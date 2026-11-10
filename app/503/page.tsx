import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IDIOMA_PADRAO } from "@/lib/i18n/idiomas";
import { traduzir } from "@/lib/i18n/dicionario";

// Manutenção é justamente o cenário em que o Supabase pode estar fora do ar —
// esta página não pode depender dele para saber em que idioma falar. Sem
// sessão para consultar, fica no idioma padrão da instalação.
const idioma = IDIOMA_PADRAO;

export default function ServiceUnavailablePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4 sm:p-8">
      <div className="w-full max-w-lg rounded-2xl bg-tint-butter p-8 text-center sm:p-12">
        <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-4xl">{traduzir("503 — Em manutenção", idioma)}</h1>
        <p className="mt-3 text-base text-text-muted">
          {traduzir("Voltamos em alguns minutos.", idioma)}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/">{traduzir("Voltar", idioma)}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
