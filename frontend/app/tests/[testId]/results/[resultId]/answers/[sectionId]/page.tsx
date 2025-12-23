"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin, Alert, Card, Table, Tag, Button, Divider, Row, Col } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { get, getAccess } from "@/helper/api";
import type { Answer, TestResult, TestSection } from "@/types/test";
import { THEME_COLORS } from "@/constants/colors";

const AnswerDetailPage: React.FC = () => {
  const params = useParams<{ testId: string; resultId: string; sectionId: string }>();
  const router = useRouter();
  const { testId, resultId, sectionId } = params;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [answer, setAnswer] = React.useState<Answer | null>(null);
  const [result, setResult] = React.useState<TestResult | null>(null);
  const [section, setSection] = React.useState<TestSection | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!testId || !resultId || !sectionId) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch answer data
        const answerRes = await getAccess(`answers/test/${testId}/section/${sectionId}`);
        
        // Fetch result data to show user answers
        const resultRes = await getAccess(`results/${resultId}`);
        
        // Fetch test data to get section info
        const testRes = await get(`tests/${testId}/full`);
        const sectionData = testRes.sections?.find((s: TestSection) => s._id === sectionId);

        setAnswer(answerRes);
        setResult(resultRes);
        setSection(sectionData || null);
      } catch (e: any) {
        console.error("Error loading answer data:", e);
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Không thể tải dữ liệu đáp án.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testId, resultId, sectionId]);

  // Create answer keys table data
  const answerKeysTableData = React.useMemo(() => {
    if (!answer?.answerKeys || !result) return [];

    return answer.answerKeys.map((key) => {
      const userAnswer = result.answers.find((a) => a.questionNumber === key.questionNumber);
      const userAnswerText = userAnswer?.userAnswer?.join(", ") || "Chưa trả lời";
      const correctAnswerText = key.correctAnswer.join(", ");
      const isCorrect = userAnswer?.isCorrect || false;

      return {
        key: key.questionNumber,
        questionNumber: key.questionNumber,
        userAnswer: userAnswerText,
        correctAnswer: correctAnswerText,
        isCorrect,
        alternatives: key.alternatives || [],
      };
    });
  }, [answer, result]);

  const answerKeysColumns = [
    {
      title: "Câu hỏi",
      dataIndex: "questionNumber",
      key: "questionNumber",
      width: 100,
      align: "center" as const,
    },
    {
      title: "Đáp án của bạn",
      dataIndex: "userAnswer",
      key: "userAnswer",
      render: (text: string, record: any) => (
        <span style={{ color: record.isCorrect ? THEME_COLORS.success : THEME_COLORS.error }}>
          {text}
        </span>
      ),
    },
    {
      title: "Đáp án đúng",
      dataIndex: "correctAnswer",
      key: "correctAnswer",
      render: (text: string, record: any) => (
        <div>
          <Tag style={{ backgroundColor: THEME_COLORS.primary, borderColor: THEME_COLORS.primary, color: "#fff" }}>
            {text}
          </Tag>
          {record.alternatives && record.alternatives.length > 0 && (
            <div style={{ marginTop: 4, fontSize: "12px", color: "#666" }}>
              (Cũng chấp nhận: {record.alternatives.join(", ")})
            </div>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Đang tải dữ liệu đáp án...</p>
      </div>
    );
  }

  if (error || !answer) {
    return (
      <div style={{ maxWidth: 1200, margin: "40px auto", padding: "0 16px" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{ marginBottom: 16 }}
        >
          Quay lại
        </Button>
        <Alert
          message="Không thể tải dữ liệu đáp án"
          description={error || "Đã có lỗi xảy ra khi tải dữ liệu."}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{ marginBottom: 16 }}
        >
          Quay lại
        </Button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
          {section?.title || `Part ${answer.partNumber}`} - Transcript & Answer Keys
        </h1>
      </div>

      {/* Audio Player */}
      {answer.audioUrl && (
        <Card title="Audio" style={{ marginBottom: 24 }}>
          <audio controls style={{ width: "100%" }}>
            <source src={answer.audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </Card>
      )}

      {/* Transcript and Answer Keys - Split Screen Layout */}
      <Row gutter={[24, 24]}>
        {/* Transcript - 6 parts (14 columns) on large screens */}
        <Col xs={24} lg={14}>
          <Card title="Transcript">
            <div
              style={{
                lineHeight: 1.8,
                fontSize: 16,
                color: "#333",
              }}
              dangerouslySetInnerHTML={{ __html: answer.transcriptHtml }}
            />
          </Card>
        </Col>

        {/* Answer Keys - 4 parts (10 columns) on large screens */}
        <Col xs={24} lg={10}>
          {answer.answerKeys && answer.answerKeys.length > 0 && (
            <div className="sticky-answer-keys">
              <Card title="Answer Keys & Your Results">
                <Table
                  dataSource={answerKeysTableData}
                  columns={answerKeysColumns}
                  pagination={false}
                  size="middle"
                  rowClassName={(record) => (record.isCorrect ? "correct-row" : "incorrect-row")}
                />
              </Card>
            </div>
          )}
        </Col>
      </Row>
      <style jsx global>{`
        .correct-row {
          background-color: #f6ffed;
        }
        .incorrect-row {
          background-color: #fff1f0;
        }
        .sticky-answer-keys {
          position: sticky;
          top: 24px;
        }
        @media (max-width: 991px) {
          .sticky-answer-keys {
            position: relative;
            top: 0;
          }
        }
      `}</style>

      {/* Summary Stats */}
      {result && answer.answerKeys && (
        <Card title="Summary">
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, color: "#666" }}>Tổng số câu hỏi</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>
                {answer.answerKeys.length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "#666" }}>Số câu đúng</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4, color: THEME_COLORS.success }}>
                {answerKeysTableData.filter((d) => d.isCorrect).length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "#666" }}>Số câu sai</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4, color: "#ff4d4f" }}>
                {answerKeysTableData.filter((d) => !d.isCorrect).length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "#666" }}>Tỷ lệ đúng</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>
                {answer.answerKeys.length > 0
                  ? Math.round(
                      (answerKeysTableData.filter((d) => d.isCorrect).length /
                        answer.answerKeys.length) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnswerDetailPage;

