import { FastifyPluginAsync } from "fastify";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "../lib/db.js";
import { hashEmailForName, hashPassword, readBearerToken, signAuthToken, verifyAuthToken, verifyPassword } from "../lib/auth.js";
import { redisExpire, redisIncr } from "../lib/redis.js";

let authSchemaReady = false;

async function ensureAuthSchema() {
  if (authSchemaReady) {
    return;
  }
  await db.query(`
    alter table users
    add column if not exists password_hash text
  `);
  authSchemaReady = true;
}

const authRoute: FastifyPluginAsync = async (app) => {
  async function isRateLimited(key: string, limit: number, ttlSeconds: number) {
    const count = await redisIncr(key);
    if (count === 1) {
      await redisExpire(key, ttlSeconds);
    }
    return count > limit;
  }

  async function guardRateLimit(ip: string, email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const byIpKey = `rl:auth:ip:${ip}`;
    const byEmailKey = `rl:auth:email:${normalizedEmail}`;
    const ipLimited = await isRateLimited(byIpKey, 30, 60);
    const emailLimited = await isRateLimited(byEmailKey, 10, 60);
    return ipLimited || emailLimited;
  }

  function requireAuth(authorizationHeader: unknown) {
    const token = readBearerToken(authorizationHeader);
    if (!token) {
      return null;
    }
    return verifyAuthToken(token);
  }

  app.post("/api/v1/auth/register", async (request, reply) => {
    await ensureAuthSchema();

    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6).max(72),
      full_name: z.string().min(2).max(120).optional()
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid payload", issues: parsed.error.issues });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const rateLimited = await guardRateLimit(request.ip, email);
    if (rateLimited) {
      return reply.code(429).send({ message: "Too many attempts. Try again in a minute." });
    }
    const passwordHash = await hashPassword(parsed.data.password);
    const fullName = parsed.data.full_name?.trim() || hashEmailForName(email);
    const userId = randomUUID();

    try {
      await db.query(
        `
          insert into users (id, email, full_name, password_hash)
          values ($1::uuid, $2, $3, $4)
        `,
        [userId, email, fullName, passwordHash]
      );
    } catch {
      return reply.code(409).send({ message: "Email already registered" });
    }

    const token = signAuthToken({ userId, email });
    return reply.code(201).send({
      token,
      user: { id: userId, email, full_name: fullName }
    });
  });

  app.post("/api/v1/auth/login", async (request, reply) => {
    await ensureAuthSchema();

    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1).max(72)
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid payload", issues: parsed.error.issues });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const rateLimited = await guardRateLimit(request.ip, email);
    if (rateLimited) {
      return reply.code(429).send({ message: "Too many attempts. Try again in a minute." });
    }
    const { rows } = await db.query<{
      id: string;
      email: string;
      full_name: string;
      password_hash: string | null;
    }>(
      `
      select id::text, email, full_name, password_hash
      from users
      where email = $1
      limit 1
      `,
      [email]
    );

    const user = rows[0];
    if (!user?.password_hash) {
      return reply.code(401).send({ message: "Invalid email or password" });
    }
    const valid = await verifyPassword(parsed.data.password, user.password_hash);
    if (!valid) {
      return reply.code(401).send({ message: "Invalid email or password" });
    }

    const token = signAuthToken({ userId: user.id, email: user.email });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      }
    };
  });

  app.get("/api/v1/auth/me", async (request, reply) => {
    const auth = requireAuth(request.headers.authorization);
    if (!auth) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const { rows } = await db.query<{ id: string; email: string; full_name: string }>(
      `
      select id::text, email, full_name
      from users
      where id = $1::uuid
      limit 1
      `,
      [auth.userId]
    );
    const user = rows[0];
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }
    return { user };
  });

  app.patch("/api/v1/auth/me", async (request, reply) => {
    const auth = requireAuth(request.headers.authorization);
    if (!auth) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const schema = z.object({
      full_name: z.string().min(2).max(120)
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid payload", issues: parsed.error.issues });
    }

    await db.query(
      `
      update users
      set full_name = $2
      where id = $1::uuid
      `,
      [auth.userId, parsed.data.full_name.trim()]
    );

    const { rows } = await db.query<{ id: string; email: string; full_name: string }>(
      `
      select id::text, email, full_name
      from users
      where id = $1::uuid
      limit 1
      `,
      [auth.userId]
    );
    const user = rows[0];
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }

    return { user };
  });

  app.patch("/api/v1/auth/password", async (request, reply) => {
    await ensureAuthSchema();
    const auth = requireAuth(request.headers.authorization);
    if (!auth) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const schema = z.object({
      current_password: z.string().min(1).max(72),
      new_password: z.string().min(6).max(72)
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid payload", issues: parsed.error.issues });
    }

    const { rows } = await db.query<{ password_hash: string | null }>(
      `
      select password_hash
      from users
      where id = $1::uuid
      limit 1
      `,
      [auth.userId]
    );
    const currentHash = rows[0]?.password_hash;
    if (!currentHash) {
      return reply.code(401).send({ message: "Current password invalid" });
    }
    const valid = await verifyPassword(parsed.data.current_password, currentHash);
    if (!valid) {
      return reply.code(401).send({ message: "Current password invalid" });
    }

    const newHash = await hashPassword(parsed.data.new_password);
    await db.query(
      `
      update users
      set password_hash = $2
      where id = $1::uuid
      `,
      [auth.userId, newHash]
    );

    return { message: "Password updated" };
  });

  app.delete("/api/v1/auth/me", async (request, reply) => {
    const auth = requireAuth(request.headers.authorization);
    if (!auth) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    await db.query(
      `
      delete from users
      where id = $1::uuid
      `,
      [auth.userId]
    );

    return { message: "Account deleted" };
  });
};

export default authRoute;
