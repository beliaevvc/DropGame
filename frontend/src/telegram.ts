// безопасный мост к Telegram WebApp API
export type TG = {
  ready: () => void;
  expand: () => void;
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string>;
  onEvent: (event: string, cb: (...a: any[]) => void) => void;
  offEvent: (event: string, cb: (...a: any[]) => void) => void;
  MainButton: {
    text: string;
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    setText: (t: string) => void;
    onClick: (f: () => void) => void;
    offClick: (f: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (f: () => void) => void;
    offClick: (f: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: "light"|"medium"|"heavy") => void;
    notificationOccurred: (t:"success"|"warning"|"error") => void;
  };
};

export function getTG(): TG | null {
  // @ts-expect-error
  const tg = (window as any)?.Telegram?.WebApp as TG | undefined;
  return tg ?? null;
}

/** Применяем цвета темы Телеграма в :root */
export function applyTelegramTheme(tg: TG) {
  const p = tg.themeParams || {};
  const root = document.documentElement;
  // используем безопасные значения с запасом
  const set = (cssVar: string, tgKey: string, fallback: string) =>
    root.style.setProperty(cssVar, (p as any)[tgKey] || fallback);

  set("--tg-bg",        "bg_color",         "#000000");
  set("--tg-text",      "text_color",       "#ffffff");
  set("--tg-hint",      "hint_color",       "#9aa0a6");
  set("--tg-link",      "link_color",       "#6ab3f3");
  set("--tg-button",    "button_color",     "#2ea6ff");
  set("--tg-button-tx", "button_text_color","#ffffff");
}