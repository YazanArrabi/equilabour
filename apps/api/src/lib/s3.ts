import { S3Client } from "@aws-sdk/client-s3";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const s3Client = new S3Client({
  region: getEnvVar("AWS_REGION"),
  credentials: {
    accessKeyId: getEnvVar("AWS_ACCESS_KEY_ID"),
    secretAccessKey: getEnvVar("AWS_SECRET_ACCESS_KEY"),
  },
});

export const S3_BUCKET_NAME = getEnvVar("S3_BUCKET_NAME");
