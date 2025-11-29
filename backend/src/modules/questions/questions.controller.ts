import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple questions' })
  @ApiResponse({ status: 201, description: 'Questions created successfully' })
  createMany(@Body() createQuestionDtos: CreateQuestionDto[]) {
    return this.questionsService.createMany(createQuestionDtos);
  }

  @Get()
  @ApiOperation({ summary: 'Get all questions' })
  @ApiResponse({ status: 200, description: 'List of all questions' })
  @ApiQuery({ name: 'numbers', required: false, type: String, description: 'Comma-separated question numbers' })
  findAll(@Query('numbers') numbers?: string) {
    if (numbers) {
      const questionNumbers = numbers.split(',').map(n => parseInt(n, 10));
      return this.questionsService.findByQuestionNumbers(questionNumbers);
    }
    return this.questionsService.findAll();
  }

  @Get('group/:questionGroupId')
  @ApiOperation({ summary: 'Get all questions for a specific question group' })
  @ApiResponse({ status: 200, description: 'List of questions for the group' })
  findByQuestionGroupId(@Param('questionGroupId') questionGroupId: string) {
    return this.questionsService.findByQuestionGroupId(questionGroupId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific question' })
  @ApiResponse({ status: 200, description: 'Question found' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a question' })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  update(@Param('id') id: string, @Body() updateQuestionDto: UpdateQuestionDto) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a question' })
  @ApiResponse({ status: 204, description: 'Question deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete a question' })
  @ApiResponse({ status: 204, description: 'Question permanently deleted' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  hardDelete(@Param('id') id: string) {
    return this.questionsService.hardDelete(id);
  }
}

