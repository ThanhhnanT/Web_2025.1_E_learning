import { Injectable } from '@nestjs/common';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Answer } from './schema/answer.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class AnswersService {
  constructor(
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
  ) {}

  async create(createAnswerDto: CreateAnswerDto) {
    const newAnswer = await this.answerModel.create({
      ...createAnswerDto,
      testId: new Types.ObjectId(createAnswerDto.testId),
      sectionId: new Types.ObjectId(createAnswerDto.sectionId),
    });
    return newAnswer;
  }

  async findAll() {
    return await this.answerModel
      .find({ deletedAt: null })
      .populate('testId')
      .populate('sectionId')
      .exec();
  }

  async findOne(id: string) {
    return await this.answerModel
      .findById(id)
      .populate('testId')
      .populate('sectionId')
      .exec();
  }

  async findByTestIdAndSectionId(testId: string, sectionId: string) {
    return await this.answerModel
      .findOne({
        testId: new Types.ObjectId(testId),
        sectionId: new Types.ObjectId(sectionId),
        deletedAt: null,
      })
      .populate('testId')
      .populate('sectionId')
      .exec();
  }

  async findByTestId(testId: string) {
    return await this.answerModel
      .find({
        testId: new Types.ObjectId(testId),
        deletedAt: null,
      })
      .populate('testId')
      .populate('sectionId')
      .sort({ partNumber: 1 })
      .exec();
  }

  async findBySectionId(sectionId: string) {
    return await this.answerModel
      .findOne({
        sectionId: new Types.ObjectId(sectionId),
        deletedAt: null,
      })
      .populate('testId')
      .populate('sectionId')
      .exec();
  }

  // DEPRECATED: Keep for backward compatibility
  async findByContentId(contentId: string) {
    return null;
  }

  async update(id: string, updateAnswerDto: UpdateAnswerDto) {
    const updateData: any = { ...updateAnswerDto };
    if (updateAnswerDto.testId) {
      updateData.testId = new Types.ObjectId(updateAnswerDto.testId);
    }
    if (updateAnswerDto.sectionId) {
      updateData.sectionId = new Types.ObjectId(updateAnswerDto.sectionId);
    }
    return await this.answerModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('testId')
      .populate('sectionId')
      .exec();
  }

  async remove(id: string) {
    // Soft delete
    return await this.answerModel
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .exec();
  }

  async hardDelete(id: string) {
    // Xóa thật sự khỏi database
    return await this.answerModel.findByIdAndDelete(id).exec();
  }
}
