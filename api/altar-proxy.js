import https from "https";

export default async function handler(req, res) {
  const altarUrl = "https://aicc-freedom.altar.com.pl/accinterface/extsrvrest/outbound/loadrecord";
  const authHeader = "Basic " + Buffer.from("admin:altar123").toString("base64");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Agent HTTPS z pełnym wsparciem TLSv1.2 i wyłączoną walidacją certów (częsty problem z ACC)
    const agent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
      minVersion: "TLSv1.2",
    });

    // Generowanie pseudo Postman-Token
    const postmanToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const response = await fetch(altarUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "User-Agent": "PostmanRuntime/7.49.1",
        "Accept": "*/*",
        "Postman-Token": postmanToken,
        "Host": "aicc-freedom.altar.com.pl",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
      agent,
    });

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    console.error("❌ Błąd połączenia z ACC:", err);
    res.status(500).json({ error: "ACC connection failed", details: err.message });
  }
}
