# Anados Checker - Development Guide

このドキュメントは、Anados Checker プロジェクトの開発における規約とパターンをまとめたものです。

## プロジェクト概要

Anados（アナドス）は、スマートフォン向けゲームです。このプロジェクトは、キャラクターやスチル（イベントCG）のコレクション管理を支援するWebアプリケーションです。

- **技術スタック**: Next.js (Pages Router), TypeScript, Emotion (CSS-in-JS), Blueprint.js (UI)
- **多言語対応**: next-i18next を使用（日本語/英語）
- **データ形式**: YAML (マスターデータ)
- **状態管理**: React hooks + localStorage

## ディレクトリ構造

```
src/
├── pages/              # Next.js ページ (Pages Router)
│   ├── still/         # スチル関連ページ
│   └── ...
├── components/        # 再利用可能なコンポーネント
├── types/            # TypeScript 型定義
├── utils/            # ユーティリティ関数
├── hooks/            # カスタムフック
├── providers/        # Context Provider
└── styles/           # グローバルスタイル

public/
├── locales/          # 翻訳ファイル (ja/en)
│   ├── ja/
│   └── en/
└── static/           # 静的ファイル (画像等)
```

## コーディング規約

### 1. ページコンポーネント

**必須パターン**:
- `Container` コンポーネントでラップ
- `getStaticProps` でデータ取得と翻訳ロード
- 翻訳ネームスペース: `["common", "ページ固有"]`

```tsx
import { GetStaticProps, NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Container } from "@/components/Container";

type PageProps = {
  // props
};

const Page: NextPage<PageProps> = (props) => {
  return (
    <Container
      titleLink="/path/to/page"
      title={t("title")}
      description={t("description")}
    >
      {/* content */}
    </Container>
  );
};

export const getStaticProps: GetStaticProps<PageProps> = async (context) => {
  return {
    props: {
      ...(await serverSideTranslations(context.locale!, ["common", "page-namespace"])),
      // other props
    },
  };
};

export default Page;
```

### 2. モーダルコンポーネント

**必須パターン**:
- Blueprint の `Dialog` + `DialogBody` を使用
- `isOpen`, `onClose` を props で受け取る
- `onClosing` でクリーンアップが必要な場合は設定

```tsx
import { Dialog, DialogBody } from "@blueprintjs/core";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const Modal: React.FC<ModalProps> = (props) => {
  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      onClosing={() => {/* cleanup */}}
      title="タイトル"
    >
      <DialogBody>
        {/* content */}
      </DialogBody>
    </Dialog>
  );
};
```

**参考実装**:
- `/src/components/StillRouletteModal/index.tsx`
- `/src/components/CustomLabelModal/index.tsx`
- `/src/components/NineStillsSelectModal/index.tsx`

### 3. スタイリング

**Emotion を使用**:
- `css` テンプレートタグで定義
- コンポーネント外で定義する場合は `const xxxStyle = css` で命名
- レスポンシブは `@media (max-width: 992px)` を基準

```tsx
import { css } from "@emotion/react";

const containerStyle = css`
  display: flex;
  gap: 10px;

  @media (max-width: 992px) {
    flex-direction: column;
  }
`;

const Component = () => (
  <div css={containerStyle}>
    {/* content */}
  </div>
);
```

### 4. 画像の扱い

**必ず `getImageUrl()` を使用**:
```tsx
import { getImageUrl } from "@/utils/image.ts";

// スチル画像
<img src={getImageUrl("still/" + still.image)} />

// キャラクター画像
<img src={getImageUrl("char/" + char.image)} />

// 共通画像
<img src={getImageUrl("common/star.png")} />
```

**Canvas での画像使用時**:
```tsx
const img = new Image();
img.crossOrigin = "anonymous"; // CORS対策（必須）
img.src = getImageUrl("still/" + still.image);
```

### 5. 翻訳 (i18n)

**翻訳ファイルの配置**:
- `/public/locales/ja/[namespace].json`
- `/public/locales/en/[namespace].json`

**使用方法**:
```tsx
import { useTranslation } from "next-i18next";

const Component = () => {
  const { t } = useTranslation("namespace");
  const { t: t2 } = useTranslation("another-namespace");

  return <div>{t("key.path")}</div>;
};
```

**ネームスペースの使い分け**:
- `common`: 共通UI (ボタン、フィルター等)
- ページ固有: そのページでのみ使う文言

### 6. トースト通知

