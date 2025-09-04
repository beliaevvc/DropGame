import * as PIXI from "pixi.js";

/** Малый «взрыв» частиц в точке (для кликов/событий). */
export function particlesBurst(
  container: PIXI.Container,
  x: number,
  y: number,
  color = 0xffffff
) {
  const g = new PIXI.Container();
  container.addChild(g);

  const parts: PIXI.Graphics[] = [];
  const COUNT = 6; // компактнее, без лагов

  for (let i = 0; i < COUNT; i++) {
    const p = new PIXI.Graphics();
    p.beginFill(color).drawCircle(0, 0, 2).endFill();
    p.x = x;
    p.y = y;

    const angle = Math.random() * Math.PI * 2;
    (p as any).vx = Math.cos(angle) * (70 + Math.random() * 70);
    (p as any).vy = Math.sin(angle) * (70 + Math.random() * 70);

    parts.push(p);
    g.addChild(p);
  }

  let life = 0.28;
  let last = performance.now();
  let raf = 0;

  function tick() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    life -= dt;
    const alpha = Math.max(0, life / 0.28);

    for (const p of parts) {
      p.x += (p as any).vx * dt;
      p.y += (p as any).vy * dt;
      p.alpha = alpha;
    }

    if (life > 0) {
      raf = requestAnimationFrame(tick);
    } else {
      for (const p of parts) p.destroy({ children: true });
      if (g.parent) g.parent.removeChild(g);
      g.destroy({ children: true });
      cancelAnimationFrame(raf);
    }
  }

  raf = requestAnimationFrame(tick);
}

/** Лёгкая тряска сцены (например, при бомбе). */
export function screenShake(
  container: PIXI.Container,
  intensity = 6,
  durationMs = 200
) {
  const ox = container.x,
    oy = container.y;
  const start = performance.now();
  let raf = 0;

  function tick() {
    const t = performance.now() - start;
    if (t < durationMs) {
      container.x = ox + (Math.random() * 2 - 1) * intensity;
      container.y = oy + (Math.random() * 2 - 1) * intensity;
      raf = requestAnimationFrame(tick);
    } else {
      container.x = ox;
      container.y = oy;
      cancelAnimationFrame(raf);
    }
  }

  raf = requestAnimationFrame(tick);
}

/** Всплывающая надпись +N / -N в точке клика. */
export function floatingScore(
  container: PIXI.Container,
  x: number,
  y: number,
  value: number
) {
  const color = value >= 0 ? 0x00ff66 : 0xff4444; // зелёный/красный
  const txt = new PIXI.Text(
    (value >= 0 ? "+" : "") + value,
    new PIXI.TextStyle({
      fontSize: 28,
      fill: color,
      fontWeight: "bold",
    })
  );

  txt.anchor.set(0.5);
  txt.x = x;
  txt.y = y;
  container.addChild(txt);

  let life = 0.8;
  let last = performance.now();

  function tick() {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;

    life -= dt;
    txt.y -= 30 * dt; // всплывает
    txt.alpha = Math.max(0, life / 0.8);

    if (life > 0) {
      requestAnimationFrame(tick);
    } else {
      if (txt.parent) txt.parent.removeChild(txt);
      txt.destroy();
    }
  }

  requestAnimationFrame(tick);
}

/** Круговая вспышка (цвет задаётся параметром). */
export function flashEffect(
  container: PIXI.Container,
  x: number,
  y: number,
  color: number
) {
  const circle = new PIXI.Graphics();
  circle.beginFill(color, 0.5);
  circle.drawCircle(0, 0, 40); // базовый радиус (масштабируем анимацией)
  circle.endFill();

  circle.x = x;
  circle.y = y;
  container.addChild(circle);

  let life = 0.4; // сек
  let last = performance.now();

  function tick() {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;

    life -= dt;
    const progress = 1 - life / 0.4;

    circle.scale.set(1 + progress * 2); // расширение
    circle.alpha = 1 - progress; // плавное исчезание

    if (life > 0) {
      requestAnimationFrame(tick);
    } else {
      container.removeChild(circle);
      circle.destroy();
    }
  }

  requestAnimationFrame(tick);
}

/** Голубой «ледяной» оверлей на весь экран (кратковременно). */
export function freezeOverlay(app: PIXI.Application) {
  const overlay = new PIXI.Graphics();
  overlay.beginFill(0x66ccff, 0.25);
  // В Pixi v8 канвас доступен как app.canvas
  const w = (app as any).canvas?.width ?? (app.view as any)?.width ?? 0;
  const h = (app as any).canvas?.height ?? (app.view as any)?.height ?? 0;
  overlay.drawRect(0, 0, w, h);
  overlay.endFill();
  overlay.alpha = 0;

  app.stage.addChild(overlay);

  let life = 0.6;
  let last = performance.now();

  function tick() {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;

    life -= dt;
    const progress = 1 - life / 0.6;

    // всплеск и затухание (sine)
    overlay.alpha = Math.sin(progress * Math.PI);

    if (life > 0) {
      requestAnimationFrame(tick);
    } else {
      app.stage.removeChild(overlay);
      overlay.destroy();
    }
  }

  requestAnimationFrame(tick);
}
// ❄️ Эффект снегопада при заморозке
export function snowEffect(container: PIXI.Container, durationMs: number) {
  const flakes: PIXI.Text[] = [];
  const COUNT = 20; // сколько снежинок за раз

  for (let i = 0; i < COUNT; i++) {
    const flake = new PIXI.Text("❄️", { fontSize: 20 });
    flake.x = Math.random() * (container.parent?.width || 400);
    flake.y = -Math.random() * 200; // стартуют чуть выше экрана
    flake.alpha = 0.8;
    container.addChild(flake);
    flakes.push(flake);
  }

  let last = performance.now();
  let life = durationMs / 1000;

  function tick() {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    life -= dt;

    flakes.forEach(f => {
      f.y += 50 * dt; // падение вниз
      f.x += Math.sin(f.y / 20) * 0.5; // лёгкое колыхание
    });

    if (life > 0) {
      requestAnimationFrame(tick);
    } else {
      flakes.forEach(f => {
        if (f.parent) f.parent.removeChild(f);
        f.destroy();
      });
    }
  }

  requestAnimationFrame(tick);
}
/** 🔴 Флэш всего экрана (например, при бомбе). */
export function screenFlash(app: PIXI.Application, color = 0xff0000, duration = 0.3) {
  const overlay = new PIXI.Graphics();
  const w = (app as any).canvas?.width ?? (app.view as any)?.width ?? 0;
  const h = (app as any).canvas?.height ?? (app.view as any)?.height ?? 0;

  overlay.beginFill(color, 1);
  overlay.drawRect(0, 0, w, h);
  overlay.endFill();
  overlay.alpha = 0;
  app.stage.addChild(overlay);

  let t = 0;
  let last = performance.now();

  function tick() {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    t += dt;

    // сначала ярче, потом гаснет
    const progress = t / duration;
    if (progress < 0.5) {
      overlay.alpha = progress * 2 * 0.5; // до 0.5
    } else {
      overlay.alpha = (1 - progress) * 2 * 0.5; // обратно к 0
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      app.stage.removeChild(overlay);
      overlay.destroy();
    }
  }

  requestAnimationFrame(tick);
}