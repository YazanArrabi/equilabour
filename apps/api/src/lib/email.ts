import { Resend } from "resend";

function getClient(): Resend {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    throw new Error("Missing required environment variable: RESEND_API_KEY");
  }

  return new Resend(key);
}

function getFrom(): string {
  return process.env.RESEND_FROM ?? "EquiLabour <onboarding@resend.dev>";
}

export async function sendEmailOtp(to: string, code: string): Promise<void> {
  const resend = getClient();

  const { error } = await resend.emails.send({
    from: getFrom(),
    to,
    subject: "Your EquiLabour verification code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
        <h2 style="margin-bottom:8px">Verify your email</h2>
        <p style="color:#555;margin-bottom:24px">Enter this code in EquiLabour to complete sign-up:</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;text-align:center;
                    padding:24px;background:#f4f4f5;border-radius:8px;margin-bottom:24px">
          ${code}
        </div>
        <p style="color:#888;font-size:13px">This code expires in 10 minutes. If you didn't create an EquiLabour account, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
