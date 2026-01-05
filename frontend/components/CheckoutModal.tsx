'use client';

import React, { useState } from 'react';
import { Modal, Radio, Button, message, Spin, Checkbox, Divider } from 'antd';
import { CreditCardOutlined, BankOutlined, MobileOutlined, CloseOutlined } from '@ant-design/icons';
import paymentService, { CreatePaymentIntentDto } from '../service/paymentService';
import StripeCheckout from './payment/StripeCheckout';
import VNPayCheckout from './payment/VNPayCheckout';
import MomoCheckout from './payment/MomoCheckout';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  course: {
    _id: string;
    title: string;
    price: number;
    thumbnail_url?: string;
    instructor?: any;
  };
  onSuccess?: (paymentId: string) => void;
}

export default function CheckoutModal({ open, onClose, course, onSuccess }: CheckoutModalProps) {
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'vnpay' | 'momo'>('stripe');
  const [loading, setLoading] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const gateways = [
    {
      value: 'stripe',
      label: 'Thẻ tín dụng/Ghi nợ',
      icon: <CreditCardOutlined style={{ fontSize: '24px' }} />,
      description: 'Thanh toán bằng Visa, Mastercard hoặc các thẻ khác',
    },
    {
      value: 'vnpay',
      label: 'VNPay',
      icon: <BankOutlined style={{ fontSize: '24px' }} />,
      description: 'Internet Banking & Thẻ ATM',
    },
    {
      value: 'momo',
      label: 'Ví điện tử MoMo',
      icon: <MobileOutlined style={{ fontSize: '24px' }} />,
      description: 'Thanh toán qua ví MoMo',
    },
  ];

  const handlePayment = async () => {
    if (!agreedToTerms) {
      message.warning('Vui lòng đồng ý với điều khoản và điều kiện');
      return;
    }

    try {
      setLoading(true);

      const paymentIntent: CreatePaymentIntentDto = {
        courseId: course._id,
        paymentGateway: selectedGateway,
        savePaymentMethod,
        returnUrl: `${window.location.origin}/payment/result`,
        cancelUrl: `${window.location.origin}/courses/${course._id}`,
      };

      const response = await paymentService.createPaymentIntent(paymentIntent);
      setPaymentData(response);

      // Handle different gateways
      if (selectedGateway === 'stripe') {
        // Stripe will be handled by StripeCheckout component
        if (response.url) {
          window.location.href = response.url;
        }
      } else if (selectedGateway === 'vnpay') {
        // Redirect to VNPay
        if (response.paymentUrl) {
          window.location.href = response.paymentUrl;
        }
      } else if (selectedGateway === 'momo') {
        // Handle Momo - will show QR or redirect
        // Data is set in paymentData state
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      message.error(error?.response?.data?.message || 'Tạo thanh toán thất bại. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      closeIcon={<CloseOutlined />}
      styles={{
        body: { padding: '24px' },
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Hoàn tất thanh toán</h2>
      </div>

      {/* Course Summary */}
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          gap: '16px',
        }}
      >
        {course.thumbnail_url && (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            style={{
              width: '100px',
              height: '60px',
              objectFit: 'cover',
              borderRadius: '4px',
            }}
          />
        )}
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{course.title}</h3>
          {course.instructor && (
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              Giảng viên: {course.instructor.name || 'N/A'}
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#1890ff' }}>
            {formatPrice(course.price)}
          </div>
        </div>
      </div>

      {/* Payment Gateway Selection */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
          Chọn phương thức thanh toán
        </h3>
        <Radio.Group
          value={selectedGateway}
          onChange={(e) => setSelectedGateway(e.target.value)}
          style={{ width: '100%' }}
        >
          {gateways.map((gateway) => (
            <Radio.Button
              key={gateway.value}
              value={gateway.value}
              style={{
                height: 'auto',
                padding: '16px',
                marginBottom: '12px',
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <div>{gateway.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{gateway.label}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{gateway.description}</div>
                </div>
              </div>
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>

      {/* Gateway-specific components */}
      {selectedGateway === 'stripe' && paymentData && (
        <StripeCheckout paymentData={paymentData} onSuccess={onSuccess} />
      )}

      {selectedGateway === 'vnpay' && paymentData && (
        <VNPayCheckout paymentData={paymentData} />
      )}

      {selectedGateway === 'momo' && paymentData && (
        <MomoCheckout paymentData={paymentData} />
      )}

      {/* Save Payment Method */}
      {selectedGateway === 'stripe' && (
        <div style={{ marginBottom: '16px' }}>
          <Checkbox
            checked={savePaymentMethod}
            onChange={(e) => setSavePaymentMethod(e.target.checked)}
          >
            Lưu phương thức thanh toán cho các lần mua sau
          </Checkbox>
        </div>
      )}

      {/* Terms and Conditions */}
      <div style={{ marginBottom: '24px' }}>
        <Checkbox
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
        >
          Tôi đồng ý với{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer">
            Điều khoản và Điều kiện
          </a>{' '}
          và{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">
            Chính sách bảo mật
          </a>
        </Checkbox>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Total and Action Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#666' }}>Tổng thanh toán</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#1890ff' }}>
            {formatPrice(course.price)}
          </div>
        </div>
        <Button
          type="primary"
          size="large"
          onClick={handlePayment}
          loading={loading}
          disabled={!agreedToTerms || loading}
          style={{ minWidth: '180px', height: '48px', fontSize: '16px' }}
        >
          {loading ? 'Đang xử lý...' : 'Tiến hành thanh toán'}
        </Button>
      </div>

      {/* Security Notice */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#e6f7ff',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#0050b3',
        }}
      >
        🔒 Thông tin thanh toán của bạn được bảo mật và mã hóa. Chúng tôi không bao giờ lưu trữ thông tin thẻ của bạn.
      </div>
    </Modal>
  );
}

