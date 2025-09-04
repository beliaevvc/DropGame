// frontend/src/game/engine.ts
import * as PIXI from "pixi.js";
import {
  EMOJI,
  SPECIALS,
  SPAWN,
  MOTION,
  PLAYFIELD,
  FREEZE_SECONDS,
  MULTIPLIER_SECONDS,
  TIMER_BONUS_SECONDS,
} from "./config";
import { Drop } from "./types";
import { SFX } from "./audio";
import {
  particlesBurst,
  screenShake,
  floatingScore,
  flashEffect,
  freezeOverlay,
} from "./effects";

/** Короткий флэш всего экрана (например, при бомбе). */
export function screenFlash(
  app: PIXI.Application,
  color = 0xff0000,
  duration = 0.3
) {
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

    const k = t / duration;
    overlay.alpha = (k < 0.5 ? k * 2 : (1 - k) * 2) * 0.5;

    if (k < 1) requestAnimationFrame(tick);
    else {
      app.stage.removeChild(overlay);
      overlay.destroy();
    }
  }
  requestAnimationFrame(tick);
}

/** Общая вероятность спец-эмодзи. */
const SPECIAL_CHANCE = 0.20;

/** Стили текста. */
const normalStyle = new PIXI.TextStyle({ fontSize: 45 });
const specialStyle = new PIXI.TextStyle({ fontSize: 48 });

export type EngineEvents = {
  onScore: (delta: number, total: number) => void;
  onBomb: (total: number) => void;
  onRocket: (gain: number, total: number) => void;
  onMultiplier?: (active: boolean) => void; // x2 в HUD
  onTimerBonus?: () => void; // +5s индикация
};

export class GameEngine {
  app: PIXI.Application;
  stage: PIXI.Container;
  layerDrops: PIXI.Container;
  running = false;

  drops: Drop[] = [];
  nextId = 1;
  score = 0;

  // таймер
  totalSeconds = 60;
  secondsLeft = 60;

  // статусы
  frozenUntil = 0;
  multUntil = 0;

  // спавн
  nextSpawnAt = 0;

  constructor(public view: HTMLDivElement, public events: EngineEvents) {
    this.app = new PIXI.Application();
    this.stage = this.app.stage;
    this.layerDrops = new PIXI.Container();
  }

  async init() {
    await this.app.init({
      backgroundAlpha: 0,
      antialias: true,
      resizeTo: this.view,
    });
    this.view.appendChild(this.app.canvas);

    this.app.ticker.maxFPS = 60;
    (this.app.ticker as any).minFPS = 30;

    this.stage.addChild(this.layerDrops);
    this.app.ticker.add(this.tick);
  }

  start(seconds: number) {
    this.reset();
    this.totalSeconds = seconds;
    this.secondsLeft = seconds;
    this.running = true;
    this.nextSpawnAt = performance.now() + 500;
  }

  reset() {
    this.score = 0;
    this.running = false;
    this.frozenUntil = 0;
    this.multUntil = 0;

    for (const d of this.drops) {
      d.sprite?.parent?.removeChild(d.sprite);
      d.sprite?.destroy();
    }
    this.drops = [];
  }

  private setFrozen(ms: number) {
    this.frozenUntil = Math.max(this.frozenUntil, performance.now() + ms);
  }
  private isFrozen() {
    return performance.now() < this.frozenUntil;
  }

  private setX2(ms: number) {
    this.multUntil = Math.max(this.multUntil, performance.now() + ms);
    this.events.onMultiplier?.(true);
  }
  private isX2() {
    return performance.now() < this.multUntil;
  }

  /** Пакетный спавн. */
  private spawnBatch() {
    const now = performance.now();
    const between =
      SPAWN.minIntervalMs +
      Math.random() * (SPAWN.maxIntervalMs - SPAWN.minIntervalMs);
    this.nextSpawnAt = now + between;

    const batch = Math.floor(
      SPAWN.minBatch + Math.random() * (SPAWN.maxBatch - SPAWN.minBatch + 1)
    );

    for (let i = 0; i < batch; i++) {
      if (this.drops.length >= SPAWN.maxAlive) break;

      if (Math.random() < SPECIAL_CHANCE) {
        const totalW = SPECIALS.reduce((a, b) => a + b.weight, 0);
        let r = Math.random() * totalW;
        for (const sp of SPECIALS) {
          if (r < sp.weight) {
            this.spawnSpecial(sp.kind as any, sp.char);
            break;
          }
          r -= sp.weight;
        }
      } else {
        this.spawnNormal();
      }
    }
  }

