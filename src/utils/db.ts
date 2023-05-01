import { env } from "~/env.mjs";
import { connect } from "@planetscale/database";
import { type Knex, knex } from "knex";

export const conn = connect({
  url: env.DATABASE_URL,
});

const knexConfig: Knex.Config = {
  client: "mysql",
  connection: {},
};

export const knexInstance = knex(knexConfig);

type DbRecord = {
  id: string;
  created_at: string;
  updated_at: string;
};

export interface User extends DbRecord {
  first_name: string;
  last_name: string;
  email: string;
  hashed_password: string;
}