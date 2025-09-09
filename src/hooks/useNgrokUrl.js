import { useState, useEffect } from "react";

export function useNgrokUrl(loja = "Mimos") {
  const [ngrokUrl, setNgrokUrl] = useState(null);

  useEffect(() => {
    async function fetchNgrok() {
      try {
        const res = await fetch("https://api.jsonbin.io/v3/b/68a2e0a5d0ea881f405c44d8", {
          headers: {
            "X-Master-Key": "$2a$10$RKrrtUJtw.UpRgJQAwsUyOElRGt4k7eDAUxluSs2g2cSmwhx1UIhW",
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);

        const json = await res.json();

        // 🔹 compatível com os 2 formatos possíveis do bin
        if (json?.record?.ngrok) {
          setNgrokUrl(json.record.ngrok);
        } else if (json?.record?.lojas?.[loja]) {
          setNgrokUrl(json.record.lojas[loja].url);
        } else {
          console.error("Formato inesperado no JSONBin:", json);
        }
      } catch (err) {
        console.error("Erro ao buscar ngrok:", err);
      }
    }

    fetchNgrok();
    const interval = setInterval(fetchNgrok, 30000);
    return () => clearInterval(interval);
  }, [loja]);

  return ngrokUrl;
}
