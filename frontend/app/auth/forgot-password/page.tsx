"use client";
import { useState } from "react";
import AuthForm from "@/components/AuthForm";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import styles from "../auth.module.css";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1 = nhập email, 2 = nhập mã & pass mới
  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Gửi mã xác nhận
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) {
      setMessage("Vui lòng nhập email!");
      return;
    }
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Không gửi được mã, thử lại sau.");
    } else {
      setMessage(`Mã xác nhận đã gửi tới ${form.email}.`);
      setStep(2);
    }

    const resPass = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, otp: form.otp, newPassword: form.newPassword }),
    });
    const dataPass = await resPass.json();
    if (!res.ok) {
      setMessage(dataPass.error || "Xác thực thất bại.");
    } else {
      setMessage("Đặt lại mật khẩu thành công!");
    }

  };

  // Đặt lại mật khẩu
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.otp || !form.newPassword) {
      setMessage("Vui lòng nhập đầy đủ mã xác nhận và mật khẩu mới!");
      return;
    }

    setLoading(true);
    setMessage("");

    // giả lập xác thực OTP
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setLoading(false);
    setMessage("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập lại.");
  };

  return (
    <main className={styles.container}>
      <AuthForm
        title="Quên mật khẩu"
        onSubmit={step === 1 ? handleSendOtp : handleResetPassword}
      >
        {step === 1 && (
          <>
            <InputField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Button
              type="submit"
              text={loading ? "Đang gửi..." : "Gửi mã xác nhận"}
              disabled={loading}
            />
          </>
        )}

        {step === 2 && (
          <>
            <InputField
              label="Mã xác nhận (6 số)"
              name="otp"
              type="text"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value })}
              required
            />
            <InputField
              label="Mật khẩu mới"
              name="newPassword"
              type="password"
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
              required
            />
            <Button
              type="submit"
              text={loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              disabled={loading}
            />
          </>
        )}

        {message && <p className={styles.message}>{message}</p>}

        <p className={styles.switch}>
          <Link href="/auth/login">← Quay lại đăng nhập</Link>
        </p>
      </AuthForm>
    </main>
  );
}
