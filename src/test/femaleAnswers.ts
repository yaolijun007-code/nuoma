import type { AnswerMap } from "../domain/types";

export const validFemaleAnswers = (): AnswerMap => ({
  ...Object.fromEntries(Array.from({ length: 55 }, (_, index) => [`f${index + 1}`, "0"])),
  f1: "虚构女性用户",
  f2: "13800000000",
  f3: "2026-08-14",
  f11: ["9"],
  f26: ["7"],
  f30: ["6"],
  f31: ["5"],
  f33: ["0"],
  f45: ["6"],
  f47: ["0"],
  f48: ["0", "3"],
  f49: ["13"],
  f50: ["11"],
  f51: ["7"],
  f53: ["0", "1", "4"],
  f55: 8,
});
