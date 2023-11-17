import yaml from "js-yaml";
import fs from "fs";
import { useCallback } from "react";

export function useYaml(path: string) {
  const obj = useCallback(() => {
    yaml.load(fs.readFileSync(path, "utf-8"));
  }, [path]);
  console.log(obj);
}
