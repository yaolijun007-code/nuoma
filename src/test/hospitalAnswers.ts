import type { AnswerMap } from "../domain/types";

export const validHospitalAnswers = (): AnswerMap => ({
  name: "虚构用户",
  phone: "13800000000",
  date: "2026-08-13",
  topConcerns: ["0", "1", "2"],
  mainChange: "11",
  workStatus: "0",
  twelveWeekGoals: ["0", "1"],
  singleImprovement: "0",
  ...Object.fromEntries(Array.from({ length: 55 }, (_, index) => [`q${index + 1}`, "0"])),
  q47: ["0", "1", "2", "3", "4"],
  q48: ["10"],
});
