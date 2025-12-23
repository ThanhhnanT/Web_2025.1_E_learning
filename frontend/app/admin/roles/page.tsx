"use client";

import { useMemo, useState } from "react";
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
    name: "Administrator",
    desc: "Full access to all features and settings.",
  },
  editor: {
    icon: <EditOutlined />,
    name: "Editor",
    desc: "Can create, edit, and publish content.",
  },
  viewer: {
    icon: <EyeOutlined />,
    name: "Viewer",
    desc: "Read-only access to view content.",
  },
  support: {
    icon: <CustomerServiceOutlined />,
    name: "Support Agent",
    desc: "Can view user data and respond to tickets.",
  },
};

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "user-mgmt",
    title: "User Management",
    permissions: [
      { key: "create-user", label: "Create User", description: "Allows creating new user accounts." },
      { key: "edit-user", label: "Edit User", description: "Allows modifying existing user profiles." },
      { key: "delete-user", label: "Delete User", description: "Allows permanently deleting user accounts." },
      { key: "view-users", label: "View User List", description: "Allows viewing the complete list of users." },
    ],
  },
  {
    key: "content",
    title: "Content Settings",
    permissions: [
      { key: "publish", label: "Publish Content", description: "Allows publishing new articles or posts." },
      { key: "categories", label: "Manage Categories", description: "Allows creating and editing content categories." },
    ],
  },
  {
    key: "billing",
    title: "Billing",
    permissions: [
      { key: "view-invoices", label: "View Invoices", description: "Allows viewing past and current invoices." },
      { key: "manage-sub", label: "Manage Subscription", description: "Allows changing the subscription plan." },
    ],
  },
];

const PRESET_PERMS: Record<RoleKey, Record<string, boolean>> = {
  administrator: PERMISSION_GROUPS.reduce((acc, g) => {
    g.permissions.forEach((p) => (acc[p.key] = true));
    return acc;
  }, {} as Record<string, boolean>),
  editor: {
    "create-user": false,
    "edit-user": false,
    "delete-user": false,
    "view-users": true,
    publish: true,
    categories: true,
    "view-invoices": false,
    "manage-sub": false,
  },
  viewer: {
    "create-user": false,
    "edit-user": false,
    "delete-user": false,
    "view-users": true,
    publish: false,
    categories: false,
    "view-invoices": false,
    "manage-sub": false,
  },
  support: {
    "create-user": false,
    "edit-user": true,
    "delete-user": false,
    "view-users": true,
    publish: false,
    categories: false,
    "view-invoices": true,
    "manage-sub": false,
  },
};

export default function RolesManagementPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RoleKey>("administrator");
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const list = useMemo(() => {
    const entries = Object.entries(ROLE_META) as [RoleKey, (typeof ROLE_META)[RoleKey]][];
    return entries.filter(([, meta]) => meta.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const perms = useMemo(() => {
    const base = PRESET_PERMS[selected];
    return { ...base, ...overrides };
  }, [selected, overrides]);

  const handleToggle = (key: string, value: boolean) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectRole = (key: RoleKey) => {
    setSelected(key);
    setOverrides({});
  };

  const handleReset = () => setOverrides({});

  const handleSave = async () => {
    // Placeholder: here would call backend to save custom permissions if implemented
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
    }, 500);
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
            Roles & Permissions
          </Title>
          <Text type="secondary">Manage access control for application.</Text>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            variant="outlined"
            styles={{ header: { padding: "12px 16px" }, body: { padding: 12 } }}
            title={
              <Button type="primary" block icon={<PlusOutlined />}>
                Create New Role
              </Button>
            }
          >
            <Input
              placeholder="Search roles..."
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
            title={`Permissions for ${ROLE_META[selected].name}`}
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  Reset
                </Button>
                <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                  Save Changes
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
                        Select All
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

