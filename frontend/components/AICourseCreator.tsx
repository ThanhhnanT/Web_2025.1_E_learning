"use client";

import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Radio,
  Slider,
  Typography,
  Row,
  Col,
  Tag,
} from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import styles from '@/styles/aiCourseCreator.module.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface AICourseCreatorProps {
  className?: string;
}

const AICourseCreator: React.FC<AICourseCreatorProps> = ({ className }) => {
  const [topic, setTopic] = useState('');
  const [proficiency, setProficiency] = useState('Beginner');
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [goals, setGoals] = useState('');

  const handleGenerate = () => {
    // TODO: Implement AI course generation
    console.log({ topic, proficiency, weeklyHours, goals });
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.contentWrapper}>
        {/* Single Card with all content */}
        <Card className={styles.mainCard}>
          {/* Heading Section */}
          <div className={styles.headingSection}>
            <div className={styles.badge}>
              <ThunderboltOutlined className={styles.badgeIcon} />
              <span className={styles.badgeText}>Được hỗ trợ bởi AI</span>
            </div>
            <Title level={1} className={styles.mainTitle}>
              Thiết kế lộ trình học tập của bạn
            </Title>
            <Text className={styles.subtitle}>
              Cho chúng tôi biết bạn muốn học gì, và AI của chúng tôi sẽ tạo ra một chương trình học được cá nhân hóa dành riêng cho bạn.
            </Text>
          </div>

          {/* Divider */}
          <div className={styles.divider} />

          {/* Section 1: Topic */}
          <div className={styles.formSection}>
            <label className={styles.label}>
              <span className={styles.labelText}>Bạn muốn học gì?</span>
              <TextArea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Python cho Khoa học Dữ liệu, Lịch sử Pháp thế kỷ 19, Làm vườn hữu cơ cho người mới bắt đầu..."
                className={styles.textArea}
                rows={6}
              />
              <Text type="secondary" className={styles.hint}>
                Hãy mô tả càng chi tiết càng tốt. AI sẽ sử dụng thông tin này để cấu trúc các module của bạn.
              </Text>
            </label>
          </div>

          <Row gutter={[32, 32]}>
            {/* Section 2: Proficiency Level */}
            <Col xs={24} md={12}>
              <div className={styles.formSection}>
                <div className={styles.proficiencyContainer}>
                  <span className={styles.labelText}>Trình độ hiện tại</span>
                  <Radio.Group
                    value={proficiency}
                    onChange={(e) => setProficiency(e.target.value)}
                    className={styles.proficiencyGroup}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="Beginner">Cơ bản</Radio.Button>
                    <Radio.Button value="Intermediate">Trung bình</Radio.Button>
                    <Radio.Button value="Advanced">Nâng cao</Radio.Button>
                  </Radio.Group>
                </div>
              </div>
            </Col>

            {/* Section 3: Time Commitment */}
            <Col xs={24} md={12}>
              <div className={styles.formSection}>
                <div className={styles.sliderHeader}>
                  <span className={styles.labelText}>Thời gian học mỗi tuần</span>
                  <Tag color="blue" className={styles.hoursTag}>
                    {weeklyHours} giờ
                  </Tag>
                </div>
                <div className={styles.sliderContainer}>
                  <Slider
                    min={1}
                    max={20}
                    value={weeklyHours}
                    onChange={setWeeklyHours}
                    className={styles.slider}
                  />
                </div>
                <div className={styles.sliderLabels}>
                  <Text type="secondary" className={styles.sliderLabel}>1 giờ</Text>
                  <Text type="secondary" className={styles.sliderLabel}>10 giờ</Text>
                  <Text type="secondary" className={styles.sliderLabel}>20+ giờ</Text>
                </div>
              </div>
            </Col>
          </Row>

          {/* Section 4: Description / Goals */}
          <div className={styles.formSection}>
            <label className={styles.label}>
              <span className={styles.labelText}>Mục tiêu học tập & Sở thích (Tùy chọn)</span>
              <TextArea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="Cho chúng tôi biết thêm về cách bạn thích học (ví dụ: 'Tôi thích nội dung video', 'Tập trung vào bài tập thực hành', 'Tôi cần điều này cho buổi phỏng vấn xin việc tuần tới')..."
                className={styles.textArea}
                rows={4}
              />
            </label>
          </div>

          {/* Action Area */}
          <div className={styles.actionArea}>
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={handleGenerate}
              className={styles.generateButton}
            >
              Tạo khóa học của tôi
            </Button>
            <Text type="secondary" className={styles.actionHint}>
              Quá trình tạo bằng AI thường mất 30-60 giây. Bạn có thể chỉnh sửa chương trình học sau.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AICourseCreator;

