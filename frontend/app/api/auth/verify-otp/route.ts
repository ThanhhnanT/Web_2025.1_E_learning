import { NextResponse } from "next/server";
import { otpStore } from "../send-otp/otpStore"; 

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ ok: false, error: "Thiếu email hoặc OTP" });
    }

    const record = otpStore.get(email);
    if (!record) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy mã OTP." });
    }

    const now = Date.now();
    if (record.expires < now) {
      otpStore.delete(email);
      return NextResponse.json({ ok: false, error: "Mã OTP đã hết hạn." });
    }

    if (record.otp !== otp) {
      return NextResponse.json({ ok: false, error: "Mã OTP không đúng." });
    }

    otpStore.delete(email);
    return NextResponse.json({ ok: true, message: "Xác thực OTP thành công." });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ khi xác thực OTP." });
  }
}
