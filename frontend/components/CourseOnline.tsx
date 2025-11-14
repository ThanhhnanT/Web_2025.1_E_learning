"use client";
import React, { useState } from "react";
import { Button, Form, Input, Select, Card, Row, Col } from "antd";
import styles from "./CourseOnline.module.css"; // import CSS module

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

const validateMessages = {
  required: "${label} is required!",
};

const CourseOnline: React.FC = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(true);

  const onFinish = (values: any) => {
    console.log(values);
  };

  if (!visible) return null;

  return (
    <Row gutter={40} align="top" className={styles.containerRow}>
      {/* Nội dung mô tả bên trái */}
      <Col xs={24} md={14} className={styles.descriptionCol}>
        <h2>Phần mềm luyện thi online</h2>
        <p>
          Các phần mềm luyện thi IELTS, TOEIC, HSK online chất lượng cao của <b>LEARNIFY</b> đều
          được thiết kế sát format thi thật, theo chương trình chuẩn CEFR (A1-C2) của đại học
          Cambridge và Oxford (Anh) với nhiều tính năng và hệ thống bài tập phong phú đa dạng.
        </p>
        <p>
          Phần mềm luyện thi bao gồm các tính năng chuyên sâu và lộ trình luyện thi cá nhân hóa
          để chinh phục các mốc điểm quan trọng. <b>LEARNIFY</b> áp dụng những công nghệ tối
          ưu vào học tập như spaced-repetition để ôn tập flashcards, AI để chấm chữa phát âm và
          bài thi nói/viết. Toàn bộ quá trình luyện thi của bạn sẽ được thống kê chi tiết theo
          ngày và theo từng dạng câu hỏi để có thể dễ dàng theo dõi tiến độ và điều chỉnh lộ
          trình ôn tập một cách phù hợp.
        </p>
        <p>
          Bạn có thể <b>tìm kiếm lộ trình phù hợp với bản thân</b> trước khi học.
        </p>
      </Col>

      {/* Form bên phải */}
      <Col xs={24} md={10} style={{ display: "flex", justifyContent: "center" }}>
        <Card title={<div className={styles.cardTitle}>Tìm kiếm lộ trình học</div>} className={styles.cardForm}>
          <Form {...layout} form={form} name="message" onFinish={onFinish} validateMessages={validateMessages}>
            <Form.Item name={["user", "goal"]} label="Goal" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item
              name={["user", "level"]}
              label="Level"
              rules={[{ required: true, message: "Vui lòng chọn level!" }]}
            >
              <Select
                placeholder="Chọn level"
                options={[
                  { value: "beginner", label: "Beginner" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "advanced", label: "Advanced" },
                ]}
              />
            </Form.Item>

            <Form.Item name={["user", "description"]} label="Description">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item name={["user", "hour"]} label="Estimated Hours" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 0, span: 24 }} >
              <div className={styles.formButtons}>
                <Button htmlType="button" onClick={() => form.resetFields()} className={styles.buttonCancel}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" className={styles.buttonOk}>
                  Ok
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default CourseOnline;
