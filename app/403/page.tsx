import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { IdiomaProvider } from "@/lib/i18n/IdiomaProvider";
import { normalizarIdioma } from "@/lib/i18n/idiomas";
import { traduzir } from "@/lib/i18n/dicionario";

export default async function ForbiddenPage() {
  // Rota fora da árvore de `app/app/layout.tsx` — sem o `IdiomaProvider` de lá, então
  // resolve o idioma direto, como `admin/forbidden/page.tsx`. Pode chegar aqui
  // sem sessão (link direto, robô), por isso `user` é opcional.
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
          <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-4xl">{traduzir("403 — Sem permissão", idioma)}</h1>
          <p className="mt-3 text-base text-text-muted">
            {traduzir("Você não tem acesso a essa área.", idioma)}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="outline">
              <Link href="/">{traduzir("Voltar", idioma)}</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/app/inbox">{traduzir("Voltar pra Inbox", idioma)}</Link>
            </Button>
          </div>
        </div>
      </main>
    </IdiomaProvider>
  );
}
