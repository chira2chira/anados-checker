import { createKysely } from "@vercel/postgres-kysely";
import { ColumnType } from "kysely";

type ShareCharTable = {
  id: string;
  chars: string;
  percent: ColumnType<string, number, number>;
  owned: number;
  char_count: number;
  create_at: ColumnType<Date, string, never>;
};

type Database = {
  sharechar: ShareCharTable;
};

export const db = createKysely<Database>();
