import type { StillState } from "@/types/still";
import { deserializeStill, parseLocalStorageStill } from "@/utils/charUtil";
import { useLocalStorageDraft } from "@/utils/localStorageStore";

const STILL_KEY = "still";

function parse(raw: string | null): StillState[] {
  return raw ? parseLocalStorageStill(raw) : [];
}

export default function useStillState() {
  const {
    value: stillStates,
    setValue: setStillStates,
    save,
  } = useLocalStorageDraft(STILL_KEY, parse, deserializeStill);

  return { stillStates, setStillStates, save };
}
