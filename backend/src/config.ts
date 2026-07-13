import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",

  qwen: {
    apiKey: process.env.QWEN_API_KEY ?? "",
    baseURL:
      process.env.QWEN_BASE_URL ??
      "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    personaModel: process.env.QWEN_PERSONA_MODEL ?? "qwen3.7-plus",
    mediatorModel: process.env.QWEN_MEDIATOR_MODEL ?? "qwen3.7-max",
  },

  // Alibaba Cloud RDS for PostgreSQL. If RDS_HOST is unset, the backend falls
  // back to an in-memory store (see store.ts) so local dev works without a
  // database.
  rds: {
    host: process.env.RDS_HOST ?? "",
    port: Number(process.env.RDS_PORT ?? 5432),
    user: process.env.RDS_USER ?? "",
    password: process.env.RDS_PASSWORD ?? "",
    database: process.env.RDS_DATABASE ?? "adversary",
    ssl: process.env.RDS_SSL !== "false",
  },

  // Alibaba Cloud OSS. If ALIBABA_ACCESS_KEY_ID is unset, transcripts fall
  // back to local disk (see transcript.ts) so local dev works without a
  // bucket.
  oss: {
    region: process.env.OSS_REGION ?? "",
    accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID ?? "",
    accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET ?? "",
    bucket: process.env.OSS_BUCKET ?? "",
  },

  maxExtraRoles: 2,
} as const;
