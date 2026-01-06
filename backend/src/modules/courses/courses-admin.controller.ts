import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { AdminGuard } from '@/auth/admin.guard';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@ApiTags('Admin Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/courses')
export class CoursesAdminController {
  constructor(private readonly coursesService: CoursesService) {}

  @ApiOperation({
    summary: 'Get all courses with stats (Admin)',
    description: 'Get all courses with enrollment statistics. Admin only.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, enum: ['HSK', 'TOEIC', 'IELTS'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @Get()
  async getAllCourses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [courses, total] = await Promise.all([
      this.coursesService['courseModel']
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
        .exec(),
      this.coursesService['courseModel'].countDocuments(filter),
    ]);

    return {
      data: courses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalItems: total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @ApiOperation({
    summary: 'Get course analytics (Admin)',
    description: 'Get detailed analytics for a specific course. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @Get(':id/analytics')
  async getCourseAnalytics(@Param('id') id: string) {
    // This would integrate with EnrollmentsService in production
    return {
      courseId: id,
      totalEnrollments: 0,
      activeEnrollments: 0,
      completedEnrollments: 0,
      averageProgress: 0,
      averageCompletionTime: 0,
    };
  }

  @ApiOperation({
    summary: 'Create course (Admin)',
    description: 'Create a new course. Admin only.',
  })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @ApiOperation({
    summary: 'Update any course (Admin)',
    description: 'Admin can update any course regardless of ownership.',
  })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @ApiOperation({
    summary: 'Delete any course (Admin)',
    description: 'Delete a course. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @ApiOperation({
    summary: 'Publish/unpublish course (Admin)',
    description: 'Toggle course published status. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course publish status updated' })
  @Post(':id/publish')
  async togglePublish(
    @Param('id') id: string,
    @Body() body: { published: boolean },
  ) {
    // Map published boolean to status string
    const status = body.published ? 'published' : 'draft';
    return this.coursesService.update(id, { status } as any);
  }

  // Module management
  @ApiOperation({
    summary: 'Create module (Admin)',
    description: 'Create a new module for a course. Admin only.',
  })
  @ApiResponse({ status: 201, description: 'Module created successfully' })
  @Post('modules')
  createModule(@Body() createModuleDto: CreateModuleDto) {
    return this.coursesService.createModule(createModuleDto);
  }

  @ApiOperation({
    summary: 'Update any module (Admin)',
    description: 'Admin can update any module.',
  })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiResponse({ status: 200, description: 'Module updated successfully' })
  @Patch('modules/:id')
  updateModule(
    @Param('id') id: string,
    @Body() updateModuleDto: UpdateModuleDto,
  ) {
    return this.coursesService.updateModule(id, updateModuleDto);
  }

  @ApiOperation({
    summary: 'Delete any module (Admin)',
    description: 'Delete a module. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiResponse({ status: 200, description: 'Module deleted successfully' })
  @Delete('modules/:id')
  removeModule(@Param('id') id: string) {
    return this.coursesService.removeModule(id);
  }

  // Lesson management
  @ApiOperation({
    summary: 'Create lesson (Admin)',
    description: 'Create a new lesson for a module. Admin only.',
  })
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  @Post('lessons')
  createLesson(@Body() createLessonDto: CreateLessonDto) {
    return this.coursesService.createLesson(createLessonDto);
  }

  @ApiOperation({
    summary: 'Update any lesson (Admin)',
    description: 'Admin can update any lesson.',
  })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson updated successfully' })
  @Patch('lessons/:id')
  updateLesson(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.coursesService.updateLesson(id, updateLessonDto);
  }

  @ApiOperation({
    summary: 'Delete any lesson (Admin)',
    description: 'Delete a lesson. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson deleted successfully' })
  @Delete('lessons/:id')
  removeLesson(@Param('id') id: string) {
    return this.coursesService.removeLesson(id);
  }

  @ApiOperation({
    summary: 'Get course with modules and lessons (Admin)',
    description: 'Get course details with all modules and lessons. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully' })
  @Get(':id/full')
  async getCourseFull(@Param('id') id: string) {
    const course = await this.coursesService.findOne(id);
    const modules = await this.coursesService.findAllModules(id);
    const modulesWithLessons = await Promise.all(
      modules.map(async (module: any) => {
        const lessons = await this.coursesService.findAllLessons(module._id.toString());
        return {
          ...module.toObject ? module.toObject() : module,
          lessons,
        };
      })
    );
    return {
      course,
      modules: modulesWithLessons,
    };
  }

  @ApiOperation({
    summary: 'Bulk delete courses (Admin)',
    description: 'Delete multiple courses at once. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Courses deleted successfully' })
  @Post('bulk/delete')
  async bulkDelete(@Body() body: { courseIds: string[] }) {
    for (const id of body.courseIds) {
      await this.coursesService.remove(id);
    }
    return {
      message: 'Courses deleted successfully',
      deletedCount: body.courseIds.length,
    };
  }
}

