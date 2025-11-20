import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from './schema/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const newPayment = await this.paymentModel.create(createPaymentDto);
    return newPayment;
  }

  async findAll(userId?: string, courseId?: string, status?: string) {
    const query: any = {};
    if (userId) query.userId = userId;
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;

    return await this.paymentModel
      .find(query)
      .populate('userId', 'name email')
      .populate('courseId', 'title price')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    return await this.paymentModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('courseId', 'title price')
      .exec();
  }

  async findByTransactionId(transactionId: string) {
    return await this.paymentModel
      .findOne({ transactionId })
      .populate('userId', 'name email')
      .populate('courseId', 'title price')
      .exec();
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    return await this.paymentModel
      .findByIdAndUpdate(id, updatePaymentDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return await this.paymentModel.findByIdAndDelete(id).exec();
  }
}

