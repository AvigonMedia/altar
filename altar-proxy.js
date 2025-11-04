import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/altar", async (req, res) => {
  try {
    const response = await fetch("https://aicc-freedom.altar.com.pl/accinterface/extsrvrest/outbound/loadrecord", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from("admin:altar123").toString("base64")
      },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();
    res.status(response.status).type("application/json").send(text);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e.message });
  }
});

app.listen(8080, () => console.log("🚀 Altar proxy running on port 8080"));
