import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * A VOZ DINÂMICA (migration 9242): gatilhos que não custam nada, e um
 * critério que o modelo aplica por mensagem.
 *
 * Duas camadas, duas provas: a decisão pura (`lib/ai/voz/regras.ts`, sem
 * banco) e a resolução do turno (`voz-do-turno.ts`, com credencial e orçamento
 * mockados como no teste irmão `resolver-voz-do-turno.test.ts`).
 */
const { resolveOrgLlmConfigMock, aplicarOrcamentoMock, chaveDaTelaMock } = vi.hoisted(() => ({
  resolveOrgLlmConfigMock: vi.fn(),
  aplicarOrcamentoMock: vi.fn(),
  chaveDaTelaMock: vi.fn(),
}));
vi.mock("@/lib/instalacao/comportamento", () => ({ chaveDeOrcamentoDaInstalacao: chaveDaTelaMock }));
vi.mock("@/lib/agent-engine/edge/llm/credentials", () => ({
  resolveOrgLlmConfig: resolveOrgLlmConfigMock,
}));
vi.mock("@/lib/agent-engine/edge/llm/run-model-call", () => ({
  aplicarOrcamento: aplicarOrcamentoMock,
  LlmBudgetExceededError: class LlmBudgetExceededError extends Error {},
}));

import {
  blocoDaVozDinamica,
  decidirVozDinamica,
  lerVozRegras,
  VOZ_REGRAS_PADRAO,
  vozRegrasSchema,
} from "@/lib/ai/voz/regras";
import {
  BLOCO_DA_RESPOSTA_FALADA,
  blocoDaRespostaFalada,
  contextoDaVozDinamica,
  resolverVozDoTurno,
  vozParaEsteEnvio,
} from "@/lib/agent-engine/agent/voz-do-turno";

const ETAPA = "11111111-1111-4111-8111-111111111111";
const OUTRA = "22222222-2222-4222-8222-222222222222";

describe("regras da voz dinâmica — leitura", () => {
  it("vazio, nulo e lixo valem o padrão: só o espelho do áudio ligado", () => {
    for (const valor of [undefined, null, {}, "x", 7, { espelhar_audio: "sim" }]) {
      expect(lerVozRegras(valor)).toEqual(VOZ_REGRAS_PADRAO);
    }
    expect(VOZ_REGRAS_PADRAO).toEqual({ espelhar_audio: true, primeira_resposta: false, etapas: [], criterio: "" });
  });

  it("recusa etapa que não é uuid e critério acima do teto", () => {
    expect(vozRegrasSchema.safeParse({ etapas: ["nao-e-uuid"] }).success).toBe(false);
    expect(vozRegrasSchema.safeParse({ criterio: "x".repeat(601) }).success).toBe(false);
    expect(vozRegrasSchema.safeParse({ criterio: "  quando falar de preço  " }).data?.criterio).toBe(
      "quando falar de preço",
    );
  });
});

describe("regras da voz dinâmica — decisão", () => {
  const ctx = { inboundType: null, primeiraResposta: false, stageId: null };

  it("sem gatilho e sem critério: texto", () => {
    expect(decidirVozDinamica(VOZ_REGRAS_PADRAO, ctx)).toBe("texto");
  });

  it("cliente mandou áudio: fala — e só quando o espelho está ligado", () => {
    expect(decidirVozDinamica(VOZ_REGRAS_PADRAO, { ...ctx, inboundType: "audio" })).toBe("falar");
    expect(
      decidirVozDinamica({ ...VOZ_REGRAS_PADRAO, espelhar_audio: false }, { ...ctx, inboundType: "audio" }),
    ).toBe("texto");
  });

  it("primeira resposta da conversa: fala quando marcado", () => {
    expect(decidirVozDinamica({ ...VOZ_REGRAS_PADRAO, primeira_resposta: true }, { ...ctx, primeiraResposta: true })).toBe("falar");
    expect(decidirVozDinamica(VOZ_REGRAS_PADRAO, { ...ctx, primeiraResposta: true })).toBe("texto");
  });

  it("etapa do funil: fala só na etapa marcada", () => {
    const regras = { ...VOZ_REGRAS_PADRAO, etapas: [ETAPA] };
    expect(decidirVozDinamica(regras, { ...ctx, stageId: ETAPA })).toBe("falar");
    expect(decidirVozDinamica(regras, { ...ctx, stageId: OUTRA })).toBe("texto");
    expect(decidirVozDinamica(regras, { ...ctx, stageId: null })).toBe("texto");
  });

  it("critério escrito e nenhum gatilho: o modelo decide; gatilho vence o critério", () => {
    const regras = { ...VOZ_REGRAS_PADRAO, criterio: "quando explicar valores" };
    expect(decidirVozDinamica(regras, ctx)).toBe("modelo_decide");
    expect(decidirVozDinamica(regras, { ...ctx, inboundType: "audio" })).toBe("falar");
  });

  it("o bloco do modelo carrega o critério e ensina o em_audio", () => {
    const bloco = blocoDaVozDinamica("  quando o cliente parecer indeciso  ");
    expect(bloco).toContain("quando o cliente parecer indeciso");
    expect(bloco).toContain("em_audio: true");
    expect(bloco).toContain("sem em_audio");
  });
});

