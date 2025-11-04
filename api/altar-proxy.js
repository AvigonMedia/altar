export default async function handler(req, res) {
  const altarUrl = "https://aicc-freedom.altar.com.pl/accinterface/extsrvrest/outbound/loadrecord";
  const authHeader = "Basic " + Buffer.from("admin:altar123").toString("base64");

  if (req.method === "POST") {
    try {
      const response = await fetch(altarUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify(req.body),
      });

      const text = await response.text(); // ACC często zwraca tekst, nie JSON
      res.status(200).send(text);
    } catch (err) {
      console.error("❌ Błąd połączenia z ACC:", err);
      res.status(500).json({ error: "ACC connection failed", details: err.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed. Use POST." });
  }
}
