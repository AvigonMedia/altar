import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 8080;

// Przyjmujemy tekst, aby mieć pełną kontrolę
app.use(express.text({ type: "*/*" }));

// Testowy endpoint do sprawdzenia połączenia Render → ACC
app.get("/test", async (req, res) => {
  const altarUrl =
    "https://aicc-freedom.altar.com.pl/accinterface/extsrvrest/outbound/loadrecord";

  try {
    const response = await fetch(altarUrl, {
      method: "GET",
      headers: {
        "Authorization": "Basic " + Buffer.from("admin:altar123").toString("base64"),
      },
    });

    if (!response.ok) {
      throw new Error(`ACC returned error: ${response.statusText}`);
    }

    const data = await response.text();
    res.status(200).send(data); // Zwraca odpowiedź z ACC
  } catch (err) {
    console.error("Błąd podczas testowania połączenia z ACC:", err.message);
    res.status(500).send({ error: "ACC połączenie nie działa", details: err.message });
  }
});

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
    const response = await fetch(altarUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(jsonBody),
    });

    const text = await response.text();
    console.log("📩 Odpowiedź ACC:", text);

    res.status(response.status).send(text || "OK");
  } catch (err) {
    console.error("❌ Błąd połączenia z ACC:", err.message);
    res.status(500).json({ error: "ACC request failed", details: err.message });
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
