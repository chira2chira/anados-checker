---
name: revival-gacha
description: 復刻ガチャを assets/gacha.yaml に一括追加し、バナー画像(main/header)を配置する。「復刻ガチャ追加」「ガチャ追加」「gacha.yaml 更新」「Housing_PickUP 画像の配置」といった依頼で使用する。
---

# 復刻ガチャ追加

複数の復刻ガチャを `assets/gacha.yaml` に追記し、バナー画像を `public/static/image/banner/<locale>/{main,header}/<id>.webp` に配置する定型作業。バナー画像は Vercel のストレージ削減のため webp (quality 80) で統一している。PNG を置かないこと。

## 前提となる入力

ユーザーからは通常これだけが渡される。

- 追加するガチャの**日本語タイトル一覧（開催順）**
- 割り当てる**ID範囲**（例: 220-237）
- **開催期間**（例: 2026/8/21-2026/10/2）
- メイン画像は `public/static/image/` 直下に `Housing_PickUP_<番号>_single_JP.png` / `..._EN.png` として配置済み

## 手順

### 1. 採番と現状確認

```bash
ls public/static/image/banner/ja/main | sed 's/\.webp//' | sort -n | tail -3
ls public/static/image/Housing_PickUP_*_single_JP.png
```

新IDは `banner/ja/main` の最大番号+1 からの連番。ユーザー指定と食い違ったら指定を優先しつつ指摘する。

### 2. 流用元エントリの特定

```bash
node .claude/skills/revival-gacha/scripts/gacha-revival.mjs scan <titles.txt> <開始ID>
```

`titles.txt` はタイトル1行1件（開催順）。1行1タイトルで次を出力し、`gacha-plan.json` の雛形も書き出す。

```
220	src=81	header=REUSE	[81(true)]	モテモテGメン出動！守れ、ハッテンビーチの平和！
232	src=160	header=MISSING	[160(false)]	マッチング最大効率！ようこそおひとりさまアイランド
```

- `src=` … **流用元ID** = 直近の `revival: true` エントリ。無ければ直近の初出エントリ
- `header=` … `REUSE` = ヘッダー流用可 / `MISSING` = 流用元なし
- `[...]` … 過去の全出現（id と `revival` フラグ）

ヘッダー画像には「復刻」バッジが焼き込まれているため、**復刻実績のある回のヘッダーしか流用できない**。`MISSING` のものは新規ヘッダーの用意が必要なので、必ずユーザーに知らせる。

タイトルが `NOT FOUND` になったら、ユーザー指定の表記とマスタの表記がゆれている。部分一致で探し直す:

```bash
grep -n "特徴的な部分文字列" assets/gacha.yaml
```

（実例: ユーザー指定「ひと皮剥ける熱帯夜」/ 既存データ「一皮剥ける熱帯夜」）

### 3. 画像とタイトルの対応を目視確認【必須・省略不可】

`Housing_PickUP_<番号>` の番号は新IDと一致していることが多いが、**保証はない**。
JP画像を Read ツールで全枚数開き、次を確認する。

- バナー下部のタイトルが、指定タイトル一覧の並び順と一致しているか
- バナーに「復刻 Revival」バッジがあるか
- 「開催期間 ... まで」の**終了日時**（`end` に使う。ほぼ常に `13:00` JST）
- PUキャラの顔ぶれと人数が、流用元エントリの `pickUp` と一致しているか

PU構成が流用元と違う場合は勝手に直さず、差分をユーザーに報告して判断を仰ぐ。

### 4. poolId を決める

`poolId` は `assets/gacha_pool.yaml` の最新プール（= 直近ガチャと同じ値）を使う。ただし前回のプール更新以降に通常プール入りしたキャラがいる場合は新しいプールを `gacha_pool.yaml` に追加する必要がある。判断材料が無ければ**最新プールを暫定採用し、その旨をユーザーに明示して確認を求める**。

```bash
grep -n "^- id:" assets/gacha_pool.yaml | tail -3
grep -n "poolId" assets/gacha.yaml | tail -3
node .claude/skills/revival-gacha/scripts/gacha-revival.mjs pooldiff 23 24
```

