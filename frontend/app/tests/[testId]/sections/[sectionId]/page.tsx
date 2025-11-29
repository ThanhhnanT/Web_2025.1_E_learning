"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Row, Col, Spin, Alert, Button, Card, Space, Carousel } from "antd";
import type { CarouselRef } from "antd/es/carousel";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { get } from "@/helper/api";
import SectionView from "@/components/test-taking/SectionView";
import TestNavigation from "@/components/test-taking/TestNavigation";
import type { TestSection, UserAnswer } from "@/types/test";

interface SectionWithQuestions extends TestSection {}

const SectionTakingPage: React.FC = () => {
  const params = useParams<{ testId: string; sectionId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { testId, sectionId } = params;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sections, setSections] = React.useState<SectionWithQuestions[]>([]);
  const [navSections, setNavSections] = React.useState<TestSection[] | null>(null);
  const [userAnswers, setUserAnswers] = React.useState<Record<number, string[]>>({});
  const [currentQuestion, setCurrentQuestion] = React.useState<number | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = React.useState<number>(0);
  const [pendingQuestionToFocus, setPendingQuestionToFocus] =
    React.useState<number | null>(null);

  const carouselRef = React.useRef<CarouselRef | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const questionInputMapRef =
    React.useRef<Map<number, HTMLElement | null> | null>(null);

  // Màu cho từng Part khi được chọn
  const partColors = ["#1d4ed8", "#16a34a", "#f97316", "#a855f7", "#059669"];

  const scrollToTop = React.useCallback(() => {
    if (typeof window === "undefined") return;

    // Scroll một mục tiêu duy nhất để tránh hai hoạt ảnh song song
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const selectedSectionIds = React.useMemo(() => {
    const raw = searchParams?.get("sections") || "";
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts;
    return sectionId ? [sectionId.toString()] : [];
  }, [searchParams, sectionId]);

  // Load toàn bộ sections đã chọn để hiển thị dưới dạng Carousel,
  // tránh reload khi chuyển section.
  React.useEffect(() => {
    const fetchSections = async () => {
      if (!testId || !sectionId) return;
      setLoading(true);
      setError(null);

      try {
        let idsToLoad = selectedSectionIds;
        if (!idsToLoad || idsToLoad.length === 0) {
          idsToLoad = [sectionId.toString()];
        }

        const responses = await Promise.all(
          idsToLoad.map((id) => get(`tests/${testId}/sections/${id}`))
        );

        setSections(responses);

        // Xác định index section hiện tại dựa vào route param
        const initialIndex = idsToLoad.indexOf(sectionId.toString());
        const safeIndex = initialIndex >= 0 ? initialIndex : 0;
        setCurrentSectionIndex(safeIndex);

        const current = responses[safeIndex];
        if (current?.questionRange && Array.isArray(current.questionRange)) {
          const [start] = current.questionRange;
          setCurrentQuestion(start);
        }
      } catch (e: any) {
        console.error("Lỗi khi tải các section:", e);
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Không thể tải dữ liệu section.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [testId, sectionId, selectedSectionIds]);

  // Đồng bộ vị trí Carousel với currentSectionIndex (đặc biệt cho lần load đầu,
  // khi người dùng vào thẳng Section 2, 3,...)
  React.useEffect(() => {
    if (!carouselRef.current) return;
    if (!sections || sections.length === 0) return;
    if (currentSectionIndex < 0 || currentSectionIndex >= sections.length) return;

    carouselRef.current.goTo(currentSectionIndex, false);
  }, [sections, currentSectionIndex]);

  // Load cấu trúc để sidebar biết toàn bộ section đã chọn
  React.useEffect(() => {
    const fetchStructure = async () => {
      if (!testId) return;
      try {
        const data = await get(`tests/${testId}/structure`);
        if (!data || !Array.isArray(data.sections)) return;
        const allSections: TestSection[] = data.sections;
        if (selectedSectionIds.length > 0) {
          setNavSections(
            allSections.filter((s) => selectedSectionIds.includes(s._id.toString()))
          );
        } else {
          setNavSections(allSections);
        }
      } catch (e) {
        console.error("Lỗi khi tải cấu trúc test cho sidebar:", e);
      }
    };

    fetchStructure();
  }, [testId, selectedSectionIds]);

  const handleAnswerChange = (questionNumber: number, answer: string[]) => {
    // Chuẩn hoá: cắt khoảng trắng và loại bỏ chuỗi rỗng
    const normalized =
      Array.isArray(answer)
        ? answer
            .map((v) => (v ?? "").trim())
            .filter((v) => v.length > 0)
        : [];

    setUserAnswers((prev) => {
      const next = { ...prev };
      if (normalized.length === 0) {
        // Nếu không còn đáp án hợp lệ, xoá luôn entry => coi như chưa làm
        delete next[questionNumber];
      } else {
        next[questionNumber] = normalized;
      }
      return next;
    });
  };

  const currentSection: SectionWithQuestions | null =
    sections && sections.length > 0 ? sections[currentSectionIndex] : null;

  const findSectionIndexForQuestion = React.useCallback(
    (questionNumber: number) => {
      if (!sections || sections.length === 0) return -1;
      return sections.findIndex((sec) => {
        if (!sec.questionRange || !Array.isArray(sec.questionRange)) return false;
        const [start, end] = sec.questionRange;
        return questionNumber >= start && questionNumber <= end;
      });
    },
    [sections],
  );

  const focusQuestion = React.useCallback(
    (questionNumber: number) => {
      const map = questionInputMapRef.current;
      if (!map) return;

      const target = map.get(questionNumber);
      if (!target) return;

      // Scroll container (or window) smoothly so that the question is visible
      const scrollContainer = containerRef.current || window;
      if (typeof (target as any).getBoundingClientRect !== 'function') {
        return;
      }
      const rect = (target as any).getBoundingClientRect();
      const offsetTop =
        rect.top + (containerRef.current?.scrollTop || window.scrollY);

      const finalTop = Math.max(offsetTop - 120, 0); // leave space for header

      if ('scrollTo' in scrollContainer) {
        (scrollContainer as any).scrollTo({
          top: finalTop,
          behavior: 'smooth',
        });
      } else {
        window.scrollTo({ top: finalTop, behavior: 'smooth' });
      }

      // Focus slightly later so it happens after scroll animation starts
      window.setTimeout(() => {
        if ('focus' in target) {
          (target as HTMLElement).focus();
        }
      }, 150);
    },
    [],
  );

  React.useEffect(() => {
    if (pendingQuestionToFocus == null) return;

    const targetIndex = findSectionIndexForQuestion(pendingQuestionToFocus);
    if (targetIndex !== currentSectionIndex) return;

    const questionToFocus = pendingQuestionToFocus;
    let attempts = 0;

    const tryFocus = () => {
      attempts += 1;
      focusQuestion(questionToFocus);
      if (attempts < 5) {
        window.setTimeout(tryFocus, 80);
      }
    };

    // Đặt currentQuestion đúng câu cần focus để tracking bôi màu đúng
    setCurrentQuestion(questionToFocus);

    // Bắt đầu chuỗi retry nhỏ để chờ ref input mount xong
    window.setTimeout(tryFocus, 80);
    setPendingQuestionToFocus(null);
  }, [
    pendingQuestionToFocus,
    currentSectionIndex,
    focusQuestion,
    findSectionIndexForQuestion,
  ]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Đang tải section...</p>
      </div>
    );
  }

  if (error || !currentSection) {
    return (
      <div style={{ maxWidth: 800, margin: "40px auto" }}>
        <Alert
          message="Không thể tải section"
          description={error || "Đã có lỗi xảy ra khi tải dữ liệu."}
          type="error"
          showIcon
        />
      </div>
    );
  }

  // Chuẩn hóa dữ liệu cho TestNavigation
  const navigationSections: TestSection[] =
    navSections && navSections.length > 0
      ? navSections
      : currentSection
      ? [currentSection]
      : [];
  const userAnswersList: UserAnswer[] = Object.entries(userAnswers).map(
    ([questionNumber, value]) => ({
      questionId: "",
      questionNumber: Number(questionNumber),
      userAnswer: value,
      // Chỉ tính là đã làm nếu còn ít nhất một đáp án khác rỗng/space
      isAnswered:
        Array.isArray(value) &&
        value.some(
          (v) => typeof v === "string" && v.trim().length > 0,
        ),
    })
  );

  return (
    <div ref={containerRef} style={{ padding: "16px 32px" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={17} lg={18}>
          {/* Tabs điều hướng giữa các section (bên ngoài slide) */}
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {sections.map((sec, idx) => {
              const isActive = idx === currentSectionIndex;
              const activeColor = partColors[idx % partColors.length];
              return (
                <button
                  key={sec._id}
                  type="button"
                  onClick={() => {
                    if (idx !== currentSectionIndex) {
                      // Đổi màu ngay lập tức
                      setCurrentSectionIndex(idx);
                      // Chuyển slide, không scroll lên đầu
                      carouselRef.current?.goTo(idx);
                    }
                  }}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: isActive ? activeColor : "#f5f5f5",
                    color: isActive ? "#ffffff" : "#333",
                    fontWeight: isActive ? 600 : 400,
                    boxShadow: isActive ? `0 0 0 1px ${activeColor}` : "none",
                    transition:
                      "background-color 0.2s, color 0.2s, box-shadow 0.2s",
                  }}
                >
                  {sec.title || `Part ${idx + 1}`}
                </button>
              );
            })}
          </div>

          <Carousel
            ref={carouselRef}
            dots={false}
            infinite={false}
            adaptiveHeight={true}
            effect="fade"
            speed={400}
            beforeChange={(_, next) => {
              const target = sections[next];
              if (
                target?.questionRange &&
                Array.isArray(target.questionRange)
              ) {
                const [start] = target.questionRange;
                setCurrentQuestion(start);
              }
            }}
            afterChange={(index) => {
              setCurrentSectionIndex(index);
            }}
          >
            {sections.map((sec, index) => (
              <div key={sec._id}>
                <SectionView
                  section={sec}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  questionInputMapRef={questionInputMapRef}
                  onQuestionFocus={(qNum) => {
                    setCurrentQuestion(qNum);
                  }}
    
                  footer={
                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button
                        icon={<RightOutlined />}
                        disabled={index === sections.length - 1}
                        onClick={() => {
                          if (index < sections.length - 1) {
                            scrollToTop();
                            scrollToTop();
                            carouselRef.current?.goTo(index + 1);
                          }
                        }}
                      >
                        Tiếp theo
                      </Button>
                    </div>
                  }
                />
              </div>
            ))}
          </Carousel>
        </Col>
        <Col
          xs={24}
          md={7}
          lg={6}
          style={{
            position: "sticky",
            top: 20,
            alignSelf: "flex-start",
          }}
        >
          {currentSection && (
            <TestNavigation
              sections={navigationSections}
              userAnswers={userAnswersList}
              currentQuestion={
                currentQuestion || currentSection.questionRange[0]
              }
              onQuestionClick={(qNum) => {
                setCurrentQuestion(qNum);
                const targetIndex = findSectionIndexForQuestion(qNum);
                if (
                  targetIndex >= 0 &&
                  targetIndex !== currentSectionIndex &&
                  carouselRef.current
                ) {
                  // Cập nhật ngay currentSectionIndex để tab Part đổi màu đúng
                  setCurrentSectionIndex(targetIndex);
                  setPendingQuestionToFocus(qNum);
                  carouselRef.current.goTo(targetIndex);
                } else {
                  focusQuestion(qNum);
                }
              }}
              onSectionClick={() => {}}
            />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default SectionTakingPage;


