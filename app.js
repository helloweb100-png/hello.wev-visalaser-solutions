/* =========================================================================
   VISA LASER SOLUTIONS · app.js
   Sin dependencias. Un solo bucle rAF con scroll amortiguado ("slow motion")
   que alimenta todos los efectos ligados al scroll.
   Índice:
     0 · Configuración editable        7 · Hero (rotador, partículas, tilt 3D)
     1 · Utilidades y estado           8 · Cinta (marquee)
     2 · Motor de scroll               9 · Manifiesto (palabras que se iluminan)
     3 · Loader                       10 · Imagen que se abre
     4 · WhatsApp y redes             11 · Tarjetas apiladas
     5 · Navegación y menú            12 · Línea de tiempo
     6 · Texto dividido y reveals     13 · Detalles (FAQ, form, footer, etc.)
   ========================================================================= */
(() => {
    'use strict';

    /* ─────────────────────────────────────────────────────────
       0 · CONFIGURACIÓN EDITABLE
       ───────────────────────────────────────────────────────── */
    const CONFIG = {
        // WhatsApp del negocio (código de país + número, sin símbolos)
        whatsapp: '528727784981',
        // Redes sociales: pega aquí las URLs reales y los íconos aparecerán solos.
        // Mientras estén vacías, la sección "Búscanos en redes sociales" permanece oculta.
        social: {
            tiktok: '',
            facebook: '',
            instagram: ''
        },
        // Mensaje por defecto si un botón no define el suyo
        waDefault: 'Hola, quiero información sobre sus trámites.'
    };

    /* ─────────────────────────────────────────────────────────
       1 · UTILIDADES Y ESTADO
       ───────────────────────────────────────────────────────── */
    const root = document.documentElement;
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = {
        out: t => 1 - Math.pow(1 - t, 3),
        inOut: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    };
    const abs = el => el.getBoundingClientRect().top + window.scrollY;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const S = { y: 0, target: 0, vel: 0, vh: window.innerHeight, vw: window.innerWidth, ready: false };
    const tasks = [];      // funciones que corren en cada frame
    const measures = [];   // funciones que recalculan posiciones (resize/load)
    const state = { expand: 0 };

    const addTask = fn => tasks.push(fn);
    const addMeasure = fn => { measures.push(fn); };
    const measureAll = () => {
        S.vh = window.innerHeight;
        S.vw = window.innerWidth;
        measures.forEach(fn => fn());
    };

    const waLink = text => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text || CONFIG.waDefault)}`;

    /* ─────────────────────────────────────────────────────────
       2 · MOTOR DE SCROLL (amortiguado, independiente del fps)
       ───────────────────────────────────────────────────────── */
    let lastT = performance.now();
    function frame(now) {
        const dt = Math.min(.064, Math.max(.001, (now - lastT) / 1000));
        lastT = now;
        S.target = window.scrollY;
        const prev = S.y;
        const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 7.5);
        S.y += (S.target - S.y) * k;
        if (Math.abs(S.target - S.y) < .08) S.y = S.target;
        S.vel += (((S.y - prev) / dt) - S.vel) * .18;
        for (let i = 0; i < tasks.length; i++) tasks[i](S, dt, now);
        requestAnimationFrame(frame);
    }

    /* ─────────────────────────────────────────────────────────
       3 · LOADER (pantalla de carga con estados reales)
       ───────────────────────────────────────────────────────── */
    function runLoader() {
        return new Promise(resolve => {
            const el = $('#loader');
            if (!el) { root.classList.remove('is-loading'); root.classList.add('is-ready'); resolve(); return; }

            const status = $('[data-loader-status]', el);
            const bar = $('[data-loader-bar]', el);
            const pct = $('[data-loader-pct]', el);
            const steps = [
                [0, 'Iniciando sistemas…'],
                [24, 'Verificando documentos…'],
                [50, 'Conectando México · EE.UU. · Canadá…'],
                [76, 'Preparando tu asesoría…'],
                [97, 'Listo para despegar']
            ];
            const minMs = reduceMotion ? 450 : 2700;
            const t0 = performance.now();
            let assetsReady = false, shown = 0, done = false, stepIdx = -1;

            const fontsP = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
            const logoP = new Promise(r => { const im = new Image(); im.onload = im.onerror = r; im.src = 'logo.jpeg'; });
            const loadP = document.readyState === 'complete' ? Promise.resolve() : new Promise(r => window.addEventListener('load', r, { once: true }));
            Promise.all([fontsP, logoP, loadP]).then(() => { assetsReady = true; });
            setTimeout(() => { assetsReady = true; }, 7500); // seguro anti-bloqueo

            function finish() {
                if (done) return;
                done = true;
                bar.style.transform = 'scaleX(1)';
                pct.textContent = '100';
                status.textContent = 'Listo para despegar';
                setTimeout(() => {
                    el.classList.add('is-done');
                    setTimeout(() => { root.classList.add('is-ready'); S.ready = true; }, reduceMotion ? 0 : 650);
                    setTimeout(() => {
                        el.remove();
                        root.classList.remove('is-loading');
                        measureAll();
                        if (location.hash && $(location.hash)) $(location.hash).scrollIntoView();
                        resolve();
                    }, reduceMotion ? 50 : 1250);
                }, 380);
            }

            (function tick(now) {
                const t = clamp((now - t0) / minMs);
                let target = ease.inOut(t) * 100;
                if (!assetsReady) target = Math.min(target, 91);
                shown += (target - shown) * .12;
                const v = Math.min(100, shown);
                bar.style.transform = `scaleX(${(v / 100).toFixed(4)})`;
                pct.textContent = Math.floor(v);
                for (let i = steps.length - 1; i >= 0; i--) {
                    if (v >= steps[i][0]) { if (i !== stepIdx) { stepIdx = i; status.textContent = steps[i][1]; } break; }
                }
                if (assetsReady && t >= 1 && v > 99) finish();
                else requestAnimationFrame(tick);
            })(t0);
        });
    }

    /* ─────────────────────────────────────────────────────────
       4 · WHATSAPP, REDES Y DETALLES DE MARCA
       ───────────────────────────────────────────────────────── */
    function initLinks() {
        $$('[data-wa]').forEach(a => { a.href = waLink(a.dataset.wa); });

        const wrap = $('[data-social-wrap]');
        if (wrap) {
            let any = false;
            $$('[data-social]', wrap).forEach(a => {
                const url = CONFIG.social[a.dataset.social];
                if (url) { a.href = url; a.hidden = false; any = true; }
            });
            wrap.hidden = !any;
        }
        $$('[data-year]').forEach(n => { n.textContent = new Date().getFullYear(); });
    }

    /* ─────────────────────────────────────────────────────────
       5 · NAVEGACIÓN Y MENÚ MÓVIL
       ───────────────────────────────────────────────────────── */
    function initNav() {
        const nav = $('[data-nav]');
        if (!nav) return;
        const rail = $('[data-progress]');
        const links = $$('[data-link]');
        const secs = $$('[data-theme]').map(el => ({ el, top: 0, bottom: 0, theme: el.dataset.theme, id: el.id }));
        let navH = 68, docH = 1, lastTheme = '', lastSolid = null, lastActive = '', lastP = -1;

        addMeasure(() => {
            navH = nav.offsetHeight;
            docH = Math.max(1, document.documentElement.scrollHeight - S.vh);
            secs.forEach(s => { s.top = abs(s.el); s.bottom = s.top + s.el.offsetHeight; });
        });

        addTask(() => {
            const y = S.target;
            const solid = y > 24;
            if (solid !== lastSolid) { nav.classList.toggle('is-solid', solid); lastSolid = solid; }

            const probe = y + navH * .5;
            let theme = 'dark', active = '';
            for (const s of secs) {
                if (probe >= s.top && probe < s.bottom) {
                    theme = s.theme;
                    if (s.el.matches('[data-expand]')) theme = state.expand > .52 ? 'dark' : 'light';
                    active = s.id;
                    break;
                }
            }
            if (theme !== lastTheme) { nav.classList.toggle('is-light', theme === 'light'); lastTheme = theme; }
            if (active !== lastActive) {
                links.forEach(l => l.classList.toggle('is-active', l.dataset.link === active));
                lastActive = active;
            }
            if (rail) {
                const p = clamp(S.y / docH);
                if (Math.abs(p - lastP) > .0005) { rail.style.setProperty('--p', p.toFixed(4)); lastP = p; }
            }
        });
    }

    function initMenu() {
        const menu = $('[data-menu]');
        const btn = $('[data-menu-toggle]');
        const nav = $('[data-nav]');
        if (!menu || !btn) return;

        const set = open => {
            menu.classList.toggle('is-open', open);
            menu.setAttribute('aria-hidden', String(!open));
            btn.setAttribute('aria-expanded', String(open));
            btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
            nav.classList.toggle('is-menu', open);
            root.classList.toggle('menu-open', open);
        };
        btn.addEventListener('click', () => set(!menu.classList.contains('is-open')));
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { set(false); btn.focus(); } });
        $$('[data-menu-link]', menu).forEach(a => a.addEventListener('click', e => {
            e.preventDefault();
            const target = $(a.getAttribute('href'));
            set(false);
            if (target) setTimeout(() => target.scrollIntoView(), 250);
        }));
        window.addEventListener('resize', () => { if (window.innerWidth >= 1024 && menu.classList.contains('is-open')) set(false); });
    }

    /* ─────────────────────────────────────────────────────────
       6 · TEXTO DIVIDIDO Y REVEALS
       ───────────────────────────────────────────────────────── */
    function wrapWords(el, mkOuter) {
        let idx = 0;
        const walk = node => {
            Array.from(node.childNodes).forEach(ch => {
                if (ch.nodeType === 3) {
                    const frag = document.createDocumentFragment();
                    ch.textContent.split(/(\s+)/).forEach(part => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                        frag.appendChild(mkOuter(part, idx++));
                    });
                    ch.replaceWith(frag);
                } else if (ch.nodeType === 1) {
                    walk(ch);
                }
            });
        };
        walk(el);
        return idx;
    }

    function initReveals() {
        // Titulares palabra por palabra
        $$('[data-split]').forEach(el => {
            wrapWords(el, (word, i) => {
                const outer = document.createElement('span'); outer.className = 'sw';
                const inner = document.createElement('span'); inner.className = 'sw__i';
                inner.textContent = word; inner.style.setProperty('--i', i);
                outer.appendChild(inner);
                return outer;
            });
            el.classList.add('is-split');
        });

        // Retardo escalonado entre hermanos
        const groups = new Map();
        $$('[data-reveal]').forEach(el => {
            const p = el.parentElement;
            const n = groups.get(p) || 0;
            groups.set(p, n + 1);
            el.style.setProperty('--rd', ((n % 4) * .09).toFixed(2) + 's');
        });

        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
            });
        }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
        $$('[data-reveal], [data-split]').forEach(el => io.observe(el));

        // Contadores
        const cio = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                cio.unobserve(e.target);
                const el = e.target, to = +el.dataset.count, dur = 1700, t0 = performance.now();
                (function step(now) {
                    const t = clamp((now - t0) / dur);
                    el.textContent = Math.round(to * ease.out(t));
                    if (t < 1) requestAnimationFrame(step);
                })(t0);
            });
        }, { threshold: .6 });
        $$('[data-count]').forEach(el => { el.textContent = '0'; cio.observe(el); });
    }

    /* Spotlight que sigue al cursor + botones magnéticos */
    function initPointerFx() {
        document.addEventListener('pointermove', e => {
            const t = e.target.closest ? e.target.closest('[data-spot]') : null;
            if (!t) return;
            const r = t.getBoundingClientRect();
            t.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
            t.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
        }, { passive: true });

        if (!finePointer || reduceMotion) return;
        $$('[data-magnetic]').forEach(btn => {
            btn.addEventListener('pointermove', e => {
                const r = btn.getBoundingClientRect();
                const x = (e.clientX - r.left - r.width / 2) * .2;
                const y = (e.clientY - r.top - r.height / 2) * .32;
                btn.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
            });
            btn.addEventListener('pointerleave', () => { btn.style.translate = ''; });
        });
    }

    /* ─────────────────────────────────────────────────────────
       7 · HERO (parallax de salida, rotador, partículas, tilt 3D)
       ───────────────────────────────────────────────────────── */
    const hero = { visible: true };

    function initHero() {
        const el = $('[data-hero]');
        if (!el) return;
        const copy = $('.hero__copy', el);
        const visual = $('.hero__visual', el);
        let h = 800, lastHs = -1;

        addMeasure(() => { h = el.offsetHeight; });
        new IntersectionObserver(([e]) => { hero.visible = e.isIntersecting; }, { threshold: 0 }).observe(el);

        addTask(() => {
            if (!hero.visible) return;
            const hs = clamp(S.y / h);
            if (Math.abs(hs - lastHs) < .0008) return;
            lastHs = hs;
            if (copy) {
                copy.style.transform = `translate3d(0, ${(S.y * .14).toFixed(1)}px, 0)`;
                copy.style.opacity = clamp(1.15 - hs * 1.5).toFixed(3);
            }
            if (visual) visual.style.transform = `translate3d(0, ${(S.y * .24).toFixed(1)}px, 0)`;
        });
    }

    /* Palabra rotatoria con efecto "scramble" */
    function initRotator() {
        const wrap = $('[data-rotator]');
        const el = $('[data-rotator-word]');
        if (!wrap || !el || reduceMotion) return;
        const words = wrap.dataset.words.split('|');
        const glyphs = 'abcdeghmnopqrsuvxyzABCDEFGHJKLMNOPRSTUV';
        let i = 0, busy = false;

        function scramble(to) {
            busy = true;
            const t0 = performance.now(), dur = 950;
            (function step(now) {
                const t = clamp((now - t0) / dur);
                let out = '';
                for (let k = 0; k < to.length; k++) {
                    const settle = .18 + (k / to.length) * .62;
                    out += (to[k] === ' ' || t >= settle) ? to[k] : glyphs[Math.floor(Math.random() * glyphs.length)];
                }
                el.textContent = out;
                if (t < 1) requestAnimationFrame(step);
                else { el.textContent = to; busy = false; }
            })(t0);
        }

        const start = () => setInterval(() => {
            if (busy || !hero.visible || document.hidden) return;
            i = (i + 1) % words.length;
            scramble(words[i]);
        }, 3400);

        const wait = setInterval(() => { if (S.ready) { clearInterval(wait); setTimeout(start, 1800); } }, 200);
    }

    /* Partículas: red de nodos con colores de la marca y estrellas fugaces */
    function initParticles() {
        const cv = $('[data-particles]');
        if (!cv || reduceMotion) return;
        const ctx = cv.getContext('2d');
        const COLORS = [[255, 255, 255], [140, 172, 255], [255, 96, 106], [92, 204, 255]];
        const mouse = { x: -9999, y: -9999 };
        let w = 0, h = 0, dpr = 1, P = [];
        const shooters = [];
        let nextShot = 1800;

        const mk = () => {
            const c = COLORS[Math.random() < .6 ? 0 : 1 + Math.floor(Math.random() * 3)];
            return { x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .34, vy: (Math.random() - .5) * .34, r: Math.random() * 1.7 + .6, c, tw: Math.random() * 6.28 };
        };
        const resize = () => {
            const r = cv.getBoundingClientRect();
            dpr = Math.min(window.devicePixelRatio || 1, 1.75);
            w = r.width; h = r.height;
            cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const n = Math.round(clamp(w * h / 15500, 26, w < 700 ? 44 : 100));
            P = Array.from({ length: n }, mk);
        };
        addMeasure(resize);

        const host = cv.parentElement.parentElement; // .hero
        host.addEventListener('pointermove', e => {
            const r = cv.getBoundingClientRect();
            mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
        }, { passive: true });
        host.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

        addTask((s, dt, now) => {
            if (!hero.visible || !w) return;
            ctx.clearRect(0, 0, w, h);
            const LINK = w < 700 ? 96 : 138;

            for (const p of P) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
                if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
                const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
                if (d2 < 14400) { const d = Math.sqrt(d2) || 1, f = (120 - d) / 120 * .9; p.x += dx / d * f; p.y += dy / d * f; }
            }
            for (let i = 0; i < P.length; i++) {
                const a = P[i];
                for (let j = i + 1; j < P.length; j++) {
                    const b = P[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
                    if (d2 < LINK * LINK) {
                        const al = (1 - Math.sqrt(d2) / LINK) * .34;
                        ctx.strokeStyle = `rgba(${a.c[0]},${a.c[1]},${a.c[2]},${al.toFixed(3)})`;
                        ctx.lineWidth = .7;
                        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    }
                }
                const tw = .55 + Math.sin(now / 700 + a.tw) * .35;
                ctx.fillStyle = `rgba(${a.c[0]},${a.c[1]},${a.c[2]},${tw.toFixed(3)})`;
                ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
                const mdx = a.x - mouse.x, mdy = a.y - mouse.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
                if (md < 170) {
                    ctx.strokeStyle = `rgba(157,182,255,${((1 - md / 170) * .45).toFixed(3)})`;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
                }
            }

            // Estrellas fugaces
            nextShot -= dt * 1000;
            if (nextShot <= 0 && shooters.length < 2) {
                nextShot = 2600 + Math.random() * 3600;
                const red = Math.random() < .4;
                shooters.push({ x: Math.random() * w * .8 + w * .2, y: -20, vx: -(5 + Math.random() * 3), vy: 4 + Math.random() * 2.5, life: 1, red });
            }
            for (let i = shooters.length - 1; i >= 0; i--) {
                const s2 = shooters[i];
                s2.x += s2.vx; s2.y += s2.vy; s2.life -= .012;
                if (s2.life <= 0 || s2.y > h + 40) { shooters.splice(i, 1); continue; }
                const tx = s2.x - s2.vx * 14, ty = s2.y - s2.vy * 14;
                const g = ctx.createLinearGradient(s2.x, s2.y, tx, ty);
                g.addColorStop(0, s2.red ? 'rgba(255,110,120,.95)' : 'rgba(190,210,255,.95)');
                g.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.strokeStyle = g; ctx.lineWidth = 1.8;
                ctx.beginPath(); ctx.moveTo(s2.x, s2.y); ctx.lineTo(tx, ty); ctx.stroke();
            }
        });
    }

    /* Inclinación 3D del logotipo (puntero) + deriva suave en reposo / táctil */
    function initTilt() {
        const scope = $('[data-tilt-scope]');
        const card = scope && $('[data-tilt]', scope);
        if (!scope || !card) return;
        let tx = 0, ty = 0, cx = 0, cy = 0, lastMove = -9999, hovering = false;

        scope.addEventListener('pointermove', e => {
            if (e.pointerType === 'touch') return;
            const r = scope.getBoundingClientRect();
            tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
            ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
            lastMove = performance.now(); hovering = true;
        }, { passive: true });
        scope.addEventListener('pointerleave', () => { hovering = false; });

        addTask((s, dt, now) => {
            if (!hero.visible) return;
            if (!hovering && now - lastMove > 900 && !reduceMotion) {
                tx = Math.sin(now / 2400) * .6;
                ty = Math.cos(now / 3100) * .42;
            }
            cx += (tx - cx) * .075; cy += (ty - cy) * .075;
            card.style.setProperty('--ry', (cx * 12).toFixed(2) + 'deg');
            card.style.setProperty('--rx', (-cy * 8).toFixed(2) + 'deg');
            card.style.setProperty('--gx', (50 + cx * 38).toFixed(1) + '%');
            card.style.setProperty('--gy', (24 + cy * 38).toFixed(1) + '%');
            scope.style.setProperty('--px', cx.toFixed(3));
            scope.style.setProperty('--py', cy.toFixed(3));
        });
    }

    /* ─────────────────────────────────────────────────────────
       8 · CINTA (marquee) — reacciona a la velocidad del scroll
       ───────────────────────────────────────────────────────── */
    function initMarquee() {
        const rows = $$('[data-marquee]');
        if (!rows.length) return;
        const belt = rows[0].closest('.belt');
        let visible = true;
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(belt);

        const data = rows.map(row => ({ row, track: $('.belt__track', row), dir: +row.dataset.marquee, x: 0, w: 1 }));
        addMeasure(() => {
            data.forEach(d => {
                $$('[data-clone]', d.row).forEach(n => n.remove());
                d.w = d.track.getBoundingClientRect().width || 1;
                const copies = Math.ceil(S.vw / d.w) + 1;
                for (let k = 0; k < copies; k++) {
                    const c = d.track.cloneNode(true);
                    c.setAttribute('data-clone', ''); c.setAttribute('aria-hidden', 'true');
                    d.row.appendChild(c);
                }
                d.x = d.dir > 0 ? -d.w : 0;
            });
        });

        addTask((s, dt) => {
            if (!visible) return;
            const boost = reduceMotion ? 0 : Math.abs(s.vel) * .22;
            const skew = reduceMotion ? 0 : clamp(s.vel / -140, -7, 7);
            data.forEach(d => {
                d.x += d.dir * (46 + boost) * dt;
                if (d.dir < 0 && d.x <= -d.w) d.x += d.w;
                if (d.dir > 0 && d.x >= 0) d.x -= d.w;
                d.row.style.transform = `translate3d(${d.x.toFixed(2)}px,0,0) skewX(${(skew * d.dir * -1).toFixed(2)}deg)`;
            });
        });
    }

    /* ─────────────────────────────────────────────────────────
       9 · MANIFIESTO (cada palabra se ilumina con el scroll)
       ───────────────────────────────────────────────────────── */
    function initManifesto() {
        const sec = $('[data-manifesto]');
        const txt = sec && $('[data-words]', sec);
        if (!txt) return;
        const spans = [];
        const n = wrapWords(txt, word => {
            const sp = document.createElement('span');
            sp.className = 'mw'; sp.textContent = word;
            spans.push(sp);
            return sp;
        });
        let top = 0, h = 0, last = -1;
        addMeasure(() => { top = abs(txt); h = txt.offsetHeight; });

        addTask(() => {
            const rel = top - S.y;
            if (rel > S.vh * 1.1 || rel + h < -S.vh * .2) return;
            const P = clamp((S.vh * .86 - rel) / (S.vh * .46 + h));
            if (Math.abs(P - last) < .002) return;
            last = P;
            const spread = 7;
            for (let i = 0; i < n; i++) {
                const wp = clamp((P * (n + spread) - i) / spread);
                spans[i].style.setProperty('--p', wp.toFixed(3));
            }
        });
    }

    /* ─────────────────────────────────────────────────────────
       10 · IMAGEN QUE SE ABRE CON EL SCROLL
       ───────────────────────────────────────────────────────── */
    function initExpand() {
        const sec = $('[data-expand]');
        if (!sec) return;
        const sticky = sec.firstElementChild;
        const content = $('[data-expand-content]', sec);
        let top = 0, range = 1, last = -1;

        addMeasure(() => { top = abs(sec); range = Math.max(1, sec.offsetHeight - sticky.offsetHeight); });
        addTask(() => {
            const p = clamp((S.y - top) / range);
            const e = ease.inOut(clamp(p / .7));
            state.expand = e;
            if (e === last || (Math.abs(e - last) < .0004 && e !== 0 && e !== 1)) return;
            last = e;
            sec.style.setProperty('--e', e.toFixed(4));
            if (content) content.inert = e < .6;
        });
    }

    /* ─────────────────────────────────────────────────────────
       11 · TARJETAS APILADAS (se encogen al quedar debajo de la siguiente)
       ───────────────────────────────────────────────────────── */
    function initStack() {
        const stack = $('[data-stack]');
        const cards = $$('[data-svc]');
        if (!stack || cards.length < 2) return;
        let stickTops = [], sticky = true, inView = false;
        const lastSc = cards.map(() => -1), lastDim = cards.map(() => -1);

        new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: '10% 0px 10% 0px' }).observe(stack);
        addMeasure(() => {
            sticky = getComputedStyle(cards[0]).position === 'sticky';
            stickTops = cards.map(c => parseFloat(getComputedStyle(c).top) || 0);
        });

        addTask(() => {
            if (!inView) return;
            const rects = cards.map(c => c.getBoundingClientRect());
            const s = rects.map((r, j) => sticky ? clamp((S.vh - r.top) / Math.max(1, S.vh - stickTops[j])) : 0);
            cards.forEach((c, i) => {
                let sum = 0;
                for (let j = i + 1; j < cards.length; j++) sum += s[j];
                const sc = (1 - Math.min(sum, 3) * .032).toFixed(4);
                const dim = Math.min(sum * .13, .42).toFixed(3);
                if (sc !== lastSc[i]) { c.style.setProperty('--sc', sc); lastSc[i] = sc; }
                if (dim !== lastDim[i]) { c.style.setProperty('--dim', dim); lastDim[i] = dim; }
            });
        });
    }

    /* ─────────────────────────────────────────────────────────
       12 · LÍNEA DE TIEMPO (el avión baja y activa cada paso)
       ───────────────────────────────────────────────────────── */
    function initTimeline() {
        const tl = $('[data-timeline]');
        if (!tl) return;
        const steps = $$('[data-step]', tl);
        const rail = $('.tl__rail', tl);
        let top = 0, railTop = 0, railH = 1, centers = [], last = -1, lastActive = -1;

        addMeasure(() => {
            top = abs(tl);
            const cs = getComputedStyle(rail);
            railTop = parseFloat(cs.top) || 0;
            railH = Math.max(1, tl.offsetHeight - railTop - (parseFloat(cs.bottom) || 0));
            centers = steps.map(st => abs($('.tl__node', st)) + 23 - top - railTop);
        });
        addTask(() => {
            const rel = top - S.y;
            if (rel > S.vh * 1.2 || rel + tl.offsetHeight < -S.vh * .3) return;
            const probe = S.y + S.vh * .56 - top - railTop;
            const p = clamp(probe / railH);
            if (Math.abs(p - last) > .0006) { tl.style.setProperty('--p', p.toFixed(4)); last = p; }
            let active = -1;
            centers.forEach((c, i) => { if (probe >= c) active = i; });
            if (active !== lastActive) {
                steps.forEach((st, i) => st.classList.toggle('is-active', i <= active));
                lastActive = active;
            }
        });
    }

    /* ─────────────────────────────────────────────────────────
       13 · DETALLES: FAQ, FORMULARIO, FOOTER, BOTÓN FLOTANTE
       ───────────────────────────────────────────────────────── */
    function initAccordion() {
        const acc = $('[data-accordion]');
        if (!acc) return;
        const items = $$('.acc__item', acc);
        items.forEach(item => {
            const q = $('.acc__q', item);
            q.addEventListener('click', () => {
                const open = !item.classList.contains('is-open');
                items.forEach(o => {
                    const on = o === item && open;
                    o.classList.toggle('is-open', on);
                    $('.acc__q', o).setAttribute('aria-expanded', String(on));
                });
            });
        });
    }

    function initForm() {
        const form = $('[data-form]');
        if (!form) return;
        const name = $('#f-name'), phone = $('#f-phone'), service = $('#f-service'), msg = $('#f-msg');
        const status = $('.form__status', form);

        const setErr = (input, text) => {
            const field = input.closest('.field');
            const err = $('.field__err', field);
            field.classList.toggle('has-error', !!text);
            input.setAttribute('aria-invalid', text ? 'true' : 'false');
            if (err) err.textContent = text || '';
        };
        [name, service].forEach(inp => inp.addEventListener('input', () => setErr(inp, '')));
        service.addEventListener('change', () => setErr(service, ''));

        form.addEventListener('submit', e => {
            e.preventDefault();
            let ok = true;
            if (name.value.trim().length < 2) { setErr(name, 'Escribe tu nombre para poder atenderte.'); ok = false; }
            if (!service.value) { setErr(service, 'Elige el trámite que necesitas.'); ok = false; }
            if (!ok) { status.textContent = ''; (name.value.trim().length < 2 ? name : service).focus(); return; }

            const lines = [`Hola, soy ${name.value.trim()}.`, `Me interesa: ${service.value}.`];
            if (msg.value.trim()) lines.push(msg.value.trim());
            if (phone.value.trim()) lines.push(`Mi teléfono: ${phone.value.trim()}`);
            lines.push('(Mensaje enviado desde la página web)');
            const url = waLink(lines.join('\n'));

            status.textContent = '¡Listo! Abriendo WhatsApp con tu mensaje…';
            const w = window.open(url, '_blank', 'noopener');
            if (!w) window.location.href = url;
        });
    }

    function initFooter() {
        const mark = $('.footer__mark');
        const foot = $('.footer');
        if (!mark || !foot) return;
        let top = 0, h = 1, last = -1;
        addMeasure(() => { top = abs(foot); h = foot.offsetHeight; });
        addTask(() => {
            if (S.y + S.vh < top) return;
            const p = clamp((S.y + S.vh - top) / (h * .85));
            if (Math.abs(p - last) > .004) { mark.style.setProperty('--fm', p.toFixed(3)); last = p; }
        });
    }

    function initWaf() {
        const waf = $('.waf');
        const tip = $('[data-waf-tip]');
        if (!waf || !tip) return;
        let shown = false;
        try { shown = sessionStorage.getItem('vls-tip') === '1'; } catch (err) { /* sin storage */ }
        if (shown) return;
        const wait = setInterval(() => {
            if (!S.ready) return;
            clearInterval(wait);
            setTimeout(() => {
                waf.classList.add('is-tip');
                try { sessionStorage.setItem('vls-tip', '1'); } catch (err) { /* sin storage */ }
                setTimeout(() => waf.classList.remove('is-tip'), 6500);
            }, 6000);
        }, 300);
    }

    /* ─────────────────────────────────────────────────────────
       ARRANQUE
       ───────────────────────────────────────────────────────── */
    function init() {
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);

        initLinks();
        initNav();
        initMenu();
        initReveals();
        initPointerFx();
        initHero();
        initRotator();
        initParticles();
        initTilt();
        initMarquee();
        initManifesto();
        initExpand();
        initStack();
        initTimeline();
        initAccordion();
        initForm();
        initFooter();
        initWaf();

        S.y = S.target = window.scrollY;
        measureAll();
        requestAnimationFrame(t => { lastT = t; frame(t); });

        let rt;
        window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(measureAll, 160); });
        window.addEventListener('load', () => setTimeout(measureAll, 300));
        if ('ResizeObserver' in window) {
            let ro;
            new ResizeObserver(() => { clearTimeout(ro); ro = setTimeout(measureAll, 220); }).observe(document.body);
        }

        runLoader();
    }

    init();
})();
