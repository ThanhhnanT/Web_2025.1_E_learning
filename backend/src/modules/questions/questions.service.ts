import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from './schema/question.schema';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name)
    private questionModel: Model<QuestionDocument>,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const question = new this.questionModel({
      ...createQuestionDto,
      questionGroupId: new Types.ObjectId(createQuestionDto.questionGroupId),
    });
    return question.save();
  }

  async createMany(createQuestionDtos: CreateQuestionDto[]) {
    const questions = createQuestionDtos.map(dto => ({
      ...dto,
      questionGroupId: new Types.ObjectId(dto.questionGroupId),
    }));
    return this.questionModel.insertMany(questions);
  }

  async findAll(): Promise<Question[]> {
    return this.questionModel
      .find({ deletedAt: null })
      .sort({ questionNumber: 1 })
      .exec();
  }

  async findByQuestionGroupId(questionGroupId: string): Promise<Question[]> {
    return this.questionModel
      .find({ 
        questionGroupId: new Types.ObjectId(questionGroupId),
        deletedAt: null 
      })
      .sort({ order: 1 })
      .exec();
  }

  async findByQuestionNumbers(questionNumbers: number[]): Promise<Question[]> {
    return this.questionModel
      .find({ 
        questionNumber: { $in: questionNumbers },
        deletedAt: null 
      })
      .sort({ questionNumber: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Question> {
    const question = await this.questionModel
      .findOne({ _id: new Types.ObjectId(id), deletedAt: null })
      .exec();
    
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    
    return question;
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto): Promise<Question> {
    const updateData: any = { ...updateQuestionDto };
    
    if (updateQuestionDto.questionGroupId) {
      updateData.questionGroupId = new Types.ObjectId(updateQuestionDto.questionGroupId);
    }

    const question = await this.questionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        updateData,
        { new: true }
      )
      .exec();
    
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    
    return question;
  }

  async remove(id: string): Promise<void> {
    const result = await this.questionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
      )
      .exec();
    
    if (!result) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
  }

  async hardDelete(id: string): Promise<void> {
    const result = await this.questionModel
      .deleteOne({ _id: new Types.ObjectId(id) })
      .exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
  }
}

