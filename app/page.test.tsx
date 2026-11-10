import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cena = vi.hoisted(() => ({
  usuario: null as { id: string } | null,
  cadastro: "aberto" as "aberto" | "com_aprovacao" | "so_convite",
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: cena.usuario } }) },
  }),
}));
vi.mock("@/lib/i18n/idiomaAnonimo", () => ({ idiomaDoVisitante: async () => "pt-BR" }));
vi.mock("@/lib/branding/saida", () => ({ marcaDaSaida: async () => ({ nome: "Marca da Revenda" }) }));
vi.mock("@/lib/auth/politica-de-cadastro", () => ({ modoDeCadastro: async () => cena.cadastro }));

import HomePage from "./page";

async function montar() {
  return render(await HomePage());
}

beforeEach(() => {
  cena.usuario = null;
  cena.cadastro = "aberto";
});

describe("/ — a página inicial pública", () => {
  // A verificação de um app que pede dados de conta Google abre o endereço
  // principal SEM entrar. Antes, `/` era só um redirect para o painel e o
  // revisor caía no login.
  it("sem sessão: mostra o nome da marca, o que o produto faz e os links legais", async () => {
    await montar();

    // O `h1` deixou de ser o nome da marca: na landing ele é a frase do hero
    // ("Todo ping merece resposta."), e o nome da marca vive no logotipo da
    // navegação e no texto do Google (testados abaixo). Um único `h1` na página.
    const titulos = screen.getAllByRole("heading", { level: 1 });
    expect(titulos).toHaveLength(1);
    expect(titulos[0]).toHaveTextContent("Todo ping merece resposta.");
    expect(screen.getByText(/Seu WhatsApp atendendo na hora/)).toBeInTheDocument();

    const politica = screen
      .getAllByRole("link", { name: "Política de Privacidade" })
      .map((a) => a.getAttribute("href"));
    expect(politica).toContain("/legal/privacy");
    expect(politica).toContain("/legal/privacy#dados-do-google");
    expect(screen.getByRole("link", { name: "Termos de Uso" })).toHaveAttribute(
      "href",
      "/legal/terms",
    );
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
  });

  it("o nome vem da marca resolvida, não de texto fixo", async () => {
    await montar();
    expect(document.body.textContent).toContain("Marca da Revenda");
    // No logotipo da navegação e no parágrafo sobre os dados do Google.
    expect(screen.getByText("Marca da Revenda", { selector: "header b" })).toBeInTheDocument();
    expect(document.querySelector("footer.foot")?.textContent).toContain("Marca da Revenda");
  });

  it("mantém, visível, o parágrafo sobre Google Agenda e Google Ads exigido pela verificação", async () => {
    await montar();
    const rodape = document.querySelector("footer.foot");
    expect(rodape?.textContent).toContain("Google Agenda");
    expect(rodape?.textContent).toContain("Google Ads");
  });

  it("cadastro aberto: 'Criar conta' e os botões de começar levam a /signup", async () => {
    await montar();
    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute("href", "/signup");
    for (const botao of screen.getAllByRole("link", { name: /Criar minha conta/ })) {
      expect(botao).toHaveAttribute("href", "/signup");
    }
  });

  it("só por convite: não há 'Criar conta' e os botões de começar levam ao login", async () => {
    cena.cadastro = "so_convite";
    await montar();
    expect(screen.queryByRole("link", { name: "Criar conta" })).toBeNull();
    expect(screen.queryByRole("link", { name: /Criar minha conta/ })).toBeNull();
    const entrar = screen.getAllByRole("link", { name: "Entrar" });
    expect(entrar.length).toBeGreaterThan(1);
    for (const link of entrar) expect(link).toHaveAttribute("href", "/login");
  });

  it("com sessão: segue direto para o painel, como sempre foi", async () => {
    cena.usuario = { id: "11111111-1111-4111-8111-111111111111" };
    await expect(montar()).rejects.toThrow("NEXT_REDIRECT:/app");
  });
});
