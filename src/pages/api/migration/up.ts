// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { db } from "@/utils/db";
import { sql } from "kysely";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // await db.schema
  //   .createTable("sharechar")
  //   .addColumn("id", "varchar", (col) => col.primaryKey())
  //   .addColumn("chars", "varchar")
  //   .addColumn("percent", "numeric(5, 2)")
  //   .addColumn("owned", "integer")
  //   .addColumn("char_count", "integer")
  //   .addColumn("create_at", "timestamp", (col) =>
  //     col.defaultTo(sql`now()`).notNull()
  //   )
  //   .execute();

  res.status(200).end();
}
