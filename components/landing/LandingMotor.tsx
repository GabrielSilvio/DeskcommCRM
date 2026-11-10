"use client";

import { useEffect, useRef } from "react";

import { iniciarLanding, type EntradaDaLanding } from "./iniciar-landing";

/**
 * O único pedaço da landing que roda no navegador. Não desenha nada: acha a raiz `.lp` onde foi
 * montado e entrega o comportamento (palco 3D, rolagem, conversa, popup) ao módulo de inicialização,
 * guardando a função de limpeza que ele devolve.
 *
 * A limpeza importa porque ir para `/login` é navegação do lado do cliente: o laço de animação, o
 * Lenis e os ScrollTriggers precisam morrer junto com a página, senão seguem trabalhando por baixo
 * da tela de entrada.
 */
export function LandingMotor(entrada: EntradaDaLanding) {
  const ancora = useRef<HTMLSpanElement>(null);
  // Só a primeira entrega vale: um refresh do servidor reenvia objetos novos e não deve reiniciar o palco.
  const inicial = useRef(entrada);

  useEffect(() => {
    const raiz = ancora.current?.closest<HTMLElement>(".lp");
    if (!raiz) return;
    return iniciarLanding(raiz, inicial.current);
  }, []);

  return <span ref={ancora} hidden aria-hidden />;
}
