"use client";

import React from "react";
import Link from "next/link";
import { Pagination, Card, Tag, Button, Row, Col, Spin, Alert } from "antd";
import { ClockCircleOutlined, UserOutlined, MessageOutlined } from "@ant-design/icons";
import { get } from "@/helper/api";
import styles from "@/styles/testList.module.css";

export type Test = {
  _id: string;
  title: string;
  series?: string;
  testNumber?: string;
  durationMinutes: number;
  totalQuestions: number;
  totalUser: number;
  totalComment: number;
  hastag: string[];
  skill?: string;
  externalSlug?: string;
  sourceUrl?: string;
};

type PaginationInfo = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type SkillOption = "all" | "reading" | "listening" | "speaking" | "writing";

type TestListProps = {
  keyword?: string;
  skill?: SkillOption;
  tests?: Test[]; // nếu cha truyền vào thì dùng (backward compatibility)
  itemsPerPage?: number;
};

const TestCard: React.FC<{ test: Test }> = ({ test }) => {
  const href = `/tests/${test._id}/sections`;

  return (
    <Link href={href} style={{ width: "100%" }}>
      <Card className={styles.testCard} hoverable>
        <h3 className={styles.title}>{test.title}</h3>
        <p className={styles.info}>
          <ClockCircleOutlined /> {test.durationMinutes} phút &nbsp; | &nbsp;
          <UserOutlined /> {test.totalUser} &nbsp; | &nbsp;
          <MessageOutlined /> {test.totalComment}
        </p>
        <p className={styles.desc}>
          {test.series && test.testNumber
            ? `${test.series} - ${test.testNumber}`
            : test.series || test.testNumber || ""}
          {test.totalQuestions ? ` | ${test.totalQuestions} câu hỏi` : ""}
        </p>
        {test.hastag && test.hastag.length > 0 && (
          <div className={styles.tags}>
            {test.hastag.map((tag, index) => (
              <Tag
                key={`${test._id}-tag-${index}-${tag}`}
                color="blue"
                className={styles.tag}
              >
                #{tag}
              </Tag>
            ))}
          </div>
        )}
        <Button type="default" className={styles.detailBtn}>
          Chi tiết
        </Button>
      </Card>
    </Link>
  );
};

const TestList: React.FC<TestListProps> = ({
  keyword = "",
  skill = "all",
  tests: initialTestsProp,
  itemsPerPage = 10,
}) => {
  const initialTests = React.useMemo<Test[]>(() => initialTestsProp ?? [], [initialTestsProp]);
  const [tests, setTests] = React.useState<Test[]>(initialTests);
  const [pagination, setPagination] = React.useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const pageSize = itemsPerPage;

  // Nếu parent truyền tests (initialTests) thì dùng ngay, không fetch từ API
  React.useEffect(() => {
    if (initialTests.length > 0) {
      setTests(initialTests);
      setPagination(null);
      setCurrentPage(1);
      setError(null);
      return;
    }
  }, [initialTests]);

  // Fetch từ API khi không có initialTests và khi currentPage thay đổi
  React.useEffect(() => {
    if (initialTests.length > 0) {
      return; // Không fetch nếu có initialTests
    }

    const fetchTests = async () => {
      setLoading(true);
      setError(null);
      try {
        const skillQuery = skill && skill !== "all" ? `&skill=${skill}` : "";
        const payload = await get(`tests?page=${currentPage}&pageSize=${pageSize}${skillQuery}`);
        const data = payload?.data;
        const pageMeta = payload?.pagination;
        if (Array.isArray(data) && pageMeta) {
          setTests(data);
          setPagination(pageMeta);
        } else {
          console.error("Unexpected tests payload:", payload);
          setError("Dữ liệu không hợp lệ từ server");
        }
      } catch (err: any) {
        console.error("Lỗi fetch tests:", err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tải danh sách bài test";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [currentPage, pageSize, initialTests, skill]);

  // Filter tests theo keyword + skill (client-side filtering)
  const filteredTests = React.useMemo(() => {
    const lowerSkill = skill.toLowerCase();
    const skillFiltered =
      skill === "all"
        ? tests
        : tests.filter((t) => (t.skill || "").toLowerCase() === lowerSkill);

    if (!keyword || keyword.trim() === "") {
      return skillFiltered;
    }

    const lower = keyword.toLowerCase().trim();
    return skillFiltered.filter(
      (t) =>
        (t.title || "").toLowerCase().includes(lower) ||
        (t.series || "").toLowerCase().includes(lower) ||
        (t.testNumber || "").toLowerCase().includes(lower) ||
        (t.hastag || []).some((tag) => tag.toLowerCase().includes(lower))
    );
  }, [tests, keyword, skill]);

  // Reset về trang 1 khi keyword thay đổi
  React.useEffect(() => {
    if (initialTests.length === 0) {
      setCurrentPage(1);
    }
  }, [keyword, skill, initialTests.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error && tests.length === 0) {
    return (
      <Alert
        message="Lỗi"
        description={error}
        type="error"
        showIcon
        style={{ margin: "20px 0" }}
      />
    );
  }

  // Client-side pagination cho initialTests
  const startIndex = initialTests.length > 0 ? (currentPage - 1) * pageSize : 0;
  const endIndex = initialTests.length > 0 ? startIndex + pageSize : filteredTests.length;
  const displayTests = initialTests.length > 0 
    ? filteredTests.slice(startIndex, endIndex)
    : filteredTests;

  return (
    <div>
      {loading && tests.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Đang tải danh sách bài test...</p>
        </div>
      ) : displayTests.length > 0 ? (
        <Row gutter={[16, 16]} justify="center" align="stretch">
          {displayTests.map((test, index) => (
            <Col key={test._id || `test-${index}`} xs={12} sm={12} md={8} lg={6} style={{ display: "flex" }}>
              <TestCard test={test} />
            </Col>
          ))}
        </Row>
      ) : (
        <p style={{ textAlign: "center", marginTop: 20 }}>
          {loading ? "Đang tải..." : "Không tìm thấy kết quả nào"}
        </p>
      )}

      {/* Pagination - server-side khi fetch từ API */}
      {initialTests.length === 0 && pagination && pagination.totalPages > 1 && (
        <div className={styles.paginationWrapper}>
          <Pagination
            current={currentPage}
            total={pagination.totalItems}
            pageSize={pagination.pageSize}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      )}

      {/* Client-side pagination cho initialTests (backward compatibility) */}
      {initialTests.length > 0 && filteredTests.length > pageSize && (
        <div className={styles.paginationWrapper}>
          <Pagination
            current={currentPage}
            total={filteredTests.length}
            pageSize={pageSize}
            onChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TestList;
