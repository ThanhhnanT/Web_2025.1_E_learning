import api from '../lib/api';

export interface CreatePaymentIntentDto {
  courseId: string;
  paymentGateway: 'stripe' | 'vnpay' | 'momo';
  savePaymentMethod?: boolean;
  paymentMethodId?: string;
  returnUrl?: string;
  cancelUrl?: string;
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
    const response = await api.post('/payments/create-intent', data);
    return response.data;
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<Payment> {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  }

  /**
   * Get payment by transaction ID
   */
  async getPaymentByTransactionId(transactionId: string): Promise<Payment> {
    const response = await api.get(`/payments/transaction/${transactionId}`);
    return response.data;
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(filters?: {
    courseId?: string;
    status?: string;
  }): Promise<Payment[]> {
    const response = await api.get('/payments', { params: filters });
    return response.data;
  }

  /**
   * Verify payment return from gateway
   */
  async verifyPaymentReturn(gateway: string, queryParams: any): Promise<any> {
    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(`/payments/verify/${gateway}?${queryString}`);
    return response.data;
  }

  /**
   * Get user's saved payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await api.get('/payments/methods');
    return response.data;
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(methodId: string): Promise<void> {
    await api.delete(`/payments/methods/${methodId}`);
  }

  /**
   * Request refund
   */
  async requestRefund(paymentId: string, reason: string): Promise<Payment> {
    const response = await api.post(`/payments/${paymentId}/refund`, { reason });
    return response.data;
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

