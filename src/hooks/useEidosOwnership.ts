import { useEffect, useState } from "react";
import { parseLocalStorageEidos } from "@/utils/charUtil";

const EIDOS_KEY = "eidos";

export default function useEidosOwnership() {
  const [owned, setOwned] = useState<number[]>([]);

  const save = () => {
    window.localStorage.setItem(EIDOS_KEY, owned.join(","));
  };

  useEffect(() => {
    // SSRを避けて取得する
    const storedCharValue = window.localStorage.getItem(EIDOS_KEY);
    if (storedCharValue) {
      setOwned(parseLocalStorageEidos(storedCharValue));
    }
  }, []);

  return { owned, setOwned, save };
}
