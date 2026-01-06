import { getAccess, postAccess, patchAccess, deleteAccess } from '../helper/api';

export interface CreatePaymentIntentDto {
  courseId: string;
  paymentGateway: 'stripe' | 'vnpay' | 'momo';
  savePaymentMethod?: boolean;
  paymentMethodId?: string;
  returnUrl?: string;
  cancelUrl?: string;
  face_verification_token?: string;
}

export interface PaymentIntentResponse {
  paymentId: string;
  transactionId: string;
  amount: number;
  gateway: string;
  sessionId?: string;
  url?: string;
  paymentUrl?: string;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

export interface PaymentMethod {
  _id: string;
  gateway: string;
  methodType: string;
  last4?: string;
  brand?: string;
  isDefault: boolean;
  expiryMonth?: number;
  expiryYear?: number;
  createdAt: string;
}

export interface Payment {
  _id: string;
  userId: string;
  courseId: any;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionId: string;
  paymentDate?: string;
  paymentGateway: string;
  gatewayTransactionId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

class PaymentService {
  /**
   * Create payment intent/session
   */
  async createPaymentIntent(data: CreatePaymentIntentDto): Promise<PaymentIntentResponse> {
    return await postAccess('payments/create-intent', data);
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<Payment> {
    return await getAccess(`payments/${paymentId}`);
  }

  /**
   * Get payment by transaction ID
   */
  async getPaymentByTransactionId(transactionId: string): Promise<Payment> {
    return await getAccess(`payments/transaction/${transactionId}`);
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(filters?: {
    courseId?: string;
    status?: string;
  }): Promise<Payment[]> {
    return await getAccess('payments', filters);
  }

  /**
   * Verify Stripe session and complete payment
   */
  async verifyStripeSession(sessionId: string): Promise<any> {
    return await getAccess(`payments/verify/stripe-session?session_id=${sessionId}`);
  }

  /**
   * Verify payment return from gateway
   */
  async verifyPaymentReturn(gateway: string, queryParams: any): Promise<any> {
    const queryString = new URLSearchParams(queryParams).toString();
    return await getAccess(`payments/verify/${gateway}?${queryString}`);
  }

  /**
   * Get user's saved payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return await getAccess('payments/methods');
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(methodId: string): Promise<void> {
    await deleteAccess(`payments/methods/${methodId}`);
  }

  /**
   * Request refund
   */
  async requestRefund(paymentId: string, reason: string): Promise<Payment> {
    return await postAccess(`payments/${paymentId}/refund`, { reason });
  }

  /**
   * Format amount to VND currency
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  /**
   * Get payment status badge color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: '#FFA726',
      completed: '#66BB6A',
      failed: '#EF5350',
      refunded: '#42A5F5',
    };
    return colors[status] || '#9E9E9E';
  }

  /**
   * Get payment status label
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Đang xử lý',
      completed: 'Thành công',
      failed: 'Thất bại',
      refunded: 'Đã hoàn tiền',
    };
    return labels[status] || status;
  }

  /**
   * Get payment gateway label
   */
  getGatewayLabel(gateway: string): string {
    const labels: Record<string, string> = {
      stripe: 'Stripe',
      vnpay: 'VNPay',
      momo: 'MoMo',
    };
    return labels[gateway] || gateway;
  }

  /**
   * Get payment gateway icon
   */
  getGatewayIcon(gateway: string): string {
    const icons: Record<string, string> = {
      stripe: '💳',
      vnpay: '🏦',
      momo: '📱',
    };
    return icons[gateway] || '💰';
  }
}

export const paymentService = new PaymentService();
export default paymentService;

