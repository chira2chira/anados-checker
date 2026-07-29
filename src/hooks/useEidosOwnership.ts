import { parseLocalStorageEidos } from "@/utils/charUtil";
import { useLocalStorageDraft } from "@/utils/localStorageStore";

const EIDOS_KEY = "eidos";

function parse(raw: string | null) {
  return raw ? parseLocalStorageEidos(raw) : [];
}

function serialize(owned: number[]) {
  return owned.join(",");
}

export default function useEidosOwnership() {
  const {
    value: owned,
    setValue: setOwned,
    save,
  } = useLocalStorageDraft(EIDOS_KEY, parse, serialize);

  return { owned, setOwned, save };
}
