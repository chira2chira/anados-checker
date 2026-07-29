import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

/**
 * localStorage を「外部ストア」として useSyncExternalStore で購読する仕組み。
 *
 * マウント後の useEffect で localStorage を読んで setState する従来の書き方は、
 * SSRとの不一致は避けられるものの「描画 -> setState -> 再描画」の連鎖を生む。
 * getServerSnapshot が常に null を返すことで SSR とハイドレーション初回描画を一致させ、
 * ハイドレーション完了後は React がストアの値へ切り替える。
 */

const listeners = new Map<string, Set<() => void>>();

function notify(key: string) {
  const keyListeners = listeners.get(key);
  if (!keyListeners) return;
  for (const listener of Array.from(keyListeners)) listener();
}

function subscribe(key: string, listener: () => void) {
  const existing = listeners.get(key);
  const keyListeners = existing ?? new Set<() => void>();
  if (!existing) listeners.set(key, keyListeners);
  keyListeners.add(listener);

  return () => {
    keyListeners.delete(listener);
    if (keyListeners.size === 0) listeners.delete(key);
  };
}

if (typeof window !== "undefined") {
  // storageイベントは他タブでの書き込みのみ発火する
  window.addEventListener("storage", (e) => {
    if (e.key === null) {
      // localStorage.clear()の場合は全キーに通知する
      for (const key of Array.from(listeners.keys())) notify(key);
    } else {
      notify(e.key);
    }
  });
}

/** localStorageへ書き込み、同一タブの購読者へ通知する */
export function writeLocalStorage(key: string, value: string) {
  window.localStorage.setItem(key, value);
  notify(key);
}

const getServerSnapshot = () => null;

/** localStorageの生文字列を購読する(SSR・ハイドレーション時はnull) */
export function useLocalStorageRaw(key: string) {
  const subscribeKey = useCallback(
    (listener: () => void) => subscribe(key, listener),
    [key],
  );
  const getSnapshot = useCallback(
    () => window.localStorage.getItem(key),
    [key],
  );

  return useSyncExternalStore(subscribeKey, getSnapshot, getServerSnapshot);
}

/**
 * localStorageの値をベースに編集可能な状態を持ち、save()で明示的に永続化する。
 *
 * 未編集の間はストアの値をそのまま返すため、ハイドレーション後の読み込みが自動で反映される。
 * 一度編集するとドラフトが優先されるので、編集中に読み込み結果で上書きされることはない。
 *
 * @param parse 生文字列(未保存はnull)から値へ変換する関数。毎回同じ参照を渡すこと
 * @param serialize 値を保存用の文字列へ変換する関数。毎回同じ参照を渡すこと
 */
export function useLocalStorageDraft<T>(
  key: string,
  parse: (raw: string | null) => T,
  serialize: (value: T) => string,
): {
  value: T;
  setValue: Dispatch<SetStateAction<T>>;
  save: (next?: T) => void;
} {
  const raw = useLocalStorageRaw(key);
  const persisted = useMemo(() => parse(raw), [parse, raw]);
  const [draft, setDraft] = useState<{ value: T } | null>(null);
  const value = draft ? draft.value : persisted;

  const setValue = useCallback(
    (action: SetStateAction<T>) => {
      setDraft((prev) => ({
        value:
          typeof action === "function"
            ? (action as (prev: T) => T)(prev ? prev.value : persisted)
            : action,
      }));
    },
    [persisted],
  );

  const save = useCallback(
    (next?: T) => {
      if (next !== undefined) setValue(next);
      writeLocalStorage(key, serialize(next === undefined ? value : next));
    },
    [key, serialize, setValue, value],
  );

  return { value, setValue, save };
}
