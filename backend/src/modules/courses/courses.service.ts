import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from './schema/course.schema';
import { Module as CourseModule } from './schema/module.schema';
import { Lesson } from './schema/lesson.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(CourseModule.name) private moduleModel: Model<CourseModule>,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
  ) {}

  // Course methods
  async create(createCourseDto: CreateCourseDto) {
    const newCourse = await this.courseModel.create(createCourseDto);
    return newCourse;
  }

  async findAll() {
    return await this.courseModel
      .find()
      .populate('instructor', 'name email')
      .exec();
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
    const query = courseId ? { courseId } : {};
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
    const query = moduleId ? { moduleId, deletedAt: null } : { deletedAt: null };
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

