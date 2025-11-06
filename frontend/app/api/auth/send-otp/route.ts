import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

type Body = { email?: string };

const OTP_TTL_MS = 60 * 1000; //1 phut 
const otpStore = new Map<
  string,
  { otp: string; expiresAt: number }
>();

//ma oTP
function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP credentials are not configured in environment.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, 
    auth: { user, pass },
  });
}

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as Body;
    if (!email) return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    const prev = otpStore.get(email);
    const now = Date.now();
    if (prev && now < prev.expiresAt - OTP_TTL_MS + 60 * 1000) {
      return NextResponse.json({ ok: false, error: "Please wait before requesting another code." }, { status: 429 });
    }

    const otp = genOtp();
    const expiresAt = now + OTP_TTL_MS;
    otpStore.set(email, { otp, expiresAt });

    const transporter = await createTransport();

    const mailHtml = `
      <div style="font-family: Arial, sans-serif; line-height:1.4;">
        <h3>OTP xác nhận</h3>
        <p>Mã xác nhận của bạn là:</p>
        <p style="font-size: 24px; font-weight:700; letter-spacing:4px;">${otp}</p>
        <p>Mã có hiệu lực trong 1 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Mã xác nhận khôi phục mật khẩu (OTP)",
      text: `Mã xác nhận: ${otp} (hết hạn trong 1 phút)`,
      html: mailHtml,
    });

    return NextResponse.json({ ok: true, message: "OTP sent" });
  } catch (err: any) {
    console.error("send-otp error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Server error" }, { status: 500 });
  }
}
