import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { conn, knexInstance, type User } from "~/utils/db";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'

const SALT_ROUNDS = 10;
const SECRET = 'secret'

export const userRouter = createTRPCRouter({
  exsists: publicProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ input }) => {
      const users = await conn.execute(
        knexInstance("users").where("email", input.email).limit(1).toString()
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
        knexInstance("users").where("email", input.email).limit(1).toString()
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

      const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '1d' })

      ctx.res.setHeader(
        "Set-Cookie",
        `authToken=${token}; Path=/; HttpOnly; SameSite=Strict`
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
        knexInstance("users")
          .insert({
            first_name: input.first_name,
            last_name: input.last_name,
            email: input.email,
            hashed_password: hash,
          })
          .toString()
      );

      const userId = users.insertId;

      const token = jwt.sign({ userId }, SECRET, { expiresIn: '1d' })

      ctx.res.setHeader(
        "Set-Cookie",
        `authToken=${token}; Path=/; HttpOnly; SameSite=Strict`
      );

      return true;
    }),
  logout: protectedProcedure
    .mutation(({ ctx }) => {
      ctx.res.setHeader(
        "Set-Cookie",
        `authToken=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
      );

      return true;
    })
});
