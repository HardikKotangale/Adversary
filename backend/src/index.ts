import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { router } from "./routes.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", router);

app.listen(config.port, () => {
  console.log(`Adversary backend listening on http://localhost:${config.port}`);
});
