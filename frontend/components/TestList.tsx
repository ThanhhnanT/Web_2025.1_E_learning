"use client";

import React from "react";
import { Pagination, Card, Tag, Button, Row, Col } from "antd";
import { ClockCircleOutlined, UserOutlined, MessageOutlined } from "@ant-design/icons";
import styles from "./TestList.module.css";

export type Test = {
  id: number;
  title: string;
  description: string;
  duration: string;
  level: string;
};

type TestListProps = {
  keyword?: string;
  tests?: Test[]; // nếu cha truyền vào thì dùng
  itemsPerPage?: number;
};

const TestCard: React.FC<{ test: Test }> = ({ test }) => {
  return (
    <Card className={styles.testCard} hoverable>
      <h3 className={styles.title}>{test.title}</h3>
      <p className={styles.info}>
        <ClockCircleOutlined /> {test.duration} &nbsp; | &nbsp;
        <UserOutlined /> 1301838 &nbsp; | &nbsp;
        <MessageOutlined /> 3410
      </p>
      <p className={styles.desc}>4 phần thi | 40 câu hỏi</p>
      <div className={styles.tags}>
        <Tag color="blue" className={styles.tag}>#IELTS Academic</Tag>
        <Tag color="blue" className={styles.tag}>#Listening</Tag>
      </div>
      <Button type="default" className={styles.detailBtn}>Chi tiết</Button>
    </Card>
  );
};

const TestList: React.FC<TestListProps> = ({ keyword = "", tests: initialTests = [], itemsPerPage = 20 }) => {
  // nếu parent truyền tests (initialTests) thì dùng ngay, còn không thì fetch
  const [allTests, setAllTests] = React.useState<Test[]>(initialTests);
  const [filteredTests, setFilteredTests] = React.useState<Test[]>(initialTests);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Nếu parent không truyền (initialTests rỗng) → fetch once
  React.useEffect(() => {
    if (initialTests.length > 0) {
      setAllTests(initialTests);
      setFilteredTests(initialTests);
      setCurrentPage(1);
      return;
    }

    // chỉ fetch khi initialTests rỗng
    let mounted = true;
    fetch("/tests.json")
      .then((res) => res.json())
      .then((data: Test[]) => {
        if (!mounted) return;
        setAllTests(data);
        setFilteredTests(data);
      })
      .catch((err) => {
        console.error("Lỗi fetch tests:", err);
      });
    return () => { mounted = false; };
  }, [initialTests]);

  // filter khi keyword hoặc allTests thay đổi
  React.useEffect(() => {
    const lower = (keyword || "").toLowerCase().trim();
    if (!lower) {
      setFilteredTests(allTests);
    } else {
      const result = allTests.filter(
        (t) =>
          (t.title || "").toLowerCase().includes(lower) ||
          (t.description || "").toLowerCase().includes(lower)
      );
      setFilteredTests(result);
    }
    setCurrentPage(1);
  }, [keyword, allTests]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTests = filteredTests.slice(startIndex, endIndex);

  return (
    <div>
      {currentTests.length > 0 ? (
        <Row gutter={[16, 16]} justify="center" align="stretch">
          {currentTests.map((test) => (
            <Col key={test.id} xs={12} sm={12} md={8} lg={6} style={{ display: "flex" }}>
              <TestCard test={test} />
            </Col>
          ))}
        </Row>
      ) : (
        <p style={{ textAlign: "center", marginTop: 20 }}>
          Không tìm thấy kết quả nào
        </p>
      )}

      {filteredTests.length > itemsPerPage && (
        <Pagination
          current={currentPage}
          total={filteredTests.length}
          pageSize={itemsPerPage}
          onChange={(page) => setCurrentPage(page)}
          style={{ textAlign: "center", marginTop: 30 }}
        />
      )}
    </div>
  );
};

export default TestList;
