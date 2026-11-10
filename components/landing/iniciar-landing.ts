/* eslint-disable @typescript-eslint/no-explicit-any --
   Three, GSAP, ScrollTrigger e Lenis chegam como globais de <script> (sem CDN: os arquivos moram em
   public/landing/vendor) e não trazem tipos no repositório. Tipar a superfície que o palco usa seria
   um espelho de quatro bibliotecas inteiras para um módulo só; o `any` fica contido aqui. */

/**
 * O comportamento da landing: preloader, conversa roteirizada, palco 3D, rolagem (frase, trilho
 * horizontal, cartões), botões magnéticos e o popup "Comece em três passos".
 *
 * Portado do protótipo `pingcloser-soft3d.html` sem mudar o jeito dele de se mover. Três diferenças
 * que não são de visual:
 *
 *  1. Tudo é escopado à raiz (`.lp`) e devolve uma função de limpeza. A ida para `/login` é
 *     navegação do lado do cliente: sem a limpeza, o laço do `requestAnimationFrame`, o Lenis, os
 *     ScrollTriggers e os listeners de `window` continuariam vivos numa página que já não existe.
 *  2. As bibliotecas são carregadas de `/landing/vendor/` e cada falha é tolerada: sem Three o canvas
 *     some, sem GSAP o trilho vira rolagem nativa; a página inteira segue legível.
 *  3. O texto da conversa chega pronto (já traduzido pelo servidor): este módulo não importa o
 *     dicionário de idiomas, que pesaria no pacote do cliente.
 */

export interface PassoDaConversa {
  /** Classe do balão: `bub`, `bub ai`, `bub out` ou `sysl` (linha do sistema). */
  k?: string;
  t?: string;
  /** Rótulo pequeno sob o balão. */
  m?: string;
  /** Pausa até o próximo passo, em ms. */
  w?: number;
  /** Mostra o "digitando" por este tempo (em ms) em vez de um balão. */
  typing?: number;
  toast?: string;
  set?: Record<string, string | [string, string]>;
}

export interface EntradaDaLanding {
  conversa: PassoDaConversa[];
  /** Valores iniciais dos quatro marcadores da conversa (etapa, próximo passo, responsável, dono). */
  padrao: Record<string, string | [string, string]>;
}

type Globais = {
  THREE?: any;
  gsap?: any;
  ScrollTrigger?: any;
  Lenis?: any;
};

const VENDOR = "/landing/vendor/";
const carregados = new Map<string, Promise<void>>();

/** Carrega um script uma vez por página; falha de rede rejeita, quem chama decide o que fazer sem ele. */
function carregarScript(arquivo: string): Promise<void> {
  const url = VENDOR + arquivo;
  const ja = carregados.get(url);
  if (ja) return ja;
  const p = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = url;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      carregados.delete(url); // permite nova tentativa na próxima visita
      reject(new Error("não carregou " + url));
    };
    document.head.appendChild(s);
  });
  carregados.set(url, p);
  return p;
}

