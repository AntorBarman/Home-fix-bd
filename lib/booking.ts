import type { BookingStatus } from "@/types";
export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ["accepted", "cancelled"], accepted: ["assigned", "cancelled"], assigned: ["on_the_way", "cancelled"],
  on_the_way: ["arrived", "cancelled"], arrived: ["started", "cancelled"], started: ["completed"],
  completed: ["customer_confirmed"], customer_confirmed: ["closed"], closed: [], cancelled: [],
};
export function canTransition(from: BookingStatus, to: BookingStatus) { return VALID_TRANSITIONS[from].includes(to); }
