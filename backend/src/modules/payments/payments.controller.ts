import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, Res, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { Public } from '@/auth/decorate/customize';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StripeService } from './services/stripe.service';
import { VNPayService } from './services/vnpay.service';
import { MomoService } from './services/momo.service';
import { Request, Response } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
    private readonly vnpayService: VNPayService,
    private readonly momoService: MomoService,
  ) {}

  @ApiOperation({ 
    summary: 'Tạo payment intent cho khóa học',
    description: 'Tạo payment intent/session với gateway được chọn. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreatePaymentIntentDto })
  @ApiResponse({ status: 201, description: 'Tạo payment intent thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post('create-intent')
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    const ipAddr = req.ip || req.connection.remoteAddress || '127.0.0.1';
    return this.paymentsService.createPaymentIntent(userId, createPaymentIntentDto, ipAddr);
  }

  @ApiOperation({ 
    summary: 'Tạo giao dịch thanh toán mới (Legacy)',
    description: 'Tạo một giao dịch thanh toán mới. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 201, description: 'Tạo giao dịch thanh toán thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @ApiOperation({ 
    summary: 'Lấy danh sách giao dịch thanh toán',
    description: 'Lấy danh sách giao dịch thanh toán với các bộ lọc tùy chọn. API này là public.'
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Lọc theo ID người dùng' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Lọc theo ID khóa học' })
  @ApiQuery({ name: 'status', required: false, description: 'Lọc theo trạng thái (pending, completed, failed, refunded)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách giao dịch thành công' })
  @Public()
  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('courseId') courseId?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.findAll(userId, courseId, status);
  }

  @ApiOperation({ 
    summary: 'Lấy chi tiết giao dịch thanh toán theo ID',
    description: 'Lấy thông tin chi tiết của một giao dịch thanh toán cụ thể. API này là public.'
  })
  @ApiParam({ name: 'id', description: 'ID của giao dịch thanh toán', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết giao dịch thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy giao dịch' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @ApiOperation({ 
    summary: 'Lấy giao dịch thanh toán theo transaction ID',
    description: 'Lấy thông tin giao dịch thanh toán theo transaction ID. API này là public.'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID của giao dịch', example: 'TXN123456789' })
  @ApiResponse({ status: 200, description: 'Lấy giao dịch thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy giao dịch' })
  @Public()
  @Get('transaction/:transactionId')
  findByTransactionId(@Param('transactionId') transactionId: string) {
    return this.paymentsService.findByTransactionId(transactionId);
  }

  @ApiOperation({ 
    summary: 'Cập nhật giao dịch thanh toán',
    description: 'Cập nhật thông tin của một giao dịch thanh toán. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của giao dịch cần cập nhật', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdatePaymentDto })
  @ApiResponse({ status: 200, description: 'Cập nhật giao dịch thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy giao dịch' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @ApiOperation({ 
    summary: 'Xóa giao dịch thanh toán',
    description: 'Xóa một giao dịch thanh toán. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của giao dịch cần xóa', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa giao dịch thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy giao dịch' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }

  // ========== Webhook Endpoints ==========

  @ApiOperation({ 
    summary: 'Stripe webhook handler',
    description: 'Xử lý webhook từ Stripe. Public endpoint.'
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('webhook/stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const event = this.stripeService.verifyWebhook(signature, req.body);
      const result = await this.stripeService.handleWebhookEvent(event);

      if (result) {
        // Process based on event type
        if (result.type === 'checkout.completed' || result.type === 'payment.succeeded') {
          const { metadata } = result;
          if (metadata?.userId && metadata?.courseId) {
            // Find payment by session ID or payment intent ID
            const payment = await this.paymentsService.findByTransactionId(
              result.paymentIntentId || result.sessionId
            );
            
            if (payment) {
              await this.paymentsService.completePayment(
                payment._id.toString(),
                result.paymentIntentId
              );
            }
          }
        } else if (result.type === 'payment.failed') {
          const payment = await this.paymentsService.findByTransactionId(result.paymentIntentId);
          if (payment) {
            await this.paymentsService.handleFailedPayment(
              payment._id.toString(),
              result.errorMessage || 'Payment failed'
            );
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }

  @ApiOperation({ 
    summary: 'VNPay IPN handler',
    description: 'Xử lý IPN (Instant Payment Notification) từ VNPay. Public endpoint.'
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('webhook/vnpay')
  async handleVNPayIPN(@Query() query: any, @Res() res: Response) {
    try {
      const verification = this.vnpayService.verifyIPN(query);

      if (verification.isValid) {
        const { orderId, responseCode, transactionNo } = verification.data;

        const payment = await this.paymentsService.findByTransactionId(orderId);

        if (payment) {
          if (responseCode === '00') {
            // Payment successful
            await this.paymentsService.completePayment(
              payment._id.toString(),
              transactionNo
            );
            res.json({ RspCode: '00', Message: 'Success' });
          } else {
            // Payment failed
            const description = this.vnpayService.getResponseDescription(responseCode);
            await this.paymentsService.handleFailedPayment(
              payment._id.toString(),
              description
            );
            res.json({ RspCode: '00', Message: 'Success' });
          }
        } else {
          res.json({ RspCode: '01', Message: 'Order not found' });
        }
      } else {
        res.json({ RspCode: '97', Message: 'Invalid signature' });
      }
    } catch (error) {
      console.error('VNPay IPN error:', error);
      res.json({ RspCode: '99', Message: 'Unknown error' });
    }
  }

  @ApiOperation({ 
    summary: 'Momo IPN handler',
    description: 'Xử lý IPN từ Momo. Public endpoint.'
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('webhook/momo')
  async handleMomoIPN(@Body() body: any, @Res() res: Response) {
    try {
      const verification = this.momoService.handleIPN(body);

      if (verification.isValid) {
        const { orderId, resultCode, transId } = verification.data;

        const payment = await this.paymentsService.findByTransactionId(orderId);

        if (payment) {
          if (resultCode === 0) {
            // Payment successful
            await this.paymentsService.completePayment(
              payment._id.toString(),
              transId.toString()
            );
            res.json({ resultCode: 0, message: 'Success' });
          } else {
            // Payment failed
            const description = this.momoService.getResultDescription(resultCode);
            await this.paymentsService.handleFailedPayment(
              payment._id.toString(),
              description
            );
            res.json({ resultCode: 0, message: 'Success' });
          }
        } else {
          res.json({ resultCode: 1, message: 'Order not found' });
        }
      } else {
        res.json({ resultCode: 97, message: 'Invalid signature' });
      }
    } catch (error) {
      console.error('Momo IPN error:', error);
      res.json({ resultCode: 99, message: 'Unknown error' });
    }
  }

  @ApiOperation({ 
    summary: 'Verify payment return from gateway',
    description: 'Xác thực và xử lý return URL từ payment gateway. Public endpoint.'
  })
  @Public()
  @Get('verify/:gateway')
  async verifyPaymentReturn(
    @Param('gateway') gateway: string,
    @Query() query: any,
  ) {
    switch (gateway) {
      case 'vnpay':
        const vnpayResult = this.vnpayService.verifyReturnUrl(query);
        if (vnpayResult.isValid) {
          const payment = await this.paymentsService.findByTransactionId(vnpayResult.data.orderId);
          return {
            success: vnpayResult.data.responseCode === '00',
            payment,
            data: vnpayResult.data,
          };
        }
        return { success: false, message: 'Invalid signature' };

      case 'momo':
        // Momo typically sends data via query params too
        return { success: true, data: query };

      case 'stripe':
        // Stripe uses session ID
        if (query.session_id) {
          const session = await this.stripeService.retrieveSession(query.session_id);
          return { success: session.payment_status === 'paid', session };
        }
        return { success: false, message: 'No session ID provided' };

      default:
        return { success: false, message: 'Invalid gateway' };
    }
  }

  // ========== Payment Methods Management ==========

  @ApiOperation({ 
    summary: 'Lấy danh sách payment methods của user',
    description: 'Lấy tất cả payment methods đã lưu của user. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @Get('methods')
  async getUserPaymentMethods(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.paymentsService.getUserPaymentMethods(userId);
  }

  @ApiOperation({ 
    summary: 'Xóa payment method',
    description: 'Xóa một payment method đã lưu. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @Delete('methods/:id')
  async removePaymentMethod(@Param('id') methodId: string, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.paymentsService.removePaymentMethod(userId, methodId);
  }

  @ApiOperation({ 
    summary: 'Hoàn tiền giao dịch',
    description: 'Xử lý hoàn tiền cho một giao dịch. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @Post(':id/refund')
  async refundPayment(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.paymentsService.refundPayment(id, body.reason);
  }
}

