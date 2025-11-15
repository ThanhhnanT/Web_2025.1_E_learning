import { Injectable } from '@nestjs/common';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Answer } from './schema/answer.schema';
import { Model } from 'mongoose';

@Injectable()
export class AnswersService {
  constructor(
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
  ) {}

  async create(createAnswerDto: CreateAnswerDto) {
    const newAnswer = await this.answerModel.create(createAnswerDto);
    return newAnswer;
  }


  async findAll() {
    return await this.answerModel
      .find({ deletedAt: null })
      .populate('contentId')
      .exec();
  }

  async findOne(id: string) {
    return await this.answerModel
      .findById(id)
      .populate('contentId')
      .exec();
  }

  async findByContentId(contentId: string) {
    // Lấy answer của một content
    return await this.answerModel
      .findOne({ contentId, deletedAt: null })
      .populate('contentId')
      .exec();
  }

  async update(id: string, updateAnswerDto: UpdateAnswerDto) {
    return await this.answerModel
      .findByIdAndUpdate(id, updateAnswerDto, { new: true })
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
