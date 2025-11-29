import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findAllPaginated(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      skill?: string;
      testType?: string;
      series?: string;
      level?: string;
      language?: string;
    },
  ) {
    // Ensure page and pageSize are positive numbers
    const currentPage = Math.max(1, Math.floor(page));
    const limit = Math.max(1, Math.floor(pageSize));
    const skip = (currentPage - 1) * limit;
    const filter: Record<string, any> = {};

    if (filters?.skill) {
      filter.skill = filters.skill;
    }
    if (filters?.testType) {
      filter.testType = filters.testType;
    }
    if (filters?.series) {
      filter.series = filters.series;
    }
    if (filters?.level) {
      filter.level = filters.level;
    }
    if (filters?.language) {
      filter.language = filters.language;
    }

    // Get total count and paginated data in parallel
    const [totalItems, data] = await Promise.all([
      this.testModel.countDocuments(filter).exec(),
      this.testModel
        .find(filter)
        .populate('createdBy', 'name email')
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;

    return {
      data,
      pagination: {
        currentPage,
        pageSize: limit,
        totalItems,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  async findOne(id: string) {
    const test = await this.testModel.findById(id).populate('createdBy', 'name email').exec();
    if (!test) {
      throw new NotFoundException(`Test with ID ${id} not found`);
    }
    return test;
  }

  async update(id: string, updateTestDto: UpdateTestDto) {
    const test = await this.testModel
      .findByIdAndUpdate(id, updateTestDto, { new: true })
      .exec();
    if (!test) {
      throw new NotFoundException(`Test with ID ${id} not found`);
    }
    return test;
  }

  async remove(id: string) {
    const test = await this.testModel.findByIdAndDelete(id).exec();
    if (!test) {
      throw new NotFoundException(`Test with ID ${id} not found`);
    }
    return test;
  }
}
