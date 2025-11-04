import express from "express";
import fetch from "node-fetch";
import fs from "fs";

const app = express();

// 📦 Middleware do parsowania JSON
app.use(express.json({ limit: "1mb", type: "application/json" }));

// 🔧 Pomocnicza funkcja do logowania (na konsolę i do pliku)
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  console.log(logLine);
  fs.appendFileSync("logs.txt", logLine);
}

// 🧠 Główny endpoint do przyjmowania leadów z MAKE
app.post("/altar", async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 8).toUpperCase();
  logToFile(`🟢 [${requestId}] Otrzymano zapytanie z MAKE: ${JSON.stringify(req.body)}`);

  try {
    // Walidacja podstawowa (czy przyszły wymagane pola)
    if (!req.body || !req.body.params || !Array.isArray(req.body.params)) {
      logToFile(`🔴 [${requestId}] Błąd walidacji — brak params`);
      return res.status(400).json({ error: "Brak params w body" });
    }

    // Przekazanie do ACC
    const response = await fetch(
      "https://aicc-freedom.altar.com.pl/accinterface/extsrvrest/outbound/loadrecord",
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": "Basic " + Buffer.from("admin:altar123").toString("base64"),
        },
        body: JSON.stringify(req.body),
      }
    );

    const rawText = await response.text();
    const logPrefix = `[${requestId}] [ACC ${response.status}]`;

    if (!response.ok) {
      logToFile(`🟠 ${logPrefix} Błąd odpowiedzi z ACC: ${rawText}`);
      return res.status(response.status).send({
        error: "Błąd po stronie ACC",
        status: response.status,
        response: rawText,
      });
    }

    logToFile(`✅ ${logPrefix} Sukces: ${rawText}`);
    return res.status(200).send(rawText || { status: "OK" });
  } catch (err) {
    logToFile(`❌ [${requestId}] Wyjątek: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// 🌐 Endpoint testowy (GET /)
app.get("/", (req, res) => {
  res.send("✅ Altar Proxy działa! Wyślij POST /altar żeby przetestować połączenie z ACC.");
});

// 🖥️ Nasłuchiwanie portu Render
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logToFile(`🚀 Altar Proxy uruchomiony na porcie ${PORT}`);
});
