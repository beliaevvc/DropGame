// frontend/src/game/types.ts

// Все виды спец-эмодзи
export type SpecialKind = "bomb" | "rocket" | "freeze" | "mult" | "time";

// Вид дропа: обычный или один из спецов
export type DropKind = "normal" | SpecialKind;

// Структура любого падающего объекта
export type Drop = {
  id: number;
  kind: DropKind;
  char: string;
  points: number; // используется для normal; у спецов 0
  x: number;
  y: number;
  vx: number;
  vy: number;
  sprite?: any; // (оставляем any, чтобы не тянуть PIXI в типы)
};