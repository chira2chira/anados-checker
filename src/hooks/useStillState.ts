import { useEffect, useState } from "react";
import type { StillState } from "@/pages/still/manager";
import { deserializeStill, parseLocalStorageStill } from "@/utils/charUtil";

const STILL_KEY = "still";

export default function useStillState() {
  const [stillStates, setStillStates] = useState<StillState[]>([]);

  const save = () => {
    window.localStorage.setItem(STILL_KEY, deserializeStill(stillStates));
  };

  useEffect(() => {
    // SSRを避けて取得する
    const storedStillValue = window.localStorage.getItem(STILL_KEY);
    if (storedStillValue) {
      setStillStates(parseLocalStorageStill(storedStillValue));
    }
  }, []);

  return { stillStates, setStillStates, save };
}
