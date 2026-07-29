import React, { useCallback, useMemo } from "react";
import {
  useLocalStorageRaw,
  writeLocalStorage,
} from "@/utils/localStorageStore";

const SPOILER_KEY = "hidespoiler";

type HideSpoilerProviderProps = {
  children?: React.ReactNode;
};

type HideSpoilerContextProps = {
  hideSpoiler: boolean;
  setHideSpoiler: (hideSpoiler: boolean) => void;
};

export const HideSpoilerContext = React.createContext<HideSpoilerContextProps>(
  {} as HideSpoilerContextProps
);

const HideSpoilerProvider: React.FC<HideSpoilerProviderProps> = (props) => {
  // 保存値をそのまま参照するため、ローカルstateは持たない
  const raw = useLocalStorageRaw(SPOILER_KEY);
  const hideSpoiler = raw === null ? true : raw !== "false";

  const setHideSpoiler = useCallback((newValue: boolean) => {
    writeLocalStorage(SPOILER_KEY, newValue + "");
  }, []);

  const value = useMemo(
    () => ({ hideSpoiler, setHideSpoiler }),
    [hideSpoiler, setHideSpoiler]
  );

  return (
    <HideSpoilerContext.Provider value={value}>
      {props.children}
    </HideSpoilerContext.Provider>
  );
};

export default HideSpoilerProvider;
