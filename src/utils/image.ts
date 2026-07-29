export function getImageUrl(path: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const sanitizedPath = path.startsWith("/") ? path.slice(1) : path;
  return isProd
    ? `https://anados-collection-tracker.b-cdn.net/static/image/${sanitizedPath}`
    : `/static/image/${sanitizedPath}`;
}

/**
 * data URLをBlobに変換する。
 * Safariはサイズの大きいdata URLをダウンロードできないため、Blob URL経由にする必要がある。
 * ユーザー操作のコンテキストを失わないよう、fetchではなく同期処理で変換する。
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeType = header.match(/data:([^;]+)/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * data URLまたはBlobを名前付きでダウンロードする。
 * Safari対策としてBlob URLを使い、aタグをDOMに追加してからクリックする。
 */
export function downloadImage(source: string | Blob, fileName: string) {
  const blob = typeof source === "string" ? dataUrlToBlob(source) : source;
  const objectUrl = URL.createObjectURL(blob);

  const aElm = document.createElement("a");
  aElm.href = objectUrl;
  aElm.download = fileName;
  aElm.rel = "noopener";
  aElm.style.display = "none";
  document.body.appendChild(aElm);
  aElm.click();
  document.body.removeChild(aElm);

  // 即座にrevokeするとSafariでダウンロードが失敗するため遅延させる
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60 * 1000);
}
