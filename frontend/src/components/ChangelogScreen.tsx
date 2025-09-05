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

  // В Telegram скрываем системную кнопку
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.MainButton?.hide?.();
  }, []);

  return (
    <div
      className="w-full flex flex-col text-white"
      style={{
        backgroundColor: "#000000",
        minHeight: "var(--app-vh, 100vh)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Верхняя панель (только в Telegram): своя кнопка Назад + заголовок */}
      {isTelegram && (
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 active:bg-white/20 text-sm"
          >
            ← Назад
          </button>
          <h1 className="text-xl font-bold">Обновления</h1>
        </div>
      )}

      {/* Контент с прокруткой */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Заголовок для браузера (в TG уже в верхней панели) */}
        {!isTelegram && (
          <h1 className="text-2xl font-bold mb-4 mt-6 text-center">Обновления</h1>
        )}

        <div className="w-full max-w-md mx-auto text-sm leading-relaxed space-y-4">
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

        {/* В браузере — нижняя кнопка Назад как раньше */}
        {!isTelegram && (
          <div className="w-full flex justify-center mt-6">
            <button className="btn btn-primary" onClick={onBack}>
              Назад
            </button>
          </div>
        )}
      </div>

      {/* Подпись версии, чуть выше нижней кромки + safe-area */}
      <div className="w-full flex justify-center mb-3">
        <div className="text-xs text-white/60">Emoji Drop {version}</div>
      </div>
    </div>
  );
}
