// frontend/src/game/config.ts

export type EmojiDef = {
  char: string;
  points: number;
  weight: number; // относительный вес выпадения
};

export type SpecialDef = {
  char: string;
  kind: "bomb" | "rocket" | "freeze" | "mult" | "time"; // добавили "time"
  weight: number;
};

// Обычные эмодзи и очки (⭐ убрали отсюда, теперь это спец)
export const EMOJI: EmojiDef[] = [
  { char: "😀", points: 1,  weight: 30 },
  { char: "😺", points: 2,  weight: 20 },
  { char: "🍀", points: 3,  weight: 18 },
  { char: "🍎", points: 4,  weight: 16 },
  { char: "🍩", points: 5,  weight: 14 },
  { char: "🪙", points: 8,  weight: 12 },
  { char: "💎", points: 15, weight: 8 },
  { char: "🎯", points: 20, weight: 6 },
  { char: "👑", points: 30, weight: 4 },
  { char: "🧠", points: 30, weight: 3 },
  { char: "🧨", points: 50, weight: 1 },
  { char: "🧿", points: 50, weight: 1 },
];

// Спец-эмодзи (⭐ теперь тут, с типом "mult", ⏱️ с типом "time")
export const SPECIALS: SpecialDef[] = [
  { char: "💣", kind: "bomb",   weight: 14 },   // –100
  { char: "❄️", kind: "freeze", weight: 9 },    // стоп на 5с
  { char: "🚀", kind: "rocket", weight: 3 },    // собрать всё
  { char: "⭐", kind: "mult",   weight: 5 },    // x2 на 5с
  { char: "⏱️", kind: "time",   weight: 3 },    // добавляет 5 секунд
];

// Общие константы
export const GAME_SECONDS = 30;
export const FREEZE_SECONDS = 5;
export const MULTIPLIER_SECONDS = 5;   // длительность x2
export const TIMER_BONUS_SECONDS = 5;  // +5 секунд при часах

// Спавн
export const SPAWN = {
  minIntervalMs: 250,
  maxIntervalMs: 450,
  minBatch: 1,
  maxBatch: 2,
  maxAlive: 45,
};

// Движение
export const MOTION = {
  baseVy: 140,        // px/s
  jitterVx: 20,       // случайный дрейф
  accelPctByEnd: 0.35 // к концу игры +35% скорости
};

// Размер игрового поля
export const PLAYFIELD = {
  width: 390,
  height: 844,
  paddingTop: 80,
  paddingSide: 16,
  paddingBottom: 20,
};

export const VERSION = "v0.2.4";