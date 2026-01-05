import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

@Injectable()
export class VNPayService {
  private readonly logger = new Logger(VNPayService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Sort object keys alphabetically
   */
  private sortObject(obj: any): any {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  /**
   * Create HMAC SHA512 signature
   */
  private createSignature(data: string, secretKey: string): string {
    return crypto
      .createHmac('sha512', secretKey)
      .update(Buffer.from(data, 'utf-8'))
      .digest('hex');
  }

  /**
   * Create VNPay payment URL
   */
  createPaymentUrl(
    amount: number,
    orderId: string,
    orderInfo: string,
    ipAddr: string,
    returnUrl?: string,
  ): string {
    try {
      const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
      const secretKey = this.configService.get<string>('VNPAY_HASH_SECRET');
      const vnpUrl = this.configService.get<string>('VNPAY_URL');
      const defaultReturnUrl = this.configService.get<string>('VNPAY_RETURN_URL');

      if (!tmnCode || !secretKey || !vnpUrl) {
        throw new Error('VNPay configuration is incomplete');
      }

      const date = new Date();
      const createDate = this.formatDate(date);
      const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // 15 minutes

      let vnpParams: any = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Amount: amount * 100, // VNPay requires amount * 100
        vnp_ReturnUrl: returnUrl || defaultReturnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
      };

      vnpParams = this.sortObject(vnpParams);

      const signData = querystring.stringify(vnpParams, { encode: false });
      const secureHash = this.createSignature(signData, secretKey);

      vnpParams['vnp_SecureHash'] = secureHash;

      const paymentUrl = vnpUrl + '?' + querystring.stringify(vnpParams, { encode: false });

      return paymentUrl;
    } catch (error) {
      this.logger.error('Error creating VNPay payment URL:', error);
      throw error;
    }
  }

  /**
   * Verify return URL signature
   */
  verifyReturnUrl(queryParams: any): { isValid: boolean; data?: any } {
    try {
      const secretKey = this.configService.get<string>('VNPAY_HASH_SECRET');
      if (!secretKey) {
        throw new Error('VNPay hash secret not configured');
      }

      const secureHash = queryParams['vnp_SecureHash'];
      delete queryParams['vnp_SecureHash'];
      delete queryParams['vnp_SecureHashType'];

      const sortedParams = this.sortObject(queryParams);
      const signData = querystring.stringify(sortedParams, { encode: false });
      const checkSum = this.createSignature(signData, secretKey);

      if (secureHash === checkSum) {
        return {
          isValid: true,
          data: {
            orderId: queryParams.vnp_TxnRef,
            amount: parseInt(queryParams.vnp_Amount) / 100,
            responseCode: queryParams.vnp_ResponseCode,
            transactionNo: queryParams.vnp_TransactionNo,
            bankCode: queryParams.vnp_BankCode,
            payDate: queryParams.vnp_PayDate,
            orderInfo: queryParams.vnp_OrderInfo,
          },
        };
      }

      return { isValid: false };
    } catch (error) {
      this.logger.error('Error verifying VNPay return URL:', error);
      return { isValid: false };
    }
  }

  /**
   * Verify IPN (Instant Payment Notification)
   */
  verifyIPN(queryParams: any): { isValid: boolean; data?: any } {
    // IPN verification is the same as return URL verification
    return this.verifyReturnUrl(queryParams);
  }

  /**
   * Query transaction status from VNPay
   */
  async queryTransaction(
    orderId: string,
    transactionDate: string,
    ipAddr: string,
  ): Promise<any> {
    try {
      const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
      const secretKey = this.configService.get<string>('VNPAY_HASH_SECRET');
      const apiUrl = this.configService.get<string>('VNPAY_API_URL');

      if (!tmnCode || !secretKey || !apiUrl) {
        throw new Error('VNPay configuration is incomplete');
      }

      const date = new Date();
      const requestDate = this.formatDate(date);

      let vnpParams: any = {
        vnp_Version: '2.1.0',
        vnp_Command: 'querydr',
        vnp_TmnCode: tmnCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: 'Query transaction',
        vnp_TransactionDate: transactionDate,
        vnp_CreateDate: requestDate,
        vnp_IpAddr: ipAddr,
      };

      vnpParams = this.sortObject(vnpParams);

      const signData = querystring.stringify(vnpParams, { encode: false });
      const secureHash = this.createSignature(signData, secretKey);

      vnpParams['vnp_SecureHash'] = secureHash;

      // In production, you would make an HTTP request to VNPay API
      // For now, return the params that would be sent
      return {
        url: apiUrl,
        params: vnpParams,
      };
    } catch (error) {
      this.logger.error('Error querying VNPay transaction:', error);
      throw error;
    }
  }

  /**
   * Format date to VNPay format (yyyyMMddHHmmss)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Parse VNPay date format to Date object
   */
  parseVNPayDate(vnpDate: string): Date {
    // Format: yyyyMMddHHmmss
    const year = parseInt(vnpDate.substring(0, 4));
    const month = parseInt(vnpDate.substring(4, 6)) - 1;
    const day = parseInt(vnpDate.substring(6, 8));
    const hours = parseInt(vnpDate.substring(8, 10));
    const minutes = parseInt(vnpDate.substring(10, 12));
    const seconds = parseInt(vnpDate.substring(12, 14));

    return new Date(year, month, day, hours, minutes, seconds);
  }

  /**
   * Get VNPay response code description
   */
  getResponseDescription(responseCode: string): string {
    const descriptions: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
      '99': 'Các lỗi khác',
    };

    return descriptions[responseCode] || 'Lỗi không xác định';
  }
}

