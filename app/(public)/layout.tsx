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
        Duas colunas só em tela larga: o formulário num cartão e, ao lado, um
        painel na cor da marca com objetos 3D de massinha (sprites WebP geradas
        uma vez a partir da cena da página inicial — ver `public/entrada/README.md`;
        nenhum Three.js é carregado aqui) e UMA frase. No celular o painel some e
        o cartão ganha só um objeto pequeno como assinatura: a pessoa veio
        entrar, não ler.

        O painel é feito sobre `bg-accent`, a rampa que cada instalação troca
        pela própria marca. Todo escurecimento/clareamento é `color-mix` em cima
        de `--color-accent`, então a composição acompanha a cor trocada, e o
        texto continua no par `text-accent-foreground`. Os sprites têm cor
        própria; o "palco" mais escuro atrás deles existe para o balão azul não
        sumir quando a instalação (ou o tema escuro, onde o acento é claro)
        deixa o fundo parecido com ele. Decorativo (`aria-hidden`).
      */}
      {/* `href` + `precedence`: o React iça o bloco para o <head> e o deduplica.
          Solto aqui dentro, ele era hidratado NO LUGAR — e qualquer <style> que
          outro pedaço injete antes (a barra de desenvolvimento do Next faz
          isso) desalinha a árvore e a hidratação da tela inteira falha. */}
      <style href="entrada-animacoes" precedence="default">
        {ANIMACOES_DA_ENTRADA}
      </style>
      <div className="min-h-screen bg-bg p-3 sm:p-6 lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="flex items-center justify-center py-10 lg:py-0">
          <div className="relative w-full max-w-md animate-[entrada-cartao_520ms_var(--ease-out-slow)_both] space-y-8 rounded-xl bg-surface p-6 shadow-lg motion-reduce:animate-none sm:rounded-2xl sm:p-10 lg:space-y-5 lg:p-7">
          {/* Assinatura do celular: sobe por cima da borda do cartão, sem ocupar linha. */}
          <Sprite
            nome="balao-de-conversa"
            className="-top-9 right-3 w-24 sm:right-6 sm:w-28 lg:hidden"
            gira="-4deg"
            duracao="6s"
            semSombra
          />
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
          className="relative hidden animate-[entrada-painel_700ms_var(--ease-out-slow)_160ms_both] overflow-hidden rounded-2xl bg-accent p-12 text-accent-foreground motion-reduce:animate-none lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-3rem)] lg:flex-col lg:justify-end xl:p-14"
          style={{
            backgroundImage: [
              "radial-gradient(90% 60% at 100% 0%, color-mix(in oklab, var(--color-accent) 72%, white) 0%, transparent 70%)",
              "radial-gradient(80% 50% at 0% 100%, color-mix(in oklab, var(--color-accent) 80%, black) 0%, transparent 75%)",
            ].join(", "),
          }}
        >
          {/* Formas grandes e muito suaves: dão profundidade sem competir com os objetos. */}
          <span
            className="absolute -right-32 -top-32 size-[26rem] rounded-full"
            style={{ background: "color-mix(in oklab, var(--color-accent) 88%, white)", opacity: 0.45 }}
          />
          <span
            className="absolute -left-40 bottom-24 size-[24rem] rounded-full"
            style={{ background: "color-mix(in oklab, var(--color-accent) 85%, black)", opacity: 0.35 }}
          />
          {/* Palco: um disco mais escuro e um anel por trás dos objetos. */}
          <div className="absolute inset-x-0 top-0 h-[66%]">
            <span
              className="absolute left-1/2 top-[46%] aspect-square w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 38%, color-mix(in oklab, var(--color-accent) 84%, black), color-mix(in oklab, var(--color-accent) 68%, black))",
                boxShadow: "inset 0 2px 0 color-mix(in oklab, var(--color-accent) 80%, white)",
              }}
            />
            <span
              className="absolute left-1/2 top-[46%] aspect-square w-[104%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{ borderColor: "color-mix(in oklab, var(--color-accent) 80%, white)", opacity: 0.35 }}
            />
            <Sprite nome="cartoes-empilhados" className="right-[3%] top-[3%] w-[34%]" gira="5deg" duracao="7.5s" atraso="-2s" />
            <Sprite nome="balao-de-conversa" className="left-[7%] top-[9%] w-[58%]" gira="-3deg" duracao="6.5s" />
            <Sprite nome="faisca" className="left-[2%] top-[1%] w-[18%]" gira="8deg" duracao="5.2s" atraso="-1s" />
            <Sprite nome="conversa-verde" className="right-[4%] top-[44%] w-[38%]" gira="-4deg" duracao="7s" atraso="-3.5s" />
            <Sprite nome="moeda-com-check" className="left-[3%] top-[58%] w-[29%]" gira="6deg" duracao="5.8s" atraso="-2.4s" />
            <Sprite nome="raio" className="left-[38%] top-[72%] w-[15%]" gira="-7deg" duracao="4.8s" atraso="-0.6s" />
          </div>
          <div className="relative space-y-3">
            <p className="max-w-lg text-balance font-display text-5xl font-extrabold leading-[0.98] tracking-[-0.035em] xl:text-6xl">
              {traduzir("Todo ping merece resposta.", locale)}
            </p>
            <p className="max-w-md text-balance text-lg font-medium leading-snug text-accent-foreground/90">
              {traduzir("Seu WhatsApp atendendo na hora, a qualquer hora.", locale)}
            </p>
          </div>
        </aside>
      </div>
    </IdiomaProvider>
  );
}

