import twilio from "twilio";

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Missing required environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN");
  }

  return twilio(accountSid, authToken);
}

function getFrom(): string {
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!from) {
    throw new Error("Missing required environment variable: TWILIO_FROM_NUMBER");
  }

  return from;
}

export async function sendSmsOtp(to: string, code: string): Promise<void> {
  const client = getClient();

  await client.messages.create({
    body: `Your EquiLabour verification code is: ${code}. It expires in 10 minutes.`,
    from: getFrom(),
    to,
  });
}
