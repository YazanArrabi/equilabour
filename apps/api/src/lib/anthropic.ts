import Anthropic from "@anthropic-ai/sdk";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const anthropic = new Anthropic({
  apiKey: getEnvVar("ANTHROPIC_API_KEY"),
});
