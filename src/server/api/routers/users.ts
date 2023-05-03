import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { conn, type User } from "~/utils/db";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import { env } from '~/env.mjs'

const SALT_ROUNDS = 10;

export const userRouter = createTRPCRouter({
  exsists: publicProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ input }) => {
      const users = await conn.execute(
        'SELECT * FROM users WHERE email = :email LIMIT 1',
        { email: input.email },
      );
      return users.rows.length > 0;
    }),
  getUser: protectedProcedure
    .query(({ ctx }) => {
      return {
        id: ctx.user?.id,
        email: ctx.user?.email,
        first_name: ctx.user?.first_name,
        last_name: ctx.user?.last_name,
      };
    }),
  login: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const users = await conn.execute(
        'SELECT * FROM users WHERE email = :email LIMIT 1',
        { email: input.email }
      );

      if (users.rows.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const user = users.rows[0] as User;
      const compare = bcrypt.compareSync(input.password, user.hashed_password);

      if (!compare) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign({ userId: user.id }, env.JWS_SECRET, { expiresIn: '1d' })

      ctx.res?.setHeader(
        "Set-Cookie",
        `authToken=${token}; Path=/; HttpOnly; HttpOnly; SameSite=Strict`
      );

      return true;
    }),
  register: publicProcedure
    .input(
      z.object({
        first_name: z.string(),
        last_name: z.string(),
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const hash = bcrypt.hashSync(input.password, SALT_ROUNDS);

      const users = await conn.execute(
        'INSERT INTO users (first_name, last_name, email, hashed_password) VALUES (:first_name, :last_name, :email, :hashed_password)',
        {
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email,
          hashed_password: hash,
        }
      );

      const userId = users.insertId;

      const token = jwt.sign({ userId }, env.JWS_SECRET, { expiresIn: '1d' })

      ctx.res?.setHeader(
        "Set-Cookie",
        `authToken=${token}; Path=/; Secure; HttpOnly; SameSite=Strict`
      );

      return true;
    }),
  logout: protectedProcedure
    .mutation(({ ctx }) => {
      ctx.res?.setHeader(
        "Set-Cookie",
        `authToken=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
      );

      return true;
    }),
  test: publicProcedure
    .query(() => {
      return 'Testing';
    })
});
