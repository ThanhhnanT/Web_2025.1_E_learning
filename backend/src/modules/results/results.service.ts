import { Injectable } from '@nestjs/common';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Result } from './schema/result.schema';
import { Model } from 'mongoose';

@Injectable()
export class ResultsService {
  constructor(
    @InjectModel(Result.name) private resultModel: Model<Result>,
  ) {}

  async create(createResultDto: CreateResultDto) {
    const newResult = await this.resultModel.create(createResultDto);
    return newResult;
  }

  async findAll() {
    return await this.resultModel
      .find({ deletedAt: null })
      .populate('userId', 'name email')
      .populate('testId', 'title language level')
      .populate('answerId', 'correctAnswer')
      .sort({ completedAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    return await this.resultModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('testId', 'title language level durationMinutes totalQuestions')
      .populate('answerId', 'correctAnswer')
      .exec();
  }

  async findByUserId(userId: string) {
    return await this.resultModel
      .find({ userId, deletedAt: null })
      .populate('testId', 'title language level')
      .populate('answerId', 'correctAnswer')
      .sort({ completedAt: -1 })
      .exec();
  }

  async findByTestId(testId: string) {
    return await this.resultModel
      .find({ testId, deletedAt: null })
      .populate('userId', 'name email')
      .populate('answerId', 'correctAnswer')
      .sort({ score: -1, completedAt: -1 })
      .exec();
  }

  async findByUserAndTest(userId: string, testId: string) {
    return await this.resultModel
      .find({ userId, testId, deletedAt: null })
      .populate('testId', 'title language level')
      .populate('answerId', 'correctAnswer')
      .sort({ completedAt: -1 })
      .exec();
  }

  async update(id: string, updateResultDto: UpdateResultDto) {
    return await this.resultModel
      .findByIdAndUpdate(id, updateResultDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    // Soft delete
    return await this.resultModel
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .exec();
  }

  async hardDelete(id: string) {
    // Xóa thật sự khỏi database
    return await this.resultModel.findByIdAndDelete(id).exec();
  }
}
