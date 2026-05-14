export type CycleStatus = "active" | "completed";

export interface Cycle {
  id: string;
  startDate: string;
  endDate: string;
  workingDayCount: number;
  status: CycleStatus;
  createdBy: string;
  createdAt: string;
}

export interface CreateCycleInput {
  startDate: string;
  endDate: string;
  workingDayCount: number;
}

export type CycleError =
  | { type: "active_cycle_exists" }
  | { type: "unauthorized" }
  | { type: "db_error"; message: string };
