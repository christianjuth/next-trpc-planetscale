import { cookies } from "next/headers";
import { appRouter } from "~/server/api/root";
import { conn, type User } from "./db";
import jwt from "jsonwebtoken";
import { env } from "~/env.mjs";

export const ssrApi = async () => {
  const authToken = cookies().get("authToken")?.value;

  let user: User | null = null;

  if (typeof authToken === "string") {
    const parsedToken = authToken
      ? jwt.verify(authToken, env.JWS_SECRET)
      : null;

    if (
      typeof parsedToken === "object" &&
      parsedToken !== null &&
      typeof parsedToken["userId"] === "string"
    ) {
      const data = await conn.execute(
        'SELECT * FROM users WHERE id = :id LIMIT 1',
        { id: parsedToken.userId }
      );
      if (data.rows.length > 0) {
        user = data.rows[0] as User;
      }
    }
  }

  return appRouter.createCaller({ user, req: undefined, res: undefined });
};
