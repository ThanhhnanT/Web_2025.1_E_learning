"use client";

import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Dropdown, Avatar } from "antd";
import type { MenuProps } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { checkAuth } from "../lib/helper";
import { logoutUser } from "@/lib/api";
import FooterComponent from "./FooterComponent";
import styles from './AntLayout.module.css';

const { Header, Content } = Layout;

// Component client-only cho User menu
function UserMenuClient() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setIsAuthenticated(checkAuth());
  }, []);

  if (!mounted) return null;

  const userMenu: MenuProps['items'] = [
    { key: "profile", label: <span onClick={() => router.push("/auth/profile")}>Hồ sơ</span> },
    { key: "logout", label: <span onClick={() => { logoutUser(); router.push("/"); }}>Đăng xuất</span> },
  ];

  return isAuthenticated ? (
    <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow>
      <Avatar src="/avatar.png" style={{ cursor: "pointer" }} />
    </Dropdown>
  ) : (
    <Button
      type="primary"
      shape="round"
      style={{ fontWeight: "bold" }}
      onClick={() => router.push("/auth/login")}
    >
      Đăng nhập
    </Button>
  );
}

export default function AntLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!mounted) {
    // SSR skeleton: render header/footer tĩnh, content trống
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <Header className={styles.header}><div style={{ height: 60 }}></div></Header>
        <Content className={styles.container}></Content>
        <FooterComponent />
      </Layout>
    );
  }

  // Xác định selectedKey dựa trên pathname
  let selectedKey = "home";
  if (pathname.startsWith("/about")) selectedKey = "about";
  else if (pathname.startsWith("/courses")) selectedKey = "courses";
  else if (pathname.startsWith("/tests")) selectedKey = "tests";
  else if (pathname.startsWith("/flashcards")) selectedKey = "flashcards";
  else if (pathname.startsWith("/posts")) selectedKey = "blog";
  else if (pathname.startsWith("/buy-courses")) selectedKey = "buy-courses";

  const menuItems: MenuProps["items"] = [
    { key: "home", label: <Link href="/"><span style={{ fontWeight: "bold" }}>Trang chủ</span></Link> },
    { key: "about", label: <Link href="/about"><span style={{ fontWeight: "bold" }}>Giới thiệu</span></Link> },
    { key: "courses", label: <Link href="/courses/online"><span style={{ fontWeight: "bold" }}>Chương trình học</span></Link> },
    { key: "tests", label: <Link href="/tests"><span style={{ fontWeight: "bold" }}>Đề thi online</span></Link> },
    { key: "flashcards", label: <Link href="/flashcards"><span style={{ fontWeight: "bold" }}>Flashcards</span></Link> },
    { key: "blog", label: <Link href="/posts"><span style={{ fontWeight: "bold" }}>Blog</span></Link> },
    {
      key: "buy-courses",
      label: (
        <span
          style={{ fontWeight: "bold", cursor: "pointer" }}
          onClick={() => {
            if (checkAuth()) router.push("/buy-courses");
            else router.push("/auth/login?next=/buy-courses");
          }}
        >
          Kích hoạt khóa học
        </span>
      )
    },
    { key: "user", label: <UserMenuClient /> },
  ];

  const dropdownMenu = { items: menuItems };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* HEADER */}
      <Header className={styles.header} style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Image
            src={isMobile ? "/logo1.png" : "/logo.png"}
            alt="Logo"
            width={isMobile ? 100 : 150}
            height={isMobile ? 100 : 150}
            priority
            style={{ objectFit: "contain" }}
          />
        </Link>

        {isMobile ? (
          <Dropdown menu={dropdownMenu} placement="bottomRight" arrow>
            <Button type="text" icon={<MenuOutlined style={{ fontSize: 26, color: "black" }} />} />
          </Dropdown>
        ) : (
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{
              flex: 1,
              justifyContent: "flex-end",
              minWidth: 0,
              background: "transparent",
              borderBottom: "none",
            }}
          />
        )}
      </Header>

      {/* CONTENT */}
      <Content className={styles.container}>{children}</Content>

      {/* FOOTER */}
      <FooterComponent />
    </Layout>
  );
}
