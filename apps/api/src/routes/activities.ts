import { FastifyPluginAsync } from "fastify";
import { db } from "../lib/db.js";
import { randomUUID } from "crypto";
import { z } from "zod";
import { readBearerToken, verifyAuthToken } from "../lib/auth.js";
import { redisDel, redisGet, redisSetEx } from "../lib/redis.js";

type Activity = {
  id: string;
  type: "run" | "ride" | "walk";
  distance_km: number;
  moving_time_s: number;
  avg_pace: string;
  elevation_gain_m: number;
  started_at: string;
  route: Array<{ latitude: number; longitude: number }>;
};

function formatPace(durationSec: number, distanceMeters: number) {
  if (durationSec <= 0 || distanceMeters <= 0) {
    return "--:--";
  }
  const paceSecPerKm = durationSec / (distanceMeters / 1000);
  const mm = Math.floor(paceSecPerKm / 60);
  const ss = Math.floor(paceSecPerKm % 60);
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

const activitiesRoute: FastifyPluginAsync = async (app) => {
  function requireAuth(authorizationHeader: unknown) {
    const token = readBearerToken(authorizationHeader);
    if (!token) {
      return null;
    }
    return verifyAuthToken(token);
  }

  app.get("/api/v1/activities", async (request, reply) => {
    const auth = requireAuth(request.headers.authorization);
    if (!auth) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const cacheKey = `activities:${auth.userId}`;
    const cached = await redisGet(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fallback to DB query
      }
    }
    const { rows } = await db.query<{
      id: string;
      type: "run" | "ride" | "walk";
      distance_km: number;
      moving_time_s: number;
      avg_pace: string;
      elevation_gain_m: number;
      started_at: string;
      route: Array<{ latitude: number; longitude: number }>;
    }>(`
      select
        a.id::text as id,
        lower(a.sport_type)::text as type,
        round((a.distance_m::numeric / 1000), 2)::float8 as distance_km,
        a.moving_time_s,
        a.elevation_gain_m,
        a.started_at::text as started_at,
        coalesce(
          json_agg(
            json_build_object('latitude', gp.lat, 'longitude', gp.lon)
            order by gp.seq
          ) filter (where gp.id is not null),
          '[]'::json
        ) as route
      from activities a
      left join gps_points gp on gp.activity_id = a.id
      where a.user_id = $1::uuid
      group by a.id
      order by started_at desc
      limit 100
    `, [auth.userId]);

    const mapped = rows.map((row: Activity) => ({
      ...row,
      avg_pace: formatPace(row.moving_time_s, Math.round(row.distance_km * 1000))
    }));

    await redisSetEx(cacheKey, 30, JSON.stringify(mapped));
    return mapped;
  });

  app.post("/api/v1/activities", async (request, reply) => {
    const auth = requireAuth(request.headers.authorization);
    if (!auth) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const schema = z.object({
      title: z.string().min(1).max(200).optional(),
      type: z.enum(["run", "ride", "walk"]).default("run"),
      distance_km: z.number().nonnegative(),
      moving_time_s: z.number().int().nonnegative(),
      elevation_gain_m: z.number().int().nonnegative().default(0),
      started_at: z.string().datetime().optional(),
      route: z
        .array(
          z.object({
            latitude: z.number(),
            longitude: z.number()
          })
        )
        .default([])
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid activity payload",
        issues: parsed.error.issues
      });
    }

    const payload = parsed.data;
    const activityId = randomUUID();
    const startedAt = payload.started_at ?? new Date().toISOString();
    const distanceM = Math.round(payload.distance_km * 1000);

    await db.query(
      `
        insert into activities (
          id, user_id, sport_type, distance_m, moving_time_s, elapsed_time_s, elevation_gain_m, started_at
        ) values (
          $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::timestamptz
        )
      `,
      [
        activityId,
        auth.userId,
        payload.type,
        distanceM,
        payload.moving_time_s,
        payload.moving_time_s,
        payload.elevation_gain_m,
        startedAt
      ]
    );

    if (payload.route.length > 0) {
      const values: Array<unknown> = [];
      const chunks: string[] = [];
      payload.route.forEach((point, index) => {
        const base = index * 5;
        chunks.push(
          `($${base + 1}::uuid, $${base + 2}::int, $${base + 3}::float8, $${base + 4}::float8, null, $${base + 5}::timestamptz)`
        );
        values.push(activityId, index + 1, point.latitude, point.longitude, startedAt);
      });

      await db.query(
        `
          insert into gps_points (activity_id, seq, lat, lon, altitude_m, recorded_at)
          values ${chunks.join(",")}
        `,
        values
      );
    }

    await redisDel(`activities:${auth.userId}`);

    return reply.code(201).send({
      id: activityId,
      type: payload.type,
      distance_km: payload.distance_km,
      moving_time_s: payload.moving_time_s,
      avg_pace: formatPace(payload.moving_time_s, distanceM),
      elevation_gain_m: payload.elevation_gain_m,
      started_at: startedAt,
      route: payload.route
    });
  });
};

export default activitiesRoute;
