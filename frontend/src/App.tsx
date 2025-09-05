// frontend/src/App.tsx
import React, { useEffect, useState } from "react";
import StartScreen from "./components/StartScreen";
import GameScreen from "./components/GameScreen";
import EndScreen from "./components/EndScreen";
import ChangelogScreen from "./components/ChangelogScreen";

type Screen = "start" | "game" | "end" | "changelog";

const VERSION = "v0.3.2";

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [best, setBest] = useState<number>(() => {
    const v = localStorage.getItem("dropgame_best_score");
    return v ? parseInt(v, 10) : 0;
  });
  const [lastScore, setLastScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Telegram init + тема + высота + спрятать MainButton + задать отступ HUD
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;

    const applyTheme = () => {
      const th = tg?.themeParams || {};
      document.documentElement.style.setProperty("--tg-bg", th.bg_color || "#000000");
      document.documentElement.style.setProperty("--tg-text", th.text_color || "#ffffff");
      document.documentElement.style.setProperty("--tg-hint", th.hint_color || "rgba(255,255,255,0.6)");
    };

    const applyVh = () => {
      const vh = (tg?.viewportHeight as number | undefined) || window.innerHeight || 0;
      document.documentElement.style.setProperty("--app-vh", `${vh}px`);
    };

    // Базовые значения, если НЕ в Telegram (браузер)
    if (!tg) {
      document.documentElement.style.setProperty("--tg-bg", "#000000");
      document.documentElement.style.setProperty("--tg-text", "#ffffff");
      document.documentElement.style.setProperty("--tg-hint", "rgba(255,255,255,0.6)");
      document.documentElement.style.setProperty("--hud-offset", "20px");
      document.documentElement.style.setProperty("--app-vh", `${window.innerHeight}px`);
      const onResize = () =>
        document.documentElement.style.setProperty("--app-vh", `${window.innerHeight}px`);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    // В Telegram
    tg.ready?.();
    tg.expand?.();
    tg.MainButton?.hide?.(); // убираем системную кнопку

    // Отступ HUD чуть больше, чтобы не перекрывалось шапкой Telegram
    document.documentElement.style.setProperty("--hud-offset", "56px");

    applyTheme();
    applyVh();

    tg.onEvent?.("themeChanged", applyTheme);
    tg.onEvent?.("viewportChanged", applyVh);

    return () => {
      tg.offEvent?.("themeChanged", applyTheme);
      tg.offEvent?.("viewportChanged", applyVh);
    };
  }, []);

  const onGameEnd = (score: number) => {
    setLastScore(score);
    const newRec = score > best;
    setIsNewRecord(newRec);
    if (newRec) {
      setBest(score);
      localStorage.setItem("dropgame_best_score", String(score));
    }
    setScreen("end");
  };

  return (
    <div
      className="w-full flex items-center justify-center"
      style={{
        // Всегда чёрный фон и белый текст по умолчанию
        height: "var(--app-vh, 100vh)",
        backgroundColor: "var(--tg-bg, #000000)",
        color: "var(--tg-text, #ffffff)",
      }}
    >
      {screen === "start" && (
        <StartScreen
          version={VERSION}
          best={best}
          onStart={() => setScreen("game")}
          onChangelog={() => setScreen("changelog")}
        />
      )}

      {screen === "game" && <GameScreen version={VERSION} onExit={onGameEnd} />}

      {screen === "end" && (
        <EndScreen
          score={lastScore}
          best={best}
          newRecord={isNewRecord}
          onRestart={() => setScreen("game")}
          onBack={() => setScreen("start")}
        />
      )}

      {screen === "changelog" && (
        <ChangelogScreen version={VERSION} onBack={() => setScreen("start")} />
      )}
    </div>
  );
}
