/* Gnana Divakar — shared interactions (vanilla, reduced-motion safe) */
(function () {
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(min-width:900px)").matches && !window.matchMedia("(pointer:coarse)").matches;

  /* Lenis smooth scroll (loaded from CDN, native fallback if unavailable) */
  if (!RM) {
    const startLenis = (L) => {
      const lenis = new L({ lerp: 0.1, smoothWheel: true });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      window.__lenis = lenis;
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
          const id = a.getAttribute("href");
          if (!id || id.length < 2) return;
          const el = document.querySelector(id);
          if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -24 }); }
        });
      });
    };
    if (window.Lenis) startLenis(window.Lenis);
    else {
      const s = document.createElement("script");
      s.src = "assets/lenis.min.js";
      s.onload = () => { if (window.Lenis) startLenis(window.Lenis); };
      document.head.appendChild(s);
    }
  }

  /* reveal + line-mask + figure clip + case media clip */
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".reveal,.line-mask,.figure,.case-media").forEach((el) => io.observe(el));

  /* count-up (supports prefix/suffix) */
  const num = (el) => {
    const to = parseFloat(el.dataset.count || "0");
    const pre = el.dataset.prefix || "";
    const suf = el.dataset.suffix || "";
    /* count-up + bar-fill are gentle data reveals — kept on even for reduced-motion */
    const dur = 1400; let s = null;
    const step = (t) => {
      if (s === null) s = t;
      const p = Math.min((t - s) / dur, 1);
      const v = Math.round((1 - Math.pow(1 - p, 3)) * to);
      el.textContent = pre + v + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const cio = new IntersectionObserver(
    (es) => es.forEach((e) => { if (e.isIntersecting) { num(e.target); cio.unobserve(e.target); } }),
    { threshold: 0.6 }
  );
  document.querySelectorAll("[data-count]").forEach((el) => cio.observe(el));

  /* before/after bars */
  const bio = new IntersectionObserver(
    (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); bio.unobserve(e.target); } }),
    { threshold: 0.6 }
  );
  document.querySelectorAll(".bar").forEach((el) => bio.observe(el));

  /* scroll progress + nav hide + parallax */
  const prog = document.querySelector(".progress");
  const header = document.querySelector(".site-header");
  const px = Array.from(document.querySelectorAll("[data-parallax]"));
  let lastY = 0;
  window.addEventListener("scroll", () => {
    const h = document.documentElement;
    const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    if (prog) prog.style.transform = `scaleX(${p})`;
    const y = h.scrollTop;
    if (header) {
      if (y > lastY && y > 220) header.classList.add("hide");
      else header.classList.remove("hide");
    }
    lastY = y;
    if (!RM && px.length) {
      const vh = window.innerHeight;
      px.forEach((img) => {
        const r = img.getBoundingClientRect();
        const c = (r.top + r.height / 2 - vh / 2) / vh;
        img.style.transform = `translateY(${c * -18}px)`;
      });
    }
  }, { passive: true });

  /* live IST clock */
  const clock = document.querySelector("[data-clock]");
  if (clock) {
    const tick = () => {
      try {
        clock.textContent = new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata",
        }).format(new Date()) + " IST";
      } catch (e) {}
    };
    tick(); setInterval(tick, 1000);
  }

  /* stack category selector — filters the panel to the active category; hover previews, click locks */
  document.querySelectorAll(".stack3").forEach((stack) => {
    const cats = [...stack.querySelectorAll(".s3cat")];
    const groups = [...stack.querySelectorAll(".s3-tools")];
    const apply = (cat) => {
      cats.forEach((c) => c.classList.toggle("active", c.dataset.cat === cat));
      groups.forEach((g) => g.classList.toggle("show", g.dataset.cat === cat));
    };
    let locked = stack.dataset.default || (cats[0] && cats[0].dataset.cat);
    cats.forEach((c) => {
      c.addEventListener("mouseenter", () => apply(c.dataset.cat));
      c.addEventListener("focus", () => apply(c.dataset.cat));
      c.addEventListener("click", () => { locked = c.dataset.cat; apply(locked); });
    });
    const nav = stack.querySelector(".stack3-nav");
    if (nav) nav.addEventListener("mouseleave", () => apply(locked));
    apply(locked);
  });

  /* smooth page transition — fade out before navigating to another page */
  if (!RM) {
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || !/\.html$/.test(href)) return;
      if (a.target === "_blank") return;
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        document.body.classList.add("leaving");
        setTimeout(() => { window.location.href = href; }, 300);
      });
    });
    window.addEventListener("pageshow", (e) => { if (e.persisted) document.body.classList.remove("leaving"); });
  }

  /* custom cursor + magnetic + "view" label */
  if (fine && !RM) {
    const cur = document.querySelector(".cursor");
    const ring = document.querySelector(".cursor-ring");
    if (cur && ring) {
      let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
      addEventListener("mousemove", (e) => {
        mx = e.clientX; my = e.clientY;
        cur.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      });
      (function loop() {
        rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
        ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
        requestAnimationFrame(loop);
      })();
      document.querySelectorAll("a,button,.case-media,[data-cursor]").forEach((el) => {
        const view = el.getAttribute("data-cursor") === "view";
        el.addEventListener("mouseenter", () => { ring.classList.add("hover"); if (view) ring.classList.add("view"); });
        el.addEventListener("mouseleave", () => { ring.classList.remove("hover"); ring.classList.remove("view"); });
      });
      document.querySelectorAll("[data-magnetic]").forEach((el) => {
        el.addEventListener("mousemove", (e) => {
          const r = el.getBoundingClientRect();
          el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * 0.25}px,${(e.clientY - (r.top + r.height / 2)) * 0.3}px)`;
        });
        el.addEventListener("mouseleave", () => { el.style.transform = ""; });
      });
    }
  }
})();
