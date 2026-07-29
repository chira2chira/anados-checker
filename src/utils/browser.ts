export function isIos() {
  return /ipod|ipad|iphone|macintosh/i.test(navigator.userAgent);
}

/**
 * ブラウザが次のフレームを描画し終えるまで待つ。
 * setStateの直後に重い同期処理を始めるとローディング表示が描画されないため、
 * 処理を開始する前にこれを挟んで描画の機会を与える。
 * 1回目のrAFは描画直前に呼ばれるため、描画完了を待つには2回連続で挟む必要がある。
 */
export function waitForPaint() {
  return new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}
