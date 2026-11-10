# Imagens das telas de acesso (login, cadastro e irmãs)

Usadas por `app/(public)/layout.tsx` (painel de cor e assinatura do celular) e
`components/auth/EntrarComGoogle.tsx` (`google.svg`).

## Objetos 3D (WebP com transparência, 512x512)

| Arquivo | Objeto |
|---|---|
| `balao-de-conversa.webp` | balão de conversa azul com três pontos e selo coral |
| `conversa-verde.webp` | conversa verde com duas linhas |
| `moeda-com-check.webp` | moeda dourada com check |
| `faisca.webp` | faísca branca com faísca amarela pequena |
| `raio.webp` | raio coral |
| `cartoes-empilhados.webp` | três cartões empilhados |

## Como foram geradas

Nenhuma é desenhada à mão e nenhuma carrega Three.js em produção. São capturas
dos MESMOS modelos, materiais e luzes (`build.*`, `M`, ambiente PMREM, luzes) do
protótipo da landing (`pingcloser-design/prototipos/pingcloser-soft3d.html`,
Three.js r128):

1. Uma cópia de trabalho do protótipo reaproveita o trecho da cena (linhas do
   "Estúdio" até o fim de `build`) numa página própria, com
   `WebGLRenderer({ alpha: true, preserveDrawingBuffer: true })`, 768x768,
   `setClearColor(0, 0)`.
2. Cada objeto é renderizado sozinho, centralizado e escalado para ocupar 86%
   do quadro, com a rotação da landing (`data-r`: balão -8,-24,7; conversa
   verde 8,26,-9; moeda 16,-26,10; faísca 0,18,-14; raio 6,-20,12; cartões
   -14,24,-6).
3. Um Chrome headless com WebGL por software (SwiftShader, via CDP) avalia
   `renderer.render` e `canvas.toDataURL('image/png')` logo depois.
4. O PNG de 768px é reduzido a 512px e gravado com `sharp`
   (`webp({ quality: 82, alphaQuality: 90, effort: 6 })`). Cada arquivo tem
   entre 10 e 16 KB.

Para trocar um objeto ou a rotação, repita os passos 1 a 4 com o mesmo
protótipo; mantenha o nome do arquivo.

## `google.svg`

Marca "G" do Google nas cores oficiais, como arquivo para não cravar cor no
código dos componentes.
