import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ ok: false, error: "Thiếu thông tin." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    return NextResponse.json({ ok: true, message: "Đặt lại mật khẩu thành công." });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ ok: false, error: "Không thể đặt lại mật khẩu." });
  }
}
