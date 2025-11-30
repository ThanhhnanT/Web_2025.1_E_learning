import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QuestionGroup, QuestionGroupDocument } from './schema/question-group.schema';
import { CreateQuestionGroupDto } from './dto/create-question-group.dto';
import { UpdateQuestionGroupDto } from './dto/update-question-group.dto';

@Injectable()
export class QuestionGroupsService {
  constructor(
    @InjectModel(QuestionGroup.name)
    private questionGroupModel: Model<QuestionGroupDocument>,
  ) {}

  async create(createQuestionGroupDto: CreateQuestionGroupDto): Promise<QuestionGroup> {
    const questionGroup = new this.questionGroupModel({
      ...createQuestionGroupDto,
      sectionId: new Types.ObjectId(createQuestionGroupDto.sectionId),
    });
    return questionGroup.save();
  }

  async findAll(): Promise<QuestionGroup[]> {
    return this.questionGroupModel
      .find({ deletedAt: null })
      .sort({ order: 1 })
      .exec();
  }

  async findBySectionId(sectionId: string): Promise<QuestionGroup[]> {
    return this.questionGroupModel
      .find({ 
        sectionId: new Types.ObjectId(sectionId),
        deletedAt: null 
      })
      .sort({ order: 1 })
      .exec();
  }

  async findOne(id: string): Promise<QuestionGroup> {
    const questionGroup = await this.questionGroupModel
      .findOne({ _id: new Types.ObjectId(id), deletedAt: null })
      .exec();
    
    if (!questionGroup) {
      throw new NotFoundException(`Question group with ID ${id} not found`);
    }
    
    return questionGroup;
  }

  async update(id: string, updateQuestionGroupDto: UpdateQuestionGroupDto): Promise<QuestionGroup> {
    const updateData: any = { ...updateQuestionGroupDto };
    
    if (updateQuestionGroupDto.sectionId) {
      updateData.sectionId = new Types.ObjectId(updateQuestionGroupDto.sectionId);
    }

    const questionGroup = await this.questionGroupModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        updateData,
        { new: true }
      )
      .exec();
    
    if (!questionGroup) {
      throw new NotFoundException(`Question group with ID ${id} not found`);
    }
    
    return questionGroup;
  }

  async remove(id: string): Promise<void> {
    const result = await this.questionGroupModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
      )
      .exec();
    
    if (!result) {
      throw new NotFoundException(`Question group with ID ${id} not found`);
    }
  }

  async hardDelete(id: string): Promise<void> {
    const result = await this.questionGroupModel
      .deleteOne({ _id: new Types.ObjectId(id) })
      .exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Question group with ID ${id} not found`);
    }
  }
}

