// frontend/src/components/EndScreen.tsx
import React, { useEffect, useRef } from "react";

export default function EndScreen({
  score,
  best,
  newRecord,
  onRestart,
  onBack,
}: {
  score: number;
  best: number;
  newRecord: boolean;
  onRestart: () => void;
  onBack: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Фейерверк при рекорде (Canvas2D, поверх, не перехватывает клики)
  useEffect(() => {
    if (!newRecord) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let running = true;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    function resize() {
      const parent = canvas.parentElement!;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    type P = { x:number; y:number; vx:number; vy:number; life:number; color:string; };
    const parts: P[] = [];

    function burst(cx: number, cy: number) {
      const N = 60;
      const palette = ["#ff5757","#ffd257","#7cff6b","#6bd7ff","#b57cff"];
      for (let i = 0; i < N; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 120 + Math.random() * 180;
        parts.push({
          x: cx, y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0.9 + Math.random() * 0.6,
          color: palette[(Math.random() * palette.length) | 0],
        });
      }
    }

    const start = performance.now();
    function tick() {
      const t = performance.now() - start;
      if (!running) return;

      if (t < 2500 && (t % 400) < 16) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const x = 40 + Math.random() * (w - 80);
        const y = 60 + Math.random() * (h * 0.5 - 80);
        burst(x, y);
      }

      const dt = 1 / 60;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        p.vy += 220 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life <= 0) parts.splice(i, 1);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of parts) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (t < 3500 || parts.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        stop();
      }
    }

    function stop() {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      window.removeEventListener("resize", resize);
    }

    rafRef.current = requestAnimationFrame(tick);
    return stop;
  }, [newRecord]);

  // Telegram MainButton: показываем «Главный экран» только внутри TG
  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    if (!tg) return;

    const mb = tg.MainButton;
    try {
      mb.setText("Главный экран");
      mb.show();
      const onClick = () => onBack();
      tg.onEvent("mainButtonClicked", onClick);

      // можно подстроить цвет под тему Telegram (опционально)
      // tg.MainButton.color и bgColor устанавливаются самим Telegram

      return () => {
        tg.offEvent("mainButtonClicked", onClick);
        mb.hide();
      };
    } catch {
      // если что-то пошло не так — просто ничего не делаем,
      // в браузере и так остаются обычные кнопки
    }
  }, [onBack]);

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center text-white px-6">
      {/* Фейерверк */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Заголовок */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="text-2xl">{newRecord ? "🏆" : "🎮"}</span>
        <h1 className="text-2xl font-bold">
          {newRecord ? "Рекорд!" : "Игра окончена"}
        </h1>
      </div>

      {/* Текст результата (строго по центру) */}
      <div className="text-white/85 mb-4 text-center">
        Ты заработал <b>{score}</b> очков{newRecord ? " — лучший результат!" : "."}
      </div>

      {/* Кнопки — для браузера/обычного запуска */}
      <div className="flex items-center justify-center gap-2">
        <button
          className="btn btn-primary whitespace-nowrap px-4 py-2 text-sm"
          onClick={onRestart}
        >
          Играть снова
        </button>
        <button
          className="btn btn-primary opacity-80 whitespace-nowrap px-4 py-2 text-sm"
          onClick={onBack}
        >
          Главный экран
        </button>
      </div>

      {/* Лучший счёт — тонко */}
      <div className="mt-3 text-xs text-white/60">
        Лучший счёт: <b>{best}</b>
      </div>
    </div>
  );
}