### 5. plan JSON を仕上げる

`scan` が titles.txt と同じディレクトリに `gacha-plan.json` を出す。空欄の `start` / `end` / `poolId` を埋める。

```json
{
  "start": "8/21/2026",
  "end": "10/2/2026 13:00",
  "poolId": 24,
  "items": [
    { "newId": 220, "sourceId": 81, "_headerFrom": 81 },
    { "newId": 232, "sourceId": 160, "_headerFrom": null },
    { "newId": 233, "sourceId": 161, "_headerFrom": null,
      "nameJa": "ひと皮剥ける熱帯夜！皆にはナイショだよ" }
  ]
}
```

- 日付は `M/D/YYYY` 形式（ゼロ埋めなし）。`end` には時刻を付ける。
- `nameJa` は既存の表記を変えたいときだけ足す（無ければ流用元のまま）。
- `_headerFrom` が `null` = ヘッダー流用不可。`scan` の判定を手で覆さない。

### 6. 画像の移動・コピー

```bash
node .claude/skills/revival-gacha/scripts/gacha-revival.mjs images <plan.json>
```

`Housing_PickUP_<newId>_single_JP/EN.png` を webp (quality 80) に変換して `banner/ja|en/main/<newId>.webp` に置き（元の PNG は削除）、`_headerFrom` があるものは ja/en 両方のヘッダーをコピーする。最後に未配置ファイルを一覧表示するので、それをユーザーへの報告にそのまま使う。

画像ファイル名の番号が新IDと違う場合は、先に `Housing_PickUP_<newId>_single_JP/EN.png` へリネームしてから `images` を流す（変換はスクリプトに任せる）。新規ヘッダーを手で追加する場合も webp に変換してから置く。

### 7. gacha.yaml への追記

```bash
node .claude/skills/revival-gacha/scripts/gacha-revival.mjs append <plan.json>
```

流用元ブロックのテキストをそのまま複製し、`id` / `revival: true` / `start` / `end` / `poolId` / （指定時のみ）`nameJa` だけを差し替える。`nameEn` `weight` `pickUp` は無加工で継承される。

ファイルは **CRLF** なので手書き追記や yaml ライブラリでの書き戻しはしない（全体が再フォーマットされる）。

### 8. 検証

```bash
node .claude/skills/revival-gacha/scripts/gacha-revival.mjs verify <件数>
```

チェック内容:

- js-yaml でパースできる
- id 重複なし
- `weight` の合計 + `pickUp` の合計 = 1.0
  （`rarity3` の重み = `1 - 0.02 - 0.1 - 0.5 - 0.01 * PU数` なので PU 2件→0.36 / 3件→0.35 / 4件→0.34）
- 全 `pickUp[].name` が `assets/charactor.yaml` の `nameJa` に存在する
- `poolId` が `assets/gacha_pool.yaml` に存在する
- 全新IDについて main/header 画像が ja/en 両方揃っている（欠けているヘッダーは報告対象）

## 報告に必ず含める項目

- 移動・コピーしたファイル数と、ヘッダー流用の対応表
- **ヘッダーが用意できなかったID一覧**（初復刻のもの）
- 採用した `poolId` と、その根拠・確認依頼
- ユーザー指定・バナー画像・既存データの間の**表記ゆれ**と、どれを採用したか
- 既存データ由来の不整合を踏襲した箇所

## 注意点

- `nameJa` は表示専用でロジックには使われない（`src/components/SelectBannerModal`, `src/pages/gacha/simulator.tsx`）。表記ゆれがあっても動作は壊れないが、報告はする。
- `pickUp[].name` は `charactor.yaml` の `nameJa` と完全一致が必須。不一致だと `src/utils/yamlUtil.ts` の `generateGachaInfo` が実行時に throw する。
- バナー画像上の肩書きと `charactor.yaml` の名義が食い違うケースが既存データにある（例: バナー「ダウンタイムの帝王 アズモンド」/ データ「レペゼンラスト アズモンド」）。既存エントリの登録に合わせる。
