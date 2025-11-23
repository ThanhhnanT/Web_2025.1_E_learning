"use client";

import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Dropdown, Avatar } from "antd";
import type { MenuProps } from "antd";
import { 
  MenuOutlined, 
  HomeOutlined, 
  InfoCircleOutlined, 
  BookOutlined, 
  FileTextOutlined, 
  ThunderboltOutlined, 
  ReadOutlined, 
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined
} from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { checkAuth } from "../lib/helper";
import { logoutUser } from "@/lib/api";
import { getUserProfile } from "@/helper/api";
import Cookies from "js-cookie";
import FooterComponent from "./FooterComponent";
import styles from '@/styles/antLayout.module.css';
import skeletonStyles from '@/styles/skeleton.module.css';
import AuthModal from "./auth/ModalAuth";
// import MessageProvider from "./providers/MessageProvider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import {MessageProvider}  from "./providers/Message";
import { commonStyle } from "@/styles/common";

const { Header, Content, Footer } = Layout;
const style = commonStyle()

// Component client-only cho User menu
function UserMenuClient({ onOpenModal }: { onOpenModal: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth());
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cập nhật lại token sau mỗi lần reload
  useEffect(() => {
    if (checkAuth()) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setUserAvatar(null);
    }
  }, [mounted]);

  // Chỉ fetch avatar khi đăng nhập
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAvatar = async () => {
      try {
        const user = await getUserProfile();
        if (user?.avatar_url) setUserAvatar(user.avatar_url);
      } catch {}
    };

    fetchAvatar();
  }, [isAuthenticated]);

  if (!mounted) return null;

  const userMenu: MenuProps["items"] = [
    {
      key: "profile",
      label: <span onClick={() => router.push("/auth/profile")}>Hồ sơ</span>,
      icon: <UserOutlined />
    },
    {
      key: "logout",
      label: (
        <span
          onClick={() => {
            logoutUser();
            setIsAuthenticated(false);
            setUserAvatar(null);
            router.push("/");
          }}
        >
          Đăng xuất
        </span>
      ),
      icon: <LogoutOutlined />
    }
  ];

  return isAuthenticated ? (
    <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow>
      <Avatar
        src={userAvatar || undefined}
        icon={!userAvatar && <UserOutlined />}
        style={{ cursor: "pointer" }}
      />
    </Dropdown>
  ) : (
    <Button
      type="primary"
      shape="round"
      style={{ fontWeight: "bold" }}
      onClick={onOpenModal}
    >
      Đăng nhập
    </Button>
  );
}


export default function AntLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
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
      <AntdRegistry>
        <ConfigProvider
          theme={{
            token: {
              borderRadius: 50,
              colorPrimary: style.primaryColor,
              fontSize: 14,
              padding: 12,
            },
            components: {
              Button: {
                colorPrimary: style.btnColor,
                colorPrimaryHover: style.btnHoverColor,
                colorPrimaryActive: style.btnActiveColor,
                borderRadius: 50,
              },
            },
          }}
        >
          <MessageProvider>
      <Layout style={{ minHeight: "100vh" }}>
              <Header className={`${styles.header} ${skeletonStyles.headerSkeleton}`} style={{ background: "#ffffff" }}>
                <div className={skeletonStyles.headerLogoSkeleton} />
                <div className={skeletonStyles.headerMenuSkeleton}>
                  <div className={skeletonStyles.headerButtonSkeleton} />
                </div>
              </Header>
        <Content className={styles.container}></Content>
              <Footer className={skeletonStyles.footerSkeleton}>
                <div className={skeletonStyles.footerContent}>
                  <div className={skeletonStyles.footerLogoSkeleton} />
                  <div className={skeletonStyles.footerTextSkeleton}>
                    <div className={skeletonStyles.footerTitleSkeleton} />
                    <div className={skeletonStyles.footerLinkSkeleton} />
                    <div className={skeletonStyles.footerLinkSkeleton} />
                  </div>
                </div>
                <div className={skeletonStyles.footerCopyrightSkeleton} />
              </Footer>
      </Layout>
          </MessageProvider>
        </ConfigProvider>
      </AntdRegistry>
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
    { 
      key: "home", 
      label: <Link href="/"><span style={{ fontWeight: "bold" }}>Trang chủ</span></Link>,
      icon: <HomeOutlined />
    },
    { 
      key: "about", 
      label: <Link href="/about"><span style={{ fontWeight: "bold" }}>Giới thiệu</span></Link>,
      icon: <InfoCircleOutlined />
    },
    { 
      key: "courses", 
      label: <Link href="/courses/online"><span style={{ fontWeight: "bold" }}>Chương trình học</span></Link>,
      icon: <BookOutlined />
    },
    { 
      key: "tests", 
      label: <Link href="/tests"><span style={{ fontWeight: "bold" }}>Đề thi online</span></Link>,
      icon: <FileTextOutlined />
    },
    { 
      key: "flashcards", 
      label: <Link href="/flashcards/discover"><span style={{ fontWeight: "bold" }}>Flashcards</span></Link>,
      icon: <ThunderboltOutlined />
    },
    { 
      key: "blog", 
      label: <Link href="/posts"><span style={{ fontWeight: "bold" }}>Blog</span></Link>,
      icon: <ReadOutlined />
    },
    {
      key: "buy-courses",
      label: (
        <span
          style={{ fontWeight: "bold", cursor: "pointer" }}
          onClick={() => {
            if (checkAuth()) router.push("/buy-courses");
            else setAuthModalOpen(true);
          }}
        >
          Kích hoạt khóa học
        </span>
      ),
      icon: <ShoppingCartOutlined />
    },
    { key: "user", label: <UserMenuClient onOpenModal={() => setAuthModalOpen(true)} /> },
  ];

  const dropdownMenu = { items: menuItems };

  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          token: {
            borderRadius: 50,
            colorPrimary: style.primaryColor,
            fontSize: 14,
            padding: 12,
          },
          components: {
            Button: {
              colorPrimary: style.btnColor,
              colorPrimaryHover: style.btnHoverColor,
              colorPrimaryActive: style.btnActiveColor,
              borderRadius: 50,
            },
          },
        }}
      >
        <MessageProvider>
          <Layout style={{ minHeight: "100vh" }}>
            {/* HEADER */}
            <Header className={`${styles.header} ${skeletonStyles.headerSkeleton}`} style={{ background: "#ffffff" }}>
              <Link href="/" style={{ display: "flex", alignItems: "center", height: "100%" }}>
                <Image
                  src={isMobile ? "/logo1.png" : "/logo.png"}
                  alt="Logo"
                  width={isMobile ? 100 : 120 }
                  height={isMobile ? 100 : 120}
                  priority
                  style={{ objectFit: "contain" }}
                />
              </Link>

              {isMobile ? (
                <Dropdown menu={dropdownMenu} placement="bottomRight" arrow>
                  <Button 
                    type="text" 
                    icon={<MenuOutlined style={{ fontSize: 26, color: "black" }} />} 
                    className={styles.mobileMenuButton}
                  />
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
          
          {/* AUTH MODAL */}
          <AuthModal
            visible={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            setOpen={(open: boolean) => {
              setAuthModalOpen(open);
              // Refresh page when modal closes after successful login to update auth status
              if (!open && checkAuth()) {
               setTimeout(()=> window.location.reload(), 200);
              }
            }}
          />
        </MessageProvider>
      </ConfigProvider>
    </AntdRegistry>
  );
}
