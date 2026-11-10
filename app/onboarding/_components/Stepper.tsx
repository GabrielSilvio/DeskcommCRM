"use client";

import { usePathname } from "next/navigation";
import { useT } from "@/hooks/i18n/useT";

import { cn } from "@/lib/utils";

export interface PassoVisivel {
  segmento: string;
  rotulo: string;
  cumprido: boolean;
}

/**
 * O indicador de progresso.
 *
 * Duas coisas mudaram, e as duas eram defeito:
 *
 * 1. A lista era FIXA aqui dentro. Ela mostrava "Loja" mesmo quando a
 *    integração estava desligada — o padrão de toda instalação pelo kit — e a
 *    pessoa via um passo que nunca lhe seria oferecido. Agora os passos chegam
 *    de `lib/onboarding/passos.ts`, a mesma fonte que decide a ordem e monta o
 *    resumo final.
 *
 * 2. "Concluído" era `índice < atual`: bastava estar num passo adiante para os
 *    anteriores ficarem verdes, inclusive os que a pessoa pulou e os que nunca
 *    apareceram. Agora quem responde é o estado gravado.
 *
 * O passo ATUAL continua saindo da rota — o header `x-pathname` que alimentava
 * isso antes nunca era escrito por ninguém, e o indicador ficava travado no
 * primeiro passo o wizard inteiro.
 */
export function Stepper({ passos }: { passos: PassoVisivel[] }) {
  const t = useT();
  const pathname = usePathname() ?? "";
  const idx = passos.findIndex((p) => pathname.includes(`/${p.segmento}`));

  return (
    <ol aria-label="onboarding steps" className="flex w-full items-start gap-2 px-1 py-3 sm:gap-3">
      {passos.map((p, i) => {
        const isActive = i === idx;
        return (
          <li
            key={p.segmento}
            aria-current={isActive ? "step" : undefined}
            className="flex min-w-0 flex-1 flex-col gap-2 text-xs"
          >
            {/* Pílula de progresso: cheia no passo atual, suave no que já foi
                resolvido, vazia no que falta. O número fica só para leitor de tela. */}
            <div
              className={cn(
                "h-2.5 rounded-full transition-colors duration-base ease-out",
                isActive && "bg-accent",
                !isActive && p.cumprido && "bg-accent-200 dark:bg-accent-800",
                !isActive && !p.cumprido && "bg-border-strong/60",
              )}
            >
              <span className="sr-only">{i + 1}</span>
            </div>
            {/* Some visualmente abaixo de `sm`: os rótulos são frases (`Quem
                trabalha com ele`, `Onde ele organiza`), não palavras — com 7
                passos espremidos num celular de 375px, cada um ganha ~45px e
                o `truncate` cortava quase tudo, sem nenhum jeito de ler o
                resto. A tela de cada passo já mostra o título por extenso
                (`<h2>`), então o rótulo aqui é reforço, não a única fonte —
                `sr-only` mantém ele lido por leitor de tela mesmo escondido. */}
            <span
              className={cn(
                "sr-only truncate sm:not-sr-only",
                isActive ? "font-display font-bold text-text" : "text-text-subtle",
              )}
            >
              {t(p.rotulo)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
