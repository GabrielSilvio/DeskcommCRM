import { LogotipoDoProduto } from "@/components/branding/MarcaDoProduto";
import { marcaEhADoProduto } from "@/lib/branding";
import { marcaDaSaida } from "@/lib/branding/saida";
import { createClient } from "@/lib/supabase/server";
import { IdiomaProvider } from "@/lib/i18n/IdiomaProvider";
import { idiomaDoVisitante } from "@/lib/i18n/idiomaAnonimo";
import { traduzir } from "@/lib/i18n/dicionario";

/**
 * A casca das telas de acesso — login, cadastro, recuperação, MFA, confirmar acesso.
 *
 * ── Por que o LOGO mora aqui, e não em `login/page.tsx` ───────────────────────
 *
 * São sete telas no grupo `(public)`, e todas são "antes de entrar": quem instala
 * o produto para clientes mostra a marca dele exatamente aí. Um `<img>` por
 * página seriam sete cópias que divergem na primeira vez que alguém mexer numa
 * só — e a que ficaria para trás é sempre a que ninguém abre (recuperação de
 * senha, cadastro de MFA), que é justamente onde o cliente do revendedor
 * aparece sozinho e sem contexto.
 *
 * ── Por que `marcaDaSaida(null)` ──────────────────────────────────────────────
 *
 * Aqui não existe organização resolvida: `null` é a declaração disso, e a pilha
 * resultante é a mesma do layout raiz (banco acima, `.env` embaixo). Montar a
 * pilha à mão nesta tela faria a fachada anunciar uma precedência que o resto do
 * produto não usa. E `marcaDaSaida` NUNCA lança (ver o cabeçalho dela): uma cor
 * ou um logo mal gravados não podem derrubar a única tela por onde se entra para
 * corrigi-los.
 *
 * Sem logo configurado E com o nome padrão, a fachada mostra o logotipo do
 * PRODUTO (`components/branding/MarcaDoProduto.tsx`) — inline, sem `<img>`,
 * para que `tests/e2e/marca-logo.spec.ts` continue medindo "a fachada está sem
 * `<img>`" como "sem logo do revendedor".
 *
 * O conteúdo de cada página resolve o próprio nome. A tela de login usa
 * `marcaDaSaida(null)`, como o título da aba, para que a marca alterada pela
 * instalação apareça também sob o botão "Entrar"; a casca usa a mesma resolução
 * para logo e tema.
 *
 * Com o login e a aba na MESMA pilha, `tests/e2e/icone-da-marca.spec.ts` deixou
 * de cruzar duas resoluções independentes: ele só prova que as duas concordam.
 * O que ancora o nome numa verdade de fora da pilha é o caso "o nome trocado em
 * /admin/marca…" de `tests/e2e/marca-logo.spec.ts`, que digita o nome na tela e
 * o confere no login de quem não entrou. Não apague um sem o outro.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const marca = await marcaDaSaida(null);
  // A maioria destas telas roda ANTES do login (não há usuário nenhum), mas
  // duas — `/login/mfa` e, em parte, `/login/recovery` — rodam com uma sessão
  // parcial já criada (primeiro fator verificado, segundo pendente). Onde há
  // sessão, o idioma salvo no perfil vale; sem ela, o do navegador (Accept-Language),
  // pela MESMA função das páginas (`idiomaDoVisitante`). Com o perfil só, quem chegava
  // sem sessão via o servidor no idioma do navegador e os formulários do cliente
  // (cadastro, login, senha) no padrão pt-BR do provider.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = await idiomaDoVisitante((user?.user_metadata?.locale as string | undefined) ?? null);

  return (
    <IdiomaProvider locale={locale}>
      {/*
        Duas colunas só em tela larga: o formulário num bloco branco e, ao lado,
        um painel na cor da marca com UMA frase. No celular o painel some e fica
        só o bloco — a pessoa veio entrar, não ler. O painel usa `bg-accent`, a
        rampa que cada instalação troca pela própria marca, e é decorativo
        (`aria-hidden`): a frase repete o que a página inicial já afirma e sai
        do mesmo dicionário dela (nenhum texto novo para traduzir).
      */}
      <div className="min-h-screen bg-bg p-3 sm:p-6 lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="flex items-center justify-center py-4 sm:py-10">
          <div className="w-full max-w-md space-y-8 rounded-xl bg-surface p-6 shadow-md sm:rounded-2xl sm:p-10">
          {marca.logoUrl || marca.logoDarkUrl ? (
            <div className="flex justify-start">
              {/*
                <img> em vez de next/image pelo mesmo motivo da barra lateral: a URL
                é de quem hospeda e o `next/image` exige allowlist de domínios
                fechada em BUILD — a imagem pré-buildada do self-host recusaria o
                domínio do operador. Altura máxima de 80 px e largura máxima de 192 px, sem distorcer
                arte de proporção desconhecida nem ampliar arquivos pequenos.

                O `alt` é o nome DESTA resolução (`marca.nome`), e não o de
                `branding()`: é a legenda da imagem que está ali, e nomeá-la com a
                marca de outra fonte descreveria uma marca que não é a do logo.

                O `data-testid` é lido por `tests/e2e/marca-logo.spec.ts`, que prova
                que o logo da EMPRESA não vaza para cá. Sem ele a spec caía na
                "primeira <img> da página", e uma asserção de negação com seletor
                largo passa sozinha assim que outra imagem entra na tela.
              */}
              <div
                className={
                  marca.logoDarkUrl
                    ? "rounded-md"
                    : "rounded-md dark:bg-white dark:px-3 dark:py-2 dark:shadow-sm"
                }
              >
                {marca.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    data-testid="logo-da-fachada"
                    src={marca.logoUrl}
                    alt={marca.nome}
                    className={
                      marca.logoDarkUrl
                        ? "h-auto max-h-20 w-auto max-w-[12rem] object-contain dark:hidden"
                        : "h-auto max-h-20 w-auto max-w-[12rem] object-contain"
                    }
                  />
                ) : (
                  <span className="dark:hidden">{marca.nome}</span>
                )}
                {marca.logoDarkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    data-testid="logo-escuro-da-fachada"
                    src={marca.logoDarkUrl}
                    alt={marca.nome}
                    className="hidden h-auto max-h-20 w-auto max-w-[12rem] object-contain dark:block"
                  />
                ) : null}
              </div>
            </div>
          ) : marcaEhADoProduto({ name: marca.nome, logoUrl: null }) ? (
            <div className="flex justify-start">
              <LogotipoDoProduto nome={marca.nome} className="h-12 w-auto" />
            </div>
          ) : null}
          {children}
          </div>
        </div>
        <aside
          aria-hidden
          className="relative hidden overflow-hidden rounded-2xl bg-accent p-12 text-accent-foreground lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-3rem)] lg:flex-col lg:justify-end"
        >
          {/* Formas macias, só CSS: dão volume ao bloco sem imagem nem 3D. */}
          <span className="absolute -right-24 -top-24 size-80 rounded-full bg-accent-foreground/10" />
          <span className="absolute right-16 top-40 size-40 rounded-[40px] bg-accent-foreground/10" />
          <span className="absolute -left-16 top-1/3 size-56 rounded-full bg-accent-foreground/[0.07]" />
          <p className="relative max-w-md font-display text-5xl font-extrabold leading-[1.05] tracking-[-0.03em]">
            {traduzir(
              "Atendimento e vendas pelo WhatsApp, com agentes de inteligência artificial.",
              locale,
            )}
          </p>
        </aside>
      </div>
    </IdiomaProvider>
  );
}
