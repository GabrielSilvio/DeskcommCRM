# Bibliotecas da landing (sem CDN)

Arquivos minificados exatos, baixados uma vez e servidos daqui para a landing não depender de
terceiros em tempo de execução (uma instalação self-host pode estar sem saída para a internet).
Carregados sob demanda por `components/landing/iniciar-landing.ts`. Nenhuma entra no `package.json`.

| Arquivo | Versão | Origem | Licença |
|---|---|---|---|
| `three.min.js` | three.js r128 | https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js | MIT |
| `gsap.min.js` | GSAP 3.12.5 | https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js | GreenSock Standard "no charge" license (https://gsap.com/standard-license) |
| `ScrollTrigger.min.js` | GSAP 3.12.5 | https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js | idem |
| `lenis.min.js` | Lenis 1.1.14 | https://unpkg.com/lenis@1.1.14/dist/lenis.min.js | MIT |

Baixados em 10/11/2026. Para atualizar, troque o arquivo e a versão aqui juntos e refaça a prova
visual da landing (o palco 3D foi escrito para o three r128: `outputEncoding`, `sRGBEncoding`).
