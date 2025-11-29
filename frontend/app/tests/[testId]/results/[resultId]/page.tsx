"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Spin, Alert } from "antd";
import { get, getAccess } from "@/helper/api";
import ReviewPanel from "@/components/test-taking/ReviewPanel";
import type { Test, TestResult } from "@/types/test";

const TestResultReviewPage: React.FC = () => {
  const params = useParams<{ testId: string; resultId: string }>();
  const { testId, resultId } = params;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [test, setTest] = React.useState<Test | null>(null);
  const [result, setResult] = React.useState<TestResult | null>(null);
  const [selectedSectionIds, setSelectedSectionIds] = React.useState<string[] | undefined>(undefined);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!testId || !resultId) return;
      setLoading(true);
      setError(null);
      try {
        // Đọc selectedSectionIds từ localStorage
        if (typeof window !== "undefined") {
          const key = `test_${testId}_selectedSections`;
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSelectedSectionIds(parsed);
              }
            } catch (e) {
              console.warn("Failed to parse selectedSections from localStorage:", e);
            }
          }
        }

        const [testRes, resultRes] = await Promise.all([
          get(`tests/${testId}/full`),
          getAccess(`results/${resultId}`),
        ]);
        setTest(testRes);
        setResult(resultRes);
      } catch (e: any) {
        console.error("Error loading review data:", e);
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Không thể tải dữ liệu kết quả.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testId, resultId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Đang tải kết quả...</p>
      </div>
    );
  }

  if (error || !test || !result) {
    return (
      <div style={{ maxWidth: 800, margin: "40px auto" }}>
        <Alert
          message="Không thể tải kết quả"
          description={error || "Đã có lỗi xảy ra khi tải dữ liệu."}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 32px" }}>
      <ReviewPanel 
        result={result} 
        test={{ title: test.title, sections: test.sections || [] }}
        selectedSectionIds={selectedSectionIds}
      />
    </div>
  );
};

export default TestResultReviewPage;


