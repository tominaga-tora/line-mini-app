import { useEffect, useState } from "react";
import liff from "@line/liff";
import "./App.css";
import ScrollActionGame from "./components/ScrollActionGame";
import { useAtom } from "jotai";
import { isLiffBrowserAtom } from "./shared/atoms/atoms";

function App() {
  const [name, setName] = useState("");
  const liffId = import.meta.env.VITE_LIFF_ID;
  const [isLiffBrowser, setIsLiffBrowser] = useAtom(isLiffBrowserAtom);

  useEffect(() => {
    // Check if LIFF is in client
    const inClient = liff.isInClient();
    setIsLiffBrowser(inClient);

    if (!inClient) {
      console.warn("LIFFアプリ内で動作させてください。");
      return;
    }

    console.log("test liffId", liffId);
    if (!liffId) {
      console.error("LIFF ID が設定されていません。");
      return;
    } else {
      liff.init({ liffId })
        .then(() => {
          console.log("LIFF 初期化成功");
          return liff.getProfile();
        })
        .then((profile) => {
          setName(profile.displayName);
        })
        .catch((error) => {
          console.error("LIFF 初期化エラー:", liffId);
          console.error("LIFF 初期化エラー:", error.message);
        });
    }
  }, [liffId, setIsLiffBrowser]);

  return (
    <div className="App">
      {name && <p>こんにちは、{name}さん</p>}
      <ScrollActionGame></ScrollActionGame>
    </div>
  );
}

export default App;
