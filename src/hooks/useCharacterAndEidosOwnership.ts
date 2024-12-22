import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import useCharacterOwnership from "./useCharacterOwnership";
import useEidosOwnership from "./useEidosOwnership";
import { parseLocalStorageChar } from "@/utils/charUtil";
import { TEMP_CHAR_KEY } from "@/pages/share/char/[id]";

type OwnState = {
  char: number[];
  eidos: number[];
};

export default function useCharacterAndEidosOwnership() {
  const [tmpMode, setTmpMode] = useState(false);
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
  const [tmpOwned, setTmpOwned] = useState<OwnState>({ char: [], eidos: [] });
  const owned: OwnState = tmpMode
    ? tmpOwned
    : { char: charOwned, eidos: eidosOwned };
  const { asPath } = useRouter();

  const setOwned = useCallback(
    (setStateAction: (state: OwnState) => OwnState) => {
      if (tmpMode) return;
      setCharOwned((char) => setStateAction({ char, eidos: [] }).char);
      setEidosOwned((eidos) => setStateAction({ char: [], eidos }).eidos);
    },
    [setCharOwned, setEidosOwned, tmpMode]
  );

  const save = () => {
    if (tmpMode) {
      saveChar(tmpOwned.char);
    } else {
      saveChar();
      saveEidos();
    }
  };

  useEffect(() => {
    // SSRを避けて取得する
    if (asPath.startsWith("/share/char/")) {
      setTmpMode(true);
      const tempStoredValue = window.localStorage.getItem(TEMP_CHAR_KEY);
      if (tempStoredValue)
        setTmpOwned({
          char: parseLocalStorageChar(tempStoredValue),
          eidos: [],
        });
    } else {
      setTmpMode(false);
    }
  }, [asPath]);

  return { owned, setOwned, setCharOwned, setEidosOwned, save, tmpMode };
}
