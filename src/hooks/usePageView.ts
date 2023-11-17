import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { sendPageview } from "../utils/gtag";

export default function usePageView(currentPath: string) {
  const router = useRouter();
  const [prevPath, setPrevPath] = useState(currentPath);

  const handleRouteChange = useCallback(
    (path: string) => {
      if (prevPath !== path) {
        sendPageview(path);
        setPrevPath(path);
      }
    },
    [prevPath]
  );

  useEffect(() => {
    // 初回のみ呼ぶ
    sendPageview(currentPath);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [handleRouteChange, router.events]);
}
