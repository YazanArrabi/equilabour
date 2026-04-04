import express from "express";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});