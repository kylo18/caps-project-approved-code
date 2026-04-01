const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.get("/image-proxy", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send("Missing url parameter");
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return res.status(404).send("Image not found");
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Content-Type", response.headers.get("content-type"));
    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Error fetching image");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
