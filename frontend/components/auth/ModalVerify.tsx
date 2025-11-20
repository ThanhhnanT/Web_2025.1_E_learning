"use client";

import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Space, Typography, Divider } from "antd";
import { SafetyOutlined, MailOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useMessageApi } from "@/components/providers/Message"; 
import Cookies from "js-cookie";
import { handleVerify } from "@/service/auth";
import modalStyles from "@/styles/modal.module.css";

const { Text, Title } = Typography;

interface VerifyEmailModalProps {
  open: boolean;
  onClose: () => void;
}

const VerifyEmailModal: React.FC<VerifyEmailModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const messageApi = useMessageApi();
  const [loading, setLoading] = useState(false);

  // Cleanup handler when modal closes
  const handleAfterClose = () => {
    form.resetFields();
    setLoading(false);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.resetFields();
      setLoading(false);
    }
  }, [open, form]);

  const handleVerifyCode = async () => {
    const email = Cookies.get("email");
    if (!email) {
      messageApi.warning("Không tìm thấy email. Vui lòng đăng nhập lại!");
      return;
    }

    try {
      const value = await form.validateFields();
      setLoading(true);

      const data = { email, codeId: value.codeId };
      const res = await handleVerify(data);

      if (!res || (res.statusCode !== 200 && res.statusCode !== 201)) {
        messageApi.error("Mã xác thực không đúng hoặc đã hết hạn!");
        return;
      }

      Cookies.set("access_token", res.access_token);
      Cookies.remove("email");
      messageApi.success("Xác thực email thành công!");
      onClose();
    } catch (err) {
      console.error(err);
      messageApi.error("Không thể kết nối tới máy chủ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      afterClose={handleAfterClose}
      destroyOnClose={true}
      maskClosable={true}
      footer={null}
      centered
      width={480}
      title={
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            🔒 Xác thực Email
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Vui lòng kiểm tra email để lấy mã xác thực
          </Text>
        </div>
      }
      styles={{
        body: { 
          padding: '24px',
          maxHeight: 'calc(60vh)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }
      }}
      style={{
        margin: 0,
        paddingBottom: 0
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <MailOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '16px' }} />
        <Text style={{ display: 'block', fontSize: '15px', color: '#595959' }}>
          Chúng tôi đã gửi mã xác thực đến email của bạn.
          <br />
          Vui lòng kiểm tra hộp thư và nhập mã bên dưới.
        </Text>
      </div>

      <Form form={form} layout="vertical" size="large">
        <Form.Item
          name="codeId"
          label={<span style={{ fontWeight: 500 }}>Mã xác thực</span>}
          rules={[{ required: true, message: "Vui lòng nhập mã xác thực!" }]}
        >
          <Input
            prefix={<SafetyOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Nhập mã xác thực "
            style={{ borderRadius: '8px', fontSize: '18px', letterSpacing: '4px', textAlign: 'center' }}
          />
        </Form.Item>

        <Divider style={{ margin: '20px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button onClick={onClose} size="large" style={{ borderRadius: '8px' }}>
            Hủy
          </Button>
          <Button 
            type="primary" 
            onClick={handleVerifyCode} 
            loading={loading} 
            size="large"
            icon={<CheckCircleOutlined />}
            style={{ 
              borderRadius: '8px',
              minWidth: '120px',
              fontWeight: 500
            }}
          >
            Xác nhận
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default VerifyEmailModal;
