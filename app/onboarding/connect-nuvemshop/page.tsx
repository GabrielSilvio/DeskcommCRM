import { requireAuth } from "@/lib/auth/server";
import { ConnectNuvemshopClient } from "./_client";
import { traduzir } from "@/lib/i18n/dicionario";

export const dynamic = "force-dynamic";

export default async function ConnectNuvemshopPage() {
  const user = await requireAuth();
  const idioma = user.idioma;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em]">{traduzir("Conectar Nuvemshop", idioma)}</h2>
        <p className="text-base text-text-muted">
          {traduzir("Importe pedidos, clientes e produtos da sua loja Nuvemshop.", idioma)}
        </p>
      </header>
      <ConnectNuvemshopClient />
    </div>
  );
}
