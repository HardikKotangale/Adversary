import pg from "pg";
import { config } from "./config.js";

export const isRdsConfigured = Boolean(config.rds.host);

export const pool: pg.Pool | null = isRdsConfigured
  ? new pg.Pool({
      host: config.rds.host,
      port: config.rds.port,
      user: config.rds.user,
      password: config.rds.password,
      database: config.rds.database,
      ssl: config.rds.ssl ? { rejectUnauthorized: false } : undefined,
      max: 10,
    })
  : null;
