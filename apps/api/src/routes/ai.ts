import { FastifyPluginAsync } from "fastify";
import { InsightResponse } from "../types/api.js";

const aiRoute: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/ai/insight", async (): Promise<InsightResponse> => {
    return {
      readiness_score: 78,
      suggested_workout: "Easy run 45 min + 6 strides",
      fatigue_risk: "low",
      predicted_10k_time: "49:20"
    };
  });
};

export default aiRoute;

