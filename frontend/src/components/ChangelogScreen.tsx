// frontend/src/components/ChangelogScreen.tsx
import React, { useEffect, useMemo } from "react";
import { CHANGELOG, ChangelogEntry } from "../changelog";

export default function ChangelogScreen({
  version,
  onBack,
}: {
  version: string;
  onBack: () => void;
}) {
  const isTelegram = useMemo(
    () => Boolean((window as any)?.Telegram?.WebApp),
    []
  );

  // 🔹 В Telegram прячем системную кнопку (ничего не показываем)
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;
    tg.MainButton?.hide?.();
    // никаких onClick/ setText / show — полностью отключаем
  }, []);

  return (
    <div
      className="w-full h-full flex flex-col items-center p-6 text-white"
      style={{
        backgroundColor: "#000000", // фиксированный чёрный фон
        minHeight: "var(--app-vh, 100vh)",
      }}
    >
      <h1 className="text-2xl font-bold mb-4">Обновления</h1>

      <div className="w-full max-w-md text-sm leading-relaxed space-y-4 overflow-y-auto">
        {CHANGELOG.map((entry: ChangelogEntry) => (
          <div key={entry.version} className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <b>{entry.version}</b>
              {entry.date && <span className="text-white/60">{entry.date}</span>}
            </div>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {entry.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 🔹 Кнопка "Назад" только для браузера */}
      {!isTelegram && (
        <button className="btn btn-primary mt-6" onClick={onBack}>
          Назад
        </button>
      )}

      <div className="absolute bottom-3 text-xs text-white/60">
        Emoji Drop {version}
      </div>
    </div>
  );
}
