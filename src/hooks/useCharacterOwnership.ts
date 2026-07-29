import { parseLocalStorageChar } from "@/utils/charUtil";
import { useLocalStorageDraft } from "@/utils/localStorageStore";

const CHAR_KEY = "chars";

function parse(raw: string | null) {
  return raw ? parseLocalStorageChar(raw) : [];
}

function serialize(owned: number[]) {
  return owned.join(",");
}

export default function useCharacterOwnership() {
  const {
    value: owned,
    setValue: setOwned,
    save,
  } = useLocalStorageDraft(CHAR_KEY, parse, serialize);

  return { owned, setOwned, save };
}
