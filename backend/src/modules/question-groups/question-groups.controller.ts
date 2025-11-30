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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuestionGroupsService } from './question-groups.service';
import { CreateQuestionGroupDto } from './dto/create-question-group.dto';
import { UpdateQuestionGroupDto } from './dto/update-question-group.dto';

@ApiTags('question-groups')
@Controller('question-groups')
export class QuestionGroupsController {
  constructor(private readonly questionGroupsService: QuestionGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new question group' })
  @ApiResponse({ status: 201, description: 'Question group created successfully' })
  create(@Body() createQuestionGroupDto: CreateQuestionGroupDto) {
    return this.questionGroupsService.create(createQuestionGroupDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all question groups' })
  @ApiResponse({ status: 200, description: 'List of all question groups' })
  findAll() {
    return this.questionGroupsService.findAll();
  }

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Get all question groups for a specific section' })
  @ApiResponse({ status: 200, description: 'List of question groups for the section' })
  findBySectionId(@Param('sectionId') sectionId: string) {
    return this.questionGroupsService.findBySectionId(sectionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific question group' })
  @ApiResponse({ status: 200, description: 'Question group found' })
  @ApiResponse({ status: 404, description: 'Question group not found' })
  findOne(@Param('id') id: string) {
    return this.questionGroupsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a question group' })
  @ApiResponse({ status: 200, description: 'Question group updated successfully' })
  @ApiResponse({ status: 404, description: 'Question group not found' })
  update(@Param('id') id: string, @Body() updateQuestionGroupDto: UpdateQuestionGroupDto) {
    return this.questionGroupsService.update(id, updateQuestionGroupDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a question group' })
  @ApiResponse({ status: 204, description: 'Question group deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question group not found' })
  remove(@Param('id') id: string) {
    return this.questionGroupsService.remove(id);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete a question group' })
  @ApiResponse({ status: 204, description: 'Question group permanently deleted' })
  @ApiResponse({ status: 404, description: 'Question group not found' })
  hardDelete(@Param('id') id: string) {
    return this.questionGroupsService.hardDelete(id);
  }
}

