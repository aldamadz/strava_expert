import { FastifyPluginAsync } from "fastify";
import { db } from "../lib/db.js";

type Activity = {
  id: string;
  type: "run" | "ride" | "walk";
  distance_km: number;
  moving_time_min: number;
  elevation_gain_m: number;
  started_at: string;
};

const activitiesRoute: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/activities", async (): Promise<Activity[]> => {
    const { rows } = await db.query<{
      id: string;
      type: "run" | "ride" | "walk";
      distance_km: number;
      moving_time_min: number;
      elevation_gain_m: number;
      started_at: string;
    }>(`
      select
        id::text as id,
        lower(sport_type)::text as type,
        round((distance_m::numeric / 1000), 2)::float8 as distance_km,
        floor(moving_time_s::numeric / 60)::int as moving_time_min,
        elevation_gain_m,
        started_at::text as started_at
      from activities
      order by started_at desc
      limit 100
    `);

    return rows;
  });
};

export default activitiesRoute;
