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
        setError('Payment was canceled');
        setLoading(false);
        return;
      }

      // Determine gateway based on query params
      let gateway: string | null = null;
      if (searchParams.get('session_id')) {
        gateway = 'stripe';
      } else if (searchParams.get('vnp_TxnRef')) {
        gateway = 'vnpay';
      } else if (searchParams.get('orderId')) {
        gateway = 'momo';
      }

      if (!gateway) {
        setError('Unable to determine payment gateway');
        setPaymentStatus('failed');
        setLoading(false);
        return;
      }

      // Convert URLSearchParams to object
      const queryParams: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      // Verify payment with backend
      const result = await paymentService.verifyPaymentReturn(gateway, queryParams);

      if (result.success) {
        setPaymentStatus('success');
        setPaymentData(result.payment || result.data);
        message.success('Payment completed successfully!');
      } else {
        setPaymentStatus('failed');
        setError(result.message || 'Payment verification failed');
      }
    } catch (err: any) {
      console.error('Payment verification error:', err);
      setPaymentStatus('failed');
      setError(err?.response?.data?.message || 'An error occurred while verifying payment');
    } finally {
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
        <p style={{ fontSize: '18px', color: '#666' }}>Verifying your payment...</p>
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
          title="Payment Successful!"
          subTitle="Thank you for your purchase. You now have full access to the course."
          extra={[
            <Button type="primary" key="course" size="large" onClick={() => router.push(`/courses/${paymentData?.courseId?._id || paymentData?.courseId}`)}>
              Access Course
            </Button>,
            <Button key="home" size="large" onClick={() => router.push('/courses')}>
              Browse More Courses
            </Button>,
          ]}
        />
      )}

      {paymentStatus === 'failed' && (
        <Result
          status="error"
          icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
          title="Payment Failed"
          subTitle={error || 'Your payment could not be processed. Please try again.'}
          extra={[
            <Button type="primary" key="retry" size="large" onClick={() => router.back()}>
              Try Again
            </Button>,
            <Button key="home" size="large" onClick={() => router.push('/courses')}>
              Back to Courses
            </Button>,
          ]}
        />
      )}

      {paymentStatus === 'pending' && (
        <Result
          status="warning"
          icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
          title="Payment Pending"
          subTitle="Your payment is being processed. This may take a few minutes."
          extra={[
            <Button type="primary" key="refresh" size="large" onClick={() => window.location.reload()}>
              Refresh Status
            </Button>,
            <Button key="home" size="large" onClick={() => router.push('/')}>
              Go to Home
            </Button>,
          ]}
        />
      )}

      {paymentData && paymentStatus === 'success' && (
        <Card
          title="Payment Details"
          style={{ marginTop: '32px' }}
          bordered={false}
        >
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Transaction ID">
              {paymentData.transactionId || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Course">
              {paymentData.courseId?.title || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              {formatAmount(paymentData.amount || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Payment Method">
              {paymentService.getGatewayLabel(paymentData.paymentGateway || '')}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <span style={{ color: '#52c41a', fontWeight: 600 }}>
                {paymentService.getStatusLabel(paymentData.status || 'completed')}
              </span>
            </Descriptions.Item>
            {paymentData.paymentDate && (
              <Descriptions.Item label="Payment Date">
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
        <p>Need help? Contact our support team at support@elearning.com</p>
      </div>
    </div>
  );
}

