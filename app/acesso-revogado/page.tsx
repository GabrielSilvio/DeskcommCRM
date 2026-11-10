import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { IdiomaProvider } from "@/lib/i18n/IdiomaProvider";
import { normalizarIdioma } from "@/lib/i18n/idiomas";
import { traduzir } from "@/lib/i18n/dicionario";
import { signOut } from "@/app/actions/auth/signOut";

export const metadata = { title: "Acesso revogado" };

/**
 * Tela terminal de quem TINHA acesso e não tem mais.
 *
 * Irmã de `/account-suspended` — mesmo formato, mesma razão de existir: um
 * estado bloqueado precisa de uma tela que o nomeie. Antes desta, quem tinha o
 * vínculo revogado caía em `/app` com a casca vazia e a frase *"Você não tem
 * nenhuma organização ativa. Configure sua organização ou aceite um convite"*,
 * com um link para criar uma empresa própria. Medido em 2026-09-10 numa
 * instalação real: a pessoa não é uma visitante nova, é alguém de quem o acesso
 * foi retirado, e oferecer criação de tenant ali é transformar uma revogação
 * numa porta de entrada.
 *
 * Não há e-mail de suporte aqui de propósito: quem revogou foi o administrador
 * DA ORGANIZAÇÃO, e é com ele que se resolve — mandar a pessoa escrever para o
 * suporte do produto seria o mesmo defeito que `/account-suspended` já pagou.
 */
export default async function AcessoRevogadoPage() {
  // Rota fora da árvore de `app/app/layout.tsx` — sem o `IdiomaProvider` de lá, então
  // resolve o idioma direto, como `admin/forbidden/page.tsx`.
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
        <div className="w-full max-w-lg space-y-4 rounded-2xl bg-tint-peach p-8 text-center sm:p-12">
          <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-4xl">{traduzir("Acesso revogado", idioma)}</h1>
          <p className="text-base text-text-muted">
            {traduzir(
              "Seu acesso a esta organização foi retirado. Se você acredita que isso é um engano, fale com quem administra a empresa — só ela pode devolvê-lo.",
              idioma,
            )}
          </p>
          {/*
            A tela era um BECO. Medido em produção em 2026-09-10: quem foi
            revogado e recebeu convite novo entra pelo login, cai aqui antes de
            conseguir usar o convite, e encontra só o botão Sair — com o link
            válido no bolso e nenhuma indicação de que ele funciona.

            O endereço do convite fica FORA da área trancada (ele está em
            `lib/auth/public-paths.ts`), então abrir o link daqui funciona. O que
            faltava era alguém dizer isso.
          */}
          <p className="rounded-lg bg-surface px-4 py-3 text-text text-sm">
            {traduzir(
              "Recebeu um convite novo? Abra o link que chegou no seu e-mail — ele funciona mesmo com esta tela aberta, e devolve o seu acesso.",
              idioma,
            )}
          </p>
          <form action={signOut}>
            <Button type="submit" size="lg" className="h-12 w-full text-base">
              {traduzir("Sair", idioma)}
            </Button>
          </form>
        </div>
      </main>
    </IdiomaProvider>
  );
}
