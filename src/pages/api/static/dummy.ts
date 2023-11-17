import fs from "fs";
import path from "path";

/**
 * VercelでYarnを利用しているとEdge Functionに必要な静的ファイルの解析に失敗する
 * 単純なダミーファイルを用意し回避する
 * https://stackoverflow.com/questions/74529208/file-path-in-nextjs-api-route-not-resolving/74998489#74998489
 */
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  charYaml: fs.readFileSync(path.join(process.cwd(), "assets/charactor.yaml")),
};
