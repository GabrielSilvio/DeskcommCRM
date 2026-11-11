-- manifest: **A voz ganha o modo dinâmico: gatilhos + critério do operador, por versão.** `ai_agent_versions.voz_quando` aceita `dinamico` (CHECK recriado com o quarto valor; coluna sem linha legada fora da lista, então o `update.sh` de ninguém quebra) e nasce `voz_regras jsonb not null default '{}'` — espelhar áudio, primeira resposta, etapas do funil e um critério em linguagem natural que o modelo aplica (`lib/ai/voz/regras.ts` é o único leitor). `fn_ai_agent_version_content_immutable` passa a cobrir `voz_regras` — corpo copiado da última definição em vigor (9052) mais uma linha; sem ela uma versão publicada ficaria editável nesse campo. Idempotente; espelho no apêndice do `supabase/baseline.sql`, logo depois do bloco da 9052.
-- ============================================================================
-- 9242 — VOZ DINÂMICA: `voz_quando = 'dinamico'` + `voz_regras` por versão.
--
-- Os três modos da 9052 (nunca / espelhar / sempre) são interruptores. O que o
-- dono do negócio pede quando liga a voz é uma REGRA: "áudio quando explicar
-- o preço", "áudio na primeira resposta", "áudio em quem está na etapa de
-- proposta". O modo `dinamico` guarda isso em `voz_regras`:
--
--   { "espelhar_audio": true, "primeira_resposta": false,
--     "etapas": ["<crm_stages.id>"], "criterio": "texto livre" }
--
-- Quem decide é `lib/agent-engine/agent/voz-do-turno.ts`: gatilho que bate →
-- fala como no `sempre`; nenhum gatilho e critério escrito → o modelo escolhe
-- por mensagem (`send_message` com `em_audio: true`); nada → texto.
--
-- Default `'{}'::jsonb` e `voz_quando` inalterado em toda versão existente:
-- nenhuma organização muda de comportamento por esta migration.
--
-- O CHECK é recriado (drop + add) em vez de "add if not exists": o nome é o
-- mesmo da 9052 e o conteúdo mudou. Nenhum clone tem linha fora dos quatro
-- valores (a coluna só aceita os três anteriores), então recriar é seguro.
-- ============================================================================

alter table public.ai_agent_versions
  add column if not exists voz_regras jsonb not null default '{}'::jsonb;

alter table public.ai_agent_versions
  drop constraint if exists ai_agent_versions_voz_quando_check;

alter table public.ai_agent_versions
  add constraint ai_agent_versions_voz_quando_check
  check (voz_quando in ('nunca', 'espelhar', 'sempre', 'dinamico'));

comment on column public.ai_agent_versions.voz_quando is
  'Migrations 9052 e 9242. ''nunca'' (nunca fala, mesmo com voz_enabled=true), '
  '''espelhar'' (fala só quando o CLIENTE mandou áudio — o default), ''sempre'', '
  'ou ''dinamico'' (gatilhos + critério em voz_regras). Decidido em '
  'lib/agent-engine/agent/voz-do-turno.ts.';

comment on column public.ai_agent_versions.voz_regras is
  'Migration 9242. As regras do modo dinamico de voz_quando: espelhar_audio, '
  'primeira_resposta, etapas (crm_stages.id[]) e criterio (texto que o modelo '
  'aplica). Schema único em lib/ai/voz/regras.ts; ilegível vale como o padrão.';

create or replace function fn_ai_agent_version_content_immutable() returns trigger
-- search_path fixo na PRÓPRIA definição: um create or replace sem a cláusula
-- apaga o alter function ... set search_path da 0521 (invariante
-- tests/invariants/avisos-do-security-advisor.test.ts).
language plpgsql set search_path = '' as $fn$
begin
  if old.status <> 'draft' and (
       new.system_prompt          is distinct from old.system_prompt
    or new.provider               is distinct from old.provider
    or new.model                  is distinct from old.model
    or new.credential_id          is distinct from old.credential_id
    or new.tool_ids               is distinct from old.tool_ids
    or new.trigger_config         is distinct from old.trigger_config
    or new.channel_session_id     is distinct from old.channel_session_id
    or new.max_steps              is distinct from old.max_steps
    or new.token_budget           is distinct from old.token_budget
    or new.cost_budget_cents      is distinct from old.cost_budget_cents
    or new.history_message_window is distinct from old.history_message_window
    or new.history_token_window   is distinct from old.history_token_window
    or new.handoff_keywords       is distinct from old.handoff_keywords
    or new.handoff_tool_enabled   is distinct from old.handoff_tool_enabled
    or new.handoff_legal_enabled  is distinct from old.handoff_legal_enabled
    or new.followup               is distinct from old.followup
    or new.multimodal_input       is distinct from old.multimodal_input
    or new.video_frames_enabled   is distinct from old.video_frames_enabled
    or new.image_vision_enabled   is distinct from old.image_vision_enabled
    or new.split_messages         is distinct from old.split_messages
    or new.split_max_chars        is distinct from old.split_max_chars
    or new.cases_enabled          is distinct from old.cases_enabled
    or new.operator_enabled       is distinct from old.operator_enabled
    or new.operator_model         is distinct from old.operator_model
    or new.operator_tool_ids      is distinct from old.operator_tool_ids
    or new.pipeline_ids           is distinct from old.pipeline_ids
    or new.knowledge_source_ids   is distinct from old.knowledge_source_ids
    or new.skill_names            is distinct from old.skill_names
    or new.proposal_ai_draft_enabled is distinct from old.proposal_ai_draft_enabled
    or new.inbound_debounce_ms    is distinct from old.inbound_debounce_ms
    or new.reply_min_interval_ms  is distinct from old.reply_min_interval_ms
    or new.voz_enabled            is distinct from old.voz_enabled
    or new.voz_quando             is distinct from old.voz_quando
    or new.voz_regras             is distinct from old.voz_regras
    or new.version_number         is distinct from old.version_number
    or new.agent_id               is distinct from old.agent_id
    or new.organization_id        is distinct from old.organization_id
  ) then
    raise exception 'ai_agent_versions % é imutável (status=%): mudança de conteúdo = versão draft nova; rollback = revert (clona + publica)',
      old.id, old.status;
  end if;
  return new;
end;
$fn$;

notify pgrst, 'reload schema';
