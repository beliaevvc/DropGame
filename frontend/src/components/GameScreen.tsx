// frontend/src/components/GameScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { GameEngine } from "../game/engine";
import { GAME_SECONDS } from "../game/config";
import { SFX } from "../game/audio";

export default function GameScreen({
  version,
  onExit,
}: {
  version: string;
  onExit: (score: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [score, setScore] = useState(0);
  const [sec, setSec] = useState(GAME_SECONDS);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [multActive, setMultActive] = useState(false);

  useEffect(() => {
    const host = hostRef.current!;
    const engine = new GameEngine(host, {
      onScore: (_delta, total) => setScore(total),
      onBomb: (total) => setScore(total),
      onRocket: (_gain, total) => setScore(total),
      onMultiplier: (active) => setMultActive(active),
    });
    engineRef.current = engine;

    let rafId = 0;
    let countdownId: number | undefined;

    (async () => {
      await engine.init();

      // 3-2-1 → старт
      countdownId = window.setInterval(() => {
        setCountdown((c) => {
          if (c === null) return c;
          if (c <= 1) {
            if (countdownId) clearInterval(countdownId);
            SFX.click();
            engine.start(GAME_SECONDS);
            return null;
          }
          SFX.click();
          return c - 1;
        });
      }, 1000);

      const tickHud = () => {
        if (engine.running) setSec(Math.ceil(engine.secondsLeft));
        if (engine.running && engine.secondsLeft <= 0) {
          const finalScore = engine.score;
          engine.running = false;
          setTimeout(() => onExit(finalScore), 150);
        } else {
          rafId = requestAnimationFrame(tickHud);
        }
      };
      rafId = requestAnimationFrame(tickHud);
    })();

    // cleanup
    return () => {
      if (countdownId) clearInterval(countdownId);
      if (rafId) cancelAnimationFrame(rafId);

      try {
        const e = engineRef.current;
        if (e) {
          e.running = false;
          e.app.ticker.stop();

          // подчистим объекты игры
          (e as any).layerDrops?.removeChildren?.();

          // подчистим сцену Pixi
          const stage = e.app.stage as any;
          if (stage?.children) {
            for (const ch of [...stage.children]) {
              stage.removeChild(ch);
              ch?.destroy?.();
            }
          }

          // Pixi v8: только removeView
          e.app.destroy({ removeView: true });
        }
      } catch {}

      engineRef.current = null;
    };
  }, [onExit]);

  return (
    <div className="w-full h-full relative">
      {/* HUD — опущен вниз от шапки TG/браузера */}
      <div
        className="absolute left-0 right-0 z-10 flex justify-between items-center px-4"
        style={{ top: "var(--hud-offset, 20px)" }}
      >
        <div className="text-lg font-bold">
          Очки: <span className="text-accent">{score}</span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`text-lg font-bold ${
              sec <= 10 ? "text-red-500 animate-pulse-scale" : ""
            }`}
          >
            Время: {sec}s
          </div>

          {multActive && (
            <div className="px-2 py-0.5 rounded bg-yellow-400 text-black font-bold text-sm">
              ×2
            </div>
          )}
        </div>
      </div>

      {/* Канвас игры */}
      <div ref={hostRef} className="absolute inset-0" />

      {/* Золотой оверлей при активном множителе */}
      {multActive && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-yellow-400/20 via-yellow-200/10 to-transparent animate-pulse" />
      )}

      {/* Countdown */}
      {countdown !== null && <div className="countdown">{countdown}</div>}
    </div>
  );
}
