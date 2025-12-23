"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Tag, Spin, Alert, Row, Col, Tabs, Checkbox } from "antd";
import type { TabsProps } from "antd";
import { RightOutlined } from "@ant-design/icons";
import { get } from "@/helper/api";
import type { TestSection } from "@/types/test";
import { checkAuth } from "@/lib/helper";
import { useMessageApi } from "@/components/providers/Message";

interface TestStructureResponse {
  _id: string;
  title: string;
  testType?: string;
  durationMinutes?: number;
  totalQuestions?: number;
  sections: TestSection[];
}

const SectionsPage: React.FC = () => {
  const params = useParams<{ testId: string }>();
  const router = useRouter();
  const testId = params?.testId;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [test, setTest] = React.useState<TestStructureResponse | null>(null);
  const [selectedSectionIds, setSelectedSectionIds] = React.useState<string[]>([]);
  const messageApi = useMessageApi();

  React.useEffect(() => {
    const fetchStructure = async () => {
      if (!testId) return;
      setLoading(true);
      setError(null);

      try {
        const data = await get(`tests/${testId}/structure`);
        if (!data || !Array.isArray(data.sections)) {
          setError("Không lấy được thông tin các section của bài test.");
          return;
        }
        setTest(data);
      } catch (e: any) {
        console.error("Lỗi khi tải cấu trúc bài test:", e);
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Không thể tải thông tin bài test.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchStructure();
  }, [testId]);

  const handleStartSection = (sectionId: string) => {
    // Yêu cầu đăng nhập trước khi bắt đầu làm bài
    if (!checkAuth()) {
      messageApi?.warning("Vui lòng đăng nhập trước khi bắt đầu làm bài.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("openAuthModal"));
      }
      return;
    }

    if (!test) return;
    const allSelected =
      selectedSectionIds.length > 0 ? selectedSectionIds : [sectionId];
    const query = `?sections=${encodeURIComponent(allSelected.join(","))}`;
    router.push(`/tests/${test._id}/sections/${sectionId}${query}`);
  };

  const toggleSelectSection = (sectionId: string) => {
    setSelectedSectionIds((prev) => {
      if (prev.includes(sectionId)) {
        return prev.filter((id) => id !== sectionId);
      }
      return [...prev, sectionId];
    });
  };

  const handleStartSelected = () => {
    // Yêu cầu đăng nhập trước khi bắt đầu làm bài
    if (!checkAuth()) {
      messageApi?.warning("Vui lòng đăng nhập trước khi bắt đầu làm bài.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("openAuthModal"));
      }
      return;
    }

    if (!test || selectedSectionIds.length === 0) return;
    const first = selectedSectionIds[0];
    const query = `?sections=${encodeURIComponent(selectedSectionIds.join(","))}`;
    router.push(`/tests/${test._id}/sections/${first}${query}`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Đang tải cấu trúc bài test...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div style={{ maxWidth: 800, margin: "40px auto" }}>
        <Alert
          message="Không thể tải bài test"
          description={error || "Đã có lỗi xảy ra khi tải dữ liệu."}
          type="error"
          showIcon
        />
      </div>
    );
  }

  const sections = test.sections || [];

  const tabsItems: TabsProps["items"] = [
    {
      key: "practice",
      label: "Luyện tập",
      children: (
        <div>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Pro tips: Hình thức luyện tập từng phần và chọn mức thời gian phù hợp sẽ giúp bạn tập trung vào giải đúng các câu hỏi thay vì phải chịu áp lực hoàn thành bài thi."
          />

          {sections.length === 0 ? (
            <Alert
              message="Bài test này chưa có section nào."
              type="info"
              showIcon
            />
          ) : (
            <>
              <div style={{ marginBottom: 12, fontWeight: 500 }}>
                Chọn phần bạn muốn luyện (có thể chọn 1, 2, 3 hoặc cả 4 phần):
              </div>
              {sections.map((section, index) => {
                const checked = selectedSectionIds.includes(section._id);
                return (
                  <Card
                    key={section._id}
                    style={{ marginBottom: 16 }}
                    styles={{
                      body: {
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      },
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleSelectSection(section._id)}
                      style={{ marginRight: 8 }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginBottom: 4 }}>
                        Phần {index + 1}: {section.title}
                      </h3>
                      <div style={{ marginBottom: 4, color: "#555" }}>
                        Câu hỏi {section.questionRange[0]} -{" "}
                        {section.questionRange[1]}
                      </div>
                      {section.sectionType && (
                        <Tag color="blue">{section.sectionType}</Tag>
                      )}
                    </div>
                    <Button
                      type="primary"
                      icon={<RightOutlined />}
                      onClick={() => handleStartSection(section._id)}
                    >
                      Luyện phần {index + 1}
                    </Button>
                  </Card>
                );
              })}
              <div style={{ textAlign: "right", marginTop: 8 }}>
                <Button
                  type="primary"
                  disabled={selectedSectionIds.length === 0}
                  onClick={handleStartSelected}
                >
                  Bắt đầu luyện các phần đã chọn
                </Button>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      key: "full",
      label: "Làm full test",
      children: (
        <Alert
          type="warning"
          showIcon
          message="Chế độ làm full test đang được phát triển. Hiện tại bạn có thể luyện tập theo từng phần."
        />
      ),
    },
  ];

  return (
    <div style={{ padding: "24px 32px" }}>
      <Card style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>{test.title}</h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 14 }}>
          {typeof test.durationMinutes === "number" && (
            <span>Thời gian: {test.durationMinutes} phút</span>
          )}
          {typeof test.totalQuestions === "number" && (
            <span>| Tổng số câu: {test.totalQuestions}</span>
          )}
        </div>
      </Card>

      <Tabs defaultActiveKey="practice" items={tabsItems} />
    </div>
  );
};

export default SectionsPage;


