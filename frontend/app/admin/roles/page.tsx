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

type RoleKey = "administrator" | "editor" | "viewer" | "support";

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
  editor: {
    icon: <EditOutlined />,
    name: "Biên tập viên",
    desc: "Có thể tạo, chỉnh sửa và xuất bản nội dung.",
  },
  viewer: {
    icon: <EyeOutlined />,
    name: "Người xem",
    desc: "Chỉ có quyền xem nội dung, không thể chỉnh sửa.",
  },
  support: {
    icon: <CustomerServiceOutlined />,
    name: "Nhân viên hỗ trợ",
    desc: "Có thể xem dữ liệu người dùng và phản hồi yêu cầu.",
  },
};

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "user-mgmt",
    title: "Quản lý người dùng",
    permissions: [
      { key: "user:create", label: "Tạo người dùng", description: "Cho phép tạo tài khoản người dùng mới." },
      { key: "user:edit", label: "Chỉnh sửa người dùng", description: "Cho phép chỉnh sửa thông tin người dùng hiện có." },
      { key: "user:delete", label: "Xóa người dùng", description: "Cho phép xóa vĩnh viễn tài khoản người dùng." },
      { key: "user:view", label: "Xem danh sách người dùng", description: "Cho phép xem danh sách đầy đủ người dùng." },
    ],
  },
  {
    key: "content",
    title: "Quản lý nội dung",
    permissions: [
      { key: "content:publish", label: "Xuất bản nội dung", description: "Cho phép xuất bản bài viết hoặc bài đăng mới." },
      { key: "content:categories", label: "Quản lý danh mục", description: "Cho phép tạo và chỉnh sửa danh mục nội dung." },
    ],
  },
  {
    key: "posts",
    title: "Quản lý bài viết",
    permissions: [
      { key: "post:create", label: "Tạo bài viết", description: "Cho phép tạo bài viết mới." },
      { key: "post:edit", label: "Chỉnh sửa bài viết", description: "Cho phép chỉnh sửa bài viết của người khác." },
      { key: "post:delete", label: "Xóa bài viết", description: "Cho phép xóa bài viết của người khác." },
      { key: "post:view", label: "Xem bài viết", description: "Cho phép xem tất cả bài viết." },
      { key: "post:moderate", label: "Kiểm duyệt bài viết", description: "Cho phép phê duyệt hoặc từ chối bài viết." },
    ],
  },
  {
    key: "billing",
    title: "Thanh toán",
    permissions: [
      { key: "billing:view", label: "Xem hóa đơn", description: "Cho phép xem hóa đơn trước và hiện tại." },
      { key: "billing:manage", label: "Quản lý gói đăng ký", description: "Cho phép thay đổi gói đăng ký." },
    ],
  },
];

const PRESET_PERMS: Record<RoleKey, Record<string, boolean>> = {
  administrator: PERMISSION_GROUPS.reduce((acc, g) => {
    g.permissions.forEach((p) => (acc[p.key] = true));
    return acc;
  }, {} as Record<string, boolean>),
  editor: {
    "user:create": false,
    "user:edit": false,
    "user:delete": false,
    "user:view": true,
    "content:publish": true,
    "content:categories": true,
    "post:create": true,
    "post:edit": true,
    "post:delete": false,
    "post:view": true,
    "post:moderate": true,
    "billing:view": false,
    "billing:manage": false,
  },
  viewer: {
    "user:create": false,
    "user:edit": false,
    "user:delete": false,
    "user:view": true,
    "content:publish": false,
    "content:categories": false,
    "post:create": true,
    "post:edit": false,
    "post:delete": false,
    "post:view": true,
    "post:moderate": false,
    "billing:view": false,
    "billing:manage": false,
  },
  support: {
    "user:create": false,
    "user:edit": true,
    "user:delete": false,
    "user:view": true,
    "content:publish": false,
    "content:categories": false,
    "post:create": false,
    "post:edit": false,
    "post:delete": false,
    "post:view": true,
    "post:moderate": false,
    "billing:view": true,
    "billing:manage": false,
  },
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
              <Button type="primary" block icon={<PlusOutlined />}>
                Tạo vai trò mới
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

