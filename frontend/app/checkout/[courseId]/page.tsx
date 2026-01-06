'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  Card,
  Radio,
  Button,
  App,
  Spin,
  Checkbox,
  Divider,
  Typography,
  Row,
  Col,
  Breadcrumb,
  Alert,
} from 'antd';
import {
  CreditCardOutlined,
  BankOutlined,
  MobileOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  LockOutlined,
  ArrowLeftOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { getCourseById } from '@/service/courses';
import paymentService, { CreatePaymentIntentDto } from '@/service/paymentService';
import faceVerificationService from '@/service/faceVerification';
import StripeCheckout from '@/components/payment/StripeCheckout';
import VNPayCheckout from '@/components/payment/VNPayCheckout';
import MomoCheckout from '@/components/payment/MomoCheckout';
import FaceVerificationCamera from '@/components/FaceVerificationCamera';
import type { Course } from '@/types/course';

const { Title, Text, Paragraph } = Typography;

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { notification, message } = App.useApp(); // Use App context for notifications

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'vnpay' | 'momo'>('stripe');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [faceVerificationModalOpen, setFaceVerificationModalOpen] = useState(false);
  const [faceRegistrationModalOpen, setFaceRegistrationModalOpen] = useState(false);
  const [faceVerificationToken, setFaceVerificationToken] = useState<string | null>(null);
  const [faceStatus, setFaceStatus] = useState<{ registered: boolean; hasEncoding: boolean } | null>(null);

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

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      checkFaceStatus();
    }
  }, [courseId]);

  const checkFaceStatus = async () => {
    try {
      const status = await faceVerificationService.getFaceStatus();
      setFaceStatus(status);
    } catch (error) {
      // If error, assume face is not registered
      setFaceStatus({ registered: false, hasEncoding: false });
    }
  };

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const data = await getCourseById(courseId);
      setCourse(data);
    } catch (error) {
      console.error('Error fetching course:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể tải thông tin khóa học',
        placement: 'topRight',
      });
      router.push('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceRegistration = async (imageBase64: string) => {
    try {
      const result = await faceVerificationService.registerFace(imageBase64);
      
      if (result.success) {
        notification.success({
          message: 'Đăng ký thành công',
          description: 'Khuôn mặt của bạn đã được đăng ký. Vui lòng xác thực để tiếp tục thanh toán.',
          placement: 'topRight',
        });
        setFaceRegistrationModalOpen(false);
        // Refresh face status
        await checkFaceStatus();
        // Open verification modal
        setFaceVerificationModalOpen(true);
      } else {
        notification.error({
          message: 'Đăng ký thất bại',
          description: result.message || 'Không thể đăng ký khuôn mặt. Vui lòng thử lại.',
          placement: 'topRight',
        });
      }
    } catch (error: any) {
      notification.error({
        message: 'Lỗi đăng ký',
        description: error?.response?.data?.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.',
        placement: 'topRight',
      });
    }
  };

  const handleFaceVerification = async (imageBase64: string) => {
    try {
      const result = await faceVerificationService.verifyFace(imageBase64);
      
      if (result.success && result.match && result.verification_token) {
        setFaceVerificationToken(result.verification_token);
        setFaceVerificationModalOpen(false);
        // Proceed with payment after successful verification
        proceedWithPayment(result.verification_token);
      } else {
        notification.error({
          message: 'Xác thực thất bại',
          description: result.message || 'Khuôn mặt không khớp. Vui lòng thử lại.',
          placement: 'topRight',
        });
      }
    } catch (error: any) {
      notification.error({
        message: 'Lỗi xác thực',
        description: error?.response?.data?.message || 'Có lỗi xảy ra khi xác thực. Vui lòng thử lại.',
        placement: 'topRight',
      });
    }
  };

  const handlePayment = async () => {
    // Check if face is not registered
    if (!faceStatus?.registered || !faceStatus?.hasEncoding) {
      notification.warning({
        message: 'Yêu cầu đăng ký khuôn mặt',
        description: 'Bạn cần đăng ký khuôn mặt trước khi thanh toán. Vui lòng đăng ký khuôn mặt của bạn.',
        placement: 'topRight',
        duration: 5,
      });
      // Open face registration modal
      setFaceRegistrationModalOpen(true);
      return;
    }

    // Check if face verification is required (user has registered but not verified in this session)
    if (faceStatus?.registered && !faceVerificationToken) {
      // Open face verification modal
      setFaceVerificationModalOpen(true);
      return;
    }

    // Proceed with payment
    await proceedWithPayment();
  };

  const handleSkipFaceVerification = () => {
    setFaceVerificationModalOpen(false);
    // Proceed with payment without verification token
    proceedWithPayment();
    notification.info({
      message: 'Đã bỏ qua xác thực khuôn mặt',
      description: 'Bạn đã chọn bỏ qua xác thực khuôn mặt. Thanh toán sẽ tiếp tục.',
      placement: 'topRight',
      duration: 3,
    });
  };

  const handleSkipFaceRegistration = () => {
    setFaceRegistrationModalOpen(false);
    // Proceed with payment without face registration
    proceedWithPayment();
    notification.info({
      message: 'Đã bỏ qua đăng ký khuôn mặt',
      description: 'Bạn đã chọn bỏ qua đăng ký khuôn mặt. Thanh toán sẽ tiếp tục.',
      placement: 'topRight',
      duration: 3,
    });
  };

  const proceedWithPayment = async (verificationToken?: string) => {
    const token = verificationToken || faceVerificationToken;
    
    if (!agreedToTerms) {
      notification.warning({
        message: 'Cảnh báo',
        description: 'Vui lòng đồng ý với điều khoản và điều kiện',
        placement: 'topRight',
      });
      return;
    }

    // Check if user is logged in
    const accessToken = Cookies.get('access_token');
    if (!accessToken) {
      notification.error({
        message: 'Chưa đăng nhập',
        description: 'Vui lòng đăng nhập để tiếp tục thanh toán. Bạn có thể đăng nhập ở menu phía trên.',
        placement: 'topRight',
        duration: 6,
      });
      return;
    }

    try {
      setProcessingPayment(true);

      // Ensure we have valid full URLs for return and cancel
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'http://localhost:3000'; // Fallback for SSR

      const returnUrl = `${baseUrl}/payment/result`;
      const cancelUrl = `${baseUrl}/courses/${course!._id}`;

      const paymentIntent: CreatePaymentIntentDto = {
        courseId: course!._id,
        paymentGateway: selectedGateway,
        savePaymentMethod,
        returnUrl,
        cancelUrl,
        ...(token && { face_verification_token: token }),
      };

      const response = await paymentService.createPaymentIntent(paymentIntent);
      
      if (!response) {
        throw new Error('Không nhận được phản hồi từ server');
      }

      setPaymentData(response);

      // Handle different gateways
      if (selectedGateway === 'stripe') {
        // Stripe will be handled by StripeCheckout component
        if (response.url) {
          // Redirect will happen, keep loading state
          window.location.href = response.url;
        } else {
          setProcessingPayment(false);
          notification.error({
            message: 'Lỗi thanh toán',
            description: 'Không nhận được URL thanh toán từ Stripe',
            placement: 'topRight',
          });
        }
      } else if (selectedGateway === 'vnpay') {
        // Redirect to VNPay
        if (response.paymentUrl) {
          // Redirect will happen, keep loading state
          window.location.href = response.paymentUrl;
        } else {
          setProcessingPayment(false);
          notification.error({
            message: 'Lỗi thanh toán',
            description: 'Không nhận được URL thanh toán từ VNPay',
            placement: 'topRight',
          });
        }
      } else if (selectedGateway === 'momo') {
        // Handle Momo - will show QR or redirect
        // Data is set in paymentData state
        // Stop loading so user can see QR code or click buttons
        setProcessingPayment(false);
        notification.success({
          message: 'Đã tạo thanh toán',
          description: 'Vui lòng quét mã QR hoặc chọn phương thức thanh toán MoMo',
          placement: 'topRight',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Tạo thanh toán thất bại. Vui lòng thử lại.';
      notification.error({
        message: 'Lỗi thanh toán',
        description: errorMessage,
        placement: 'topRight',
        duration: 5,
      });
      setProcessingPayment(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getInstructorName = () => {
    if (!course?.instructor) return 'N/A';
    return typeof course.instructor === 'string' ? 'N/A' : course.instructor.name || 'N/A';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Alert
          message="Không tìm thấy khóa học"
          description="Khóa học bạn đang tìm không tồn tại hoặc đã bị xóa."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '24px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* Breadcrumb */}
        <Breadcrumb style={{ marginBottom: '24px' }}>
          <Breadcrumb.Item href="/">
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/courses">Khóa học</Breadcrumb.Item>
          <Breadcrumb.Item href={`/courses/${courseId}`}>{course.title}</Breadcrumb.Item>
          <Breadcrumb.Item>Thanh toán</Breadcrumb.Item>
        </Breadcrumb>

        {/* Back Button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push(`/courses/${courseId}`)}
          style={{ marginBottom: '24px' }}
        >
          Quay lại khóa học
        </Button>


        <Row gutter={24}>
          {/* Left Column - Payment Form */}
          <Col xs={24} lg={14}>
            <Card style={{ marginBottom: '24px' }}>
              {/* Payment Method Tabs - Horizontal */}
              <div style={{ marginBottom: '32px' }}>
                <Title level={5} style={{ marginBottom: '16px' }}>
                  Phương thức thanh toán
                </Title>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {gateways.map((gateway) => (
                    <div
                      key={gateway.value}
                      onClick={() => setSelectedGateway(gateway.value as any)}
                      style={{
                        flex: '1',
                        minWidth: '150px',
                        padding: '16px',
                        border: selectedGateway === gateway.value ? '2px solid #1890ff' : '2px solid #e8e8e8',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.3s',
                        backgroundColor: selectedGateway === gateway.value ? '#e6f7ff' : '#fff',
                      }}
                    >
                      <div style={{ marginBottom: '8px' }}>{gateway.icon}</div>
                      <div style={{ 
                        fontWeight: selectedGateway === gateway.value ? 600 : 500,
                        fontSize: '14px',
                        color: selectedGateway === gateway.value ? '#1890ff' : '#000',
                      }}>
                        {gateway.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Divider />

              {/* Payment Details Section */}
              <div style={{ marginBottom: '24px' }}>
                <Title level={5} style={{ marginBottom: '16px' }}>
                  Chi tiết thanh toán
                </Title>

                {/* Stripe Checkout Info */}
                {selectedGateway === 'stripe' && !paymentData && (
                  <Alert
                    message="Thanh toán an toàn với Stripe"
                    description="Bạn sẽ được chuyển đến trang thanh toán bảo mật của Stripe để nhập thông tin thẻ."
                    type="info"
                    showIcon={false}
                    style={{ 
                      border: '1px solid #91d5ff',
                      borderRadius: '8px'
                    }}
                  />
                )}

                {/* VNPay Info */}
                {selectedGateway === 'vnpay' && !paymentData && (
                  <div style={{ color: '#666', fontSize: '14px', padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                    <p style={{ marginBottom: '8px' }}>✓ Thanh toán qua Internet Banking</p>
                    <p style={{ marginBottom: '8px' }}>✓ Hỗ trợ tất cả ngân hàng tại Việt Nam</p>
                    <p style={{ marginBottom: 0 }}>✓ Thanh toán qua thẻ ATM nội địa</p>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text style={{ fontSize: '13px', color: '#999' }}>
                      Bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất giao dịch
                    </Text>
                  </div>
                )}
                
                {/* MoMo Info */}
                {selectedGateway === 'momo' && !paymentData && (
                  <div style={{ color: '#666', fontSize: '14px', padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                    <p style={{ marginBottom: '8px' }}>✓ Thanh toán nhanh chóng qua ví MoMo</p>
                    <p style={{ marginBottom: '8px' }}>✓ Quét mã QR hoặc thanh toán trực tiếp</p>
                    <p style={{ marginBottom: 0 }}>✓ An toàn và bảo mật tuyệt đối</p>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text style={{ fontSize: '13px', color: '#999' }}>
                      Bạn sẽ được chuyển đến ứng dụng MoMo hoặc quét mã QR để thanh toán
                    </Text>
                  </div>
                )}

                {/* After payment intent created */}
                {paymentData && selectedGateway === 'stripe' && (
                  <StripeCheckout paymentData={paymentData} />
                )}

                {paymentData && selectedGateway === 'vnpay' && (
                  <VNPayCheckout paymentData={paymentData} />
                )}

                {paymentData && selectedGateway === 'momo' && (
                  <MomoCheckout paymentData={paymentData} />
                )}
              </div>

              <Divider />

              {/* Additional Options */}
              <div style={{ marginBottom: '24px' }}>
                {/* Save Payment Method */}
                {selectedGateway === 'stripe' && !paymentData && (
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
                <Checkbox checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}>
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
            </Card>
          </Col>

          {/* Right Column - Order Summary */}
          <Col xs={24} lg={10}>
            <Card style={{ position: 'sticky', top: '24px' }}>
              <Title level={4} style={{ marginBottom: '24px' }}>
                Tóm tắt đơn hàng
              </Title>

              {/* Course Info */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                {course.thumbnail_url && (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <Title level={5} style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                    {course.title}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    Bởi {getInstructorName()}
                  </Text>
                  <div style={{ marginTop: '8px' }}>
                    <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                      {formatPrice(course.price)}
                    </Text>
                    {course.price > 0 && (
                      <Text delete type="secondary" style={{ marginLeft: '8px', fontSize: '14px' }}>
                        {formatPrice(course.price * 1.3)}
                      </Text>
                    )}
                  </div>
                </div>
              </div>

              <Divider style={{ margin: '16px 0' }} />

              {/* Price Details */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <Text style={{ fontSize: '14px' }}>Giá gốc</Text>
                  <Text style={{ fontSize: '14px' }}>{formatPrice(course.price)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <Text style={{ fontSize: '14px' }}>Giảm giá (0%)</Text>
                  <Text type="success" style={{ fontSize: '14px' }}>-{formatPrice(0)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <Text style={{ fontSize: '14px' }}>Thuế</Text>
                  <Text style={{ fontSize: '14px' }}>{formatPrice(0)}</Text>
                </div>
              </div>

              <Divider style={{ margin: '16px 0' }} />

              {/* Total */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <Text strong style={{ fontSize: '16px' }}>
                  Tổng cộng
                </Text>
                <Title level={3} style={{ margin: 0, color: '#1890ff', fontSize: '24px' }}>
                  {formatPrice(course.price)}
                </Title>
              </div>

              {/* Promo Code */}
              <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                  MÃ KHUYẾN MÃI
                </Text>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Nhập mã"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                  <Button style={{ borderRadius: '6px' }}>Áp dụng</Button>
                </div>
              </div>

              {/* Payment Button */}
              <Button
                type="primary"
                size="large"
                block
                onClick={handlePayment}
                loading={processingPayment}
                disabled={!agreedToTerms || processingPayment}
                icon={<ShoppingCartOutlined />}
                style={{ 
                  height: '52px', 
                  fontSize: '16px', 
                  fontWeight: 600,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
                }}
              >
                {processingPayment ? 'Đang xử lý...' : 'Thanh toán khóa học'}
              </Button>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Face Registration Modal */}
      <FaceVerificationCamera
        open={faceRegistrationModalOpen}
        onClose={() => setFaceRegistrationModalOpen(false)}
        onCapture={handleFaceRegistration}
        onSkip={handleSkipFaceRegistration}
        showSkipButton={true}
        mode="register"
        title="Đăng ký khuôn mặt"
      />

      {/* Face Verification Modal */}
      <FaceVerificationCamera
        open={faceVerificationModalOpen}
        onClose={() => setFaceVerificationModalOpen(false)}
        onCapture={handleFaceVerification}
        onSkip={handleSkipFaceVerification}
        showSkipButton={true}
        mode="verify"
        title="Xác thực khuôn mặt để thanh toán"
      />
    </div>
  );
}

