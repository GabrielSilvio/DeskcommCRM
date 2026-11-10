import Link from "next/link";

import { marcaDaSaida } from "@/lib/branding/saida";
import { createClient } from "@/lib/supabase/server";
import { IdiomaProvider } from "@/lib/i18n/IdiomaProvider";
import { idiomaDoVisitante } from "@/lib/i18n/idiomaAnonimo";
import { traduzir } from "@/lib/i18n/dicionario";

/**
 * Container de leitura longa.
 *
 * Não usa o grupo `app/(public)/`: aquele layout é um cartão centrado de 384px,
 * desenhado para o formulário de login, e espremeria um documento inteiro numa
 * coluna de cartão. Aqui a medida é de texto corrido.
 */
export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  // O nome da marca vem do resolvedor de SAÍDA (`marcaDaSaida`: banco acima do
  // `.env`, e nunca lança) — nunca de `branding()`, que só lê o `.env`. Quem
  // gravou a marca pela tela (Administração › Marca) tem de ver o nome dele na
  // política de privacidade e nos termos, não a semente da instalação (#2511).
  const marca = await marcaDaSaida(null);
  // Fora da árvore de `app/app/layout.tsx` — sem o `IdiomaProvider` de lá, então
  // resolve o idioma direto, como as páginas filhas (`privacy`/`terms`).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const idioma = await idiomaDoVisitante(
    (user?.user_metadata?.locale as string | undefined) ?? null,
  );

  return (
    <IdiomaProvider locale={idioma}>
      <div className="min-h-screen bg-bg">
        <header>
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
            <p className="font-display text-lg font-extrabold tracking-[-0.02em]">{marca.nome}</p>
            <Link href="/login" className="inline-flex h-11 items-center rounded-full border border-border-strong bg-surface px-5 font-display text-sm font-semibold shadow-press-soft transition-all duration-base ease-spring hover:-translate-y-0.5 motion-reduce:transition-none">
              {traduzir("Voltar", idioma)}
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-2 sm:px-6">
          <article className="space-y-6 rounded-xl bg-surface p-6 text-sm leading-relaxed shadow-md sm:rounded-2xl sm:p-10">
            {children}
          </article>
        </main>
      </div>
    </IdiomaProvider>
  );
}
