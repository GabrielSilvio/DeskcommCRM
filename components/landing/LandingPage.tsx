import Link from "next/link";

import { LandingMotor } from "./LandingMotor";
import type { PassoDaConversa } from "./iniciar-landing";
import "./landing.css";

/**
 * A landing pública (`/`): a marcação inteira, como componente de servidor.
 *
 * O visual, os textos e o comportamento vêm do protótipo aprovado (`pingcloser-soft3d.html`); aqui
 * só mudam as costuras com o app:
 *
 *  - o nome do produto é o da marca resolvida (`nome`), nunca texto fixo;
 *  - todo texto passa por `t()`, e o português é a chave da tradução;
 *  - "Criar conta" só aparece quando o cadastro está aberto; fechado, os botões de começar levam
 *    ao login e dizem "Entrar".
 *
 * O CSS (`landing.css`) mora todo sob `.lp`; o comportamento, em `LandingMotor` (cliente) →
 * `iniciar-landing.ts`. A classe `js` já vem no HTML do servidor porque os estados iniciais (linhas
 * do título escondidas, preloader) precisam existir antes de o script rodar, senão a página piscaria;
 * quem não tem script cai na regra do `<noscript>` e numa saída por tempo no CSS.
 */
export interface LandingPageProps {
  nome: string;
  t: (texto: string) => string;
  /** O cadastro está aberto? Decide se "Criar conta" existe e para onde os botões de começar vão. */
  cadastroAberto: boolean;
}

// Nomes de demonstração dos quadros: dado de exemplo, igual em qualquer idioma (por isso fora do t()).
const CLIENTES_DE_EXEMPLO = { julia: "Júlia Andrade", livia: "Lívia Prado" } as const;

