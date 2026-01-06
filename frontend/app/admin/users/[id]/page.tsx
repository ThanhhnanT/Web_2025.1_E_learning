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
  Modal,
  Input,
  Switch,
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
import "dayjs/locale/vi";
import { getUserById, updateUser, suspendUser, activateUser, adminResetPassword, deleteUser, type User } from "@/service/users";

dayjs.extend(relativeTime);
dayjs.locale("vi");

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
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [isPasswordResetModalVisible, setIsPasswordResetModalVisible] = useState(false);
  const [passwordResetForm] = Form.useForm();
  const [passwordResetSubmitting, setPasswordResetSubmitting] = useState(false);

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
  const formatRelative = (value?: string) => {
    if (!value) return "Chưa bao giờ";
    return dayjs(value).fromNow();
  };

  const statusTag = user?.email_verified ? (
    <Tag color="green">Hoạt động</Tag>
  ) : (
    <Tag color="orange">Chờ xử lý</Tag>
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

  const handleEditClick = () => {
    if (!user) return;
    editForm.setFieldsValue({
      name: user.name,
      phone: user.phone || "",
      bio: user.bio || "",
      email_verified: user.email_verified,
    });
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async (values: any) => {
    if (!user?._id) return;
    setEditSubmitting(true);
    try {
      await updateUser(user._id, values);
      message.success("Cập nhật thông tin thành công");
      const refreshed = await getUserById(user._id);
      setUser(refreshed);
      setIsEditModalVisible(false);
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || "Không thể cập nhật thông tin");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handlePasswordReset = async (values: { newPassword: string; confirmPassword: string }) => {
    if (!user?._id) return;
    if (values.newPassword !== values.confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setPasswordResetSubmitting(true);
    try {
      await adminResetPassword(user._id, values.newPassword);
      message.success("Đặt lại mật khẩu thành công");
      setIsPasswordResetModalVisible(false);
      passwordResetForm.resetFields();
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || "Không thể đặt lại mật khẩu");
    } finally {
      setPasswordResetSubmitting(false);
    }
  };

  const handleSuspendAccount = async () => {
    if (!user?._id) return;
    Modal.confirm({
      title: "Tạm ngưng tài khoản",
      content: `Bạn có chắc chắn muốn tạm ngưng tài khoản của ${user.name}?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await suspendUser(user._id, "Tạm ngưng bởi admin");
          message.success("Tài khoản đã được tạm ngưng");
          const refreshed = await getUserById(user._id);
          setUser(refreshed);
        } catch (err: any) {
          console.error(err);
          message.error(err?.response?.data?.message || "Không thể tạm ngưng tài khoản");
        }
      },
    });
  };

  const handleActivateAccount = async () => {
    if (!user?._id) return;
    try {
      await activateUser(user._id);
      message.success("Tài khoản đã được kích hoạt");
      const refreshed = await getUserById(user._id);
      setUser(refreshed);
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || "Không thể kích hoạt tài khoản");
    }
  };

  const handleDeleteUser = async () => {
    if (!user?._id) return;
    Modal.confirm({
      title: "Xóa người dùng",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của <strong>{user.name}</strong>?</p>
          <p style={{ color: "#ff4d4f", marginTop: 8 }}>Thao tác này không thể hoàn tác!</p>
        </div>
      ),
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteUser(user._id);
          message.success("Người dùng đã được xóa");
          router.push("/admin/users");
        } catch (err: any) {
          console.error(err);
          message.error(err?.response?.data?.message || "Không thể xóa người dùng");
        }
      },
    });
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
              Quay lại
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              Chi tiết người dùng
            </Title>
          </Space>
          <Space>
            <Button 
              icon={<EditOutlined />} 
              onClick={handleEditClick}
            >
              Chỉnh sửa hồ sơ
            </Button>
            <Button type="primary">Thao tác khác</Button>
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
                  <Tag color={user?.role === "administrator" ? "red" : "blue"}>
                    {user?.role === "administrator" ? "Quản trị viên" : "Người dùng"}
                  </Tag>
                </Space>
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card
              title="Thông tin người dùng"
              variant="outlined"
              styles={{ header: { padding: "12px 16px" }, body: { padding: 16 } }}
            >
              <Descriptions column={2} styles={{ label: labelStyle }}>
                <Descriptions.Item label="Email">
                  <Space>
                    <MailOutlined /> {user?.email || "N/A"}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  <Space>
                    <PhoneOutlined /> {user?.phone || "N/A"}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Vai trò">
                  {user?.role === "administrator" ? "Quản trị viên" : user?.role === "viewer" ? "Người dùng" : user?.role || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">{statusTag}</Descriptions.Item>
                <Descriptions.Item label="Lần đăng nhập cuối">
                  <Space direction="vertical" size={0}>
                    <Text strong>{formatRelative(user?.lastLoginAt)}</Text>
                    <Text type="secondary">{formatDate(user?.lastLoginAt)}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="IP đăng nhập cuối">{user?.lastLoginIp || "N/A"}</Descriptions.Item>
                <Descriptions.Item label="Vị trí cuối">
                  {user?.lastLoginLocation || "Không xác định"}
                </Descriptions.Item>
                <Descriptions.Item label="Tham gia">
                  <Space direction="vertical" size={0}>
                    <Text>{formatDate(user?.createdAt)}</Text>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              title="Vai trò & Quyền hạn"
              styles={{
                header: { padding: "16px 16px 0 16px" },
                body: { padding: 16 },
              }}
            >
              <Flex align="center" justify="space-between" wrap>
                <Space direction="vertical" size={4}>
                  <Text strong>Quyền người dùng</Text>
                  <Text type="secondary">
                    Chọn quyền để áp dụng nhóm quyền có sẵn (Quản trị viên/Người dùng).
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
                <Form.Item label="Vai trò">
                  <Select
                    value={roleValue}
                    onChange={(val) => setRoleValue(val as User["role"])}
                    style={{ maxWidth: 260 }}
                  >
                    <Option value="administrator">Quản trị viên</Option>
                    <Option value="viewer">Người dùng</Option>
                  </Select>
                </Form.Item>
              </Form>

              <Divider style={{ margin: "16px 0" }} />

              <Space direction="vertical" style={{ width: "100%" }} size="large">
                <div>
                  <Text strong>Quyền hạn</Text>
                  <Text type="secondary" style={{ display: "block" }}>
                    Các toggle này minh họa phạm vi quyền (không lưu backend).
                  </Text>
                </div>
                <div className="permissions-list" style={{ display: "grid", gap: 12 }}>
                  {[
                    {
                      title: "Quản lý người dùng",
                      desc: "Có thể xem, tạo, sửa, xóa người dùng.",
                      enabled: roleValue === "administrator",
                    },
                    {
                      title: "Quản lý nội dung",
                      desc: "Có thể tạo, sửa, xuất bản nội dung.",
                      enabled: roleValue === "administrator",
                    },
                    {
                      title: "Truy cập phân tích",
                      desc: "Có thể xem dashboards phân tích.",
                      enabled: roleValue === "administrator",
                    },
                    {
                      title: "Quản lý thanh toán",
                      desc: "Quản lý subscription và hóa đơn.",
                      enabled: roleValue === "administrator",
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
                          {item.enabled ? "Đã bật" : "Đã tắt"}
                        </Tag>
                      </Flex>
                    </Card>
                  ))}
                </div>
              </Space>
            </Card>

            <Card
              title="Nhật ký hoạt động"
              variant="outlined"
              styles={{ header: { padding: "12px 16px" }, body: { padding: 16 } }}
              style={{ marginTop: 24 }}
            >
              <Space direction="vertical">
                <Text type="secondary">Chưa có log hoạt động.</Text>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title="Thao tác tài khoản"
              variant="outlined"
              styles={{ header: { padding: "12px 16px" }, body: { padding: 16 } }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button 
                  block 
                  onClick={() => setIsPasswordResetModalVisible(true)}
                >
                  Gửi đặt lại mật khẩu
                </Button>
                {user?.suspended ? (
                  <Button 
                    block 
                    type="primary"
                    onClick={handleActivateAccount}
                  >
                    Kích hoạt tài khoản
                  </Button>
                ) : (
                  <Button 
                    block 
                    danger 
                    onClick={handleSuspendAccount}
                  >
                    Tạm ngưng tài khoản
                  </Button>
                )}
              </Space>
            </Card>

            <Card
              title="Vùng nguy hiểm"
              variant="outlined"
              styles={{ header: { color: "#b91c1c", padding: "12px 16px" }, body: { padding: 16 } }}
              style={{ marginTop: 24, borderColor: "rgba(248,113,113,0.5)" }}
            >
              <Text type="danger">Thao tác này không thể hoàn tác.</Text>
              <Divider />
              <Button block danger onClick={handleDeleteUser}>
                Xóa người dùng
              </Button>
            </Card>
          </Col>
        </Row>
      </Space>

      {/* Edit Modal */}
      <Modal
        title="Chỉnh sửa thông tin người dùng"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={() => editForm.submit()}
        confirmLoading={editSubmitting}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item label="Email">
            <Input value={user?.email} disabled />
          </Form.Item>
          <Form.Item
            label="Tên"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input placeholder="Nhập tên người dùng" />
          </Form.Item>
          <Form.Item
            label="Số điện thoại"
            name="phone"
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
          <Form.Item
            label="Giới thiệu"
            name="bio"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Nhập giới thiệu về người dùng"
            />
          </Form.Item>
          <Form.Item
            label="Xác thực email"
            name="email_verified"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        title="Đặt lại mật khẩu"
        open={isPasswordResetModalVisible}
        onCancel={() => {
          setIsPasswordResetModalVisible(false);
          passwordResetForm.resetFields();
        }}
        onOk={() => passwordResetForm.submit()}
        confirmLoading={passwordResetSubmitting}
        okText="Đặt lại"
        cancelText="Hủy"
        width={500}
      >
        <Form
          form={passwordResetForm}
          layout="vertical"
          onFinish={handlePasswordReset}
        >
          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>
          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
}

