"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Input,
  Row,
  Space,
  Typography,
  Tag,
  Checkbox,
  List,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  CustomerServiceOutlined,
  ReloadOutlined,
  SaveOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { getRolePresets, updateRolePreset } from "@/service/users";
import { useMessageApi } from "@/components/providers/Message";

const { Title, Text } = Typography;

type RoleKey = "administrator" | "viewer";

type Permission = {
  key: string;
  label: string;
  description: string;
};

type PermissionGroup = {
  key: string;
  title: string;
  permissions: Permission[];
};

const ROLE_META: Record<RoleKey, { icon: React.ReactNode; name: string; desc: string }> = {
  administrator: {
    icon: <SafetyOutlined />,
    name: "Quản trị viên",
    desc: "Quyền truy cập đầy đủ vào tất cả tính năng và cài đặt.",
  },
  viewer: {
    icon: <EyeOutlined />,
    name: "Người dùng",
    desc: "Người dùng cơ bản có thể xem và tạo nội dung cá nhân.",
  },
};

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "user-mgmt",
    title: "Quản lý người dùng",
    permissions: [
      { key: "user:create", label: "Tạo người dùng", description: "Cho phép tạo tài khoản người dùng mới." },
      { key: "user:edit", label: "Chỉnh sửa người dùng", description: "Cho phép chỉnh sửa thông tin người dùng." },
      { key: "user:edit-any", label: "Chỉnh sửa mọi người dùng", description: "Cho phép chỉnh sửa thông tin của bất kỳ người dùng nào." },
      { key: "user:delete", label: "Xóa người dùng", description: "Cho phép xóa tài khoản người dùng." },
      { key: "user:view", label: "Xem danh sách người dùng", description: "Cho phép xem danh sách người dùng." },
      { key: "user:suspend", label: "Tạm ngưng người dùng", description: "Cho phép tạm ngưng tài khoản người dùng." },
      { key: "user:activate", label: "Kích hoạt người dùng", description: "Cho phép kích hoạt lại tài khoản." },
    ],
  },
  {
    key: "content",
    title: "Quản lý nội dung",
    permissions: [
      { key: "content:publish", label: "Xuất bản nội dung", description: "Cho phép xuất bản nội dung mới." },
      { key: "content:categories", label: "Quản lý danh mục", description: "Cho phép tạo và chỉnh sửa danh mục." },
      { key: "content:edit-any", label: "Chỉnh sửa mọi nội dung", description: "Cho phép chỉnh sửa nội dung của bất kỳ ai." },
      { key: "content:delete-any", label: "Xóa mọi nội dung", description: "Cho phép xóa nội dung của bất kỳ ai." },
    ],
  },
  {
    key: "posts",
    title: "Quản lý bài viết",
    permissions: [
      { key: "post:create", label: "Tạo bài viết", description: "Cho phép tạo bài viết mới." },
      { key: "post:edit", label: "Chỉnh sửa bài viết", description: "Cho phép chỉnh sửa bài viết riêng." },
      { key: "post:edit-any", label: "Chỉnh sửa mọi bài viết", description: "Cho phép chỉnh sửa bài viết của bất kỳ ai." },
      { key: "post:delete", label: "Xóa bài viết", description: "Cho phép xóa bài viết riêng." },
      { key: "post:delete-any", label: "Xóa mọi bài viết", description: "Cho phép xóa bài viết của bất kỳ ai." },
      { key: "post:view", label: "Xem bài viết", description: "Cho phép xem tất cả bài viết." },
      { key: "post:moderate", label: "Kiểm duyệt bài viết", description: "Cho phép phê duyệt hoặc từ chối bài viết." },
    ],
  },
  {
    key: "comments",
    title: "Quản lý bình luận",
    permissions: [
      { key: "comment:create", label: "Tạo bình luận", description: "Cho phép tạo bình luận mới." },
      { key: "comment:edit", label: "Chỉnh sửa bình luận", description: "Cho phép chỉnh sửa bình luận riêng." },
      { key: "comment:edit-any", label: "Chỉnh sửa mọi bình luận", description: "Cho phép chỉnh sửa bình luận của bất kỳ ai." },
      { key: "comment:delete", label: "Xóa bình luận", description: "Cho phép xóa bình luận riêng." },
      { key: "comment:delete-any", label: "Xóa mọi bình luận", description: "Cho phép xóa bình luận của bất kỳ ai." },
      { key: "comment:moderate", label: "Kiểm duyệt bình luận", description: "Cho phép kiểm duyệt bình luận." },
    ],
  },
  {
    key: "courses",
    title: "Quản lý khóa học",
    permissions: [
      { key: "course:create", label: "Tạo khóa học", description: "Cho phép tạo khóa học mới." },
      { key: "course:edit", label: "Chỉnh sửa khóa học", description: "Cho phép chỉnh sửa khóa học riêng." },
      { key: "course:edit-any", label: "Chỉnh sửa mọi khóa học", description: "Cho phép chỉnh sửa khóa học của bất kỳ ai." },
      { key: "course:delete", label: "Xóa khóa học", description: "Cho phép xóa khóa học." },
      { key: "course:view", label: "Xem khóa học", description: "Cho phép xem khóa học." },
      { key: "course:publish", label: "Xuất bản khóa học", description: "Cho phép xuất bản khóa học." },
    ],
  },
  {
    key: "tests",
    title: "Quản lý bài kiểm tra",
    permissions: [
      { key: "test:create", label: "Tạo bài test", description: "Cho phép tạo bài test mới." },
      { key: "test:edit", label: "Chỉnh sửa bài test", description: "Cho phép chỉnh sửa bài test." },
      { key: "test:edit-any", label: "Chỉnh sửa mọi bài test", description: "Cho phép chỉnh sửa bài test của bất kỳ ai." },
      { key: "test:delete", label: "Xóa bài test", description: "Cho phép xóa bài test." },
      { key: "test:view", label: "Xem bài test", description: "Cho phép xem bài test." },
    ],
  },
  {
    key: "flashcards",
    title: "Quản lý flashcards",
    permissions: [
      { key: "flashcard:create", label: "Tạo flashcard", description: "Cho phép tạo flashcard mới." },
      { key: "flashcard:edit", label: "Chỉnh sửa flashcard", description: "Cho phép chỉnh sửa flashcard." },
      { key: "flashcard:edit-any", label: "Chỉnh sửa mọi flashcard", description: "Cho phép chỉnh sửa flashcard của bất kỳ ai." },
      { key: "flashcard:delete", label: "Xóa flashcard", description: "Cho phép xóa flashcard." },
      { key: "flashcard:view", label: "Xem flashcard", description: "Cho phép xem flashcard." },
    ],
  },
  {
    key: "enrollment",
    title: "Quản lý ghi danh",
    permissions: [
      { key: "enrollment:create", label: "Tạo ghi danh", description: "Cho phép tạo ghi danh mới." },
      { key: "enrollment:edit", label: "Chỉnh sửa ghi danh", description: "Cho phép chỉnh sửa ghi danh." },
      { key: "enrollment:delete", label: "Xóa ghi danh", description: "Cho phép xóa ghi danh." },
      { key: "enrollment:view-all", label: "Xem tất cả ghi danh", description: "Cho phép xem tất cả ghi danh." },
    ],
  },
  {
    key: "payment",
    title: "Quản lý thanh toán",
    permissions: [
      { key: "payment:view-all", label: "Xem thanh toán", description: "Cho phép xem tất cả thanh toán." },
      { key: "payment:manage", label: "Quản lý thanh toán", description: "Cho phép quản lý thanh toán." },
      { key: "payment:refund", label: "Hoàn tiền", description: "Cho phép hoàn tiền." },
      { key: "billing:view", label: "Xem hóa đơn", description: "Cho phép xem hóa đơn." },
      { key: "billing:manage", label: "Quản lý gói đăng ký", description: "Cho phép thay đổi gói đăng ký." },
    ],
  },
  {
    key: "social",
    title: "Quản lý xã hội",
    permissions: [
      { key: "chat:view-all", label: "Xem tất cả chat", description: "Cho phép xem tất cả cuộc trò chuyện." },
      { key: "chat:moderate", label: "Kiểm duyệt chat", description: "Cho phép kiểm duyệt tin nhắn." },
      { key: "friend:view-all", label: "Xem tất cả kết bạn", description: "Cho phép xem tất cả kết nối bạn bè." },
      { key: "friend:manage", label: "Quản lý kết bạn", description: "Cho phép quản lý kết nối bạn bè." },
    ],
  },
  {
    key: "statistics",
    title: "Thống kê",
    permissions: [
      { key: "statistics:view-all", label: "Xem thống kê", description: "Cho phép xem tất cả thống kê hệ thống." },
    ],
  },
];

