"use client";
import { useState } from "react";
import { loginUser } from "@/lib/api";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import InputField from "@/components/InputField";
import styles from "@/styles/auth.module.css";
import Button from "@/components/Button";
import Link from "next/link";

interface LoginForm {
    email: string;
    password: string;
}
export default function LoginPage() {
    const [form, setForm] = useState<LoginForm>({
        email: "",
        password: ""
    });
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const router = useRouter();
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await loginUser(form);
            if (res?.error) {
                setIsError(true);
                setMessage(res.message || "Đăng nhập thất bại!");
            } else {
                setIsError(false);
                setMessage("Đăng nhập thành công!");
                // Chuyển hướng sau khi đăng nhập thành công
                setTimeout(() => {
                    router.push("/dashboard");
                }, 1000);
            }
        } catch (error) {
            console.error("Login error:", error);
            setIsError(true);
            setMessage("Đã có lỗi xảy ra. Vui lòng thử lại.");
        }
    }
    return (
        <main className={styles.container}>
            <AuthForm title="Đăng nhập" onSubmit={handleSubmit}>
                <InputField
                    label="Email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                />
                <InputField
                    label="Mật khẩu"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                />
                <Button type="submit" text="Đăng nhập" />
                {message && (<p
                    className={`${styles.message} ${isError ? styles.error : styles.success} `}>{message}</p>)}
                <p className="styles.switch">
                    Chưa có tài khoản? <Link href="/auth/register" className={styles.link}>Đăng ký ngay</Link>
                </p>
            </AuthForm>
        </main>
    )
}