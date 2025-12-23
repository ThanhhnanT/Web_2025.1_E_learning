"use client";

import React, { useState } from "react";
import { Form, Input, Button, Checkbox, message } from "antd";
import { UserOutlined, LockOutlined, SafetyOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { handleAdminLogin } from "@/service/adminAuth";
import styles from "@/styles/adminLogin.module.css";

export default function AdminLoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await handleAdminLogin({
        email: values.email,
        password: values.password,
      });

      if (res.statusCode === 200) {
        Cookies.set("access_token", res.access_token);
        Cookies.set("user_id", res.id);
        message.success("Đăng nhập thành công");
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 500);
      } else {
        message.error(res.message || "Đăng nhập thất bại. Vui lòng kiểm tra thông tin.");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";
      message.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <SafetyOutlined style={{ fontSize: "1.875rem", color: "white" }} />
          </div>
          <h1 className={styles.title}>Đăng nhập Admin</h1>
          <p className={styles.subtitle}>
            Chào mừng trở lại! Vui lòng đăng nhập vào tài khoản của bạn.
          </p>
        </div>

        <div className={styles.card}>
          <Form
            form={form}
            name="adminLogin"
            onFinish={onFinish}
            layout="vertical"
            className={styles.form}
            size="large"
          >
            <Form.Item
              name="email"
              label={<span className={styles.label}>Tên đăng nhập hoặc Email</span>}
              rules={[
                { required: true, message: "Vui lòng nhập email hoặc tên đăng nhập" },
                { type: "email", message: "Vui lòng nhập email hợp lệ" },
              ]}
              className={styles.formItem}
            >
              <Input
                placeholder="Nhập tên đăng nhập hoặc email của bạn"
                className={styles.inputWithIcon}
                prefix={<UserOutlined style={{ color: "#64748b" }} />}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className={styles.label}>Mật khẩu</span>}
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
              className={styles.formItem}
            >
              <Input.Password
                placeholder="Nhập mật khẩu của bạn"
                className={styles.inputWithIcon}
                prefix={<LockOutlined style={{ color: "#64748b" }} />}
              />
            </Form.Item>

            <div className={styles.rememberForgot}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Ghi nhớ đăng nhập</Checkbox>
              </Form.Item>
              <a href="#" className={styles.forgotLink}>
                Quên mật khẩu?
              </a>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className={styles.loginButton}
                block
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>

      <footer className={styles.footer}>
        <p>© 2023 Admin E-learning. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}

