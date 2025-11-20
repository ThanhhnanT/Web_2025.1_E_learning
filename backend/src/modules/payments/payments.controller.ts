import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Public } from '@/auth/decorate/customize';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ 
    summary: 'Tạo giao dịch thanh toán mới',
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
}

