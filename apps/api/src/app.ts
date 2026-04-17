import Fastify from "fastify";
import cors from "@fastify/cors";
import activitiesRoute from "./routes/activities.js";
import aiRoute from "./routes/ai.js";
import authRoute from "./routes/auth.js";
import healthRoute from "./routes/health.js";
import safetyRoute from "./routes/safety.js";
import { db } from "./lib/db.js";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });
  app.register(healthRoute);
  app.register(authRoute);
  app.register(activitiesRoute);
  app.register(aiRoute);
  app.register(safetyRoute);
  app.addHook("onClose", async () => {
    await db.end();
  });

  return app;
}
