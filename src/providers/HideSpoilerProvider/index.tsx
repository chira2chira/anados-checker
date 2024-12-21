import React, { useEffect, useState } from "react";

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
  const [hideSpoiler, _setHideSpoiler] = useState(true);

  const setHideSpoiler = (newValue: boolean) => {
    _setHideSpoiler(newValue);
    window.localStorage.setItem(SPOILER_KEY, newValue + "");
  };

  useEffect(() => {
    // SSRを避けて取得する
    const storedValue = window.localStorage.getItem(SPOILER_KEY);
    if (storedValue) {
      _setHideSpoiler(storedValue === "false" ? false : true);
    }
  }, []);

  return (
    <HideSpoilerContext.Provider value={{ hideSpoiler, setHideSpoiler }}>
      {props.children}
    </HideSpoilerContext.Provider>
  );
};

export default HideSpoilerProvider;