const PRESET_PERMS: Record<RoleKey, Record<string, boolean>> = {
  administrator: PERMISSION_GROUPS.reduce((acc, g) => {
    g.permissions.forEach((p) => (acc[p.key] = true));
    return acc;
  }, {} as Record<string, boolean>),
  viewer: PERMISSION_GROUPS.reduce((acc, g) => {
    g.permissions.forEach((p) => {
      // Viewer only has basic permissions
      acc[p.key] = [
        "post:create",
        "post:view",
        "post:edit",
        "comment:create",
        "comment:view",
        "comment:edit",
        "course:view",
        "test:view",
        "flashcard:view",
      ].includes(p.key);
    });
    return acc;
  }, {} as Record<string, boolean>),
};

export default function RolesManagementPage() {
  const messageApi = useMessageApi();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RoleKey>("administrator");
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [presets, setPresets] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);

  const list = useMemo(() => {
    const entries = Object.entries(ROLE_META) as [RoleKey, (typeof ROLE_META)[RoleKey]][];
    return entries.filter(([, meta]) => meta.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const perms = useMemo(() => {
    // Use presets from API if available, otherwise use local presets
    const base = presets[selected] || PRESET_PERMS[selected];
    return { ...base, ...overrides };
  }, [selected, overrides, presets]);

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        setLoading(true);
        const data = await getRolePresets();
        // Convert array of permissions to object with boolean values
        const presetsObj: Record<string, Record<string, boolean>> = {};
        Object.entries(data).forEach(([role, permissions]) => {
          presetsObj[role] = {};
          // Initialize all permissions to false first
          PERMISSION_GROUPS.forEach((group) => {
            group.permissions.forEach((p) => {
              presetsObj[role][p.key] = false;
            });
          });
          // Set enabled permissions to true
          (permissions as string[]).forEach((perm) => {
            presetsObj[role][perm] = true;
          });
        });
        setPresets(presetsObj);
      } catch (error) {
        console.error('Error fetching role presets:', error);
        // Fallback to local presets
        const presetsObj: Record<string, Record<string, boolean>> = {};
        Object.keys(PRESET_PERMS).forEach((role) => {
          presetsObj[role] = PRESET_PERMS[role as RoleKey];
        });
        setPresets(presetsObj);
      } finally {
        setLoading(false);
      }
    };
    fetchPresets();
  }, []);

  const handleToggle = (key: string, value: boolean) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectRole = (key: RoleKey) => {
    setSelected(key);
    setOverrides({});
  };

  const handleReset = () => setOverrides({});

  const handleSave = async () => {
    setSaving(true);
    try {
      const permissions = Object.entries(perms)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key);
      
      await updateRolePreset(selected, permissions);

      // Update local presets
      setPresets((prev) => ({
        ...prev,
        [selected]: perms,
      }));

      // Reset overrides after successful save
      setOverrides({});
      messageApi.success('Cập nhật quyền hạn thành công!');
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      messageApi.error(
        error?.response?.data?.message || 'Không thể lưu quyền hạn. Vui lòng thử lại.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
            Vai trò & Quyền hạn
          </Title>
          <Text type="secondary">Quản lý kiểm soát truy cập cho ứng dụng.</Text>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            variant="outlined"
            styles={{ header: { padding: "12px 16px" }, body: { padding: 12 } }}
            title={
            <Button type="primary" block icon={<PlusOutlined />} disabled>
              Tạo vai trò mới (Không khả dụng)
              </Button>
            }
          >
            <Input
              placeholder="Tìm kiếm vai trò..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 12 }}
            />

            <List
              dataSource={list}
              renderItem={([key, meta]) => {
                const active = key === selected;
                return (
                  <List.Item
                    onClick={() => handleSelectRole(key)}
                    style={{
                      cursor: "pointer",
                      borderRadius: 8,
                      padding: 12,
                      background: active ? "rgba(19, 127, 236, 0.08)" : undefined,
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: active ? "rgba(19, 127, 236, 0.16)" : "#f3f4f6",
                            color: active ? "#137fec" : "#4b5563",
                          }}
                        >
                          {meta.icon}
                        </div>
                      }
                      title={
                        <Space direction="vertical" size={0}>
                          <Text strong style={{ color: active ? "#137fec" : undefined }}>
                            {meta.name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {meta.desc}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            variant="outlined"
            styles={{ header: { padding: "12px 16px" }, body: { padding: 16 } }}
            title={`Quyền hạn cho ${ROLE_META[selected].name}`}
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  Đặt lại
                </Button>
                <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                  Lưu thay đổi
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              {PERMISSION_GROUPS.map((group) => (
                <Card
                  key={group.key}
                  size="small"
                  variant="outlined"
                  styles={{ header: { padding: "10px 12px" }, body: { padding: 12 } }}
                  title={
                    <Flex align="center" justify="space-between">
                      <Text strong>{group.title}</Text>
                      <Checkbox
                        checked={group.permissions.every((p) => perms[p.key])}
                        indeterminate={
                          group.permissions.some((p) => perms[p.key]) &&
                          !group.permissions.every((p) => perms[p.key])
                        }
                        onChange={(e) =>
                          group.permissions.forEach((p) => handleToggle(p.key, e.target.checked))
                        }
                      >
                        Chọn tất cả
                      </Checkbox>
                    </Flex>
                  }
                >
                  <Row gutter={[12, 12]}>
                    {group.permissions.map((perm) => (
                      <Col xs={24} sm={12} key={perm.key}>
                        <Card
                          size="small"
                          variant="outlined"
                          styles={{ body: { padding: 10 } }}
                          hoverable
                        >
                          <Space align="start">
                            <Checkbox
                              checked={!!perms[perm.key]}
                              onChange={(e) => handleToggle(perm.key, e.target.checked)}
                            />
                            <Space direction="vertical" size={0}>
                              <Text strong>{perm.label}</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {perm.description}
                              </Text>
                            </Space>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

