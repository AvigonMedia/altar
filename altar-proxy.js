import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 8080;

// przyjmujemy tekst, żeby mieć pełną kontrolę nad logami
app.use(express.text({ type: "*/*" }));

// Funkcja wysyłająca zapytanie do ACC z retry logic
async function sendToAccWithRetry(url, options, retries = 0) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // ⏱️ 60 sekund timeout

    const response = await fetch(url, { ...options, signal: controller.signal });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`ACC returned error: ${response.statusText}`);
    }

    return await response.text(); // Odpowiedź z ACC
  } catch (err) {
    if (retries < 5) {  // Zwiększamy retry do 5 prób
      console.warn(`⏳ Próba ${retries + 1} nie powiodła się, ponawiamy...`);
      return new Promise((resolve) =>
        setTimeout(() => resolve(sendToAccWithRetry(url, options, retries + 1)), 10000) // Retry co 10s
      );
    } else {
      throw new Error(`⏱️ Próby nie powiodły się po ${5} próbach: ${err.message}`);
    }
  }
}

// Endpoint do odbierania leadów z MAKE
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
    const responseText = await sendToAccWithRetry(altarUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(jsonBody),
    });

    console.log("📩 Odpowiedź ACC:", responseText);
    res.status(200).send(responseText);
  } catch (err) {
    console.error("❌ Błąd połączenia z ACC:", err.message);
    res.status(504).json({ error: "ACC timeout", details: err.message });
  }
});

// Endpoint testowy
app.get("/", (req, res) => {
  res.send("✅ Altar Proxy działa (POST /altar do wysyłki leadów).");
});

// Uruchomienie serwera
app.listen(PORT, () =>
  console.log(`🚀 Proxy działa na porcie ${PORT}, gotowe na Make.`)
);
