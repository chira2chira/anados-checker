// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { db } from "@/utils/db";
import { loadCharactors } from "@/utils/yamlUtil";
import { sql } from "kysely";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // const result = await db.selectFrom("sharechar").selectAll().execute();
  // const charCount = loadCharactors().length;

  // for (const record of result) {
  //   const owned = record.chars.split(",").length;
  //   const percent = Math.round((owned / charCount) * 100);

  //   await db.updateTable("sharechar")
  //     .set({
  //       percent,
  //       owned,
  //       char_count: charCount,
  //     })
  //     .where("id", "=", record.id)
  //     .execute();
  // }

  res.status(200).end();
}
