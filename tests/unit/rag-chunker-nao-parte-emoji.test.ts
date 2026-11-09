import { describe, expect, it } from "vitest";

import { chunkText } from "@/lib/ai/rag/chunker";

/**
 * Metade solta de par substituto (U+D800–U+DFFF sem o par). É o que o
 * PostgREST não consegue gravar: o Postgres recusa o lote inteiro com
 * `invalid input syntax for type json`.
 */
const METADE_SOLTA = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/**
 * Monta dois parágrafos em que o corte da sobreposição (os últimos
 * `overlap` unidades do primeiro) cai EXATAMENTE entre as duas metades do 💛.
 */
function textoComEmojiNoCorte(overlap: number): string {
  // "💛" ocupa 2 unidades. Com `depois` unidades depois dele, o corte em
  // length - overlap cai na metade baixa quando depois === overlap - 1.
  const depois = "x".repeat(overlap - 1);
  const primeiro = `${"a".repeat(300)}💛${depois}`;
  const segundo = "Como cada festa tem suas escolhas, os valores variam.";
  return `${primeiro}\n\n${segundo}`;
}

describe("chunkText — sobreposição não parte emoji ao meio", () => {
  it("o corte que cairia no meio do emoji leva o emoji inteiro", () => {
    const trechos = chunkText(textoComEmojiNoCorte(200), { maxChars: 1500, overlapChars: 200 });

    expect(trechos).toHaveLength(2);
    for (const t of trechos) expect(METADE_SOLTA.test(t)).toBe(false);
    // O contexto não se perde: o emoji inteiro abre o segundo trecho.
    expect(trechos[1]!.startsWith("💛")).toBe(true);
  });

  it("nenhum trecho sai com metade solta, qualquer que seja a posição do emoji", () => {
    for (let overlap = 2; overlap <= 40; overlap++) {
      const trechos = chunkText(textoComEmojiNoCorte(overlap), { maxChars: 1500, overlapChars: overlap });
      for (const t of trechos) expect(METADE_SOLTA.test(t)).toBe(false);
    }
  });

  it("material que já chega com metade solta é saneado em vez de derrubar o lote", () => {
    const quebrado = `Festa linda \uDC9B com bolo.\n\nSegundo parágrafo.`;
    const trechos = chunkText(quebrado);

    for (const t of trechos) expect(METADE_SOLTA.test(t)).toBe(false);
    expect(trechos[0]).toContain("�");
  });

  it("texto sem emoji continua com a sobreposição de sempre", () => {
    const primeiro = "b".repeat(500);
    const trechos = chunkText(`${primeiro}\n\nfim`, { overlapChars: 200 });

    expect(trechos[1]).toBe(`${"b".repeat(200)}\nfim`);
  });
});
