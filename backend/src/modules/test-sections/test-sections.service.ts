import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TestSection, TestSectionDocument } from './schema/test-section.schema';
import { CreateTestSectionDto } from './dto/create-test-section.dto';
import { UpdateTestSectionDto } from './dto/update-test-section.dto';

@Injectable()
export class TestSectionsService {
  constructor(
    @InjectModel(TestSection.name)
    private testSectionModel: Model<TestSectionDocument>,
  ) {}

  async create(createTestSectionDto: CreateTestSectionDto): Promise<TestSection> {
    const testSection = new this.testSectionModel({
      ...createTestSectionDto,
      testId: new Types.ObjectId(createTestSectionDto.testId),
    });
    return testSection.save();
  }

  async findAll(): Promise<TestSection[]> {
    return this.testSectionModel
      .find({ deletedAt: null })
      .sort({ order: 1 })
      .exec();
  }

  async findByTestId(testId: string): Promise<TestSection[]> {
    return this.testSectionModel
      .find({ 
        testId: new Types.ObjectId(testId),
        deletedAt: null 
      })
      .sort({ order: 1 })
      .exec();
  }

  async findByTestAndFilters(
    testId: string,
    filters?: { sectionType?: string; partNumber?: number },
  ): Promise<TestSection[]> {
    const query: any = {
      testId: new Types.ObjectId(testId),
      deletedAt: null,
    };

    if (filters?.sectionType) {
      query.sectionType = filters.sectionType;
    }
    if (typeof filters?.partNumber === 'number') {
      query.partNumber = filters.partNumber;
    }

    return this.testSectionModel
      .find(query)
      .sort({ order: 1 })
      .exec();
  }

  async findOne(id: string): Promise<TestSection> {
    const testSection = await this.testSectionModel
      .findOne({ _id: new Types.ObjectId(id), deletedAt: null })
      .exec();
    
    if (!testSection) {
      throw new NotFoundException(`Test section with ID ${id} not found`);
    }
    
    return testSection;
  }

  async update(id: string, updateTestSectionDto: UpdateTestSectionDto): Promise<TestSection> {
    const updateData: any = { ...updateTestSectionDto };
    
    if (updateTestSectionDto.testId) {
      updateData.testId = new Types.ObjectId(updateTestSectionDto.testId);
    }

    const testSection = await this.testSectionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        updateData,
        { new: true }
      )
      .exec();
    
    if (!testSection) {
      throw new NotFoundException(`Test section with ID ${id} not found`);
    }
    
    return testSection;
  }

  async remove(id: string): Promise<void> {
    const result = await this.testSectionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
      )
      .exec();
    
    if (!result) {
      throw new NotFoundException(`Test section with ID ${id} not found`);
    }
  }

  async hardDelete(id: string): Promise<void> {
    const result = await this.testSectionModel
      .deleteOne({ _id: new Types.ObjectId(id) })
      .exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Test section with ID ${id} not found`);
    }
  }
}

