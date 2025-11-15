import { Injectable } from '@nestjs/common';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Content } from './schema/content.schema';
import { Model } from 'mongoose';

@Injectable()
export class ContentsService {
  constructor(
    @InjectModel(Content.name) private contentModel: Model<Content>,
  ) {}

  async create(createContentDto: CreateContentDto) {
    const newContent = await this.contentModel.create(createContentDto);
    return newContent;
  }

  async findAll() {
    return await this.contentModel
      .find({ deletedAt: null })
      .populate('testId', 'title language level')
      .exec();
  }

  async findOne(id: string) {
    return await this.contentModel
      .findById(id)
      .populate('testId', 'title language level')
      .exec();
  }

  async findByTestId(testId: string) {
    // Tìm content theo testId và chưa bị xóa
    return await this.contentModel
      .find({ testId, deletedAt: null })
      .exec();
  }

  async update(id: string, updateContentDto: UpdateContentDto) {
    return await this.contentModel
      .findByIdAndUpdate(id, updateContentDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    // Soft delete: chỉ đánh dấu deletedAt thay vì xóa thật
    return await this.contentModel
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .exec();
  }

  async hardDelete(id: string) {
    // Xóa thật sự khỏi database
    return await this.contentModel.findByIdAndDelete(id).exec();
  }
}
