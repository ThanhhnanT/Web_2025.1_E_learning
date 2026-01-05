"use client";

import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Empty,
  Image,
  Input,
  Button,
  Checkbox,
  Radio,
  Slider,
  Select,
  Rate,
  Pagination,
  Space,
  Avatar,
} from 'antd';
import {
  UserOutlined,
  BookOutlined,
  StarFilled,
  SearchOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getAllCourses } from '@/service/courses';
import type { Course } from '@/types/course';
import styles from '@/styles/courses.module.css';
import AICourseCreator from '@/components/AICourseCreator';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

type ViewMode = 'grid' | 'list';
type SortOption = 'popular' | 'price-low' | 'price-high' | 'newest';

export default function CoursesOnlinePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [isFree, setIsFree] = useState<boolean | undefined>(undefined);
  const [isPaid, setIsPaid] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    fetchCourses();
  }, [selectedCategories, difficulty, priceRange, isFree, isPaid, sortBy, searchQuery]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (selectedCategories.length > 0) {
        // For now, we'll filter by first category. Backend should support multiple categories
        filters.category = selectedCategories[0] as 'HSK' | 'TOEIC' | 'IELTS';
      }

      if (difficulty !== 'all') {
        filters.difficulty = difficulty;
      }

      if (isFree !== undefined && isFree) {
        filters.isFree = true;
      } else if (isPaid !== undefined && isPaid) {
        filters.minPrice = 1;
      }

      if (priceRange[0] > 0 || priceRange[1] < 1000000) {
        filters.minPrice = priceRange[0];
        filters.maxPrice = priceRange[1];
      }

      if (searchQuery) {
        filters.search = searchQuery;
      }

      const data = await getAllCourses(filters);
      const publishedCourses = data.filter((course) => course.status === 'published');

      // Sort courses
      let sortedCourses = [...publishedCourses];
      switch (sortBy) {
        case 'price-low':
          sortedCourses.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          sortedCourses.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          sortedCourses.sort(
            (a, b) =>
              new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
          );
          break;
        case 'popular':
        default:
          sortedCourses.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
          break;
      }

      setCourses(sortedCourses);
      setTotalResults(sortedCourses.length);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (checkedValues: string[]) => {
    setSelectedCategories(checkedValues);
    setCurrentPage(1);
  };

  const handleDifficultyChange = (e: any) => {
    setDifficulty(e.target.value);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (value: [number, number]) => {
    setPriceRange(value);
    setCurrentPage(1);
  };

  const handleFreeChange = (e: any) => {
    setIsFree(e.target.checked ? true : undefined);
    setCurrentPage(1);
  };

  const handlePaidChange = (e: any) => {
    setIsPaid(e.target.checked ? true : undefined);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setDifficulty('all');
    setPriceRange([0, 1000000]);
    setIsFree(undefined);
    setIsPaid(undefined);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const getInstructorName = (course: Course) => {
    return typeof course.instructor === 'string'
      ? 'N/A'
      : course.instructor?.name || 'N/A';
  };

  const getInstructorAvatar = (course: Course) => {
    if (typeof course.instructor === 'object' && course.instructor) {
      // Check if instructor has avatar_url (from backend) or avatar
      return (course.instructor as any).avatar_url || course.instructor.avatar;
    }
    // Fallback to course avatar if instructor avatar not available
    return course.avatar;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Miễn phí';
    return `${price.toLocaleString('vi-VN')} VNĐ`;
  };

  const pageSize = 12;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCourses = courses.slice(startIndex, startIndex + pageSize);

  return (
    <div className={styles.pageContainer}>
      {/* Hero/Search Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <Title level={1} className={styles.heroTitle}>
            Khám phá hàng nghìn khóa học
          </Title>
          <Text className={styles.heroSubtitle}>
            Tìm kỹ năng tiếp theo của bạn và phát triển sự nghiệp ngay hôm nay
          </Text>
          <div className={styles.searchContainer}>
            <Search
              placeholder="Tìm kiếm khóa học..."
              enterButton={<Button type="primary">Tìm kiếm</Button>}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch('')}
              className={styles.searchInput}
            />
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className={styles.mainContainer}>
        <Row gutter={24}>
          {/* Sidebar Filters */}
          <Col xs={24} lg={6}>
            <Card className={styles.filterCard} title={
              <div className={styles.filterHeader}>
                <span>Bộ lọc</span>
                <Button type="link" size="small" onClick={handleResetFilters}>
                  Đặt lại
                </Button>
              </div>
            }>
              {/* Category Filter */}
              <div className={styles.filterSection}>
                <Title level={5} className={styles.filterTitle}>
                  Danh mục
                </Title>
                <Checkbox.Group
                  value={selectedCategories}
                  onChange={handleCategoryChange}
                  className={styles.checkboxGroup}
                >
                  <Checkbox value="HSK" className={styles.checkboxItem}>
                    HSK
                  </Checkbox>
                  <Checkbox value="TOEIC" className={styles.checkboxItem}>
                    TOEIC
                  </Checkbox>
                  <Checkbox value="IELTS" className={styles.checkboxItem}>
                    IELTS
                  </Checkbox>
                </Checkbox.Group>
              </div>

              <div className={styles.filterDivider} />

              {/* Difficulty Filter */}
              <div className={styles.filterSection}>
                <Title level={5} className={styles.filterTitle}>
                  Mức độ
                </Title>
                <Radio.Group
                  value={difficulty}
                  onChange={handleDifficultyChange}
                  className={styles.radioGroup}
                >
                  <Radio value="all" className={styles.radioItem}>
                    Tất cả
                  </Radio>
                  <Radio value="Beginner" className={styles.radioItem}>
                    Cơ bản
                  </Radio>
                  <Radio value="Intermediate" className={styles.radioItem}>
                    Trung bình
                  </Radio>
                  <Radio value="Advanced" className={styles.radioItem}>
                    Nâng cao
                  </Radio>
                </Radio.Group>
              </div>

              <div className={styles.filterDivider} />

              {/* Price Filter */}
              <div className={styles.filterSection}>
                <Title level={5} className={styles.filterTitle}>
                  Khoảng giá
                </Title>
                <div className={styles.priceRange}>
                  <Text type="secondary" className={styles.priceLabel}>
                    {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  </Text>
                  <Slider
                    range
                    min={0}
                    max={1000000}
                    step={10000}
                    value={priceRange}
                    onChange={handlePriceRangeChange}
                    className={styles.priceSlider}
                  />
                  <div className={styles.priceCheckboxes}>
                    <Checkbox checked={isFree === true} onChange={handleFreeChange}>
                      Miễn phí
                    </Checkbox>
                    <Checkbox checked={isPaid === true} onChange={handlePaidChange}>
                      Trả phí
                    </Checkbox>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* Main Listing Area */}
          <Col xs={24} lg={18}>
            {/* Sorting / View Toolbar */}
            <div className={styles.toolbar}>
              <Text className={styles.resultsCount}>
                Hiển thị <strong>{totalResults}</strong> kết quả
              </Text>
              <Space>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: 180 }}
                  suffixIcon={<span>▼</span>}
                >
                  <Option value="popular">Phổ biến</Option>
                  <Option value="price-low">Giá: Thấp đến cao</Option>
                  <Option value="price-high">Giá: Cao đến thấp</Option>
                  <Option value="newest">Mới nhất</Option>
                </Select>
                <Button.Group>
                  <Button
                    type={viewMode === 'grid' ? 'primary' : 'default'}
                    icon={<AppstoreOutlined />}
                    onClick={() => setViewMode('grid')}
                  />
                  <Button
                    type={viewMode === 'list' ? 'primary' : 'default'}
                    icon={<UnorderedListOutlined />}
                    onClick={() => setViewMode('list')}
                  />
                </Button.Group>
              </Space>
            </div>

            {/* Course Grid */}
            {loading ? (
              <div className={styles.loadingContainer}>
                <Spin size="large" />
              </div>
            ) : paginatedCourses.length === 0 ? (
              <Empty description="Không có khóa học nào" />
            ) : (
              <>
                <Row gutter={[24, 24]} className={styles.coursesGrid}>
                  {paginatedCourses.map((course) => (
                    <Col xs={24} sm={12} xl={8} key={course._id}>
                      <Card
                        hoverable
                        className={styles.courseCard}
                        bodyStyle={{ padding: 0 }}
                        cover={
                          <div className={styles.thumbnailWrapper}>
                            {getInstructorAvatar(course) ? (
                              <Avatar
                                src={getInstructorAvatar(course)}
                                size="100%"
                                icon={<UserOutlined />}
                                className={styles.fullAvatar}
                                shape="square"
                              />
                            ) : course.thumbnail_url ? (
                              <Image
                                src={course.thumbnail_url}
                                alt={course.title}
                                className={styles.thumbnail}
                                preview={false}
                                fallback="/image.png"
                              />
                            ) : (
                              <div className={styles.thumbnailPlaceholder}>
                                <BookOutlined className={styles.placeholderIcon} />
                              </div>
                            )}
                            {course.category && (
                              <div className={styles.categoryBadge}>
                                {course.category}
                              </div>
                            )}
                          </div>
                        }
                      >
                        <div className={styles.courseContent}>
                          <Title level={4} className={styles.courseTitle}>
                            {course.title}
                          </Title>
                          <Text type="secondary" className={styles.instructorName}>
                            Bởi {getInstructorName(course)}
                          </Text>
                          <div className={styles.ratingSection}>
                            <Rate
                              disabled
                              value={course.averageRating || 0}
                              allowHalf
                              className={styles.ratingStars}
                            />
                            <div className={styles.ratingInfo}>
                              <Text className={styles.ratingText}>
                                {course.averageRating?.toFixed(1) || '0.0'}
                              </Text>
                              <Text type="secondary" className={styles.reviewCount}>
                                ({course.numReview || 0} đánh giá)
                              </Text>
                            </div>
                          </div>
                          <div className={styles.courseFooter}>
                            <div className={styles.courseMeta}>
                              <Space direction="vertical" size={4}>
                                <Text type="secondary" className={styles.metaItem}>
                                  <ClockCircleOutlined /> {course.totalModules || 0} giờ tổng cộng
                                </Text>
                                <Text type="secondary" className={styles.metaItem}>
                                  <TeamOutlined /> {course.totalStudents || 0}k học viên
                                </Text>
                              </Space>
                            </div>
                            <div className={styles.priceSection}>
                              <Text className={styles.price}>{formatPrice(course.price)}</Text>
                            </div>
                          </div>
                          <Button
                            type="default"
                            className={styles.viewDetailsButton}
                            onClick={() => handleCourseClick(course._id)}
                            block
                          >
                            Xem chi tiết
                          </Button>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* Pagination */}
                {totalResults > pageSize && (
                  <div className={styles.paginationContainer}>
                    <Pagination
                      current={currentPage}
                      total={totalResults}
                      pageSize={pageSize}
                      onChange={setCurrentPage}
                      showSizeChanger={false}
                    />
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </div>

      {/* AI Course Creator Section */}
      <AICourseCreator />
    </div>
  );
}
