import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { marcaDaSaida } from "@/lib/branding/saida";
import { idiomaDoVisitante } from "@/lib/i18n/idiomaAnonimo";
import { traduzir } from "@/lib/i18n/dicionario";
import { createClient } from "@/lib/supabase/server";

/**
 * A página inicial pública.
 *
 * Quem tem sessão segue direto para o painel, como sempre foi. Quem não tem vê
 * uma página que diz o que o produto é e leva à política de privacidade e aos
 * termos — sem pedir login. A verificação de um app que pede dados de conta
 * Google exige exatamente isso: o revisor abre o endereço principal sem entrar e
 * precisa ver o nome do produto, o que ele faz e o link da política.
 *
 * `/` já é caminho público no `proxy` (`lib/auth/public-paths.ts`), então nada
 * lá muda. O nome vem da marca resolvida (`marcaDaSaida`: banco acima do
 * `.env`), nunca de texto fixo: uma imagem serve todas as marcas.
 *
 * `getUser()` e nunca `getSession()`: o redirecionamento só vale para sessão que
 * o servidor de autenticação confirmou.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  const marca = await marcaDaSaida(null);
  const idioma = await idiomaDoVisitante(null);
  const t = (texto: string) => traduzir(texto, idioma);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <p className="font-display text-lg font-extrabold tracking-[-0.02em]">{marca.nome}</p>
        <Button asChild variant="outline" size="lg" className="h-11 px-6">
          <Link href="/login">{t("Entrar")}</Link>
        </Button>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 pb-10 pt-2 sm:space-y-6 sm:px-6">
        {/* Bloco de cor grande: a primeira coisa que a pessoa lê. O nome fica no
            h1 (é o que a verificação do Google procura) e a frase do produto
            logo abaixo, em corpo grande. */}
        <section className="relative overflow-hidden rounded-xl bg-accent px-6 py-12 text-accent-foreground sm:rounded-2xl sm:px-12 sm:py-20">
          <span aria-hidden className="absolute -right-20 -top-20 size-72 rounded-full bg-accent-foreground/10" />
          <span aria-hidden className="absolute bottom-8 right-24 hidden size-32 rounded-[40px] bg-accent-foreground/10 sm:block" />
          <h1 className="relative max-w-3xl break-words font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-7xl">
            {marca.nome}
          </h1>
          <p className="relative mt-5 max-w-xl text-xl font-medium leading-snug sm:text-2xl">
            {t("Atendimento e vendas pelo WhatsApp, com agentes de inteligência artificial.")}
          </p>
        </section>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <p className="rounded-xl bg-tint-sky p-6 text-base leading-relaxed sm:p-8">
            {t("O")} {marca.nome}{" "}
            {t(
              "reúne em um só lugar as conversas com os clientes, o funil de vendas, a agenda de atendimentos e agentes de inteligência artificial que respondem, qualificam o interesse e passam a conversa para uma pessoa quando é preciso.",
            )}
          </p>

          <p className="rounded-xl bg-tint-butter p-6 text-base leading-relaxed sm:p-8">
            {t("Quando a empresa conecta o Google Agenda, o")} {marca.nome}{" "}
            {t(
              "mostra a ocupação da agenda e cria, altera e cancela os agendamentos pedidos pela própria pessoa. Quando conecta o Google Ads, devolve ao anúncio as vendas que ele trouxe. O uso dos dados do Google está descrito na",
            )}{" "}
            <Link href="/legal/privacy#dados-do-google" className="font-semibold underline underline-offset-2">
              {t("Política de Privacidade")}
            </Link>
            .
          </p>
        </div>
      </main>

      <footer>
        <nav className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-sm text-text-muted sm:px-6">
          <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-text">
            {t("Política de Privacidade")}
          </Link>
          <Link href="/legal/terms" className="underline underline-offset-2 hover:text-text">
            {t("Termos de Uso")}
          </Link>
        </nav>
      </footer>
    </div>
  );
}
