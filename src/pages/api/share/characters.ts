import { db } from "@/utils/db";
import shortid from "shortid";
import type { NextApiRequest, NextApiResponse } from "next";
import { loadCharactors } from "@/utils/yamlUtil";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(400).json({ message: "不正なメソッド" });
  }
  const { chars } = req.body;
  if (typeof chars !== "string") {
    return res.status(400).json({ message: "不正なリクエスト" });
  } else if (!chars) {
    return res.status(400).json({ message: "空の状態では発行できません" });
  } else if (chars.length > 5000) {
    return res.status(400).json({ message: "デカすぎるでやんす！" });
  }

  const charList = chars.split(",");
  for (const char of charList) {
    if (!char.match(/^[0-9]+$/) || Number(char) === 0) {
      return res.status(400).json({ message: "不正なbody" });
    }
  }

  const charCount = loadCharactors().length;
  const owned = charList.length;
  const percent = Math.round((owned / charCount) * 100);

  const id = shortid.generate();

  try {
    await db
      .insertInto("sharechar")
      .values({
        id,
        chars: req.body.chars,
        percent,
        owned,
        char_count: charCount,
        create_at: new Date().toISOString(),
      })
      .execute();

    res.status(200).send({ id });
  } catch (error) {
    res
      .status(500)
      .send({ message: "発行に失敗しました。時間を空けて再度お試しください" });
  }
}
