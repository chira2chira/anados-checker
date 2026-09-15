#!/usr/bin/env node
// 復刻ガチャ追加の補助スクリプト。
//   scan <titles.txt> <startId>  タイトル一覧から流用元IDとヘッダー流用可否を出す
//   images <plan.json>           main画像の移動とheader画像の流用コピーを行う
//   append <plan.json>           gacha.yaml に新エントリを追記する (CRLF維持)
//   pooldiff <idA> <idB>         gacha_pool.yaml のプール差分を出す
//   verify [count]               追記結果を検証する (既定: 末尾18件)
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import sharp from "sharp";

const ROOT = process.cwd();
const WEBP_QUALITY = 80;
const GACHA = path.join(ROOT, "assets/gacha.yaml");
const CHAR = path.join(ROOT, "assets/charactor.yaml");
const POOL = path.join(ROOT, "assets/gacha_pool.yaml");
const BANNER = path.join(ROOT, "public/static/image/banner");

/** gacha.yaml を「id → 行配列」に分解する。書式を保つため文字列のまま扱う。 */
function readBlocks() {
  const raw = fs.readFileSync(GACHA, "utf8");
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks = new Map();
  const order = [];
  let cur = null;
  for (const line of lines) {
    const m = /^- id: (\d+)$/.exec(line);
    if (m) {
      cur = Number(m[1]);
      blocks.set(cur, [line]);
      order.push(cur);
    } else if (cur !== null && line.trim() !== "") {
      blocks.get(cur).push(line);
    }
  }
  return { blocks, order };
}

function field(lines, key) {
  const hit = lines.find((l) => l.startsWith(`  ${key}: `));
  return hit === undefined ? null : hit.slice(key.length + 4);
}

function scan(titlesPath, startId) {
  const { blocks, order } = readBlocks();
  const titles = fs
    .readFileSync(titlesPath, "utf8")
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean);

  const plan = { start: "", end: "", poolId: null, items: [] };
  titles.forEach((title, i) => {
    const newId = startId + i;
    const hits = order
      .filter((id) => field(blocks.get(id), "nameJa") === title)
      .map((id) => ({ id, revival: field(blocks.get(id), "revival") }));

    if (hits.length === 0) {
      console.log(`${newId}\tNOT FOUND\t${title}`);
      plan.items.push({ newId, sourceId: null, _title: title });
      return;
    }
    const revivals = hits.filter((h) => h.revival === "true");
    const headerReusable = revivals.length > 0;
    const sourceId = (headerReusable ? revivals : hits).at(-1).id;
    const hist = hits.map((h) => `${h.id}(${h.revival ?? "-"})`).join(",");
    console.log(
      `${newId}\tsrc=${sourceId}\theader=${headerReusable ? "REUSE" : "MISSING"}\t[${hist}]\t${title}`
    );
    plan.items.push({ newId, sourceId, _title: title, _headerFrom: headerReusable ? sourceId : null });
  });

  // plan はリポジトリを汚さないよう titles.txt と同じ場所に出す
  const out = path.join(path.dirname(path.resolve(titlesPath)), "gacha-plan.json");
  fs.writeFileSync(out, JSON.stringify(plan, null, 2) + "\n", "utf8");
  console.log(`\nplan -> ${out} (start/end/poolId を埋めてから append すること)`);
}

function append(planPath) {
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  if (!plan.start || !plan.end || !plan.poolId) {
    throw new Error("plan に start / end / poolId が必要");
  }
  const { blocks } = readBlocks();
  const out = [];
  for (const item of plan.items) {
    const src = blocks.get(item.sourceId);
    if (!src) throw new Error(`流用元 id=${item.sourceId} が見つからない`);
    const lines = src.map((l) => {
      if (l.startsWith("- id: ")) return `- id: ${item.newId}`;
      if (l.startsWith("  nameJa: ")) return `  nameJa: ${item.nameJa ?? l.slice(10)}`;
      if (l.startsWith("  revival: ")) return "  revival: true";
      if (l.startsWith("  start: ")) return `  start: ${plan.start}`;
      if (l.startsWith("  end: ")) return `  end: ${plan.end}`;
      if (l.startsWith("  poolId: ")) return `  poolId: ${plan.poolId}`;
      return l;
    });
    if (!lines.some((l) => l.startsWith("  revival:"))) {
      // 初期のエントリには revival キーが無い。nameEn の直後に差し込む。
      const at = lines.findIndex((l) => l.startsWith("  nameEn: "));
      lines.splice(at + 1, 0, "  revival: true");
    }
    out.push(lines.join("\r\n"));
  }
  fs.appendFileSync(GACHA, out.join("\r\n") + "\r\n", "utf8");
  console.log(`appended ${out.length} entries`);
}

