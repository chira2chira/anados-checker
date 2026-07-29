import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * react-lazyload の置き換え。
 * scroll/resize イベントで getBoundingClientRect を回す方式ではなく、
 * IntersectionObserver を全インスタンスで共有して判定する。
 *
 * - 表示済みになった要素は監視解除し、以後一切再評価しない
 * - スクロールコンテナ内(overflow)の判定はブラウザ側で行われるため overflow 指定は不要
 * - フィルタ等でレイアウトが変わった場合もブラウザが自動で再判定するため forceCheck は不要
 */

type LazyLoadProps = {
  children: React.ReactNode;
  /** 未表示時に確保するプレースホルダーの高さ */
  height: number | string;
  /** ビューポートから何px手前で表示を開始するか */
  offset?: number;
  className?: string;
};

const callbacks = new WeakMap<Element, () => void>();
const observers = new Map<number, IntersectionObserver>();

function getObserver(offset: number) {
  const cached = observers.get(offset);
  if (cached) return cached;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const callback = callbacks.get(entry.target);
        if (!callback) continue;

        // 1度表示したら監視対象から外す
        callbacks.delete(entry.target);
        observer.unobserve(entry.target);
        callback();
      }
    },
    { rootMargin: `${offset}px` },
  );
  observers.set(offset, observer);
  return observer;
}

// IntersectionObserverの有無はレンダー中に直接見るとSSRと不一致になるため、
// 外部ストアとして購読しサーバ側は「対応あり(=プレースホルダーを描画)」とみなす
const subscribeNever = () => () => {};
const getSupported = () => typeof IntersectionObserver !== "undefined";
const getSupportedOnServer = () => true;

const LazyLoad: React.FC<LazyLoadProps> = (props) => {
  const { offset = 0 } = props;
  const [visible, setVisible] = useState(false);
  const placeholder = useRef<HTMLDivElement>(null);
  const supported = useSyncExternalStore(
    subscribeNever,
    getSupported,
    getSupportedOnServer,
  );

  useEffect(() => {
    if (visible || !supported) return;

    const element = placeholder.current;
    if (!element) return;

    const observer = getObserver(offset);
    callbacks.set(element, () => setVisible(true));
    observer.observe(element);

    return () => {
      callbacks.delete(element);
      observer.unobserve(element);
    };
  }, [visible, supported, offset]);

  // 非対応環境ではLazyLoadせずそのまま表示する
  if (visible || !supported) return <>{props.children}</>;

  return (
    <div
      ref={placeholder}
      className={props.className}
      style={{ height: props.height }}
    />
  );
};

export default LazyLoad;