describe("voz dinâmica no turno", () => {
  function pool(settings: Record<string, unknown> | null = { voz: { voice_id: "v1" } }) {
    return { query: vi.fn(async () => ({ rows: [{ settings }] })) } as never;
  }
  const base = {
    pool: pool(),
    tenantId: "org1",
    cfg: {},
    voiceNote: "server-convert" as const,
    vozEnabled: true,
    vozQuando: "dinamico" as const,
  };

  beforeEach(() => {
    resolveOrgLlmConfigMock.mockReset();
    resolveOrgLlmConfigMock.mockResolvedValue({ apiKey: "k", orcamento: null, origemDaChave: "organizacao" });
    aplicarOrcamentoMock.mockReset();
    aplicarOrcamentoMock.mockResolvedValue(undefined);
    chaveDaTelaMock.mockReset();
    chaveDaTelaMock.mockImplementation((piso: string) => piso);
  });

  it("gatilho batendo: resolve como regra — a resposta inteira sai em voz, com o bloco de sempre", async () => {
    const r = await resolverVozDoTurno({ ...base, inboundType: "audio", vozRegras: VOZ_REGRAS_PADRAO });
    expect(r?.decisor).toBe("regra");
    expect(blocoDaRespostaFalada(r)).toBe(BLOCO_DA_RESPOSTA_FALADA);
    expect(vozParaEsteEnvio(r, undefined)).toBe(r);
  });

  it("só critério: resolve a credencial, mas a voz vale SÓ no envio marcado com em_audio", async () => {
    const r = await resolverVozDoTurno({
      ...base,
      inboundType: "text",
      vozRegras: { ...VOZ_REGRAS_PADRAO, criterio: "quando explicar valores" },
    });
    expect(r?.decisor).toBe("modelo");
    expect(r?.criterio).toBe("quando explicar valores");
    expect(blocoDaRespostaFalada(r)).toContain("quando explicar valores");
    expect(vozParaEsteEnvio(r, undefined)).toBeNull();
    expect(vozParaEsteEnvio(r, false)).toBeNull();
    expect(vozParaEsteEnvio(r, true)).toBe(r);
  });

  it("sem gatilho e sem critério: null, sem ida ao banco nem à credencial", async () => {
    const db = pool();
    const r = await resolverVozDoTurno({ ...base, pool: db, inboundType: "text", vozRegras: VOZ_REGRAS_PADRAO });
    expect(r).toBeNull();
    expect((db as { query: ReturnType<typeof vi.fn> }).query).not.toHaveBeenCalled();
    expect(resolveOrgLlmConfigMock).not.toHaveBeenCalled();
  });

  it("regras ausentes valem o padrão: espelha o áudio, nada mais", async () => {
    expect((await resolverVozDoTurno({ ...base, inboundType: "audio" }))?.decisor).toBe("regra");
    expect(await resolverVozDoTurno({ ...base, inboundType: "text", contextoDinamico: { primeiraResposta: true, stageId: ETAPA } })).toBeNull();
  });

  it("em_audio nunca liga a voz fora do decisor modelo: nos outros modos o turno manda", async () => {
    const r = await resolverVozDoTurno({ ...base, vozQuando: "espelhar", inboundType: "text" });
    expect(r).toBeNull();
    expect(vozParaEsteEnvio(null, true)).toBeNull();
  });

  it("contexto dinâmico: primeira resposta = nenhuma outbound; etapa vem do lead; falha cai no seguro", async () => {
    const db = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [{ existe: false }] })
        .mockResolvedValueOnce({ rows: [{ stage_id: ETAPA }] }),
    } as never;
    expect(await contextoDaVozDinamica(db, { tenantId: "org1", conversationId: "c1", leadId: "l1" })).toEqual({
      primeiraResposta: true,
      stageId: ETAPA,
    });
    const semLead = { query: vi.fn().mockResolvedValueOnce({ rows: [{ existe: true }] }) } as never;
    expect(await contextoDaVozDinamica(semLead, { tenantId: "org1", conversationId: "c1", leadId: null })).toEqual({
      primeiraResposta: false,
      stageId: null,
    });
    const quebrado = { query: vi.fn().mockRejectedValue(new Error("db fora")) } as never;
    expect(await contextoDaVozDinamica(quebrado, { tenantId: "org1", conversationId: "c1", leadId: "l1" })).toEqual({
      primeiraResposta: false,
      stageId: null,
    });
  });
});
