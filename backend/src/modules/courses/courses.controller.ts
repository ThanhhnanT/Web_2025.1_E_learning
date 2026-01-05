import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Public } from '@/auth/decorate/customize';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // Course endpoints
  @ApiOperation({ 
    summary: 'Tạo khóa học mới',
    description: 'Tạo một khóa học mới. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({ status: 201, description: 'Tạo khóa học thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @ApiOperation({ 
    summary: 'Lấy danh sách tất cả khóa học',
    description: 'Lấy danh sách tất cả các khóa học với các bộ lọc tùy chọn. API này là public.'
  })
  @ApiQuery({ name: 'category', required: false, enum: ['HSK', 'TOEIC', 'IELTS'], description: 'Lọc theo danh mục' })
  @ApiQuery({ name: 'difficulty', required: false, description: 'Lọc theo mức độ (Beginner, Intermediate, Advanced)' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Giá tối thiểu' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Giá tối đa' })
  @ApiQuery({ name: 'isFree', required: false, type: Boolean, description: 'Chỉ lấy khóa học miễn phí' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm theo tiêu đề hoặc mô tả' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách khóa học thành công' })
  @Public()
  @Get()
  findAll(
    @Query('category') category?: 'HSK' | 'TOEIC' | 'IELTS',
    @Query('difficulty') difficulty?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('isFree') isFree?: string,
    @Query('search') search?: string,
  ) {
    return this.coursesService.findAll({
      category,
      difficulty,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      isFree: isFree === 'true',
      search,
    });
  }

  // Module endpoints - MUST BE BEFORE :id route
  @ApiOperation({ 
    summary: 'Tạo module mới',
    description: 'Tạo một module mới cho khóa học. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateModuleDto })
  @ApiResponse({ status: 201, description: 'Tạo module thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post('modules')
  createModule(@Body() createModuleDto: CreateModuleDto) {
    return this.coursesService.createModule(createModuleDto);
  }

  @ApiOperation({ 
    summary: 'Lấy danh sách modules',
    description: 'Lấy danh sách tất cả modules hoặc modules của một khóa học cụ thể. API này là public.'
  })
  @ApiQuery({ name: 'courseId', required: false, description: 'ID của khóa học để lọc modules' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách modules thành công' })
  @Public()
  @Get('modules/all')
  findAllModules(@Query('courseId') courseId?: string) {
    return this.coursesService.findAllModules(courseId);
  }

  @ApiOperation({ 
    summary: 'Lấy chi tiết module theo ID',
    description: 'Lấy thông tin chi tiết của một module cụ thể. API này là public.'
  })
  @ApiParam({ name: 'id', description: 'ID của module', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết module thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy module' })
  @Public()
  @Get('modules/:id')
  findOneModule(@Param('id') id: string) {
    return this.coursesService.findOneModule(id);
  }

  @ApiOperation({ 
    summary: 'Cập nhật module',
    description: 'Cập nhật thông tin của một module. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của module cần cập nhật', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateModuleDto })
  @ApiResponse({ status: 200, description: 'Cập nhật module thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy module' })
  @Patch('modules/:id')
  updateModule(@Param('id') id: string, @Body() updateModuleDto: UpdateModuleDto) {
    return this.coursesService.updateModule(id, updateModuleDto);
  }

  @ApiOperation({ 
    summary: 'Xóa module',
    description: 'Xóa một module. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của module cần xóa', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa module thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy module' })
  @Delete('modules/:id')
  removeModule(@Param('id') id: string) {
    return this.coursesService.removeModule(id);
  }

  // Lesson endpoints
  @ApiOperation({ 
    summary: 'Tạo lesson mới',
    description: 'Tạo một lesson mới cho module. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateLessonDto })
  @ApiResponse({ status: 201, description: 'Tạo lesson thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post('lessons')
  createLesson(@Body() createLessonDto: CreateLessonDto) {
    return this.coursesService.createLesson(createLessonDto);
  }

  @ApiOperation({ 
    summary: 'Lấy danh sách lessons',
    description: 'Lấy danh sách tất cả lessons hoặc lessons của một module cụ thể. API này là public.'
  })
  @ApiQuery({ name: 'moduleId', required: false, description: 'ID của module để lọc lessons' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách lessons thành công' })
  @Public()
  @Get('lessons/all')
  findAllLessons(@Query('moduleId') moduleId?: string) {
    return this.coursesService.findAllLessons(moduleId);
  }

  @ApiOperation({ 
    summary: 'Lấy chi tiết lesson theo ID',
    description: 'Lấy thông tin chi tiết của một lesson cụ thể. API này là public.'
  })
  @ApiParam({ name: 'id', description: 'ID của lesson', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết lesson thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lesson' })
  @Public()
  @Get('lessons/:id')
  findOneLesson(@Param('id') id: string) {
    return this.coursesService.findOneLesson(id);
  }

  @ApiOperation({ 
    summary: 'Cập nhật lesson',
    description: 'Cập nhật thông tin của một lesson. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của lesson cần cập nhật', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateLessonDto })
  @ApiResponse({ status: 200, description: 'Cập nhật lesson thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lesson' })
  @Patch('lessons/:id')
  updateLesson(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto) {
    return this.coursesService.updateLesson(id, updateLessonDto);
  }

  @ApiOperation({ 
    summary: 'Xóa lesson',
    description: 'Xóa một lesson (soft delete). Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của lesson cần xóa', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa lesson thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lesson' })
  @Delete('lessons/:id')
  removeLesson(@Param('id') id: string) {
    return this.coursesService.removeLesson(id);
  }

  // Course CRUD operations - MUST BE AFTER all specific routes
  @ApiOperation({ 
    summary: 'Lấy chi tiết khóa học theo ID',
    description: 'Lấy thông tin chi tiết của một khóa học cụ thể. API này là public.'
  })
  @ApiParam({ name: 'id', description: 'ID của khóa học', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết khóa học thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khóa học' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @ApiOperation({ 
    summary: 'Cập nhật khóa học',
    description: 'Cập nhật thông tin của một khóa học. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của khóa học cần cập nhật', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({ status: 200, description: 'Cập nhật khóa học thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khóa học' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @ApiOperation({ 
    summary: 'Xóa khóa học',
    description: 'Xóa một khóa học. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của khóa học cần xóa', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa khóa học thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khóa học' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}