  /** Обычное. */
  private spawnNormal() {
    const totalW = EMOJI.reduce((a, b) => a + b.weight, 0);
    let r = Math.random() * totalW;
    let chosen = EMOJI[0];
    for (const e of EMOJI) {
      if (r < e.weight) { chosen = e; break; }
      r -= e.weight;
    }

    const w = this.view.clientWidth;
    const x = PLAYFIELD.paddingSide + Math.random() * (w - PLAYFIELD.paddingSide * 2);
    const y = -30;
    const vy = MOTION.baseVy * (0.9 + Math.random() * 0.2);
    const vx = (Math.random() * 2 - 1) * MOTION.jitterVx;

    const text = new PIXI.Text(chosen.char, normalStyle);
    text.cacheAsBitmap = true;
    text.x = x; text.y = y;
    text.eventMode = "static";
    text.cursor = "pointer";

    let drop: Drop;
    text.on("pointerdown", () => this.hitNormal(drop));

    this.layerDrops.addChild(text);
    drop = {
      id: this.nextId++,
      kind: "normal",
      char: chosen.char,
      points: chosen.points,
      x, y, vx, vy,
      sprite: text,
    };
    (text as any).__drop = drop;
    this.drops.push(drop);
  }

  /** Спец-эмодзи. */
  private spawnSpecial(
    kind: "bomb" | "rocket" | "freeze" | "mult" | "time",
    char: string
  ) {
    const w = this.view.clientWidth;
    const x = PLAYFIELD.paddingSide + Math.random() * (w - PLAYFIELD.paddingSide * 2);
    const y = -30;
    const vy = MOTION.baseVy * (0.9 + Math.random() * 0.2);
    const vx = (Math.random() * 2 - 1) * MOTION.jitterVx;

    const text = new PIXI.Text(char, specialStyle);
    text.cacheAsBitmap = true;
    text.x = x; text.y = y;
    text.eventMode = "static";
    text.cursor = "pointer";

    let drop: Drop;
    if (kind === "bomb") {
      text.on("pointerdown", () => this.hitBomb(drop));
    } else if (kind === "rocket") {
      text.on("pointerdown", () => this.hitRocket(drop));
    } else if (kind === "freeze") {
      text.on("pointerdown", () => this.hitFreeze(drop));
    } else if (kind === "mult") {
      text.on("pointerdown", () => this.hitMult(drop));
    } else if (kind === "time") {
      text.on("pointerdown", () => this.hitTime(drop));
    }

    this.layerDrops.addChild(text);
    drop = {
      id: this.nextId++,
      kind,
      char,
      points: 0,
      x, y, vx, vy,
      sprite: text,
    };
    (text as any).__drop = drop;
    this.drops.push(drop);
  }

  private removeDrop(d: Drop) {
    d.sprite?.parent?.removeChild(d.sprite);
    d.sprite?.destroy();
    this.drops = this.drops.filter(x => x.id !== d.id);
  }

  /** Обычное. */
  private hitNormal(d: Drop) {
    if (!this.running) return;
    const gain = this.isX2() ? d.points * 2 : d.points;
    this.score += gain;
    this.events.onScore(gain, this.score);

    if (d.sprite) {
      particlesBurst(this.layerDrops, d.sprite.x, d.sprite.y,
        this.isX2() ? 0xfff08a : 0x88ffbb);
      d.sprite.scale.set(0.9);
    }
    SFX.click();
    floatingScore(this.layerDrops, d.sprite!.x, d.sprite!.y, gain);
    flashEffect(this.layerDrops, d.sprite!.x, d.sprite!.y,
      this.isX2() ? 0xffe066 : 0xffffff);

    this.removeDrop(d);
  }

  /** Бомба. */
  private hitBomb(d: Drop) {
    if (!this.running) return;
    this.score = Math.max(0, this.score - 100);
    this.events.onBomb(this.score);

    if (d.sprite) {
      particlesBurst(this.layerDrops, d.sprite.x, d.sprite.y, 0xff5555);
      screenShake(this.layerDrops, 8, 280);
    }
    SFX.bomb();
    floatingScore(this.layerDrops, d.sprite!.x, d.sprite!.y, -100);
    flashEffect(this.layerDrops, d.sprite!.x, d.sprite!.y, 0xff3333);
    screenFlash(this.app, 0xff0000, 0.35);

    this.removeDrop(d);
  }