export function iniciarLanding(raiz: HTMLElement, entrada: EntradaDaLanding): () => void {
  const win = window as unknown as Globais & Window;
  const consulta = (q: string) => !!(window.matchMedia && window.matchMedia(q).matches);
  const reduced = consulta("(prefers-reduced-motion: reduce)");
  const t0 = performance.now();
  let cancelado = false;
  let pronto = false;
  let liberado = false;
  let lenis: any = null;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const limpezas: Array<() => void> = [];

  const $ = <E extends Element = HTMLElement>(s: string, c?: ParentNode) => (c || raiz).querySelector(s) as E | null;
  const $$ = <E extends Element = HTMLElement>(s: string, c?: ParentNode) => Array.prototype.slice.call((c || raiz).querySelectorAll(s)) as E[];
  const esperar = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };
  const ouvir = (alvo: EventTarget, tipo: string, fn: EventListener, opt?: AddEventListenerOptions | boolean) => {
    alvo.addEventListener(tipo, fn, opt);
    limpezas.push(() => alvo.removeEventListener(tipo, fn, opt));
  };

  function ready() {
    if (pronto || cancelado) return;
    pronto = true;
    raiz.classList.add("ready");
    esperar(() => {
      liberado = true;
    }, 250);
  }
  esperar(ready, reduced ? 0 : 2600); /* rede lenta ou erro não seguram a página */

  /* ───── Conversa roteirizada ───── */
  (function conversa() {
    const el = $("[data-chat]");
    const box = el && $("[data-msgs]", el);
    const host = el && $("[data-toasts]", el);
    if (!el || !box || !host) return;
    const SCRIPT = entrada.conversa;
    const DEF = entrada.padrao;
    let i = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let on = false;
    function set(s: Record<string, string | [string, string]>) {
      Object.keys(s).forEach((k) => {
        const n = $("[data-" + k + "]", el!);
        const v = s[k]!;
        if (!n) return;
        if (Array.isArray(v)) {
          n.textContent = v[0];
          n.className = v[1];
        } else n.textContent = v;
        n.classList.remove("bump");
        void n.offsetWidth;
        n.classList.add("bump");
      });
    }
    function add(s: PassoDaConversa) {
      const d = document.createElement("div");
      d.className = s.k || "";
      d.textContent = s.t || "";
      if (s.m) {
        const sm = document.createElement("small");
        sm.textContent = s.m;
        d.appendChild(sm);
      }
      box!.appendChild(d);
      while (box!.children.length > 6) box!.removeChild(box!.firstChild as Node);
    }
    function toast(txt: string) {
      const n = document.createElement("div");
      n.className = "toast";
      n.textContent = txt;
      host!.appendChild(n);
      esperar(() => {
        n.classList.add("bye");
        esperar(() => n.remove(), 320);
      }, 2600);
    }
    function step() {
      if (!on || cancelado) return;
      if (i >= SCRIPT.length) {
        timer = esperar(() => {
          box!.textContent = "";
          i = 0;
          set(DEF);
          step();
        }, 500);
        return;
      }
      const s = SCRIPT[i++]!;
      if (s.typing) {
        const ty = document.createElement("div");
        ty.className = "typing";
        ty.innerHTML = "<i></i><i></i><i></i>";
        box!.appendChild(ty);
        timer = esperar(() => {
          ty.remove();
          step();
        }, s.typing);
        return;
      }
      add(s);
      if (s.set) set(s.set);
      if (s.toast) toast(s.toast);
      timer = esperar(step, s.w || 1100);
    }
    if (reduced || !("IntersectionObserver" in window)) {
      SCRIPT.forEach((s) => {
        if (!s.typing) {
          add(s);
          if (s.set) set(s.set);
        }
      });
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        const v = es[0]!.isIntersecting;
        if (v && !on) {
          on = true;
          step();
        } else if (!v && on) {
          on = false;
          if (timer) clearTimeout(timer);
        }
      },
      { threshold: 0.2 },
    );
    io.observe($(".chat", el)!);
    limpezas.push(() => io.disconnect());
  })();

  /* ───── Popup que nasce do botão ───── */
  (function popup() {
    const gatilhos = $$("[data-como]");
    const dlg = $(".dlg");
    const veil = $(".veil");
    const fechar = $(".dlg .x");
    if (!dlg || !veil || !fechar || !gatilhos.length) return;
    let aberto = false;
    let origem: HTMLElement = gatilhos[0]!;
    function from() {
      const b = origem.getBoundingClientRect();
      const d = dlg!.getBoundingClientRect();
      return {
        transform: "translate(" + (b.left - d.left) + "px," + (b.top - d.top) + "px) scale(" + b.width / d.width + "," + b.height / d.height + ")",
        borderRadius: "999px",
        opacity: 0.4,
      };
    }
    function show(ev: Event) {
      if (aberto) return;
      aberto = true;
      origem = ev.currentTarget as HTMLElement;
      dlg!.hidden = false;
      veil!.hidden = false;
      if (lenis) lenis.stop();
      if (!reduced && typeof dlg!.animate === "function") {
        const b = origem.getBoundingClientRect();
        dlg!.animate([from(), { transform: "none", borderRadius: "40px", opacity: 1 }], { duration: 560, easing: "cubic-bezier(.34,1.3,.64,1)" });
        veil!.animate(
          [
            { clipPath: "circle(0px at " + (b.left + b.width / 2) + "px " + (b.top + b.height / 2) + "px)" },
            { clipPath: "circle(150vmax at " + (b.left + b.width / 2) + "px " + (b.top + b.height / 2) + "px)" },
          ],
          { duration: 620, easing: "cubic-bezier(.16,1,.3,1)" },
        );
      }
      fechar!.focus();
    }
    function hide() {
      if (!aberto) return;
      aberto = false;
      if (lenis) lenis.start();
      const done = () => {
        dlg!.hidden = true;
        veil!.hidden = true;
        origem.focus();
      };
      if (!reduced && typeof dlg!.animate === "function") {
        const a = veil!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
        a.onfinish = () => {
          veil!.getAnimations().forEach((x) => x.cancel());
        };
        dlg!.animate([{ transform: "none", borderRadius: "40px", opacity: 1 }, from()], { duration: 340, easing: "cubic-bezier(.4,0,.2,1)" }).onfinish = done;
      } else done();
    }
    gatilhos.forEach((g) => ouvir(g, "click", show));
    ouvir(fechar, "click", hide);
    ouvir(veil, "click", hide);
    ouvir(document, "keydown", (e) => {
      const ke = e as KeyboardEvent;
      if (!aberto) return;
      if (ke.key === "Escape") hide();
      if (ke.key === "Tab") {
        const f = $$("button, a[href]", dlg!);
        const first = f[0]!;
        const lastB = f[f.length - 1]!;
        if (ke.shiftKey && document.activeElement === first) {
          ke.preventDefault();
          lastB.focus();
        } else if (!ke.shiftKey && document.activeElement === lastB) {
          ke.preventDefault();
          first.focus();
        }
      }
    });
    limpezas.push(() => {
      dlg.hidden = true;
      veil.hidden = true;
    });
  })();

  /* ───── Botões magnéticos ───── */
  if (!reduced && consulta("(pointer: fine)")) {
    $$("[data-mag]").forEach((b) => {
      ouvir(b, "pointermove", (e) => {
        const pe = e as PointerEvent;
        const r = b.getBoundingClientRect();
        b.style.transform = "translate(" + (pe.clientX - r.left - r.width / 2) * 0.22 + "px," + (pe.clientY - r.top - r.height / 2) * 0.32 + "px)";
      });
      ouvir(b, "pointerleave", () => {
        b.style.transform = "";
      });
    });
  }

  /* ───── Sai a tela de carregamento ───── */
  const espera = reduced ? 0 : Math.max(0, 1250 - (performance.now() - t0));
  const fontes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontes.then(() => esperar(ready, espera));

  /* ───── Palco 3D e rolagem: dependem das bibliotecas ───── */
  const hz = $(".hz");
  const track = hz && $(".hz-track", hz);
  hz?.classList.add("native"); // até o GSAP provar que pode, o trilho é a rolagem nativa

  Promise.allSettled([
    carregarScript("three.min.js"),
    carregarScript("gsap.min.js").then(() => carregarScript("ScrollTrigger.min.js")),
    carregarScript("lenis.min.js"),
  ]).then(() => {
    if (cancelado) return;
    iniciarPalco();
    iniciarRolagem();
  });

  function iniciarPalco() {
    const T = win.THREE;
    const cv = $<HTMLCanvasElement>("#gl");
    if (!T || !cv) {
      raiz.classList.add("no-gl");
      return;
    }
    let R: any;
    try {
      R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      raiz.classList.add("no-gl");
      return;
    }
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    R.outputEncoding = T.sRGBEncoding;
    R.toneMapping = T.NoToneMapping;
    R.shadowMap.enabled = true;
    R.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene();
    const FOV = 26;
    const D = 20;
    const cam = new T.PerspectiveCamera(FOV, 1, 0.1, 100);
    cam.position.z = D;
    const halfH = Math.tan((FOV * Math.PI) / 360) * D;

    /* Estúdio: uma luz grande em cima, duas laterais e um rebatedor quente embaixo viram os reflexos do material */
    const env = new T.Scene();
    env.add(new T.Mesh(new T.BoxGeometry(60, 60, 60), new T.MeshBasicMaterial({ color: 0x2a3158, side: T.BackSide })));
    function panel(w: number, h: number, x: number, y: number, z: number, i: number, tintc?: number) {
      const c = new T.Color(tintc || 0xffffff).multiplyScalar(i);
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide }));
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    }
    panel(30, 12, 0, 26, 8, 1.5);
    panel(8, 22, -26, 6, 8, 0.95);
    panel(8, 18, 26, 2, 8, 0.6, 0xcfdcff);
    panel(24, 8, 0, -24, 8, 0.3, 0xffe9c2);
    panel(12, 12, 6, 8, 28, 0.4);
    const pm = new T.PMREMGenerator(R);
    const envRT = pm.fromScene(env, 0.03);
    scene.environment = envRT.texture;
    pm.dispose();
    scene.add(new T.HemisphereLight(0xffffff, 0x7d8ee6, 0.3));
    const key = new T.DirectionalLight(0xfff3e2, 0.56);
    key.position.set(-7, 11, 13);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 9;
    key.shadow.camera.bottom = -9;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 60;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.03;
    key.shadow.radius = 5;
    scene.add(key);
    const rim = new T.DirectionalLight(0x8fb0ff, 0.4);
    rim.position.set(9, 3, -9);
    scene.add(rim);

    /* Massinha brilhante: verniz por cima e um pouco da própria cor nas sombras, para elas não acinzentarem */
    function mat(c: number, o?: any) {
      o = o || {};
      const m = new T.MeshPhysicalMaterial({
        color: c,
        roughness: o.r == null ? 0.3 : o.r,
        metalness: o.m || 0,
        clearcoat: o.c == null ? 0.85 : o.c,
        clearcoatRoughness: o.cr == null ? 0.2 : o.cr,
        envMapIntensity: o.e == null ? 0.8 : o.e,
      });
      m.emissive = new T.Color(c).multiplyScalar(o.g == null ? 0.16 : o.g);
      return m;
    }
    const M: Record<string, any> = {
      blue: mat(0x1741f2),
      green: mat(0x0fc468),
      yellow: mat(0xffb300),
      gold: mat(0xffa600, { r: 0.24, g: 0.2 }),
      goldLight: mat(0xffc226, { r: 0.22, g: 0.22 }),
      white: mat(0xffffff, { r: 0.36, g: 0.04, e: 0.8 }),
      coral: mat(0xff472b),
      navy: mat(0x141d5a),
      sky: mat(0x7fa2ff),
      cream: mat(0xffd457),
      grey: mat(0xb4c0ea, { r: 0.5, c: 0.3, g: 0.06 }),
    };
    const tint = (name: string | null) => (name && M[name]) || M.blue;
    function rr(w: number, h: number, r: number) {
      const s = new T.Shape();
      const x = -w / 2;
      const y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
      s.lineTo(x + w, y + h - r);
      s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
      s.lineTo(x + r, y + h);
      s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
      s.lineTo(x, y + r);
      s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
      return s;
    }
    function ext(shape: any, depth: number, bevel: number, seg?: number) {
      const g = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg || 12, curveSegments: 36, steps: 1 });
      g.center();
      return g;
    }
    const bar = (len: number, th: number, depth: number, m: any) => new T.Mesh(ext(rr(len, th, th / 2 - 0.001), depth, Math.min(0.035, th / 4), 5), m);
    const ball = (r: number, m: any) => new T.Mesh(new T.SphereGeometry(r, 48, 36), m);
    function bubbleShape(w: number, h: number, r: number) {
      const s = new T.Shape();
      const x = -w / 2;
      const y = -h / 2;
      s.moveTo(x + r * 0.9, y);
      s.lineTo(x + 0.27, y - 0.47);
      s.quadraticCurveTo(x + 0.15, y - 0.58, x + 0.33, y - 0.53);
      s.lineTo(x + r + 0.74, y);
      s.lineTo(x + w - r, y);
      s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
      s.lineTo(x + w, y + h - r);
      s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
      s.lineTo(x + r, y + h);
      s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
      s.lineTo(x, y + r);
      s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
      return s;
    }
    function disc(R0: number, h: number, m: any) {
      const p: any[] = [];
      const e = h / 2;
      p.push(new T.Vector2(0, e));
      for (let i = 0; i <= 14; i++) {
        const a = Math.PI / 2 - (i / 14) * Math.PI;
        p.push(new T.Vector2(R0 - e + Math.cos(a) * e, Math.sin(a) * e));
      }
      p.push(new T.Vector2(0, -e));
      const g = new T.LatheGeometry(p, 96);
      g.rotateX(Math.PI / 2);
      return new T.Mesh(g, m);
    }

    const build: Record<string, (el: Element) => any> = {
      bubble() {
        const g = new T.Group();
        const body = new T.Mesh(ext(bubbleShape(2.7, 1.9, 0.72), 0.62, 0.32, 18), M.blue);
        g.add(body);
        const dots: any[] = [];
        [-0.58, 0, 0.58].forEach((x) => {
          const d = ball(0.2, M.white);
          d.position.set(x, 0.2, 0.6);
          g.add(d);
          dots.push(d);
        });
        const badge = ball(0.36, M.coral);
        badge.position.set(1.24, 1.1, 0.34);
        g.add(badge);
        g.userData = { dots, badge };
        return g;
      },
      wa() {
        const g = new T.Group();
        const body = new T.Mesh(ext(bubbleShape(2.3, 1.6, 0.62), 0.54, 0.28, 18), M.green);
        body.rotation.y = Math.PI;
        g.add(body);
        const a = bar(1.3, 0.22, 0.07, M.white);
        a.position.set(-0.12, 0.42, 0.56);
        g.add(a);
        const b = bar(0.8, 0.22, 0.07, M.white);
        b.position.set(-0.37, 0.04, 0.56);
        g.add(b);
        return g;
      },
      coin() {
        const g = new T.Group();
        g.add(disc(1, 0.3, M.gold));
        const face = disc(0.8, 0.36, M.goldLight);
        g.add(face);
        const rimc = new T.Mesh(new T.TorusGeometry(0.9, 0.05, 18, 96), M.goldLight);
        rimc.position.z = 0.14;
        g.add(rimc);
        const rim2 = rimc.clone();
        rim2.position.z = -0.14;
        g.add(rim2);
        const a = bar(0.48, 0.2, 0.07, M.white);
        const b = bar(0.92, 0.2, 0.07, M.white);
        a.position.set(-0.27, -0.13, 0.22);
        a.rotation.z = -Math.PI / 4;
        b.position.set(0.15, 0.03, 0.22);
        b.rotation.z = 0.803;
        g.add(a);
        g.add(b);
        return g;
      },
      spark() {
        function star(k: number) {
          const s = new T.Shape();
          s.moveTo(0, 1);
          s.quadraticCurveTo(k, k, 1, 0);
          s.quadraticCurveTo(k, -k, 0, -1);
          s.quadraticCurveTo(-k, -k, -1, 0);
          s.quadraticCurveTo(-k, k, 0, 1);
          return s;
        }
        const g = new T.Group();
        const a = new T.Mesh(ext(star(0.22), 0.26, 0.13, 10), M.white);
        g.add(a);
        const b = new T.Mesh(ext(star(0.22), 0.24, 0.12, 10), M.yellow);
        b.scale.setScalar(0.42);
        b.position.set(0.95, 0.82, 0.1);
        g.add(b);
        g.userData = { small: b };
        return g;
      },
      bolt() {
        const s = new T.Shape();
        [
          [0.12, 1],
          [-0.62, -0.16],
          [-0.08, -0.16],
          [-0.26, -1],
          [0.62, 0.2],
          [0.08, 0.2],
          [0.4, 1],
        ].forEach((p, i) => {
          if (i) s.lineTo(p[0]!, p[1]!);
          else s.moveTo(p[0]!, p[1]!);
        });
        const g = new T.Group();
        g.add(new T.Mesh(ext(s, 0.34, 0.11, 10), M.coral));
        return g;
      },
      cards() {
        const g = new T.Group();
        const ms = [M.sky, M.cream, M.white];
        ms.forEach((m, i) => {
          const c = new T.Group();
          c.add(new T.Mesh(ext(rr(1.7, 1.15, 0.22), 0.07, 0.06, 8), m));
          c.position.set((i - 1) * 0.16, (i - 1) * 0.14, i * 0.28);
          c.rotation.z = (1 - i) * 0.13;
          if (i === 2) {
            const a = bar(0.62, 0.17, 0.05, M.blue);
            a.position.set(-0.36, 0.28, 0.12);
            c.add(a);
            const b = bar(1.1, 0.11, 0.04, M.grey);
            b.position.set(-0.12, 0, 0.12);
            c.add(b);
            const d = bar(0.8, 0.11, 0.04, M.grey);
            d.position.set(-0.27, -0.2, 0.12);
            c.add(d);
            const e = ball(0.12, M.green);
            e.position.set(0.56, 0.29, 0.14);
            c.add(e);
          }
          g.add(c);
        });
        return g;
      },
      clock() {
        const g = new T.Group();
        g.add(disc(0.95, 0.26, M.white));
        const rimc = new T.Mesh(new T.TorusGeometry(0.95, 0.14, 24, 96), M.blue);
        g.add(rimc);
        function hand(len: number, th: number, m: any) {
          const p = new T.Group();
          const b = bar(len, th, 0.05, m);
          b.position.set(len / 2 - th / 2, 0, 0);
          p.add(b);
          p.position.z = 0.17;
          g.add(p);
          return p;
        }
        const h = hand(0.5, 0.17, M.navy);
        const mnt = hand(0.76, 0.13, M.coral);
        const cap = ball(0.13, M.navy);
        cap.position.z = 0.2;
        g.add(cap);
        [0, 1, 2, 3].forEach((i) => {
          const tk = ball(0.05, M.grey);
          const a = (i * Math.PI) / 2;
          tk.position.set(Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0.14);
          g.add(tk);
        });
        g.userData = { h, m: mnt };
        return g;
      },
      ball(el) {
        const g = new T.Group();
        g.add(ball(1, tint(el.getAttribute("data-c"))));
        return g;
      },
      ring(el) {
        const g = new T.Group();
        g.add(new T.Mesh(new T.TorusGeometry(0.8, 0.26, 28, 96), tint(el.getAttribute("data-c"))));
        return g;
      },
    };
    const shCanvas = document.createElement("canvas");
    shCanvas.width = shCanvas.height = 128;
    const shx = shCanvas.getContext("2d")!;
    const shg = shx.createRadialGradient(64, 64, 4, 64, 64, 62);
    shg.addColorStop(0, "rgba(12,18,60,.55)");
    shg.addColorStop(0.5, "rgba(12,18,60,.2)");
    shg.addColorStop(1, "rgba(12,18,60,0)");
    shx.fillStyle = shg;
    shx.fillRect(0, 0, 128, 128);
    const shTex = new T.CanvasTexture(shCanvas);

    interface Objeto {
      n: string;
      g: any;
      node: any;
      sh: any;
      el: HTMLElement;
      rot: number[];
      pos: any;
      s: number;
      rx: number;
      ry: number;
      rz: number;
      px: number;
      py: number;
      seed: number;
      depth: number;
      drop: number;
      delay: number;
      first: boolean;
    }
    const objs: Objeto[] = [];
    const hero = $(".hero")!;
    $$(".hero [data-a]").forEach((el, i) => {
      const n = el.getAttribute("data-a")!;
      const g = build[n]!(el);
      g.traverse((m: any) => {
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = n !== "coin";
        }
      });
      const box = new T.Box3().setFromObject(g);
      const sz = new T.Vector3();
      const c = new T.Vector3();
      box.getSize(sz);
      box.getCenter(c);
      g.position.sub(c);
      const inner = new T.Group();
      inner.add(g);
      inner.scale.setScalar(1 / Math.max(sz.x, sz.y));
      const node = new T.Group();
      node.add(inner);
      node.visible = false;
      scene.add(node);
      const sh = new T.Mesh(new T.PlaneGeometry(1.25, 0.6), new T.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, opacity: 0.42 }));
      sh.renderOrder = -1;
      sh.visible = false;
      scene.add(sh);
      objs.push({
        n,
        g,
        node,
        sh,
        el,
        rot: (el.getAttribute("data-r") || "0,0,0").split(",").map(Number),
        pos: new T.Vector3(),
        s: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        px: 0,
        py: 0,
        seed: i * 1.7 + 0.6,
        depth: 0.7 + (i % 4) * 0.3,
        drop: 1,
        delay: 120 + (i % 7) * 95,
        first: true,
      });
    });
    let W = 1;
    let H = 1;
    let mx = 0;
    let my = 0;
    let smx = 0;
    let smy = 0;
    let pxl = -9999;
    let pyl = -9999;
    let last = performance.now();
    let relAt = 0;
    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      R.setSize(W, H, false);
      cam.aspect = W / H;
      cam.updateProjectionMatrix();
    }
    ouvir(window, "resize", resize);
    resize();
    ouvir(
      window,
      "pointermove",
      (e) => {
        const pe = e as PointerEvent;
        mx = (pe.clientX / W) * 2 - 1;
        my = (pe.clientY / H) * 2 - 1;
        pxl = pe.clientX;
        pyl = pe.clientY;
      },
      { passive: true },
    );
    function hide(o: Objeto) {
      o.node.visible = false;
      o.sh.visible = false;
    }
    let raf = 0;
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const k = 1 - Math.exp(-dt * 14);
      const kr = 1 - Math.exp(-dt * 5);
      const sy = window.scrollY;
      smx += (mx - smx) * 0.06;
      smy += (my - smy) * 0.06;
      if (liberado && !relAt) relAt = now;
      const heroH = hero.offsetHeight || H;
      const hp = Math.min(1, Math.max(0, sy / heroH));
      if (sy > heroH + 60) return; /* topo fora de cena: nada para desenhar */
      const unit = (2 * halfH) / H;
      const live = reduced ? 0 : 1;
      for (let i = 0; i < objs.length; i++) {
        const o = objs[i]!;
        const r = o.el.getBoundingClientRect();
        if (!r.width || r.bottom < -H * 0.9 || r.top > H * 1.9) {
          hide(o);
          continue;
        }
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        let ts = r.width * unit;
        let tx = (cx - W / 2) * unit;
        let ty = -(cy - H / 2) * unit;
        if (relAt && now - relAt > o.delay) o.drop += (0 - o.drop) * (1 - Math.exp(-dt * 3.2));
        ty -= o.drop * halfH * 2.6;
        ts *= 1 - hp * 0.14; /* cortina: o hero encolhe um pouco enquanto some por baixo */
        ty += Math.sin(t * 0.9 + o.seed) * 0.09 * ts * live;
        const dx = o.pos.x / unit + W / 2 - pxl;
        const dy = -(o.pos.y / unit) + H / 2 - pyl;
        const d = Math.sqrt(dx * dx + dy * dy);
        const rad = Math.max(120, r.width * 0.9);
        if (d < rad && live) {
          const f = (1 - d / rad) * 0.9;
          o.px += (dx / (d || 1)) * f * 0.16;
          o.py += (-dy / (d || 1)) * f * 0.16;
        }
        o.px *= 0.9;
        o.py *= 0.9;
        tx += o.px * ts;
        ty += o.py * ts;
        if (o.first) {
          o.pos.set(tx, ty, 0);
          o.s = ts;
          o.first = false;
        }
        o.node.visible = true;
        o.sh.visible = o.n !== "ball" && o.n !== "ring";
        o.pos.x += (tx - o.pos.x) * k;
        o.pos.y += (ty - o.pos.y) * k;
        o.s += (ts - o.s) * k;
        o.node.position.copy(o.pos);
        o.node.scale.setScalar(Math.max(o.s, 0.0001));
        o.sh.position.set(o.pos.x + o.s * 0.05, o.pos.y - o.s * 0.52, -2.5);
        o.sh.scale.setScalar(Math.max(o.s, 0.0001));
        const trx = (o.rot[0]! * Math.PI) / 180 + (Math.sin(t * 0.7 + o.seed) * 0.1 + smy * 0.22) * live + o.py * 1.4;
        const tryy = (o.rot[1]! * Math.PI) / 180 + (Math.cos(t * 0.55 + o.seed) * 0.16 + smx * 0.32) * live + o.px * 1.4 + o.drop * 5;
        const trz = (o.rot[2]! * Math.PI) / 180 + Math.sin(t * 0.45 + o.seed * 2) * 0.05 * live;
        o.rx += (trx - o.rx) * kr;
        o.ry += (tryy - o.ry) * kr;
        o.rz += (trz - o.rz) * kr;
        o.node.rotation.set(o.rx, o.ry, o.rz);
        const u = o.g.userData;
        if (o.n === "bubble") {
          u.dots.forEach((dn: any, j: number) => {
            const ph = (t * 1.5 - j * 0.16) % 1.3;
            dn.position.y = 0.22 + (ph < 0.45 ? Math.sin((ph / 0.45) * Math.PI) * 0.2 : 0) * live;
          });
          u.badge.scale.setScalar(1 + Math.max(0, Math.sin(t * 2.4)) * 0.16 * live);
        }
        if (o.n === "clock") {
          u.m.rotation.z = Math.PI / 2 - t * 0.9 * live;
          u.h.rotation.z = Math.PI / 5 - t * 0.075 * live;
        }
        if (o.n === "spark") {
          u.small.rotation.z = t * 0.9 * live;
          u.small.scale.setScalar(0.42 + Math.sin(t * 2.2) * 0.06 * live);
        }
      }
      R.render(scene, cam);
    }
    raf = requestAnimationFrame(frame);
    limpezas.push(() => {
      cancelAnimationFrame(raf);
      scene.traverse((m: any) => {
        if (m.geometry) m.geometry.dispose();
      });
      Object.keys(M).forEach((nome) => M[nome].dispose());
      objs.forEach((o) => o.sh.material.dispose());
      shTex.dispose();
      envRT.dispose();
      env.traverse((m: any) => {
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
      });
      // Sem forceContextLoss de propósito: o React pode reaproveitar este mesmo <canvas> (modo estrito
      // em desenvolvimento), e um contexto perdido não volta a desenhar.
      R.dispose();
    });
  }

  function iniciarRolagem() {
    const gsap = win.gsap;
    const ST = win.ScrollTrigger;
    if (!hz || !track || !gsap || !ST || reduced) return;
    gsap.registerPlugin(ST);
    const ctx = gsap.context(() => {
      if (win.Lenis && consulta("(pointer: fine)")) {
        try {
          lenis = new win.Lenis({ lerp: 0.11 });
          lenis.on("scroll", ST.update);
          const tick = (tm: number) => lenis && lenis.raf(tm * 1000);
          gsap.ticker.add(tick);
          gsap.ticker.lagSmoothing(0);
          limpezas.push(() => {
            gsap.ticker.remove(tick);
            gsap.ticker.lagSmoothing(500, 33); // o padrão do GSAP: a página seguinte não herda o nosso ajuste
            if (lenis) lenis.destroy();
            lenis = null;
          });
        } catch {
          lenis = null;
        }
      }
      const say = $(".say");
      let textoOriginal = "";
      if (say) {
        textoOriginal = say.textContent || "";
        say.innerHTML = textoOriginal
          .trim()
          .split(/\s+/)
          .map((w) => "<span>" + w.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>")
          .join(" ");
        limpezas.push(() => {
          say.textContent = textoOriginal;
        });
        gsap.to($$("span", say), { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: say, start: "top 82%", end: "bottom 48%", scrub: true } });
      }
      gsap.to($(".mega"), { yPercent: -18, scale: 0.93, ease: "none", scrollTrigger: { trigger: $(".hero"), start: "top top", end: "bottom top", scrub: true } });
      const mm = gsap.matchMedia();
      mm.add("(min-width: 901px)", () => {
        hz.classList.remove("native");
        const travel = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const size = () => {
          hz.style.height = travel() + window.innerHeight + "px";
        };
        size();
        ST.addEventListener("refreshInit", size);
        const tw = gsap.to(track, { x: () => -travel(), ease: "none", scrollTrigger: { trigger: hz, start: "top top", end: () => "+=" + travel(), scrub: 0.5, invalidateOnRefresh: true } });
        gsap.to($(".hz-bar i"), { scaleX: 1, ease: "none", scrollTrigger: { trigger: hz, start: "top top", end: () => "+=" + travel(), scrub: true } });
        $$(".fc").forEach((card) => {
          gsap
            .timeline({ scrollTrigger: { trigger: card, containerAnimation: tw, start: "left 100%", end: "right 0%", scrub: true } })
            .fromTo(card, { rotateY: -48, rotateX: 4, y: 50, scale: 0.9 }, { rotateY: 0, rotateX: 0, y: 0, scale: 1, ease: "none" })
            .to(card, { rotateY: 40, rotateX: -3, y: -36, scale: 0.9, ease: "none" });
        });
        const cards = $$(".ctl");
        gsap.fromTo(
          cards,
          { x: (_i: number, el: HTMLElement) => (el.parentNode as HTMLElement).clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2), y: 70, rotation: (i: number) => [-12, -5, 6, 13][i], scale: 0.9 },
          { x: 0, y: 0, rotation: 0, scale: 1, ease: "none", scrollTrigger: { trigger: ".ctl-grid", start: "top 95%", end: "top 42%", scrub: 0.6, invalidateOnRefresh: true } },
        );
        return () => {
          hz.style.height = "";
          ST.removeEventListener("refreshInit", size);
          hz.classList.add("native");
        };
      });
      limpezas.push(() => mm.revert());
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (!cancelado) ST.refresh();
        });
      }
    }, raiz);
    limpezas.push(() => ctx.revert());
  }

  return () => {
    cancelado = true;
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
    // Ordem inversa à da montagem: o que foi criado por último depende do que veio antes.
    for (let i = limpezas.length - 1; i >= 0; i--) {
      try {
        limpezas[i]!();
      } catch {
        /* uma limpeza que falha não pode impedir as outras */
      }
    }
    limpezas.length = 0;
    raiz.classList.remove("ready", "no-gl");
  };
}
