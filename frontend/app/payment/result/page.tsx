'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Result, Button, Spin, Card, Descriptions, message } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import paymentService from '../../../service/paymentService';

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyPayment();
  }, [searchParams]);

  const verifyPayment = async () => {
    try {
      setLoading(true);

      // Check if payment was canceled
      if (searchParams.get('canceled') === 'true') {
        setPaymentStatus('failed');
        setError('Thanh toán đã bị hủy');
        setLoading(false);
        return;
      }

      // Handle Stripe payment
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        try {
          // Call new verify endpoint for Stripe
          const result = await paymentService.verifyStripeSession(sessionId);
          
          if (result.success) {
            setPaymentStatus('success');
            setPaymentData({
              ...result.payment,
              courseId: result.courseId || result.payment?.courseId,
            });
            message.success('Thanh toán thành công!');
          } else {
            setPaymentStatus('pending');
            setError(result.message || 'Payment is being processed');
          }
          setLoading(false);
          return;
        } catch (err: any) {
          console.error('Stripe verification error:', err);
          setPaymentStatus('failed');
          setError(err?.response?.data?.message || 'Không thể xác minh thanh toán');
          setLoading(false);
          return;
        }
      }

      // Handle VNPay
      if (searchParams.get('vnp_TxnRef')) {
        const queryParams: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });

        const result = await paymentService.verifyPaymentReturn('vnpay', queryParams);
        
        if (result.success) {
          setPaymentStatus('success');
          setPaymentData(result.payment || result.data);
          message.success('Thanh toán thành công!');
        } else {
          setPaymentStatus('failed');
          setError(result.message || 'Xác minh thanh toán thất bại');
        }
        setLoading(false);
        return;
      }

      // Handle MoMo
      if (searchParams.get('orderId')) {
        const queryParams: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });

        const result = await paymentService.verifyPaymentReturn('momo', queryParams);
        
        if (result.success) {
          setPaymentStatus('success');
          setPaymentData(result.payment || result.data);
          message.success('Thanh toán thành công!');
        } else {
          setPaymentStatus('failed');
          setError(result.message || 'Xác minh thanh toán thất bại');
        }
        setLoading(false);
        return;
      }

      // No recognized payment gateway
      setError('Không thể xác định cổng thanh toán');
      setPaymentStatus('failed');
      setLoading(false);
    } catch (err: any) {
      console.error('Payment verification error:', err);
      setPaymentStatus('failed');
      setError(err?.response?.data?.message || 'Đã xảy ra lỗi khi xác minh thanh toán');
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 64 }} spin />} />
        <p style={{ fontSize: '18px', color: '#666' }}>Đang xác minh thanh toán...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '48px 24px',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '100vh',
      }}
    >
      {paymentStatus === 'success' && (
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="Thanh toán thành công!"
          subTitle="Cảm ơn bạn đã mua khóa học. Bạn có thể truy cập khóa học ngay bây giờ."
          extra={[
            <Button 
              type="primary" 
              key="course" 
              size="large" 
              onClick={() => {
                // Extract courseId from various possible locations
                const courseId = 
                  paymentData?.courseId?._id || 
                  paymentData?.courseId || 
                  (typeof paymentData?.courseId === 'string' ? paymentData.courseId : null);
                
                console.log('Navigating to course:', courseId);
                console.log('Payment data:', paymentData);
                
                if (courseId) {
                  // Add payment_success query param to trigger enrollment recheck
                  router.push(`/courses/${courseId}?payment_success=true`);
                } else {
                  message.error('Không tìm thấy thông tin khóa học');
                  router.push('/courses');
                }
              }}
            >
              Vào học ngay
            </Button>,
            <Button key="home" size="large" onClick={() => router.push('/courses')}>
              Xem thêm khóa học
            </Button>,
          ]}
        />
      )}

      {paymentStatus === 'failed' && (
        <Result
          status="error"
          icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
          title="Thanh toán thất bại"
          subTitle={error || 'Thanh toán không thể được xử lý. Vui lòng thử lại.'}
          extra={[
            <Button type="primary" key="retry" size="large" onClick={() => router.back()}>
              Thử lại
            </Button>,
            <Button key="home" size="large" onClick={() => router.push('/courses')}>
              Quay lại khóa học
            </Button>,
          ]}
        />
      )}

      {paymentStatus === 'pending' && (
        <Result
          status="warning"
          icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
          title="Đang xử lý thanh toán"
          subTitle="Thanh toán của bạn đang được xử lý. Quá trình này có thể mất vài phút."
          extra={[
            <Button type="primary" key="refresh" size="large" onClick={() => window.location.reload()}>
              Làm mới trạng thái
            </Button>,
            <Button key="home" size="large" onClick={() => router.push('/')}>
              Về trang chủ
            </Button>,
          ]}
        />
      )}

      {paymentData && paymentStatus === 'success' && (
        <Card
          title="Chi tiết thanh toán"
          style={{ marginTop: '32px' }}
          variant="borderless"
        >
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Mã giao dịch">
              {paymentData.transactionId || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Khóa học">
              {paymentData.courseId?.title || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              {formatAmount(paymentData.amount || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức thanh toán">
              {paymentService.getGatewayLabel(paymentData.paymentGateway || '')}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <span style={{ color: '#52c41a', fontWeight: 600 }}>
                {paymentService.getStatusLabel(paymentData.status || 'completed')}
              </span>
            </Descriptions.Item>
            {paymentData.paymentDate && (
              <Descriptions.Item label="Ngày thanh toán">
                {new Date(paymentData.paymentDate).toLocaleString('vi-VN')}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      <div
        style={{
          marginTop: '48px',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
        }}
      >
        <p>Cần hỗ trợ? Liên hệ với chúng tôi tại support@elearning.com</p>
      </div>
    </div>
  );
}

