/**
 * Text chunker for the RAG indexing pipeline.
 *
 * Semantic-aware: splits by paragraphs first, then by sentence boundaries
 * for oversized chunks. Applies overlap between consecutive chunks to preserve
 * cross-boundary context for retrieval.
 */

import { createHash } from "node:crypto";

export interface ChunkOptions {
  /** Maximum characters per chunk before sub-splitting. Default: 1500 */
  maxChars?: number;
  /** Characters of overlap between consecutive chunks. Default: 200 */
  overlapChars?: number;
}

/**
 * Splits `text` into overlapping chunks suitable for embedding.
 *
 * Strategy:
 *   1. Split by double-newline (paragraph boundaries).
 *   2. If any paragraph exceeds `maxChars`, sub-split by `. ` (sentence boundaries).
 *   3. Add `overlapChars` of the previous chunk's tail to the next chunk's head.
 *   4. Trim and remove empty results.
 */
export function chunkText(text: string, opts?: ChunkOptions): string[] {
  const maxChars = opts?.maxChars ?? 1500;
  const overlapChars = opts?.overlapChars ?? 200;

  // Step 1: paragraph split
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Step 2: sub-split oversized paragraphs
  const segments: string[] = [];
  for (const para of paragraphs) {
    if (para.length <= maxChars) {
      segments.push(para);
    } else {
      // Split by sentence boundaries (". " or ".\n")
      const sentences = para.split(/\.(?:\s|\n)/).filter((s) => s.trim().length > 0);
      let current = "";
      for (const sentence of sentences) {
        const candidate = current ? `${current}. ${sentence.trim()}` : sentence.trim();
        if (candidate.length > maxChars && current.length > 0) {
          segments.push(current.trim());
          current = sentence.trim();
        } else {
          current = candidate;
        }
      }
      if (current.trim().length > 0) {
        segments.push(current.trim());
      }
    }
  }

  if (segments.length === 0) return [];
  if (segments.length === 1) {
    const only = segments[0];
    return only ? [only] : [];
  }

  // Step 3: apply overlap
  const chunks: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg) continue;
    if (i === 0) {
      chunks.push(seg);
      continue;
    }
    const prev = chunks[chunks.length - 1] ?? "";
    const tail = cauda(prev, overlapChars);
    const chunk = `${tail}\n${seg}`.trim();
    chunks.push(chunk);
  }

  // Step 4: deduplicate and filter empties
  return chunks.map(semMetadeDeCaractere).filter((c) => c.length > 0);
}

/**
 * Os últimos `n` caracteres de `texto` sem partir um par substituto (emoji e
 * afins ocupam DUAS unidades UTF-16).
 *
 * `slice(-n)` conta unidades, não caracteres: quando o corte caía entre as
 * duas metades de um emoji, o trecho seguinte começava com meia letra (um
 * "low surrogate" sozinho, ex.: U+DC9B). O PostgREST manda isso escapado no
 * JSON e o Postgres recusa o lote INTEIRO com `invalid input syntax for type
 * json` — medido em 09/11/2026: um emoji no trecho 156 derrubou os trechos
 * 100–199 de um documento de 211, em todas as tentativas.
 *
 * Recua uma unidade (leva o emoji inteiro) em vez de avançar: a sobreposição
 * existe para dar contexto, e cortar o emoji fora seria perder parte dele.
 */
function cauda(texto: string, n: number): string {
  if (texto.length <= n) return texto;
  let inicio = texto.length - n;
  if (inicio > 0 && ehMetadeBaixa(texto.charCodeAt(inicio)) && ehMetadeAlta(texto.charCodeAt(inicio - 1))) {
    inicio -= 1;
  }
  return texto.slice(inicio);
}

function ehMetadeAlta(codigo: number): boolean {
  return codigo >= 0xd800 && codigo <= 0xdbff;
}

function ehMetadeBaixa(codigo: number): boolean {
  return codigo >= 0xdc00 && codigo <= 0xdfff;
}

/**
 * Rede de segurança: troca qualquer metade solta por U+FFFD. O material do
 * cliente pode já chegar assim (cópia de PDF, exportação quebrada), e um
 * caractere ruim não pode custar cem trechos. `toWellFormed` é nativo do
 * Node 20+ (o engine do projeto é >=22).
 */
function semMetadeDeCaractere(texto: string): string {
  return texto.toWellFormed();
}

/**
 * Computes a SHA-256 hex digest of `content` for change detection / dedup.
 */
export function computeContentHash(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}
