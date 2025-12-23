"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Form,
  Descriptions,
  Select,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { getUserById, updateUser, type User } from "@/service/users";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

const labelStyle = { color: "#6b7280" };

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = useMemo(() => (params?.id ? params.id.toString() : ""), [params]);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleValue, setRoleValue] = useState<User["role"]>("viewer");

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await getUserById(userId);
        setUser(data);
        setRoleValue((data.role as User["role"]) || "viewer");
      } catch (err: any) {
        console.error(err);
        message.error(err?.response?.data?.message || "Không thể tải chi tiết người dùng");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const formatDate = (value?: string) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "N/A");
  const formatRelative = (value?: string) => (value ? dayjs(value).fromNow() : "Never");

  const statusTag = user?.email_verified ? (
    <Tag color="green">Active</Tag>
  ) : (
    <Tag color="orange">Pending</Tag>
  );

  const roleChanged = roleValue !== (user?.role || "viewer");

  const handleRoleSave = async () => {
    if (!user?._id || !roleChanged) return;
    setRoleSubmitting(true);
    try {
      await updateUser(user._id, { role: roleValue });
      message.success("Cập nhật quyền thành công");
      const refreshed = await getUserById(user._id);
      setUser(refreshed);
      setRoleValue(refreshed.role);
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || "Không thể cập nhật quyền");
    } finally {
      setRoleSubmitting(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space style={{ justifyContent: "space-between", width: "100%" }}>
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/admin/users")}
            >
              Back
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              User Detail
            </Title>
          </Space>
          <Space>
            <Button icon={<EditOutlined />} disabled>
              Edit Profile
            </Button>
            <Button type="primary">More Actions</Button>
          </Space>
        </Space>

        <Card variant="outlined">
          <Row gutter={[24, 24]} align="middle">
            <Col flex="none">
              <Avatar
                size={96}
                src={user?.avatar_url}
                icon={!user?.avatar_url && <UserOutlined />}
                style={{ backgroundColor: user?.avatar_url ? "transparent" : "#137fec" }}
              />
            </Col>
            <Col flex="auto">
              <Space direction="vertical" size={4}>
                <Title level={4} style={{ margin: 0 }}>
                  {user?.name || "—"}
                </Title>
                <Text type="secondary">{user?.email}</Text>
                <Space size="middle">
                  {statusTag}
                  <Tag color={user?.role === "admin" ? "blue" : "default"}>
                    {user?.role === "admin" ? "Admin" : "User"}
                  </Tag>
                </Space>
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card
              title="User Details"
              variant="outlined"
              styles={{ header: { padding: "12px 16px" }, body: { padding: 16 } }}
            >
              <Descriptions column={2} styles={{ label: labelStyle }}>
                <Descriptions.Item label="Email">
                  <Space>
                    <MailOutlined /> {user?.email || "N/A"}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  <Space>
                    <PhoneOutlined /> {user?.phone || "N/A"}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Role">{user?.role || "N/A"}</Descriptions.Item>
                <Descriptions.Item label="Status">{statusTag}</Descriptions.Item>
                <Descriptions.Item label="Last Login">
                  <Space direction="vertical" size={0}>
                    <Text strong>{formatRelative(user?.lastLoginAt)}</Text>
                    <Text type="secondary">{formatDate(user?.lastLoginAt)}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Last Login IP">{user?.lastLoginIp || "N/A"}</Descriptions.Item>
                <Descriptions.Item label="Last Location">
                  {user?.lastLoginLocation || "Unknown"}
                </Descriptions.Item>
                <Descriptions.Item label="Joined">
                  <Space direction="vertical" size={0}>
                    <Text>{formatDate(user?.createdAt)}</Text>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              title="Roles & Permissions"
              styles={{
                header: { padding: "16px 16px 0 16px" },
                body: { padding: 16 },
              }}
            >
              <Flex align="center" justify="space-between" wrap>
                <Space direction="vertical" size={4}>
                  <Text strong>Quyền người dùng</Text>
                  <Text type="secondary">
                    Chọn quyền để áp dụng nhóm quyền có sẵn (Admin/User).
                  </Text>
                </Space>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleRoleSave}
                  disabled={!roleChanged}
                  loading={roleSubmitting}
                >
                  Lưu
                </Button>
              </Flex>

              <Divider style={{ margin: "16px 0" }} />

              <Form layout="vertical" style={{ marginBottom: 0 }}>
                <Form.Item label="Role">
                  <Select
                    value={roleValue}
                    onChange={(val) => setRoleValue(val as User["role"])}
                    style={{ maxWidth: 260 }}
                  >
                    <Option value="administrator">Administrator</Option>
                    <Option value="editor">Editor</Option>
                    <Option value="viewer">Viewer</Option>
                    <Option value="support">Support</Option>
                  </Select>
                </Form.Item>
              </Form>

              <Divider style={{ margin: "16px 0" }} />

              <Space direction="vertical" style={{ width: "100%" }} size="large">
                <div>
                  <Text strong>Permissions</Text>
                  <Text type="secondary" style={{ display: "block" }}>
                    Các toggle này minh họa phạm vi quyền (không lưu backend).
                  </Text>
                </div>
                <div className="permissions-list" style={{ display: "grid", gap: 12 }}>
                  {[
                    {
                      title: "User Management",
                      desc: "Có thể xem, tạo, sửa, xóa người dùng.",
                      enabled: roleValue === "admin",
                    },
                    {
                      title: "Content Management",
                      desc: "Có thể tạo, sửa, publish nội dung.",
                      enabled: roleValue === "admin",
                    },
                    {
                      title: "Analytics Access",
                      desc: "Có thể xem dashboards phân tích.",
                      enabled: roleValue === "admin",
                    },
                    {
                      title: "Billing Management",
                      desc: "Quản lý subscription và hóa đơn.",
                      enabled: roleValue === "admin",
                    },
                  ].map((item) => (
                    <Card
                      key={item.title}
                      size="small"
                      variant="outlined"
                      styles={{ body: { padding: 12 } }}
                    >
                      <Flex align="center" justify="space-between" gap={12}>
                        <Space direction="vertical" size={0}>
                          <Text strong>{item.title}</Text>
                          <Text type="secondary">{item.desc}</Text>
                        </Space>
                        <Tag color={item.enabled ? "blue" : "default"}>
                          {item.enabled ? "Enabled" : "Disabled"}
                        </Tag>
                      </Flex>
                    </Card>
                  ))}
                </div>
              </Space>
            </Card>

            <Card
              title="Activity Log"
              variant="outlined"
              styles={{ header: { padding: "12px 16px" }, body: { padding: 16 } }}
              style={{ marginTop: 24 }}
            >
              <Space direction="vertical">
                <Text type="secondary">Chưa có log hoạt động. (placeholder)</Text>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title="Account Actions"
              variant="outlined"
              styles={{ header: { padding: "12px 16px" }, body: { padding: 16 } }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button block disabled>
                  Send Password Reset
                </Button>
                <Button block danger disabled>
                  Suspend Account
                </Button>
              </Space>
            </Card>

            <Card
              title="Danger Zone"
              variant="outlined"
              styles={{ header: { color: "#b91c1c", padding: "12px 16px" }, body: { padding: 16 } }}
              style={{ marginTop: 24, borderColor: "rgba(248,113,113,0.5)" }}
            >
              <Text type="danger">Thao tác này không thể hoàn tác.</Text>
              <Divider />
              <Button block danger disabled>
                Delete User
              </Button>
            </Card>
          </Col>
        </Row>
      </Space>
    </Spin>
  );
}