  /** Заморозка. */
  private hitFreeze(d: Drop) {
    if (!this.running) return;
    this.setFrozen(FREEZE_SECONDS * 1000);

    if (d.sprite) particlesBurst(this.layerDrops, d.sprite.x, d.sprite.y, 0xaad6ff);
    SFX.freeze();
    flashEffect(this.layerDrops, d.sprite!.x, d.sprite!.y, 0x66ccff);
    freezeOverlay(this.app);

    this.removeDrop(d);
  }

  /** Ракета. */
  private hitRocket(d: Drop) {
    if (!this.running) return;
    let gain = 0;
    const normals = this.drops.filter(x => x.kind === "normal");
    for (const n of normals) gain += n.points;
    if (this.isX2()) gain *= 2;

    this.score += gain;
    for (const n of normals) {
      if (n.sprite) particlesBurst(this.layerDrops, n.sprite.x, n.sprite.y, 0xffee88);
      this.removeDrop(n);
    }

    if (gain > 0) {
      const cx = this.view.clientWidth / 2;
      const cy = this.view.clientHeight / 3;
      floatingScore(this.layerDrops, cx, cy, gain);
    }

    this.events.onRocket(gain, this.score);
    SFX.rocket();
    flashEffect(this.layerDrops, this.view.clientWidth / 2, this.view.clientHeight / 2, 0xffff66);

    if (d) this.removeDrop(d);
  }

  /** Множитель. */
  private hitMult(d: Drop) {
    if (!this.running) return;
    this.setX2(MULTIPLIER_SECONDS * 1000);

    if (d.sprite) {
      particlesBurst(this.layerDrops, d.sprite.x, d.sprite.y, 0xffe066);
      flashEffect(this.layerDrops, d.sprite.x, d.sprite.y, 0xffdd55);
    }
    SFX.click?.();
    this.removeDrop(d);
  }

  /** Таймер (+5с). */
  private hitTime(d: Drop) {
    if (!this.running) return;
    this.secondsLeft += TIMER_BONUS_SECONDS;
    this.events.onTimerBonus?.();

    if (d.sprite) {
      particlesBurst(this.layerDrops, d.sprite.x, d.sprite.y, 0x99ff99);
      flashEffect(this.layerDrops, d.sprite.x, d.sprite.y, 0x55ff55);
    }
    SFX.click?.();
    this.floatingText(this.layerDrops, d.sprite!.x, d.sprite!.y, "+5s", 0x55ff55);
    this.removeDrop(d);
  }

  /** Обновление позиций. */
  private updateDrops(dt: number, speedScale: number) {
    if (this.isFrozen()) return;
    const h = this.view.clientHeight;
    for (const d of this.drops) {
      d.x += d.vx * dt;
      d.y += d.vy * dt * speedScale;
      d.sprite?.position.set(d.x, d.y);
    }
    const toRemove = this.drops.filter(d => d.y > h + 40);
    for (const d of toRemove) this.removeDrop(d);
  }

  /** Главный тик. */
  private tick = () => {
    if (!this.app || !this.running) return;
    const now = performance.now();
    const dt = this.app.ticker.deltaMS / 1000;

    if (this.multUntil !== 0 && now >= this.multUntil) {
      this.multUntil = 0;
      this.events.onMultiplier?.(false);
    }

    const elapsedFrac =
      this.totalSeconds > 0 ? 1 - this.secondsLeft / this.totalSeconds : 0;
    const speedScale = 1 + elapsedFrac * MOTION.accelPctByEnd;

    if (!this.isFrozen()) {
      this.secondsLeft -= dt;
      if (this.secondsLeft < 0) this.secondsLeft = 0;
    }

    this.updateDrops(dt, speedScale);
    if (!this.isFrozen() && now >= this.nextSpawnAt) {
      this.spawnBatch();
    }
  };/** Всплывающий произвольный текст (например, "+5s"). */
private floatingText(container: PIXI.Container, x: number, y: number, text: string, color: number) {
  const txt = new PIXI.Text(text, new PIXI.TextStyle({
    fontSize: 28,
    fill: color,
    fontWeight: "bold",
  }));
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
    txt.y -= 30 * dt;
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
}