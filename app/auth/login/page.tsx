"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Link from "next/link";
import styles from "../auth.module.css";

export default function LoginPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (form.email && form.password) {
            Cookies.set("access_token", "mock_access_token", { expires: 7 });
            alert("Đăng nhập thành công!");
            router.push("/dashboard");
        } else {
            setError("Vui lòng nhập email và mật khẩu!");
        }
    }

    return (
        <main className={styles.container}>
            <AuthForm title="Đăng nhập" onSubmit={handleSubmit}>
                <InputField
                    label="Email"
                    name="email"
                    type="email"
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

                {error && <p className={styles.message}>{error}</p>}

                <Button type="submit" text="Đăng nhập" />

                <div className={styles.switch}>
                    <Link href="/auth/forgot-password">Quên mật khẩu?</Link>
                    <p>
                        Chưa có tài khoản?{" "}
                        <Link href="/auth/register" className={styles.link}>
                            Đăng ký
                        </Link>
                    </p>
                </div>

                <div className={styles.socialButtons}>
                    <button
                        type="button"
                        className={`${styles.socialBtn} ${styles.google}`}
                        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                    >
                        <img src="/google-icon.svg" alt="Google" className={styles.icon} />
                        <span>Đăng nhập với Google</span>
                    </button>

                    <button
                        type="button"
                        className={`${styles.socialBtn} ${styles.facebook}`}
                        onClick={() => signIn("facebook", { callbackUrl: "/dashboard" })}
                    >
                        <img src="/facebook-icon.svg" alt="Facebook" className={styles.icon} />
                        <span>Đăng nhập với Facebook</span>
                    </button>
                </div>
            </AuthForm>
        </main>
    );
}
