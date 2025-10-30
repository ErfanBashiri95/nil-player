const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

// توکن تست (بعداً داینامیکش می‌کنیم)
const VALID_TOKEN = "HELIX_TOKEN_123";

// کلید هر ویدیو (ساده و هاردکد برای تست)
const KEY_MAP = {
  enc01: path.join(__dirname, "keys", "enc01.key"),
};

// سرو کلید: /api/key?vid=enc01&token=HELIX_TOKEN_123
app.get("/api/key", (req, res) => {
  const { vid, token } = req.query;
  if (!vid || !token) return res.status(400).send("Bad request");

  if (token !== VALID_TOKEN) return res.status(403).send("Forbidden");

  const keyPath = KEY_MAP[vid];
  if (!keyPath || !fs.existsSync(keyPath)) return res.status(404).send("Not found");

  // مهم: هدر بایت خام
  res.setHeader("Content-Type", "application/octet-stream");
  fs.createReadStream(keyPath).pipe(res);
});

// پورت
const PORT = 5174;
app.listen(PORT, () => console.log("KEY server on http://localhost:" + PORT));
