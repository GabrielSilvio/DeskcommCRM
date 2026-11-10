import { traduzir } from "@/lib/i18n/dicionario";
import { redirect } from "next/navigation";
import { loadAuthUser } from "@/lib/auth/server";
import { ImpersonateBanner } from "@/components/app/ImpersonateBanner";
export default async function SupportEndedPage() {
  const user = await loadAuthUser();
  if (!user) redirect("/login");
  const t = (text: string) => traduzir(text, user.idioma);
  if (!user.support) redirect("/app/inbox");
  return <main className="min-h-screen bg-bg">
    <ImpersonateBanner ended impersonating={{tenantId: user.support.organization_id,
      tenantName: user.support.name, expiresAt: user.support.expires_at}} />
    <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-tint-sky p-8 sm:p-12"><h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em]">{t("Encerre o acompanhamento para continuar")}</h1>
    <p className="mt-3 text-base text-text-muted">{t("O prazo ou as permissões desta sessão mudaram. Saia do acompanhamento para voltar à sua organização.")}</p></div>
  </main>;
}
