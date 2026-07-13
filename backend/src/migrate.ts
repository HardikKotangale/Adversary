import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, isRdsConfigured } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate(): Promise<void> {
  if (!isRdsConfigured || !pool) {
    console.error(
      "RDS_HOST is not set — nothing to migrate. Set RDS_HOST/RDS_USER/RDS_PASSWORD/RDS_DATABASE in .env first."
    );
    process.exit(1);
  }

  const sql = readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  console.log("Applying schema.sql to RDS...");
  await pool.query(sql);
  console.log("Migration complete.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
