import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course } from './schema/course.schema';
import { Module as CourseModule } from './schema/module.schema';
import { Lesson } from './schema/lesson.schema';
import { Comment } from '../comments/schema/comment.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

interface CourseFilterOptions {
  category?: 'HSK' | 'TOEIC' | 'IELTS';
  difficulty?: string;
  minPrice?: number;
  maxPrice?: number;
  isFree?: boolean;
  search?: string;
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(CourseModule.name) private moduleModel: Model<CourseModule>,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
  ) {}

  // Course methods
  async create(createCourseDto: CreateCourseDto) {
    const newCourse = await this.courseModel.create(createCourseDto);
    return newCourse;
  }

  async findAll(filters?: CourseFilterOptions) {
    const query: any = {};

    // Category filter
    if (filters?.category) {
      query.category = filters.category;
    }

    // Difficulty filter
    if (filters?.difficulty) {
      query.level = { $regex: filters.difficulty, $options: 'i' };
    }

    // Price filters
    if (filters?.isFree) {
      query.price = 0;
    } else {
      if (filters?.minPrice !== undefined) {
        query.price = { ...query.price, $gte: filters.minPrice };
      }
      if (filters?.maxPrice !== undefined) {
        query.price = { ...query.price, $lte: filters.maxPrice };
      }
    }

    // Search filter
    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const courses = await this.courseModel
      .find(query)
      .populate('instructor', 'name email')
      .exec();

    // Calculate average ratings for each course
    const coursesWithRatings = await Promise.all(
      courses.map(async (course) => {
        const ratingResult = await this.commentModel.aggregate([
          {
            $match: {
              courseId: course._id,
              deletedAt: null,
              rating: { $exists: true, $ne: null },
            },
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
            },
          },
        ]);

        const averageRating =
          ratingResult.length > 0
            ? Math.round(ratingResult[0].averageRating * 10) / 10
            : 0;

        return {
          ...course.toObject(),
          averageRating,
        };
      }),
    );

    return coursesWithRatings;
  }

  async findOne(id: string) {
    return await this.courseModel
      .findById(id)
      .populate('instructor', 'name email')
      .exec();
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    return await this.courseModel
      .findByIdAndUpdate(id, updateCourseDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return await this.courseModel.findByIdAndDelete(id).exec();
  }

  // Module methods
  async createModule(createModuleDto: CreateModuleDto) {
    const newModule = await this.moduleModel.create(createModuleDto);
    // Update totalModules in course
    await this.courseModel.findByIdAndUpdate(createModuleDto.courseId, {
      $inc: { totalModules: 1 },
    });
    return newModule;
  }

  async findAllModules(courseId?: string) {
    const query: any = {};
    if (courseId) {
      // Convert string to ObjectId for proper comparison
      query.courseId = Types.ObjectId.isValid(courseId) 
        ? new Types.ObjectId(courseId) 
        : courseId;
    }
    return await this.moduleModel
      .find(query)
      .sort({ order: 1 })
      .populate('courseId', 'title')
      .exec();
  }

  async findOneModule(id: string) {
    return await this.moduleModel
      .findById(id)
      .populate('courseId', 'title')
      .exec();
  }

  async updateModule(id: string, updateModuleDto: UpdateModuleDto) {
    return await this.moduleModel
      .findByIdAndUpdate(id, updateModuleDto, { new: true })
      .exec();
  }

  async removeModule(id: string) {
    const module = await this.moduleModel.findById(id).exec();
    if (module) {
      // Update totalModules in course
      await this.courseModel.findByIdAndUpdate(module.courseId, {
        $inc: { totalModules: -1 },
      });
      return await this.moduleModel.findByIdAndDelete(id).exec();
    }
    return null;
  }

  // Lesson methods
  async createLesson(createLessonDto: CreateLessonDto) {
    const newLesson = await this.lessonModel.create(createLessonDto);
    // Update totalLessons in module
    await this.moduleModel.findByIdAndUpdate(createLessonDto.moduleId, {
      $inc: { totalLessons: 1 },
    });
    return newLesson;
  }

  async findAllLessons(moduleId?: string) {
    const query: any = { deletedAt: null };
    if (moduleId) {
      // Convert string to ObjectId for proper comparison
      query.moduleId = Types.ObjectId.isValid(moduleId) 
        ? new Types.ObjectId(moduleId) 
        : moduleId;
    }
    return await this.lessonModel
      .find(query)
      .sort({ order: 1 })
      .populate('moduleId', 'title')
      .exec();
  }

  async findOneLesson(id: string) {
    return await this.lessonModel
      .findById(id)
      .populate('moduleId', 'title')
      .exec();
  }

  async updateLesson(id: string, updateLessonDto: UpdateLessonDto) {
    return await this.lessonModel
      .findByIdAndUpdate(id, updateLessonDto, { new: true })
      .exec();
  }

  async removeLesson(id: string) {
    const lesson = await this.lessonModel.findById(id).exec();
    if (lesson) {
      // Soft delete
      lesson.deletedAt = new Date();
      await lesson.save();
      // Update totalLessons in module
      await this.moduleModel.findByIdAndUpdate(lesson.moduleId, {
        $inc: { totalLessons: -1 },
      });
      return lesson;
    }
    return null;
  }
}

