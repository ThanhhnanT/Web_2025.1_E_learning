# Course Payment System - Implementation Guide

## Overview

This guide explains how to integrate and use the complete course payment system that supports Stripe, VNPay, and Momo payment gateways.

## Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Backend Integration](#backend-integration)
3. [Frontend Integration](#frontend-integration)
4. [Course Page Integration](#course-page-integration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Setup & Configuration

### 1. Install Required Packages

#### Backend:
```bash
cd backend
npm install stripe@14.0.0 axios@1.6.0
```

#### Frontend:
```bash
cd frontend
npm install @stripe/stripe-js@2.4.0 @stripe/react-stripe-js@2.4.0 qrcode.react@3.1.0 react-confetti@6.1.0
```

### 2. Environment Variables

Copy the `.env.example` file and add your gateway credentials:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# VNPay
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/result
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction

# Momo
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn
MOMO_RETURN_URL=http://localhost:3000/payment/result
MOMO_IPN_URL=http://your-domain.com/api/payments/webhook/momo

# Application
FRONTEND_URL=http://localhost:3000
```

### 3. Add Enrollments Module to App Module

In `backend/src/app.module.ts`, add:

```typescript
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';

@Module({
  imports: [
    // ... other imports
    EnrollmentsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
```

---

## Backend Integration

### Key Endpoints

#### Payment Endpoints:
- `POST /payments/create-intent` - Create payment session
- `POST /payments/webhook/stripe` - Stripe webhook
- `POST /payments/webhook/vnpay` - VNPay IPN
- `POST /payments/webhook/momo` - Momo IPN
- `GET /payments/verify/:gateway` - Verify return URL
- `GET /payments/methods` - Get saved payment methods
- `DELETE /payments/methods/:id` - Remove payment method

#### Enrollment Endpoints:
- `GET /enrollments` - Get user's enrollments
- `GET /enrollments/check/:courseId` - Check enrollment status
- `PATCH /enrollments/:id/progress` - Update progress
- `GET /enrollments/stats/me` - Get enrollment statistics

### Webhook Setup

#### Stripe (Development):
```bash
stripe listen --forward-to localhost:8000/payments/webhook/stripe
```

Copy the webhook signing secret to your `.env` file.

#### Stripe (Production):
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.com/payments/webhook/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Copy webhook secret to `.env`

#### VNPay & Momo:
Configure IPN URLs in your merchant dashboard to point to:
- VNPay: `https://your-domain.com/payments/webhook/vnpay`
- Momo: `https://your-domain.com/payments/webhook/momo`

---

## Frontend Integration

### 1. Import Services

```typescript
import paymentService from '@/service/paymentService';
import enrollmentService from '@/service/enrollmentService';
import CheckoutModal from '@/components/CheckoutModal';
```

### 2. Use Payment Modal

```typescript
const [checkoutVisible, setCheckoutVisible] = useState(false);

// Open checkout
<Button onClick={() => setCheckoutVisible(true)}>
  Buy Now
</Button>

// Render modal
<CheckoutModal
  open={checkoutVisible}
  onClose={() => setCheckoutVisible(false)}
  course={course}
  onSuccess={(paymentId) => {
    console.log('Payment successful:', paymentId);
    // Refresh enrollment status
  }}
/>
```

---

## Course Page Integration

### Add to Course Detail Page

Add these imports and state to `/app/courses/[courseId]/page.tsx`:

```typescript
import { useState, useEffect } from 'react';
import enrollmentService from '@/service/enrollmentService';
import paymentService from '@/service/paymentService';
import CheckoutModal from '@/components/CheckoutModal';
import { ShoppingCartOutlined, CheckCircleOutlined } from '@ant-design/icons';

// Inside component
const [isEnrolled, setIsEnrolled] = useState(false);
const [checkoutVisible, setCheckoutVisible] = useState(false);
const [checkingEnrollment, setCheckingEnrollment] = useState(true);

// Check enrollment status
useEffect(() => {
  checkEnrollmentStatus();
}, [courseId]);

const checkEnrollmentStatus = async () => {
  try {
    setCheckingEnrollment(true);
    const { isEnrolled } = await enrollmentService.checkEnrollment(courseId);
    setIsEnrolled(isEnrolled);
  } catch (error) {
    console.error('Error checking enrollment:', error);
  } finally {
    setCheckingEnrollment(false);
  }
};
```

### Add Buy Now Button

In the course info section (around line 410-434), add:

```typescript
{/* Purchase/Access Section */}
<Card style={{ marginTop: 24, borderRadius: 12 }}>
  <div style={{ textAlign: 'center', padding: '16px 0' }}>
    {checkingEnrollment ? (
      <Spin />
    ) : isEnrolled ? (
      <>
        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
        <Title level={4} style={{ color: '#52c41a' }}>You're Enrolled!</Title>
        <Text>Continue learning where you left off</Text>
      </>
    ) : (
      <>
        <Title level={2} style={{ color: '#1890ff', marginBottom: 16 }}>
          {course.price === 0 ? 'Free' : `${course.price.toLocaleString()} VNĐ`}
        </Title>
        {course.price > 0 ? (
          <Button
            type="primary"
            size="large"
            icon={<ShoppingCartOutlined />}
            onClick={() => setCheckoutVisible(true)}
            block
            style={{ height: 48, fontSize: 16 }}
          >
            Buy Now
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            onClick={() => {/* Implement free enrollment */}}
            block
            style={{ height: 48, fontSize: 16 }}
          >
            Enroll for Free
          </Button>
        )}
        <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
          30-day money-back guarantee
        </Text>
      </>
    )}
  </div>
</Card>

{/* Checkout Modal */}
<CheckoutModal
  open={checkoutVisible}
  onClose={() => setCheckoutVisible(false)}
  course={course}
  onSuccess={() => {
    setCheckoutVisible(false);
    checkEnrollmentStatus();
  }}
/>
```

---

## Testing

### 1. Test Cards (Stripe)

- **Success**: `4242 4242 4242 4242`
- **3D Secure**: `4000 0027 6000 3184`
- **Declined**: `4000 0000 0000 0002`

Use any future expiry date and any 3-digit CVC.

### 2. VNPay Sandbox

Use the test account provided by VNPay for sandbox testing.

### 3. Momo Sandbox

Use Momo test account credentials for sandbox environment.

### 4. Test Flow

1. Browse to a course: `http://localhost:3000/courses/[courseId]`
2. Click "Buy Now"
3. Select payment gateway
4. Complete payment
5. Verify redirect to result page
6. Check enrollment in "My Courses"
7. Verify webhook processing in backend logs

---

## Usage Examples

### Check if User is Enrolled

```typescript
const { isEnrolled, enrollment } = await enrollmentService.checkEnrollment(courseId);

if (isEnrolled) {
  console.log('User progress:', enrollment.progress);
}
```

### Get User's Courses

```typescript
const enrollments = await enrollmentService.getMyEnrollments('active');
```

### Update Course Progress

```typescript
await enrollmentService.updateProgress(enrollmentId, 75);
```

### Get Payment History

```typescript
const payments = await paymentService.getPaymentHistory({
  status: 'completed'
});
```

---

## Troubleshooting

### Payment Not Completing

1. Check webhook is configured correctly
2. Verify webhook secret matches
3. Check backend logs for errors
4. Ensure EnrollmentsService is injected properly

### Enrollment Not Created

1. Check payment status is "completed"
2. Verify enrollments module is registered
3. Check for duplicate enrollment prevention
4. Review server logs

### Frontend Not Receiving Payment Status

1. Verify API endpoint is accessible
2. Check CORS configuration
3. Verify authentication token is valid
4. Check browser console for errors

---

## API Reference

### Create Payment Intent

```typescript
POST /payments/create-intent
Content-Type: application/json
Authorization: Bearer <token>

{
  "courseId": "string",
  "paymentGateway": "stripe" | "vnpay" | "momo",
  "savePaymentMethod": boolean,
  "returnUrl": "string",
  "cancelUrl": "string"
}
```

### Check Enrollment

```typescript
GET /enrollments/check/:courseId
Authorization: Bearer <token>

Response: {
  "isEnrolled": boolean,
  "enrollment": Enrollment | null
}
```

---

## Security Best Practices

1. **Never** expose secret keys in frontend code
2. Always verify webhook signatures
3. Use HTTPS in production
4. Implement rate limiting on payment endpoints
5. Log all transactions for audit trails
6. Validate all input data
7. Use environment variables for sensitive data

---

## Additional Features

### Refund Processing

```typescript
await paymentService.requestRefund(paymentId, 'Customer request');
```

### Suspend Enrollment

```typescript
await enrollmentService.suspendEnrollment(enrollmentId, 'Payment dispute');
```

### Get Enrollment Statistics

```typescript
const stats = await enrollmentService.getMyStats();
console.log(`Total courses: ${stats.total}`);
console.log(`Average progress: ${stats.averageProgress}%`);
```

---

## Support

For issues or questions:
- Check server logs: `backend/logs/`
- Review webhook events in gateway dashboard
- Contact support: support@elearning.com

---

## License

This payment system is part of the E-Learning platform and follows the same license terms.

