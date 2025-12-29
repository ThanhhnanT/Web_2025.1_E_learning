"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Layout, Menu, Input, Avatar, Badge, Dropdown, message, Space, Typography, Button } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  SettingOutlined,
  TeamOutlined,
  LogoutOutlined,
  SearchOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { checkAdminAuth, isAdmin, redirectToAdminLogin } from "@/lib/adminHelper";
import { logoutUser } from "@/lib/api";
import { getUserProfile } from "@/helper/api";
import Cookies from "js-cookie";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { MessageProvider } from "./providers/Message";

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [adminName, setAdminName] = useState<string>("Admin Name");
  const [adminEmail, setAdminEmail] = useState<string>("admin@example.com");
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!checkAdminAuth()) {
        redirectToAdminLogin();
        return;
      }

      try {
        const admin = await isAdmin();
        if (!admin) {
          message.error("Bạn không có quyền truy cập trang admin");
          redirectToAdminLogin();
        } else {
          // Fetch admin profile information
          const userProfile = await getUserProfile();
          if (userProfile) {
            setAdminName(userProfile.name || "Admin Name");
            setAdminEmail(userProfile.email || "admin@example.com");
            setAdminAvatar(userProfile.avatar_url || null);
          }
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
        redirectToAdminLogin();
      }
    };

    if (mounted && pathname !== "/admin/login") {
      checkAuth();
    }
  }, [mounted, pathname]);

  const selectedKey = useMemo(() => {
    if (!pathname) return "/admin/dashboard";
    if (pathname.startsWith("/admin/flashcards")) return "/admin/flashcards";
    if (pathname.startsWith("/admin/posts")) return "/admin/posts";
    return pathname;
  }, [pathname]);

  if (!mounted) {
    return null;
  }

  const handleLogout = () => {
    logoutUser();
    Cookies.remove("user_id");
    message.success("Đăng xuất thành công");
    router.push("/admin/login");
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "/admin/dashboard",
      icon: <DashboardOutlined />,
      label: "Bảng điều khiển",
      onClick: () => router.push("/admin/dashboard"),
    },
    {
      key: "/admin/users",
      icon: <UserOutlined />,
      label: "Người dùng",
      onClick: () => router.push("/admin/users"),
    },
    {
      key: "/admin/roles",
      icon: <TeamOutlined />,
      label: "Vai trò",
      onClick: () => router.push("/admin/roles"),
    },
    {
      key: "/admin/courses",
      icon: <BookOutlined />,
      label: "Khóa học",
      onClick: () => router.push("/admin/courses"),
    },
    {
      key: "/admin/tests",
      icon: <FileTextOutlined />,
      label: "Bài kiểm tra",
      onClick: () => router.push("/admin/tests"),
    },
    {
      key: "/admin/posts",
      icon: <EditOutlined />,
      label: "Quản lý bài viết",
      onClick: () => router.push("/admin/posts"),
    },
    {
      key: "/admin/flashcards",
      icon: <ThunderboltOutlined />,
      label: "Thẻ ghi nhớ",
      onClick: () => router.push("/admin/flashcards"),
    },
    {
      key: "/admin/analytics",
      icon: <BarChartOutlined />,
      label: "Phân tích",
      onClick: () => router.push("/admin/analytics"),
    },
    {
      key: "/admin/settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
      onClick: () => router.push("/admin/settings"),
    },
  ];

  const userMenu: MenuProps["items"] = [
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const getPageTitle = () => {
    const titleMap: Record<string, string> = {
      "/admin/dashboard": "Bảng điều khiển",
      "/admin/users": "Người dùng",
      "/admin/roles": "Vai trò",
      "/admin/courses": "Khóa học",
      "/admin/tests": "Bài kiểm tra",
      "/admin/posts": "Quản lý bài viết",
      "/admin/flashcards": "Thẻ ghi nhớ",
      "/admin/analytics": "Phân tích",
      "/admin/settings": "Cài đặt",
    };
    return titleMap[pathname] || "Bảng điều khiển";
  };

  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#137fec",
            borderRadius: 6,
          },
          components: {
            Menu: {
              itemSelectedBg: "rgba(19, 127, 236, 0.2)",
              itemSelectedColor: "#137fec",
              itemHoverBg: "rgba(19, 127, 236, 0.1)",
              itemHoverColor: "#137fec",
              itemActiveBg: "rgba(19, 127, 236, 0.2)",
            },
          },
        }}
      >
        <MessageProvider>
          <Layout style={{ minHeight: "100vh", display: "flex", flexDirection: "row" }}>
            <Sider
              width={256}
              collapsed={collapsed}
              onCollapse={setCollapsed}
              collapsible
              style={{
                height: "100vh",
                position: "fixed",
                left: 0,
                top: 0,
                bottom: 0,
                borderRight: "1px solid #e5e7eb",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: collapsed ? "0 16px 0px 16px" : "16px",
                  minHeight: 64,
                }}
              >
                <Image
                  src={collapsed ? "/logo1.png" : "/logo.png"}
                  alt="LEARNIFY Logo"
                  width={collapsed ? 80 : 200}
                  height={collapsed ? 80 : 60}
                  priority
                  style={{
                    objectFit: "contain",
                  }}
                />
              </div>
              <div style={{ flex: 1, overflow: "auto" }}>
                <Menu
                  mode="inline"
                  selectedKeys={[selectedKey]}
                  items={menuItems}
                  style={{
                    border: "none",
                    background: "transparent",
                    height: "100%",
                  }}
                />
              </div>
              <div
                style={{
                  padding: 16,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 8,
                    marginBottom: 8,
                  }}
                >
                  <Avatar
                    src={adminAvatar || undefined}
                    icon={!adminAvatar && <UserOutlined />}
                    size={40}
                    style={{ backgroundColor: adminAvatar ? "transparent" : "#137fec" }}
                  />
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ display: "block", fontSize: 14 }}>
                      {adminName}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {adminEmail}
                    </Text>
                  </div>
                </div>
                  <Menu
                  mode="inline"
                  items={[
                    {
                      key: "logout",
                      icon: <LogoutOutlined />,
                      label: "Đăng xuất",
                      onClick: handleLogout,
                    },
                  ]}
                  style={{
                    border: "none",
                    background: "transparent",
                  }}
                />
              </div>
            </Sider>
            <Layout
              style={{
                marginLeft: collapsed ? 80 : 256,
                display: "flex",
                flexDirection: "column",
                flex: 1,
                transition: "margin-left 0.2s",
              }}
            >
              <Header
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  padding: "0 32px",
                  background: "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(8px)",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: 64,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                      fontSize: 18,
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: collapsed ? "-8px" : "0",
                    }}
                  />
                  <Text strong style={{ fontSize: 24, letterSpacing: "-0.033em" }}>
                    {getPageTitle()}
                  </Text>
                </div>
                <Space size="middle" style={{ flex: 1, justifyContent: "flex-end" }}>
                  <Input
                    placeholder="Tìm kiếm..."
                    prefix={<SearchOutlined />}
                    style={{
                      width: 240,
                      borderRadius: 6,
                    }}
                  />
                  <Badge count={0} showZero={false}>
                    <Avatar
                      icon={<BellOutlined />}
                      style={{
                        cursor: "pointer",
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        color: "#101922",
                      }}
                    />
                  </Badge>
                  <Avatar
                    src={adminAvatar || undefined}
                    icon={!adminAvatar && <UserOutlined />}
                    size={40}
                    style={{
                      cursor: "pointer",
                      backgroundColor: adminAvatar ? "transparent" : "#137fec",
                    }}
                  />
                </Space>
              </Header>
              <Content
                style={{
                  padding: 32,
                  overflow: "auto",
                  background: "#f6f7f8",
                  minHeight: "calc(100vh - 64px)",
                }}
              >
                {children}
              </Content>
            </Layout>
          </Layout>
        </MessageProvider>
      </ConfigProvider>
    </AntdRegistry>
  );
}

