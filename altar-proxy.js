import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 8080;

// przyjmujemy tekst, żeby mieć kontrolę nad logami
app.use(express.text({ type: "*/*" }));

app.post("/altar", async (req, res) => {
  console.log("🟢 Otrzymano zapytanie z MAKE!");
  console.log("RAW BODY:", req.body);

  let jsonBody;
  try {
    jsonBody = JSON.parse(req.body.trim());
    console.log("✅ Sparsowany JSON:", jsonBody);
  } catch (err) {
    console.error("⚠️ Błąd parsowania JSON:", err.message);
    return res.status(400).json({
      error: "Invalid JSON",
      details: err.message,
    });
  }

  const altarUrl =
    "https://aicc-freedom.altar.com.pl/accinterface/extsrvrest/outbound/loadrecord";

  const headers = {
    "Content-Type": "application/json",
    Authorization: "Basic " + Buffer.from("admin:altar123").toString("base64"),
  };

  console.log("📤 Wysyłanie danych do ACC...");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // ⏱️ 8 sekund timeout

    const response = await fetch(altarUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(jsonBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await response.text();
    console.log("📩 Odpowiedź ACC:", text);

    res.status(response.status).send(text || "OK");
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("⏱️ Timeout: ACC nie odpowiedział w 8 sekund.");
      res
        .status(504)
        .json({ error: "ACC timeout", message: "Brak odpowiedzi w 8s" });
    } else {
      console.error("❌ Błąd połączenia z ACC:", err.message);
      res
        .status(500)
        .json({ error: "ACC request failed", details: err.message });
    }
  }
});

app.get("/", (req, res) => {
  res.send("✅ Altar Proxy działa (POST /altar do wysyłki leadów).");
});

app.listen(PORT, () =>
  console.log(`🚀 Proxy działa na porcie ${PORT}, gotowe na Make.`)
);