/** メイン画像を webp に変換して banner/<locale>/main へ置き、流用可能なヘッダーをコピーする。 */
async function images(planPath) {
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const SRC = path.join(ROOT, "public/static/image");
  const missing = [];
  for (const item of plan.items) {
    for (const [loc, suffix] of [["ja", "JP"], ["en", "EN"]]) {
      const from = path.join(SRC, `Housing_PickUP_${item.newId}_single_${suffix}.png`);
      const to = path.join(BANNER, loc, "main", `${item.newId}.webp`);
      if (fs.existsSync(from)) {
        await sharp(from).webp({ quality: WEBP_QUALITY }).toFile(to);
        fs.unlinkSync(from);
        console.log(`main  ${loc}: ${path.basename(from)} -> ${item.newId}.webp`);
      } else if (!fs.existsSync(to)) {
        missing.push(`main ${loc}/${item.newId}`);
      }

      const src = item._headerFrom;
      const hTo = path.join(BANNER, loc, "header", `${item.newId}.webp`);
      if (src == null) {
        if (!fs.existsSync(hTo)) missing.push(`header ${loc}/${item.newId} (復刻実績なし・新規作成が必要)`);
        continue;
      }
      fs.copyFileSync(path.join(BANNER, loc, "header", `${src}.webp`), hTo);
      console.log(`header ${loc}: ${src}.webp -> ${item.newId}.webp`);
    }
  }
  console.log(missing.length ? `\n未配置:\n  ${missing.join("\n  ")}` : "\n画像は全て揃った");
}

function pooldiff(a, b) {
  const pools = yaml.load(fs.readFileSync(POOL, "utf8"));
  const names = (id) => {
    const p = pools.find((x) => x.id === id);
    if (!p) throw new Error(`pool ${id} が無い`);
    return new Set([...p.rarity6, ...p.rarity5, ...p.rarity4, ...p.rarity3]);
  };
  const A = names(a);
  const B = names(b);
  console.log(`${b} にだけ居る:`, [...B].filter((x) => !A.has(x)).join(", ") || "(なし)");
  console.log(`${a} にだけ居る:`, [...A].filter((x) => !B.has(x)).join(", ") || "(なし)");
}

function verify(count) {
  const gacha = yaml.load(fs.readFileSync(GACHA, "utf8"));
  const chars = new Set(yaml.load(fs.readFileSync(CHAR, "utf8")).map((x) => x.nameJa));
  const poolIds = new Set(yaml.load(fs.readFileSync(POOL, "utf8")).map((x) => x.id));
  const ids = gacha.map((x) => x.id);
  let ng = 0;
  const fail = (...m) => {
    ng++;
    console.log("NG:", ...m);
  };

  if (ids.length !== new Set(ids).size) fail("id が重複している");

  for (const g of gacha.slice(-count)) {
    const sum =
      g.weight.reduce((a, w) => a + w.weight, 0) +
      g.pickUp.reduce((a, p) => a + p.weight, 0);
    if (Math.abs(sum - 1) > 1e-9) fail(g.id, `weight 合計が ${sum.toFixed(4)}`);
    if (!poolIds.has(g.poolId)) fail(g.id, `未知の poolId ${g.poolId}`);
    for (const p of g.pickUp) {
      if (!chars.has(p.name)) fail(g.id, `charactor.yaml に無い PU: ${p.name}`);
    }
    for (const loc of ["ja", "en"]) {
      for (const kind of ["main", "header"]) {
        const f = path.join(BANNER, loc, kind, `${g.id}.webp`);
        if (!fs.existsSync(f)) fail(g.id, `画像が無い: ${loc}/${kind}`);
      }
    }
    console.log(
      `${g.id}\t${g.start} - ${g.end}\tpool=${g.poolId}\tPU=${g.pickUp.length}\t${g.nameJa}`
    );
  }
  console.log(ng === 0 ? "\nOK" : `\n${ng} 件の問題あり`);
}

const [cmd, ...args] = process.argv.slice(2);
switch (cmd) {
  case "scan":
    scan(args[0], Number(args[1]));
    break;
  case "append":
    append(args[0]);
    break;
  case "images":
    await images(args[0]);
    break;
  case "pooldiff":
    pooldiff(Number(args[0]), Number(args[1]));
    break;
  case "verify":
    verify(Number(args[0] ?? 18));
    break;
  default:
    console.log(
      "usage: gacha-revival.mjs scan <titles.txt> <startId> | images <plan.json> | append <plan.json> | pooldiff <a> <b> | verify [count]"
    );
    process.exit(1);
}
