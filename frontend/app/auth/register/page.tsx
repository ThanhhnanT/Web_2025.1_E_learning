"use client";
import { useState } from "react";
import { registerUser } from "@/lib/api";
import AuthForm from "@/components/AuthForm";
import InputField from "@/components/InputField";
import styles from "@/styles/auth.module.css";
import Button from "@/components/Button";
import Link from "next/link";

interface RegisterForm {
    fullName: string;
    email: string;
    password: string;
    role: "student" | "teacher";
}
export default function RegisterPage() {
    const [form, setForm] = useState<RegisterForm>({
        fullName: "",
        email: "",
        password: "",
        role: "student"
    });
    const [message, setMessage] = useState("");
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const res = await registerUser(form);
        setMessage(res?.message || "Đăng ký thành công!");
    }
    return (
        <main className={styles.container}>
            <AuthForm title="Đăng ký" onSubmit={handleSubmit}>
                <InputField
                    label="Họ và tên"
                    name="fullName"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                />
                <InputField
                    label="Email"
                    name="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                />
                <InputField
                    label="Mật khẩu"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                />
                <Button type="submit" text="Đăng ký" />
                {message && <p className={styles.message}>{message}</p>}
                <p className="styles.switch">
                    Đã có tài khoản? <Link href="/auth/login" className={styles.link}>Đăng nhập</Link>
                </p>
            </AuthForm>
        </main>
    )
}