import { Injectable } from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Test } from './schema/test.schema';
import { Model } from 'mongoose';

@Injectable()
export class TestsService {
  constructor(
    @InjectModel(Test.name) private testModel: Model<Test>,
  ) {}

  async create(createTestDto: CreateTestDto) {
    const newTest = await this.testModel.create(createTestDto);
    return newTest;
  }

  async findAll() {
    return await this.testModel.find().populate('createdBy', 'name email').exec();
  }

  async findOne(id: string) {
    return await this.testModel.findById(id).populate('createdBy', 'name email').exec();
  }

  async update(id: string, updateTestDto: UpdateTestDto) {
    return await this.testModel
      .findByIdAndUpdate(id, updateTestDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return await this.testModel.findByIdAndDelete(id).exec();
  }
}
