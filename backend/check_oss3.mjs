import "dotenv/config";
import OSS from "ali-oss";

const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
});

const key = "transcripts/6aba8cc2-ba35-446f-b5ed-d4acb8c1a4e5.json";
try {
  const result = await client.get(key);
  const json = JSON.parse(result.content.toString("utf-8"));
  console.log("FOUND");
  console.log("Score:", json.verdict?.score);
  console.log("Rationale:", json.verdict?.scoreRationale);
  console.log("Turns:", json.turns.length, "| Personas:", json.activePersonaIds);
} catch (err) {
  console.log("NOT_FOUND");
}
