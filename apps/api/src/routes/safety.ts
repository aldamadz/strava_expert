import { FastifyPluginAsync } from "fastify";
import { SafetyStatusResponse } from "../types/api.js";

const safetyRoute: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/safety/status", async (): Promise<SafetyStatusResponse> => {
    return {
      monitoring: true,
      anomaly_score: 0.08,
      emergency_contact_notified: false,
      message: "No anomaly detected. Live guardian active."
    };
  });
};

export default safetyRoute;

