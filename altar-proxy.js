import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ Tymczasowo odbieramy surowe dane jako tekst (żeby zobaczyć co przychodzi z MAKE)
app.use(express.text({ type: "*/*" }));

// 🔹 Endpoint do odbierania leadów z Make
app.post("/altar", async (req, res) => {
  console.log("🟢 Otrzymano zapytanie z MAKE!");
  console.log("RAW BODY:", req.body);

  // Próba sparsowania JSON
  let jsonBody;
  try {
    jsonBody = JSON.parse(req.body);
    console.log("✅ Sparsowany JSON:", jsonBody);
  } catch (err) {
    console.error("⚠️ Błąd parsowania JSON:", err.message);
    return res.status(400).json({
      error: "Invalid JSON format w request body",
      details: err.message,
    });
  }

  // 🔹 Przygotowanie danych do ACC
  const altarUrl =
    "https://aicc-freedom.altar.com.pl/accinterface/extsrvrest/outbound/loadrecord";

  const payload = JSON.stringify(jsonBody);

  // 🔹 Przygotowanie nagłówków z autoryzacją Basic
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Basic " + Buffer.from("admin:altar123").toString("base64"),
  };

  try {
    console.log("📤 Wysyłanie danych do ACC...");
    const response = await fetch(altarUrl, {
      method: "POST",
      headers,
      body: payload,
    });

    const text = await response.text();
    console.log("📩 Odpowiedź ACC:", text);

    res
      .status(response.status)
      .send(text || { status: response.status, message: "Brak treści" });
  } catch (err) {
    console.error("❌ Błąd połączenia z ACC:", err.message);
    res.status(500).json({ error: "ACC request failed", details: err.message });
  }
});

// 🔹 Testowy endpoint GET — żeby sprawdzić, czy Render działa
app.get("/", (req, res) => {
  res.send("✅ Altar Proxy działa. Użyj POST /altar żeby przesłać lead.");
});

// Start serwera
app.listen(PORT, () =>
  console.log(`🚀 Altar Proxy działa na porcie ${PORT}`)
);
