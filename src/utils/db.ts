import { env } from "~/env.mjs";
import { connect } from "@planetscale/database";

export const conn = connect({
  url: env.DATABASE_URL,
});

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