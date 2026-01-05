import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Create HMAC SHA256 signature
   */
  private createSignature(data: string, secretKey: string): string {
    return crypto
      .createHmac('sha256', secretKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Create Momo payment
   */
  async createPayment(
    amount: number,
    orderId: string,
    orderInfo: string,
    extraData?: string,
  ): Promise<any> {
    try {
      const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE');
      const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
      const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
      const endpoint = this.configService.get<string>('MOMO_ENDPOINT');
      const returnUrl = this.configService.get<string>('MOMO_RETURN_URL');
      const ipnUrl = this.configService.get<string>('MOMO_IPN_URL');

      if (!partnerCode || !accessKey || !secretKey || !endpoint) {
        throw new Error('Momo configuration is incomplete');
      }

      const requestId = orderId;
      const requestType = 'captureWallet';
      const extraDataEncoded = extraData || '';

      // Create raw signature string
      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraDataEncoded}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;

      const signature = this.createSignature(rawSignature, secretKey);

      const requestBody = {
        partnerCode,
        accessKey,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl: returnUrl,
        ipnUrl,
        extraData: extraDataEncoded,
        requestType,
        signature,
        lang: 'vi',
      };

      this.logger.log('Creating Momo payment:', { orderId, amount });

      const response = await axios.post(`${endpoint}/v2/gateway/api/create`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.resultCode === 0) {
        return {
          success: true,
          payUrl: response.data.payUrl,
          deeplink: response.data.deeplink,
          qrCodeUrl: response.data.qrCodeUrl,
          requestId: response.data.requestId,
          orderId: response.data.orderId,
        };
      } else {
        this.logger.error('Momo payment creation failed:', response.data);
        return {
          success: false,
          message: response.data.message,
          resultCode: response.data.resultCode,
        };
      }
    } catch (error) {
      this.logger.error('Error creating Momo payment:', error);
      throw error;
    }
  }

  /**
   * Verify Momo signature
   */
  verifySignature(signature: string, data: any): boolean {
    try {
      const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
      const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');

      if (!secretKey || !accessKey) {
        throw new Error('Momo configuration is incomplete');
      }

      // Reconstruct the signature string
      const rawSignature = `accessKey=${accessKey}&amount=${data.amount}&extraData=${data.extraData || ''}&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&orderType=${data.orderType}&partnerCode=${data.partnerCode}&payType=${data.payType}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;

      const calculatedSignature = this.createSignature(rawSignature, secretKey);

      return signature === calculatedSignature;
    } catch (error) {
      this.logger.error('Error verifying Momo signature:', error);
      return false;
    }
  }

  /**
   * Handle Momo IPN (Instant Payment Notification)
   */
  handleIPN(ipnData: any): { isValid: boolean; data?: any } {
    try {
      const isValid = this.verifySignature(ipnData.signature, ipnData);

      if (isValid) {
        return {
          isValid: true,
          data: {
            orderId: ipnData.orderId,
            requestId: ipnData.requestId,
            amount: ipnData.amount,
            transId: ipnData.transId,
            resultCode: ipnData.resultCode,
            message: ipnData.message,
            responseTime: ipnData.responseTime,
            orderInfo: ipnData.orderInfo,
            payType: ipnData.payType,
            extraData: ipnData.extraData,
          },
        };
      }

      return { isValid: false };
    } catch (error) {
      this.logger.error('Error handling Momo IPN:', error);
      return { isValid: false };
    }
  }

  /**
   * Query transaction status from Momo
   */
  async queryTransaction(orderId: string, requestId: string): Promise<any> {
    try {
      const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE');
      const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
      const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
      const endpoint = this.configService.get<string>('MOMO_ENDPOINT');

      if (!partnerCode || !accessKey || !secretKey || !endpoint) {
        throw new Error('Momo configuration is incomplete');
      }

      const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}`;
      const signature = this.createSignature(rawSignature, secretKey);

      const requestBody = {
        partnerCode,
        accessKey,
        requestId,
        orderId,
        signature,
        lang: 'vi',
      };

      const response = await axios.post(`${endpoint}/v2/gateway/api/query`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error querying Momo transaction:', error);
      throw error;
    }
  }

  /**
   * Process Momo refund
   */
  async refund(
    orderId: string,
    requestId: string,
    amount: number,
    transId: number,
    description?: string,
  ): Promise<any> {
    try {
      const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE');
      const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
      const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
      const endpoint = this.configService.get<string>('MOMO_ENDPOINT');

      if (!partnerCode || !accessKey || !secretKey || !endpoint) {
        throw new Error('Momo configuration is incomplete');
      }

      const refundRequestId = `${requestId}_REFUND`;

      const rawSignature = `accessKey=${accessKey}&amount=${amount}&description=${description || ''}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${refundRequestId}&transId=${transId}`;
      const signature = this.createSignature(rawSignature, secretKey);

      const requestBody = {
        partnerCode,
        accessKey,
        requestId: refundRequestId,
        amount,
        orderId,
        transId,
        signature,
        description: description || 'Refund',
        lang: 'vi',
      };

      const response = await axios.post(`${endpoint}/v2/gateway/api/refund`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.resultCode === 0) {
        return {
          success: true,
          transId: response.data.transId,
          message: response.data.message,
        };
      } else {
        this.logger.error('Momo refund failed:', response.data);
        return {
          success: false,
          message: response.data.message,
          resultCode: response.data.resultCode,
        };
      }
    } catch (error) {
      this.logger.error('Error processing Momo refund:', error);
      throw error;
    }
  }

  /**
   * Get Momo result code description
   */
  getResultDescription(resultCode: number): string {
    const descriptions: Record<number, string> = {
      0: 'Giao dịch thành công',
      9000: 'Giao dịch được xác nhận thành công',
      1000: 'Giao dịch đã được khởi tạo, chờ người dùng xác nhận thanh toán',
      1001: 'Giao dịch thất bại do người dùng từ chối xác nhận thanh toán',
      1002: 'Giao dịch bị từ chối do nhập sai OTP quá số lần quy định',
      1003: 'Giao dịch bị từ chối vì đã hết hạn thanh toán',
      1004: 'Giao dịch thất bại do số dư tài khoản không đủ',
      1005: 'Giao dịch thất bại do URL hoặc QR code đã hết hạn',
      1006: 'Giao dịch thất bại do người dùng đã từ chối xác nhận thanh toán',
      1007: 'Giao dịch bị từ chối vì tài khoản người dùng bị khóa',
      1026: 'Giao dịch bị giới hạn theo quy định',
      1080: 'Giao dịch hoàn tiền bị từ chối',
      1081: 'Giao dịch hoàn tiền đang được xử lý',
      2001: 'Giao dịch thất bại do sai thông tin',
      3001: 'Giao dịch bị từ chối do merchant không hợp lệ',
      3002: 'Giao dịch bị từ chối do số tiền không hợp lệ',
      3003: 'Giao dịch bị từ chối do orderId không hợp lệ',
      3004: 'Giao dịch bị từ chối do số tiền vượt quá hạn mức thanh toán',
      4001: 'Giao dịch thất bại do lỗi hệ thống',
      4010: 'Giao dịch đã được xác nhận trước đó',
      4011: 'Giao dịch hoàn tiền bị từ chối do giao dịch thanh toán không tồn tại',
      4100: 'Giao dịch thất bại do không tìm thấy dữ liệu',
      7000: 'Giao dịch đang được xử lý',
      7001: 'Giao dịch bị từ chối do URL hoặc QR code không tồn tại hoặc đã hết hạn',
      7002: 'Giao dịch bị từ chối do đã thanh toán trước đó',
    };

    return descriptions[resultCode] || 'Lỗi không xác định';
  }
}