/**
 * Entrada da página: o cartão sobe e aparece, o painel entra logo depois, e
 * cada objeto flutua poucos pixels no próprio ritmo. As keyframes moram aqui
 * (e não em `globals.css`) porque só estas telas as usam. Usam `translate` e
 * `rotate` individuais, para a rotação fixa de cada objeto não brigar com a
 * flutuação. Com movimento reduzido, o `motion-reduce:animate-none` das classes
 * deixa tudo parado e completo.
 */
const ANIMACOES_DA_ENTRADA = `
@keyframes entrada-cartao { from { opacity: 0; translate: 0 22px; } to { opacity: 1; translate: 0 0; } }
@keyframes entrada-painel { from { opacity: 0; translate: 0 26px; scale: 0.985; } to { opacity: 1; translate: 0 0; scale: 1; } }
@keyframes entrada-flutua { 0%, 100% { translate: 0 0; } 50% { translate: 0 -12px; } }
`;

/**
 * Um objeto 3D do painel (ou do topo do cartão, no celular): a imagem flutua e
 * a sombra de contato fica parada no chão, o que dá a sensação de que ele paira.
 * Posição e largura vêm de `className`; `gira` é a inclinação fixa.
 */
function Sprite({
  nome,
  className,
  gira,
  duracao,
  atraso,
  semSombra = false,
}: {
  nome: string;
  className: string;
  gira: string;
  duracao: string;
  atraso?: string;
  semSombra?: boolean;
}) {
  return (
    <span aria-hidden className={`pointer-events-none absolute aspect-square select-none ${className}`}>
      {!semSombra && (
        <span className="absolute inset-x-[18%] bottom-[7%] h-[9%] rounded-full bg-accent-950/35 blur-md" />
      )}
      <span
        className="absolute inset-0 animate-[entrada-flutua_6s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{ animationDuration: duracao, animationDelay: atraso }}
      >
        {/* Imagem de fundo e não <img>: é decoração, não conteúdo — e o navegador não
            baixa fundo de elemento escondido (painel some abaixo de `lg`). A fachada
            sem logo não pode ter `<img>` (tests/unit/marca-na-fachada-de-acesso). */}
        <span
          className="block size-full bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url(/entrada/${nome}.webp)`, rotate: gira }}
        />
      </span>
    </span>
  );
}
