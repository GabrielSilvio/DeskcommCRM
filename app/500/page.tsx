import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { IdiomaProvider } from "@/lib/i18n/IdiomaProvider";
import { normalizarIdioma } from "@/lib/i18n/idiomas";
import { traduzir } from "@/lib/i18n/dicionario";

/**
 * `/500` — irmã de `/403` e `/503`, e faltava.
 *
 * `lib/auth/public-paths.ts` já isenta esta rota de auth desde sempre: o
 * sistema contava com a página. Sem ela, quem caísse aqui (proxy, link de
 * runbook, redirect de borda) via "página não encontrada" — a mensagem errada
 * sobre o que aconteceu.
 *
 * Distinta de `app/error.tsx`, que trata exceção em runtime dentro do React.
 * Esta é a página estática, alcançável por URL.
 */
export default async function InternalErrorPage() {
  // Rota fora da árvore de `app/app/layout.tsx` — sem o `IdiomaProvider` de lá, então
  // resolve o idioma direto, como `admin/forbidden/page.tsx`. Quem cai aqui
  // pode até ser o próprio Supabase falhando, por isso `user` é opcional e a
  // ausência de sessão não impede a página de renderizar.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const idioma = normalizarIdioma(
    (user?.user_metadata?.locale as string | undefined) ?? null,
  );

  return (
    <IdiomaProvider locale={idioma}>
      <main className="flex min-h-screen items-center justify-center bg-bg p-4 sm:p-8">
        <div className="w-full max-w-lg rounded-2xl bg-tint-peach p-8 text-center sm:p-12">
          <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-4xl">{traduzir("500 — Erro interno", idioma)}</h1>
          <p className="mt-3 text-base text-text-muted">
            {traduzir(
              "Algo quebrou do nosso lado. Já registramos o ocorrido; tente de novo em instantes.",
              idioma,
            )}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/">{traduzir("Voltar", idioma)}</Link>
            </Button>
          </div>
        </div>
      </main>
    </IdiomaProvider>
  );
}
