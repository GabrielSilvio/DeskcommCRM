"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";

import { copyToClipboard } from "@/lib/clipboard";
import { traduzir } from "@/lib/i18n/dicionario";
import { IDIOMA_PADRAO, idiomaDelNavegador, type Idioma } from "@/lib/i18n/idiomas";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [eventId, setEventId] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  // Parte do padrão (igual ao do servidor) e ajusta depois de montar, para não
  // quebrar a hidratação do único componente que não pode falhar.
  const [idioma, setIdioma] = useState<Idioma>(IDIOMA_PADRAO);

  useEffect(() => {
    setIdioma(idiomaDelNavegador(navigator.languages ?? [navigator.language]));
  }, []);

  useEffect(() => {
    const id = Sentry.captureException(error);
    setEventId(id);
  }, [error]);

  const displayId = eventId ?? error.digest ?? "—";

  return (
    <html lang={idioma}>
      {/*
        Esta tela substitui o layout raiz, então nem o globals.css nem as fontes
        chegam aqui: os valores abaixo são os do design system escritos à mão (é a
        única exceção à regra de usar token). O escuro entra por media query,
        porque não há atributo data-theme neste ponto da árvore.
      */}
      <head>
        <style>{"body{background:#f3f5fc;color:#0c1230}.ge-card{background:#fff;border:0}.ge-muted{color:#4f5876}.ge-id{background:#e9edf9}.ge-btn{background:#fff;color:#0c1230;border:2px solid #c5cde6}.ge-main{background:#2e5bea;color:#fff;border:0;box-shadow:inset 0 -3px 0 rgba(0,0,0,.14)}.ge-on{background:#0c1230;color:#fff;border-color:#0c1230}.ge-off{background:transparent;color:#4f5876;border-color:#c5cde6}@media (prefers-color-scheme:dark){body{background:#090d20;color:#eef1ff}.ge-card{background:#121735}.ge-muted{color:#a3acd0}.ge-id{background:#1b2148}.ge-btn{background:#121735;color:#eef1ff;border-color:#39427a}.ge-main{background:#6c96ff;color:#0a0f26}.ge-on{background:#eef1ff;color:#090d20;border-color:#eef1ff}.ge-off{color:#a3acd0;border-color:#39427a}}"}</style>
      </head>
      <body
        style={{
          margin: 0,
          fontFamily:
            "Figtree, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          className="ge-card"
          style={{
            maxWidth: 480,
            width: "100%",
            borderRadius: 28,
            boxShadow: "0 14px 30px -16px rgba(12,18,48,0.25)",
            padding: "2.5rem 2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.25rem",
              marginBottom: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={() => setIdioma("es")}
              className={idioma === "es" ? "ge-on" : "ge-off"}
              style={{
                padding: "0.3rem 0.75rem",
                fontSize: "0.75rem",
                borderRadius: 9999,
                border: "1px solid",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setIdioma("pt-BR")}
              className={idioma === "pt-BR" ? "ge-on" : "ge-off"}
              style={{
                padding: "0.3rem 0.75rem",
                fontSize: "0.75rem",
                borderRadius: 9999,
                border: "1px solid",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              PT
            </button>
          </div>
          <h1 style={{ fontSize: "2.25rem", lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 0.75rem", fontWeight: 800 }}>
            {traduzir("Algo deu errado", idioma)}
          </h1>
          <p className="ge-muted" style={{ margin: "0 0 1.5rem", fontSize: "1.0625rem" }}>
            {traduzir(
              "Tente novamente em instantes. Se persistir, contate o suporte com o ID abaixo.",
              idioma,
            )}
          </p>
          <div
            className="ge-id"
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.75rem",
              padding: "0.75rem",
              borderRadius: 14,
              marginBottom: "1rem",
              wordBreak: "break-all",
            }}
          >
            ID: {displayId}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => {
                void copyToClipboard(displayId).then((ok) => {
                  if (ok) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                });
              }}
              className="ge-btn"
              style={{
                padding: "0 1.5rem",
                minHeight: 48,
                fontSize: "1rem",
                fontWeight: 700,
                borderRadius: 9999,
                cursor: "pointer",
              }}
            >
              {copied ? traduzir("Copiado!", idioma) : traduzir("Copiar ID", idioma)}
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="ge-main"
              style={{
                padding: "0 1.5rem",
                minHeight: 48,
                fontSize: "1rem",
                fontWeight: 700,
                borderRadius: 9999,
                cursor: "pointer",
              }}
            >
              {traduzir("Tentar de novo", idioma)}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