**TopToaster を使用**:
```tsx
import { TopToaster } from "@/utils/toast";

TopToaster?.then((toaster) =>
  toaster.show({
    intent: "success", // "success" | "warning" | "danger" | "primary"
    message: "メッセージ",
  })
);
```

### 7. データ取得

**スチルマスターデータ**:
```tsx
import { loadStillMaster } from "@/utils/yamlUtil";

const { charInfoWithStills } = loadStillMaster();
```

## 型定義

### 主要な型

**キャラクター関連** (`/src/types/unit.ts`):
- `CharInfo`: キャラクター基本情報
- `CharInfoWithStill`: スチル情報を含むキャラクター
- `CharClass`: 職業タイプ

**スチル関連** (`/src/types/still.ts`):
- `StillInfo`: スチル情報
- `StillState`: スチル状態（既読/レート）

## よく使うパターン

### Canvas で画像を合成

```tsx
const generateImage = async (): Promise<Blob | null> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = 900;
  canvas.height = 520;

  // 背景描画
  ctx.fillStyle = "#1c2127";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 画像読み込みと描画
  const promises = images.map(async (imageData, index) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = getImageUrl("still/" + imageData.image);
    });

    ctx.drawImage(img, x, y, width, height);
  });

  await Promise.all(promises);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
};
```

### 画像ダウンロード

```tsx
const handleDownload = () => {
  if (!imageUrl) return;

  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = `filename-${Date.now()}.png`;
  link.click();
};
```

### メモリ管理（Blob URL）

```tsx
// URL生成
const url = URL.createObjectURL(blob);
setImageUrl(url);

// 古いURLの解放
if (oldImageUrl) {
  URL.revokeObjectURL(oldImageUrl);
}
```

### レアリティ別グルーピング

```tsx
const groupedByRarity = [7, 6, 5, 4, 3, 2, 1, 0].map((rarity) => ({
  rarity,
  chars: charInfoWithStills.filter((x) => x.rarity === rarity),
}));
```

### レアリティ表示（星）

```tsx
{rarity === 0
  ? "☆"
  : [...Array(rarity)].map((_, i) => (
      <img
        key={i}
        src={getImageUrl("common/star.png")}
        alt="star"
        width="15px"
        height="15px"
      />
    ))}
```

## 参考実装

新しい機能を追加する際は、以下のファイルを参考にしてください：

### ページ実装
- **スチル管理**: `/src/pages/still/manager.tsx`
  - フィルター機能、状態管理、一括操作
- **9スチル合成**: `/src/pages/still/nine-stills.tsx`
  - Canvas画像生成、グリッドレイアウト

### コンポーネント実装
- **モーダル**: `/src/components/StillRouletteModal/index.tsx`
  - 画像プリロード、アニメーション
- **選択モーダル**: `/src/components/NineStillsSelectModal/index.tsx`
  - レアリティグルーピング、選択状態の管理
- **リスト表示**: `/src/components/CharacterAndStillList/index.tsx`
  - キャラクター + スチル表示パターン

## 禁止事項

### やってはいけないこと

1. **絶対にEmoji（絵文字）を使わない**
   - コード内、コメント、翻訳ファイルすべてにおいて禁止
   - 星マーク（☆）などの記号はOK

2. **画像読み込みでCORS対策を忘れない**
   - Canvas使用時は必ず `img.crossOrigin = "anonymous"` を設定

3. **Blob URLのメモリリーク**
   - `URL.createObjectURL()` で作成したURLは必ず `URL.revokeObjectURL()` で解放

4. **翻訳の漏れ**
   - 日本語と英語両方の翻訳ファイルを必ず作成

5. **型の any 使用**
   - 極力避け、適切な型定義を使用

## 開発フロー

1. **機能設計**: 既存パターンを確認
2. **型定義**: 必要に応じて `/src/types/` に追加
3. **翻訳ファイル**: ja/en 両方作成
4. **コンポーネント作成**: 再利用可能性を考慮
5. **ページ作成**: `Container` + `getStaticProps` パターン
6. **スタイリング**: Emotion でレスポンシブ対応
7. **動作確認**: `npm run dev` でローカル確認

## 便利なコマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番起動
npm start

# 型チェック
npx tsc --noEmit
```

## まとめ

- **既存パターンを踏襲**: 新機能は既存実装を参考に
- **型安全**: TypeScript の型を最大限活用
- **多言語対応**: 常に ja/en 両方を意識
- **メモリ管理**: Blob URL などのリソースは適切に解放
- **レスポンシブ**: モバイルでの表示も考慮
