/**
 * AS REGRAS DA VOZ DINÂMICA — `ai_agent_versions.voz_regras` (migration 9242).
 *
 * `voz_quando` tinha três respostas fechadas: nunca, espelhar o cliente, sempre.
 * Nenhuma delas cobre o que o dono de um negócio pede quando liga a voz:
 * "manda áudio quando for explicar o preço", "fala na primeira resposta para
 * parecer gente", "em cliente indeciso, áudio". O quarto modo, `dinamico`, é
 * isto: um punhado de GATILHOS que não custam nada para avaliar, e um CRITÉRIO
 * em linguagem natural que o próprio modelo aplica mensagem a mensagem.
 *
 * ═══ DUAS CAMADAS, E A ORDEM É A REGRA ═══
 *
 *  1. Gatilhos determinísticos (`decidirVozDinamica` → `falar`): o cliente
 *     mandou áudio, é a primeira resposta da conversa, ou o lead está numa das
 *     etapas marcadas. Resolvidos ANTES do modelo, sem rede: quando um bate, o
 *     turno sai em voz exatamente como no modo `sempre`.
 *  2. Critério do operador (`modelo_decide`): quando nenhum gatilho bate e há
 *     um critério escrito, o modelo recebe o bloco de `blocoDaVozDinamica` e
 *     escolhe por mensagem, marcando `send_message` com `em_audio: true`.
 *     Sem critério e sem gatilho, o turno é texto — igual a hoje.
 *
 * O plano de voz (docs/superpowers/plans/2026-10-29-voz-elevenlabs.md, §4.2)
 * recusou "o modelo decide" no MVP porque dava ao modelo uma decisão que gasta
 * dinheiro sem ninguém ter pedido. Aqui quem pede é o operador, por versão
 * publicada, escrevendo o critério — e o mesmo teto de orçamento que já
 * segura o chat e a voz (`aplicarOrcamento` em voz-do-turno.ts) continua
 * valendo, porque a credencial e o orçamento são resolvidos antes de o modelo
 * ter a opção.
 *
 * ═══ POR QUE jsonb COM SCHEMA CENTRAL, E NÃO QUATRO COLUNAS ═══
 *
 * As regras só existem no modo `dinamico`, nascem juntas e são lidas juntas
 * (DIRC: lidas e gravadas com a versão, nunca consultadas por item). O schema
 * mora AQUI e é o único leitor do jsonb — a tela, a API e o motor importam
 * daqui; nenhum deles lê path solto (anti-pattern 6, `jsonb` lock-in).
 *
 * Puro e sem banco de propósito: `decidirVozDinamica` é testável sem rede.
 */
import { z } from "zod";

/** Teto do critério: cabe num bloco de prompt sem dominar o resto do system. */
export const TETO_DO_CRITERIO = 600;

export const vozRegrasSchema = z.object({
  /** Fala quando o CLIENTE mandou áudio nesta mensagem — o `espelhar` de sempre, como gatilho. */
  espelhar_audio: z.boolean().default(true),
  /** Fala na primeira resposta do agente nesta conversa — a apresentação em áudio. */
  primeira_resposta: z.boolean().default(false),
  /** Fala quando o lead está numa destas etapas do funil (`crm_stages.id`). */
  etapas: z.array(z.string().uuid()).max(50).default([]),
  /**
   * O critério em linguagem natural que o MODELO aplica quando nenhum gatilho
   * bateu. Vazio = o modelo nunca escolhe: fora dos gatilhos, texto.
   */
  criterio: z.string().trim().max(TETO_DO_CRITERIO).default(""),
});

export type VozRegras = z.infer<typeof vozRegrasSchema>;

export const VOZ_REGRAS_PADRAO: VozRegras = vozRegrasSchema.parse({});

/**
 * Lê o jsonb do banco (ou o corpo de uma API) sem lançar: o que não for
 * legível vale como o padrão — falhar para "texto" é a direção segura da voz.
 */
export function lerVozRegras(valor: unknown): VozRegras {
  const lido = vozRegrasSchema.safeParse(valor ?? {});
  return lido.success ? lido.data : { ...VOZ_REGRAS_PADRAO };
}

export type DecisaoDaVozDinamica = "falar" | "modelo_decide" | "texto";

export interface ContextoDaVozDinamica {
  /** `messages.type` da inbound que disparou o turno; `null` sem inbound (follow-up proativo). */
  inboundType: string | null;
  /** O agente ainda não mandou nada nesta conversa. */
  primeiraResposta: boolean;
  /** `crm_leads.stage_id` do lead da conversa, quando há lead. */
  stageId: string | null;
}

export function decidirVozDinamica(regras: VozRegras, ctx: ContextoDaVozDinamica): DecisaoDaVozDinamica {
  if (regras.espelhar_audio && ctx.inboundType === "audio") return "falar";
  if (regras.primeira_resposta && ctx.primeiraResposta) return "falar";
  if (ctx.stageId !== null && regras.etapas.includes(ctx.stageId)) return "falar";
  if (regras.criterio.length > 0) return "modelo_decide";
  return "texto";
}

/** O que o modelo vê quando a escolha é dele. Mesma régua de escrita do bloco da resposta falada. */
export function blocoDaVozDinamica(criterio: string): string {
  return (
    "## Você PODE responder como NOTA DE VOZ\n" +
    "Nesta conversa você escolhe, mensagem a mensagem, entre texto e áudio. O critério do negócio para mandar áudio:\n" +
    `${criterio.trim()}\n` +
    "Para mandar em áudio, chame send_message com em_audio: true e escreva para ser ouvido, no idioma da conversa: " +
    "curto (no máximo uns 20 segundos de fala, cerca de 300 caracteres), uma ideia por vez, frases simples como num áudio de WhatsApp, " +
    "sem listas, tópicos, emojis, siglas nem símbolos; números e preços escritos como se falam. " +
    "Link, endereço longo ou dado para copiar nunca vão em áudio: mande por escrito. " +
    "Fora do critério, responda em texto como sempre, sem em_audio."
  );
}
