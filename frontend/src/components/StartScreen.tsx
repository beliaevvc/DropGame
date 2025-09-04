// frontend/src/components/StartScreen.tsx
import React, { useEffect, useState } from "react";

export default function StartScreen({
  version,
  best,
  onStart,
  onChangelog,
}: {
  version: string;
  best: number;
  onStart: () => void;
  onChangelog: () => void;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 400);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // 🔹 Поддержка Telegram MainButton (дополнительно, без удаления своей кнопки)
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    tg.MainButton.setText("🎮 Играть");
    tg.MainButton.show();

    const handler = () => onStart();
    tg.MainButton.onClick(handler);

    return () => {
      tg.MainButton.offClick(handler);
      tg.MainButton.hide();
    };
  }, [onStart]);

  const emojiSize = isMobile ? "text-lg" : "text-2xl";
  const textSmall = isMobile ? "text-[10px]" : "text-xs";
  const textNormal = isMobile ? "text-xs" : "text-sm";
  const titleSize = isMobile ? "text-xl" : "text-3xl";

  return (
    <div className="w-full h-full flex flex-col relative bg-black text-white">
      {/* Контент */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-3">
        {/* Название */}
        <h1 className={`${titleSize} font-bold tracking-tight`}>
          Emoji Drop
        </h1>

        {/* Лучший счёт */}
        <div
          className={`px-3 py-1 rounded-full bg-white/10 text-white/80 ${textSmall} flex items-center gap-2`}
        >
          <span>🏆</span>
          <span>
            Лучший счёт: <b>{best}</b>
          </span>
        </div>

        {/* Правила */}
        <div
          className={`mt-4 w-full max-w-xs flex flex-col items-center gap-3 ${textNormal} text-white/90`}
        >
          <div className="font-semibold">Правила</div>

          {/* Очки */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-1"><span className={emojiSize}>😀</span><span>+1</span></div>
              <div className="flex items-center gap-1"><span className={emojiSize}>😺</span><span>+2</span></div>
              <div className="flex items-center gap-1"><span className={emojiSize}>🍀</span><span>+3</span></div>
              <div className="flex items-center gap-1"><span className={emojiSize}>🍎</span><span>+4</span></div>
            </div>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-1"><span className={emojiSize}>🍩</span><span>+5</span></div>
              <div className="flex items-center gap-1"><span className={emojiSize}>🪙</span><span>+8</span></div>
              <div className="flex items-center gap-1"><span className={emojiSize}>💎</span><span>+15</span></div>
              <div className="flex items-center gap-1"><span className={emojiSize}>🎯</span><span>+20</span></div>
            </div>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-1"><span className={emojiSize}>👑</span><span>+30</span></div>
              <div className="flex items-center gap-1"><span className={emojiSize}>🧠</span><span>+30</span></div>
              <div className="flex items-center gap-1"><span className={emojiSize}>🧨</span><span>+50</span></div>
            </div>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-1"><span className={emojiSize}>🧿</span><span>+50</span></div>
              <div className="flex items-center gap-1"><span className={emojiSize}>💣</span><span className="text-red-400">–100</span></div>
            </div>
          </div>

          {/* Спец-эмодзи */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center justify-center gap-1">
              <span className={emojiSize}>🚀</span>
              <span className="text-green-400">Собирает всё</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className={emojiSize}>❄️</span>
              <span className="text-blue-300">Заморозка 5с</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className={emojiSize}>⭐</span>
              <span className="text-yellow-300">×2 на 5с</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className={emojiSize}>⏱️</span>
              <span className="text-green-300">+5 секунд</span>
            </div>
          </div>
        </div>

        {/* Кнопка "Играть" (оставляем для браузера) */}
        <button
          className="btn btn-primary mt-4 px-5 py-2 text-sm"
          onClick={onStart}
        >
          Играть
        </button>
      </div>

      {/* Нижняя панель */}
      <div className={`absolute bottom-2 w-full px-4 flex justify-between ${textSmall} text-white/60`}>
        <span>Emoji Drop Tg {version}</span>
        <button className="hover:text-white transition" onClick={onChangelog}>
          Обновления
        </button>
      </div>
    </div>
  );
}