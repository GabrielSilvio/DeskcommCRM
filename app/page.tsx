import { redirect } from "next/navigation";

import { LandingPage } from "@/components/landing/LandingPage";
import { modoDeCadastro } from "@/lib/auth/politica-de-cadastro";
import { marcaDaSaida } from "@/lib/branding/saida";
import { idiomaDoVisitante } from "@/lib/i18n/idiomaAnonimo";
import { traduzir } from "@/lib/i18n/dicionario";
import { createClient } from "@/lib/supabase/server";

/**
 * A página inicial pública.
 *
 * Quem tem sessão segue direto para o painel, como sempre foi. Quem não tem vê
 * a landing (`components/landing/`), que diz o que o produto é e leva ao
 * cadastro, ao login, à política de privacidade e aos termos — sem pedir login.
 * A verificação de um app que pede dados de conta Google exige exatamente isso:
 * o revisor abre o endereço principal sem entrar e precisa ver o nome do
 * produto, o que ele faz com a conta Google e o link da política (o parágrafo e
 * os links ficam no rodapé da landing).
 *
 * `/` já é caminho público no `proxy` (`lib/auth/public-paths.ts`), então nada
 * lá muda. O nome vem da marca resolvida (`marcaDaSaida`: banco acima do
 * `.env`), nunca de texto fixo: uma imagem serve todas as marcas.
 *
 * "Criar conta" segue a mesma regra de `/signup` (`modoDeCadastro`): numa
 * instalação só por convite o botão não existe e os de começar levam ao login.
 * A tela de cadastro continua sendo a autoridade — aqui é só a vitrine.
 *
 * `getUser()` e nunca `getSession()`: o redirecionamento só vale para sessão que
 * o servidor de autenticação confirmou.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  const marca = await marcaDaSaida(null);
  const idioma = await idiomaDoVisitante(null);
  const t = (texto: string) => traduzir(texto, idioma);
  const cadastroAberto = (await modoDeCadastro()) !== "so_convite";

  return <LandingPage nome={marca.nome} t={t} cadastroAberto={cadastroAberto} />;
}
