// lib/r2.ts
import { S3Client } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
dotenv.config();
if (
  !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY ||
  !process.env.CLOUDFLARE_ACCOUNT_ID
) {

  console.log(
    " :",
    process.env.R2_ACCESS_KEY_ID,
    process.env.R2_SECRET_ACCESS_KEY,
    process.env.CLOUDFLARE_ACCOUNT_ID
  );

  throw new Error("Missing R2 credentials in .env");
}
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
