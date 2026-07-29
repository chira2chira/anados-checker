import { useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import useCharacterOwnership from "./useCharacterOwnership";
import useEidosOwnership from "./useEidosOwnership";
import { parseLocalStorageChar } from "@/utils/charUtil";
import { useLocalStorageRaw } from "@/utils/localStorageStore";
import { TEMP_CHAR_KEY } from "@/pages/share/char/[id]";

type OwnState = {
  char: number[];
  eidos: number[];
};

export default function useCharacterAndEidosOwnership() {
  const {
    owned: charOwned,
    setOwned: setCharOwned,
    save: saveChar,
  } = useCharacterOwnership();
  const {
    owned: eidosOwned,
    setOwned: setEidosOwned,
    save: saveEidos,
  } = useEidosOwnership();
  const { asPath } = useRouter();
  // 共有URLの閲覧中かはパスから直接導出できる
  const tmpMode = asPath.startsWith("/share/char/");
  const tmpRaw = useLocalStorageRaw(TEMP_CHAR_KEY);

  const tmpOwned = useMemo<OwnState>(
    () => ({
      char: tmpRaw ? parseLocalStorageChar(tmpRaw) : [],
      eidos: [],
    }),
    [tmpRaw],
  );

  const owned = useMemo<OwnState>(
    () => (tmpMode ? tmpOwned : { char: charOwned, eidos: eidosOwned }),
    [tmpMode, tmpOwned, charOwned, eidosOwned],
  );

  const setOwned = useCallback(
    (setStateAction: (state: OwnState) => OwnState) => {
      if (tmpMode) return;
      setCharOwned((char) => setStateAction({ char, eidos: [] }).char);
      setEidosOwned((eidos) => setStateAction({ char: [], eidos }).eidos);
    },
    [setCharOwned, setEidosOwned, tmpMode],
  );

  const save = () => {
    if (tmpMode) {
      saveChar(tmpOwned.char);
    } else {
      saveChar();
      saveEidos();
    }
  };

  return { owned, setOwned, setCharOwned, setEidosOwned, save, tmpMode };
}
