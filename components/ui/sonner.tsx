"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        // Tokens do design system em vez dos apelidos shadcn: `bg-primary` pintava
        // o botão de ação de preto, fora da marca. A ação é a pílula `bg-accent`
        // do `Button`; cancelar fica neutro para não competir com ela.
        // O sonner injeta o CSS dele em runtime, depois do nosso; por isso o `!`
        // (importante) nas classes que disputam com o estilo padrão dele.
        // Os ícones de estado herdam a cor de `-fg` (legível nos dois temas) pelo
        // atributo `data-icon` que o sonner põe no contêiner do ícone.
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-lg! group-[.toaster]:border-border group-[.toaster]:bg-surface group-[.toaster]:text-text group-[.toaster]:shadow-lg",
          title: "font-display! font-semibold!",
          description: "text-text-muted!",
          actionButton:
            "rounded-full! bg-accent! font-display! font-semibold! text-accent-foreground!",
          cancelButton:
            "rounded-full! bg-surface-elevated! font-display! font-semibold! text-text-muted!",
          success: "[&_[data-icon]]:text-success-fg",
          error: "[&_[data-icon]]:text-error-fg",
          warning: "[&_[data-icon]]:text-warning-fg",
          info: "[&_[data-icon]]:text-info-fg",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
