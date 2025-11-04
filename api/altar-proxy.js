import fetch from 'node-fetch';
import { json } from '@vercel/node';

export default async function handler(req, res) {
  // Endpoint do ACC API
  const altarUrl = 'https://aicc-freedom.altar.com.pl/accinterface/extsrvrest/outbound/loadrecord';

  // Basic Auth Header
  const authHeader = 'Basic ' + Buffer.from('admin:altar123').toString('base64');

  if (req.method === 'POST') {
    try {
      // Wysyłanie danych do ACC
      const response = await fetch(altarUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(req.body),
      });

      const result = await response.json();
      res.status(200).json(result);
    } catch (error) {
      console.error('Błąd przy połączeniu z ACC:', error);
      res.status(500).json({ error: 'Błąd API', message: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
