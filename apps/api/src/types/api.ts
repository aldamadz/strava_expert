export type InsightResponse = {
  readiness_score: number;
  suggested_workout: string;
  fatigue_risk: "low" | "medium" | "high";
  predicted_10k_time: string;
};

export type SafetyStatusResponse = {
  monitoring: boolean;
  anomaly_score: number;
  emergency_contact_notified: boolean;
  message: string;
};

