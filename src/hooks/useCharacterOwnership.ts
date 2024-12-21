import { useEffect, useState } from "react";
import { parseLocalStorageChar } from "@/utils/charUtil";

const CHAR_KEY = "chars";

export default function useCharacterOwnership() {
  const [owned, setOwned] = useState<number[]>([]);

  const save = () => {
    window.localStorage.setItem(CHAR_KEY, owned.join(","));
  };

  useEffect(() => {
    // SSRを避けて取得する
    const storedCharValue = window.localStorage.getItem(CHAR_KEY);
    if (storedCharValue) {
      setOwned(parseLocalStorageChar(storedCharValue));
    }
  }, []);

  return { owned, setOwned, save };
}
