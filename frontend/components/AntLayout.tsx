"use client";

import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Dropdown,Avatar } from "antd";
import type { MenuProps } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkAuth } from "../lib/helper";
import { logoutUser } from "@/lib/api";
import FooterComponent from "./FooterComponent";
import styles from './AntLayout.module.css';
const { Header, Content, Footer } = Layout;

export default function AntLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  //Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const auth = checkAuth();
    setIsAuthenticated(auth);
  }, []);
  
  const userMenu : MenuProps['items']= [
    
        { key: "profile", label: <span onClick={() => router.push("/auth/profile")}>Hồ sơ</span> },
        { key: "logout", label: <span onClick={() => { logoutUser(); setIsAuthenticated(false); router.push("/"); }}>Đăng xuất</span> },
  ];


  // Menu
  const menuItems: MenuProps["items"] = ([
    {
      key: "home",
      label: (
        <Link href="/">
          <span style={{ fontWeight: "bold" }}>Trang chủ</span>
        </Link>
      ),
    },
    {
      key: "about",
      label: (
        <Link href="/about">
          <span style={{ fontWeight: "bold" }}>Giới thiệu</span>
        </Link>
      ),
    },
    {
      key: "courses",
      label: (
        <Link href="/courses">
          <span style={{ fontWeight: "bold" }}>Chương trình học</span>
        </Link>
      ),
    },
    {
      key: "tests",
      label: (
        <Link href="/tests">
          <span style={{ fontWeight: "bold" }}>Đề thi online</span>
        </Link>
      ),
    },
    {
      key: "flashcards",
      label: (
        <Link href="/flashcards">
          <span style={{ fontWeight: "bold" }}>Flashcards</span>
        </Link>
      ),
    },
    {
      key: "blog",
      label: (
        <Link href="/posts">
          <span style={{ fontWeight: "bold" }}>Blog</span>
        </Link>
      ),
    },
    {
      key: "buy-courses",
      label: (
      <span style = {{ fontWeight: "bold", cursor: "pointer" }}
        onClick={() => {
            if (isAuthenticated) {
              router.push("/buy-courses");
            } else {
              router.push("/auth/login?next=/buy-courses");
            }
          }}
        >
        Kích hoạt khóa học
      </span>
      )
    },
    {
    key: "user",
    label: isAuthenticated ? (
      <Dropdown
             menu={{items:userMenu}} 
             placement="bottomRight" arrow
             mouseEnterDelay={0.3} 
             mouseLeaveDelay={0.5} >
        <Avatar src="/avatar.png" style={{ cursor: "pointer" }} />
      </Dropdown>
    ) : (
      <Link href="/auth/login">
        <Button type="primary" shape="round" style={{ fontWeight: "bold" }}>
          Đăng nhập
        </Button>
      </Link>
    ),
  },
  ] as MenuProps["items"]);
  const dropdownMenu: { items: MenuProps["items"] } = { items: menuItems };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* HEADER */}
      <Header className={styles.header}>
        {/* LOGO */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Image
            src="/logo.png"
            alt="Logo"
            width={150}
            height={150}
            style={{
              objectFit: "contain",
            }}
          />
        </Link>

        {/* MENU / DROPDOWN */}
        {isMobile ? (
          <Dropdown 
                menu={dropdownMenu} 
                placement="bottomRight" arrow
                mouseEnterDelay={0.3} 
                mouseLeaveDelay={0.5} >
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 26, color: "black" }} />}
            />
          </Dropdown>
        ) : (
          <Menu
            mode="horizontal"
            defaultSelectedKeys={["home"]}
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
      <Content style={{ padding: "24px 48px" }}>
        <div className={styles.contentBox}>
          <div style={{ marginTop: 32 }}>{children}</div>
        </div>
      </Content>

      {/* FOOTER */}
      <FooterComponent />
    </Layout>
  );
}