const SETA = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export function LandingPage({ nome, t, cadastroAberto }: LandingPageProps) {
  const hrefComecar = cadastroAberto ? "/signup" : "/login";
  const rotuloComecar = cadastroAberto ? t("Criar minha conta") : t("Entrar");

  // O "ping" do título ganha a cor da marca; o resto da frase é traduzido de uma vez. Separar na
  // palavra (e não em duas chaves) deixa o idioma de destino escolher onde a frase quebra.
  const [antesDoPing, depoisDoPing] = t("Todo ping merece resposta.").split("ping");
  const linha1 = (antesDoPing ?? "").trimStart();
  const linha2 = (depoisDoPing ?? "").trim();

  const conversa: PassoDaConversa[] = [
    { k: "bub", t: t("Oi! Queria marcar uma avaliação para esta semana."), w: 900 },
    { typing: 1300 },
    { k: "bub ai", t: t("Claro, Mariana! Tenho quarta às 15h ou quinta às 9h30. Qual fica melhor?"), m: t("IA"), w: 1500 },
    { k: "bub", t: t("Quinta de manhã, mas só consigo antes das 9h."), w: 900 },
    {
      k: "sysl",
      t: t("A IA moveu Mariana para Avaliação"),
      set: { stage: [t("Avaliação"), "chip blue"], next: t("Confirmar horário") },
      w: 1200,
    },
    {
      k: "sysl",
      t: t("A IA chamou você: pedido de horário especial"),
      toast: t("A IA precisa de você"),
      set: { owner: [t("Esperando você"), "chip warn"] },
      w: 1900,
    },
    {
      k: "bub out",
      t: t("Consigo sim. Quinta às 8h30 está reservado para você."),
      m: t("Você"),
      set: {
        owner: [t("Você atendendo"), "chip ok"],
        resp: t("Você"),
        stage: [t("Agendado"), "chip ok"],
        next: t("Qui, 8h30"),
      },
      w: 1400,
    },
    { k: "bub", t: t("Perfeito, obrigada!"), toast: t("Mariana foi para Agendado"), w: 3400 },
  ];
  const padrao = {
    stage: [t("Novo contato"), "chip neu"] as [string, string],
    next: t("Aguardando resposta"),
    owner: [t("IA atendendo"), "chip blue"] as [string, string],
    resp: t("Assistente de IA"),
  };

  const nichos = [t("Clínicas"), t("Imobiliárias"), t("Lojas online"), t("Infoprodutos"), t("Agências"), t("Serviços")];

  return (
    <div className="lp js m-curtain">
      <noscript>
        {/* Sem script nada revela o que o JS esconde: mostra tudo de uma vez. */}
        <style>{`.lp .pre{display:none}.lp .ln>span{transform:none!important}.lp .hero .below>*,.lp .say span{opacity:1!important;transform:none!important}.lp #gl{display:none}`}</style>
      </noscript>

      <div className="pre" aria-hidden="true">
        <b>
          {Array.from(nome).map((letra, i) => (
            <span key={i} style={i ? { animationDelay: `${(i * 0.04).toFixed(2)}s` } : undefined}>
              {letra === " " ? " " : letra}
            </span>
          ))}
          <i />
        </b>
      </div>
      <canvas id="gl" aria-hidden="true" />

      <header className="nav">
        <div className="wrap">
          <span className="pill logo">
            <i aria-hidden="true" />
            <b className="logo-nome">{nome}</b>
          </span>
          <nav className="pill links" aria-label={t("Seções da página")}>
            <button type="button" data-como>
              {t("Como funciona")}
            </button>
            <a href="#recursos">{t("Recursos")}</a>
            <a href="#para-quem">{t("Para quem é")}</a>
          </nav>
          <div className="nav-cta">
            {cadastroAberto ? (
              <>
                <Link className="btn b-white" href="/login" data-mag>
                  {t("Entrar")}
                </Link>
                <Link className="btn b-ink" href="/signup" data-mag>
                  {t("Criar conta")}
                </Link>
              </>
            ) : (
              <Link className="btn b-ink" href="/login" data-mag>
                {t("Entrar")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="glow" aria-hidden="true" />
          <i data-a="bubble" className="a1" data-r="-8,-24,7" aria-hidden="true" />
          <i data-a="wa" className="a2" data-r="8,26,-9" aria-hidden="true" />
          <i data-a="coin" className="a3" data-r="16,-26,10" aria-hidden="true" />
          <i data-a="spark" className="a4" data-r="0,18,-14" aria-hidden="true" />
          <i data-a="bolt" className="a5" data-r="6,-20,12" aria-hidden="true" />
          <i data-a="cards" className="a6" data-r="-14,24,-6" aria-hidden="true" />
          <i data-a="clock" className="a7" data-r="12,-22,8" aria-hidden="true" />
          <i data-a="ball" data-c="yellow" className="b1" data-r="0,0,0" aria-hidden="true" />
          <i data-a="ball" data-c="coral" className="b2" data-r="0,0,0" aria-hidden="true" />
          <i data-a="ring" data-c="blue" className="b3" data-r="50,30,10" aria-hidden="true" />
          <i data-a="ball" data-c="green" className="b4" data-r="0,0,0" aria-hidden="true" />
          <i data-a="ring" data-c="yellow" className="b5" data-r="-40,-30,20" aria-hidden="true" />
          <i data-a="ball" data-c="sky" className="b6" data-r="0,0,0" aria-hidden="true" />
          <div className="wrap col">
            <h1 className="mega">
              <span className="ln">
                <span>
                  {linha1} <em>ping</em>
                </span>
              </span>{" "}
              <span className="ln">
                <span>{linha2}</span>
              </span>
            </h1>
            <div className="below up">
              <p className="lead">
                {t("Seu WhatsApp atendendo na hora, a qualquer hora. A IA responde, tira dúvidas e agenda. Você entra só para fechar a venda.")}
              </p>
              <div className="row">
                <Link className="btn b-blue" href={hrefComecar} data-mag>
                  {rotuloComecar} {SETA}
                </Link>
                <button className="btn b-white" type="button" data-como>
                  {t("Como funciona")}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="sheet tell">
          <div className="wrap">
            <p className="say up">
              {t("Enquanto você dorme, almoça ou atende outro cliente, ninguém fica esperando. A IA responde na hora e te chama quando é hora de fechar.")}
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap live" data-chat>
            <div className="txt up">
              <span className="tag">
                <i aria-hidden="true" />
                {t("Veja acontecendo")}
              </span>
              <h2 className="h2">{t("Você enxerga tudo, do primeiro oi à venda fechada.")}</h2>
              <p className="lead">
                {t("Acompanhe cada conversa ao vivo. Quando a IA precisa de você, ela avisa e devolve a conversa com tudo o que já foi dito. Ninguém precisa repetir nada.")}
              </p>
              <div className="tiles">
                <div className="tile">
                  <small>{t("Onde a cliente está")}</small>
                  <span className="chip neu" data-stage>
                    {padrao.stage[0]}
                  </span>
                </div>
                <div className="tile">
                  <small>{t("Quem está atendendo")}</small>
                  <b data-resp>{padrao.resp}</b>
                </div>
                <div className="tile">
                  <small>{t("Próximo passo")}</small>
                  <b data-next>{padrao.next}</b>
                </div>
              </div>
            </div>
            <div className="stage">
              <div className="chat up">
                <header>
                  <span className="av" aria-hidden="true">
                    MS
                  </span>
                  <div>
                    <b>Mariana Souza</b>
                    <small>WhatsApp</small>
                  </div>
                  <span className="chip blue" data-owner>
                    {padrao.owner[0]}
                  </span>
                </header>
                <div className="msgs" data-msgs />
                <footer>
                  <div>{t("Escreva uma mensagem")}</div>
                  <span aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />
                    </svg>
                  </span>
                </footer>
              </div>
              <div className="toasts up" data-toasts />
            </div>
          </div>
        </section>

        <section className="hz native" id="recursos">
          <div className="hz-pin">
            <div className="wrap hz-head up">
              <h2 className="h2" style={{ maxWidth: "14em" }}>
                {t("Tudo para vender mais pelo WhatsApp.")}
              </h2>
              <div className="hz-bar" aria-hidden="true">
                <i />
              </div>
            </div>
            <div className="hz-track">
              <article className="fc" style={{ background: "var(--mint)" }}>
                <div className="t">
                  <span className="n">{t("Conversas")}</span>
                  <h3 className="h3">{t("Todas as conversas num lugar só.")}</h3>
                  <p>{t("Você vê na hora quem a IA está atendendo e quem está esperando por você. Para assumir, é um clique.")}</p>
                </div>
                <div className="v">
                  <div className="ui" aria-hidden="true">
                    <div className="r">
                      <span className="av">MS</span>
                      <div>
                        <b>Mariana Souza</b>
                        <small>{t("Consegue encaixar na quinta?")}</small>
                      </div>
                      <span className="chip warn">{t("Esperando você")}</span>
                    </div>
                    <div className="r">
                      <span className="av">RL</span>
                      <div>
                        <b>Rafael Lima</b>
                        <small>{t("Vou ver com meu sócio")}</small>
                      </div>
                      <span className="chip blue">{t("IA atendendo")}</span>
                    </div>
                    <div className="r">
                      <span className="av">TN</span>
                      <div>
                        <b>Thiago Nunes</b>
                        <small>{t("Qual o valor do plano anual?")}</small>
                      </div>
                      <span className="chip blue">{t("IA atendendo")}</span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="fc" style={{ background: "var(--sky)" }}>
                <div className="t">
                  <span className="n">{t("Funil")}</span>
                  <h3 className="h3">{t("Saiba onde cada cliente está.")}</h3>
                  <p>{t("Do primeiro contato à venda fechada, cada cliente aparece na sua etapa. O funil se atualiza sozinho conforme a conversa anda.")}</p>
                </div>
                <div className="v">
                  <div className="ui" aria-hidden="true">
                    <div className="kan">
                      <div className="kcol">
                        <b>{t("Em conversa")}</b>
                        <div className="kc mv">
                          Mariana Souza<small>R$ 1.850</small>
                        </div>
                        <div className="kc">
                          Thiago Nunes<small>R$ 2.400</small>
                        </div>
                      </div>
                      <div className="kcol">
                        <b>{t("Avaliação")}</b>
                        <div className="kc">
                          Rafael Lima<small>R$ 4.200</small>
                        </div>
                      </div>
                      <div className="kcol">
                        <b>{t("Fechado")}</b>
                        <div className="kc">
                          {CLIENTES_DE_EXEMPLO.julia}<small>R$ 900</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article className="fc" style={{ background: "var(--butter)" }}>
                <div className="t">
                  <span className="n">{t("IA que atende")}</span>
                  <h3 className="h3">{t("Uma atendente que nunca dorme.")}</h3>
                  <p>{t("Ela aprende com o seu material, responde do jeito do seu negócio e sabe a hora de chamar você.")}</p>
                </div>
                <div className="v">
                  <div className="ui" aria-hidden="true">
                    <div className="r">
                      <span className="av" style={{ background: "var(--sky)", color: "var(--blue-deep)" }}>
                        {t("IA")}
                      </span>
                      <div>
                        <b>{t("Assistente da Recepção")}</b>
                        <small>{t("Atendendo agora")}</small>
                      </div>
                      <span className="chip ok">{t("Ligada")}</span>
                    </div>
                    <div className="split">
                      <b>{t("Hoje")}</b>
                      <span>{t("31 conversas atendidas")}</span>
                    </div>
                    <div className="meter">
                      <i />
                    </div>
                    <div className="opts" style={{ paddingTop: "4px" }}>
                      <span className="chip neu">{t("Tira dúvidas")}</span>
                      <span className="chip neu">{t("Agenda horários")}</span>
                      <span className="chip neu">{t("Chama você")}</span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="fc" style={{ background: "var(--peach)" }}>
                <div className="t">
                  <span className="n">{t("Retomada")}</span>
                  <h3 className="h3">{t("Cliente sumiu? A IA chama de volta.")}</h3>
                  <p>{t("Quem parou de responder recebe uma nova mensagem no momento certo. E você vê quem está esfriando antes de perder a venda.")}</p>
                </div>
                <div className="v">
                  <div className="ui" aria-hidden="true">
                    <div className="r">
                      <span className="av">TN</span>
                      <div>
                        <b>Thiago Nunes</b>
                        <small>{t("Sem resposta há 2 dias")}</small>
                      </div>
                      <span className="chip warn">{t("Mensagem em 3 h")}</span>
                    </div>
                    <div className="r">
                      <span className="av">BF</span>
                      <div>
                        <b>Bianca Ferraz</b>
                        <small>{t("Recebeu a proposta e sumiu")}</small>
                      </div>
                      <span className="chip err">{t("Esfriando")}</span>
                    </div>
                    <div className="r">
                      <span className="av">LP</span>
                      <div>
                        <b>{CLIENTES_DE_EXEMPLO.livia}</b>
                        <small>{t("A IA chamou de volta hoje")}</small>
                      </div>
                      <span className="chip ok">{t("Respondeu")}</span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="fc" style={{ background: "var(--fog)" }}>
                <div className="t">
                  <span className="n">{t("No automático")}</span>
                  <h3 className="h3">{t("O trabalho repetitivo some.")}</h3>
                  <p>{t("Chegou contato pelo site? Já cai no funil. Mudou de etapa? A mensagem sai sozinha. Você define a regra uma vez.")}</p>
                </div>
                <div className="v">
                  <div className="ui" aria-hidden="true">
                    <div className="rule">
                      <span>{t("QUANDO")}</span>
                      {t("Cliente muda de etapa")}
                    </div>
                    <div className="rule">
                      <span>{t("SE")}</span>
                      {t("Chegou em Proposta")}
                    </div>
                    <div className="rule">
                      <span>{t("ENTÃO")}</span>
                      {t("Mandar mensagem no WhatsApp")}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap ctl-wrap">
            <h2 className="h2 up" style={{ maxWidth: "9em" }}>
              {t("A IA trabalha. Você manda.")}
            </h2>
            <div className="ctl-grid up">
              <div className="ctl">
                <div className="ctl-in c1">
                  <b>{t("SEM SUSTO")}</b>
                  <h3 className="h3">{t("Você define o limite")}</h3>
                  <p>{t("Escolha quanto a IA pode gastar por mês e acompanhe o uso.")}</p>
                </div>
              </div>
              <div className="ctl">
                <div className="ctl-in c2">
                  <b>{t("HISTÓRICO")}</b>
                  <h3 className="h3">{t("Nada se perde")}</h3>
                  <p>{t("Tudo o que a IA e a equipe fizeram fica registrado em cada conversa.")}</p>
                </div>
              </div>
              <div className="ctl">
                <div className="ctl-in c3">
                  <b>{t("EQUIPE")}</b>
                  <h3 className="h3">{t("Cada um vê o que precisa")}</h3>
                  <p>{t("Acessos diferentes para quem atende e para quem gerencia, com conversas distribuídas sozinhas.")}</p>
                </div>
              </div>
              <div className="ctl">
                <div className="ctl-in c4">
                  <b>{t("SEGURANÇA")}</b>
                  <h3 className="h3">{t("Dados protegidos")}</h3>
                  <p>{t("Feito para seguir a LGPD com os dados dos seus clientes.")}</p>
                </div>
              </div>
            </div>
            <div className="duo up">
              <div>
                <h3 className="h3">{t("Funciona com o WhatsApp que você já usa")}</h3>
                <div className="opts">
                  <span className="chip ok">{t("Seu número atual")}</span>
                  <span className="chip ok">{t("Vários números")}</span>
                </div>
              </div>
              <div>
                <h3 className="h3">{t("Fala a língua do seu negócio")}</h3>
                <div className="opts">
                  <span className="chip blue">{t("Paciente")}</span>
                  <span className="chip blue">{t("Cliente")}</span>
                  <span className="chip blue">{t("Comprador")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mq" id="para-quem" role="img" aria-label={nichos.join(", ")}>
          <div aria-hidden="true">
            {[...nichos, ...nichos].map((n, i) => (
              <span key={i}>{n}</span>
            ))}
          </div>
        </div>

        <section className="sheet end">
          <div className="wrap col up">
            <h2 className="h2">{t("Seu próximo cliente acabou de mandar um ping.")}</h2>
            <p className="lead">{t("Coloque a IA para responder hoje e pare de perder venda por demora.")}</p>
            <Link className="btn b-white" href={hrefComecar} data-mag>
              {rotuloComecar} {SETA}
            </Link>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          {/* Texto exigido pela verificação do app no Google: o revisor abre `/` sem entrar e precisa
              ver o que o produto faz com a conta Google e o caminho para a política. */}
          <p className="google">
            {t("Quando a empresa conecta o Google Agenda, o")} {nome}{" "}
            {t(
              "mostra a ocupação da agenda e cria, altera e cancela os agendamentos pedidos pela própria pessoa. Quando conecta o Google Ads, devolve ao anúncio as vendas que ele trouxe. O uso dos dados do Google está descrito na",
            )}{" "}
            <Link href="/legal/privacy#dados-do-google">{t("Política de Privacidade")}</Link>.
          </p>
          <nav aria-label={t("Documentos legais")}>
            <Link href="/legal/privacy">{t("Política de Privacidade")}</Link>
            <Link href="/legal/terms">{t("Termos de Uso")}</Link>
          </nav>
          <p className="ex">{t("Nomes e valores nas telas são exemplos.")}</p>
        </div>
      </footer>

      <div className="veil" hidden />
      <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="landing-passos" hidden>
        <button className="x" type="button" aria-label={t("Fechar")}>
          ×
        </button>
        <h2 className="h3 dlg-t" id="landing-passos">
          {t("Comece em três passos.")}
        </h2>
        <ol>
          <li>
            <div>
              <b>{t("Conecte seu WhatsApp")}</b>
              <span>{t("É só apontar a câmera do celular, como no WhatsApp Web.")}</span>
            </div>
          </li>
          <li>
            <div>
              <b>{t("Conte sobre o seu negócio")}</b>
              <span>{t("Envie seus preços, horários e respostas mais comuns.")}</span>
            </div>
          </li>
          <li>
            <div>
              <b>{t("Deixe a IA atender")}</b>
              <span>{t("Acompanhe tudo pelo funil e entre na conversa quando quiser.")}</span>
            </div>
          </li>
        </ol>
        <Link className="btn b-blue" href={hrefComecar}>
          {rotuloComecar}
        </Link>
      </div>

      <LandingMotor conversa={conversa} padrao={padrao} />
    </div>
  );
}
