import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TestsService } from './tests.service';
import { TestSectionsService } from '../test-sections/test-sections.service';
import { QuestionGroupsService } from '../question-groups/question-groups.service';
import { QuestionsService } from '../questions/questions.service';
import { AnswersService } from '../answers/answers.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { CreateTestSectionDto } from '../test-sections/dto/create-test-section.dto';
import { UpdateTestSectionDto } from '../test-sections/dto/update-test-section.dto';
import { CreateQuestionGroupDto } from '../question-groups/dto/create-question-group.dto';
import { UpdateQuestionGroupDto } from '../question-groups/dto/update-question-group.dto';
import { CreateQuestionDto } from '../questions/dto/create-question.dto';
import { UpdateQuestionDto } from '../questions/dto/update-question.dto';
import { CreateAnswerDto } from '../answers/dto/create-answer.dto';
import { UpdateAnswerDto } from '../answers/dto/update-answer.dto';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';

@ApiTags('Admin Tests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/tests')
export class TestsAdminController {
  constructor(
    private readonly testsService: TestsService,
    private readonly testSectionsService: TestSectionsService,
    private readonly questionGroupsService: QuestionGroupsService,
    private readonly questionsService: QuestionsService,
    private readonly answersService: AnswersService,
  ) {}

  @ApiOperation({ summary: 'Admin - create test' })
  @Post()
  createTest(@Body() dto: CreateTestDto) {
    return this.testsService.create(dto);
  }

  @ApiOperation({ summary: 'Admin - update test' })
  @ApiParam({ name: 'testId', example: '507f1f77bcf86cd799439011' })
  @Patch(':testId')
  updateTest(@Param('testId') testId: string, @Body() dto: UpdateTestDto) {
    return this.testsService.update(testId, dto);
  }

  @ApiOperation({ summary: 'Admin - delete test with children' })
  @ApiParam({ name: 'testId', example: '507f1f77bcf86cd799439011' })
  @Delete(':testId')
  async deleteTest(@Param('testId') testId: string) {
    // cascade: sections -> groups -> questions -> answers
    const sections = await this.testSectionsService.findByTestId(testId);
    for (const section of sections) {
      const groups = await this.questionGroupsService.findBySectionId(
        section._id.toString(),
      );
      for (const group of groups) {
        const questions = await this.questionsService.findByQuestionGroupId(
          group._id.toString(),
        );
        for (const q of questions) {
          await this.questionsService.remove(q._id.toString());
        }
        await this.questionGroupsService.remove(group._id.toString());
      }
      const answer = await this.answersService.findBySectionId(
        section._id.toString(),
      );
      if (answer?._id) {
        await this.answersService.remove(answer._id.toString());
      }
      await this.testSectionsService.remove(section._id.toString());
    }
    return this.testsService.remove(testId);
  }

  @ApiOperation({ summary: 'Admin - create section' })
  @ApiParam({ name: 'testId', example: '507f1f77bcf86cd799439011' })
  @Post(':testId/sections')
  async createSection(
    @Param('testId') testId: string,
    @Body() dto: CreateTestSectionDto,
  ) {
    await this.testsService.findOne(testId);
    return this.testSectionsService.create({ ...dto, testId });
  }

  @ApiOperation({ summary: 'Admin - update section' })
  @ApiParam({ name: 'testId', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sectionId', example: '507f1f77bcf86cd799439012' })
  @Patch(':testId/sections/:sectionId')
  async updateSection(
    @Param('testId') testId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateTestSectionDto,
  ) {
    await this.testsService.findOne(testId);
    await this.testSectionsService.findOne(sectionId);
    return this.testSectionsService.update(sectionId, { ...dto, testId });
  }

  @ApiOperation({ summary: 'Admin - delete section with children' })
  @ApiParam({ name: 'testId', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sectionId', example: '507f1f77bcf86cd799439012' })
  @Delete(':testId/sections/:sectionId')
  async deleteSection(
    @Param('testId') testId: string,
    @Param('sectionId') sectionId: string,
  ) {
    await this.testsService.findOne(testId);
    const groups = await this.questionGroupsService.findBySectionId(sectionId);
    for (const group of groups) {
      const questions = await this.questionsService.findByQuestionGroupId(
        group._id.toString(),
      );
      for (const q of questions) {
        await this.questionsService.remove(q._id.toString());
      }
      await this.questionGroupsService.remove(group._id.toString());
    }
    const answer = await this.answersService.findBySectionId(sectionId);
    if (answer?._id) {
      await this.answersService.remove(answer._id.toString());
    }
    return this.testSectionsService.remove(sectionId);
  }

  @ApiOperation({ summary: 'Admin - create question group' })
  @ApiParam({ name: 'testId', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sectionId', example: '507f1f77bcf86cd799439012' })
  @Post(':testId/sections/:sectionId/groups')
  async createGroup(
    @Param('testId') testId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: CreateQuestionGroupDto,
  ) {
    await this.testsService.findOne(testId);
    await this.testSectionsService.findOne(sectionId);
    return this.questionGroupsService.create({ ...dto, sectionId });
  }

  @ApiOperation({ summary: 'Admin - update question group' })
  @ApiParam({ name: 'testId', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sectionId', example: '507f1f77bcf86cd799439012' })
  @ApiParam({ name: 'groupId', example: '507f1f77bcf86cd799439099' })
  @Patch(':testId/sections/:sectionId/groups/:groupId')
  async updateGroup(
    @Param('testId') testId: string,
    @Param('sectionId') sectionId: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateQuestionGroupDto,
  ) {
    await this.testsService.findOne(testId);
    await this.testSectionsService.findOne(sectionId);
    await this.questionGroupsService.findOne(groupId);
    return this.questionGroupsService.update(groupId, { ...dto, sectionId });
  }

  @ApiOperation({ summary: 'Admin - delete question group with questions' })
  @ApiParam({ name: 'testId', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sectionId', example: '507f1f77bcf86cd799439012' })
  @ApiParam({ name: 'groupId', example: '507f1f77bcf86cd799439099' })
  @Delete(':testId/sections/:sectionId/groups/:groupId')
  async deleteGroup(
    @Param('testId') testId: string,
    @Param('sectionId') sectionId: string,
    @Param('groupId') groupId: string,
  ) {
    await this.testsService.findOne(testId);
    await this.testSectionsService.findOne(sectionId);
    const questions = await this.questionsService.findByQuestionGroupId(
      groupId,
    );
    for (const q of questions) {
      await this.questionsService.remove(q._id.toString());
    }
    return this.questionGroupsService.remove(groupId);
  }

  @ApiOperation({ summary: 'Admin - create question' })
  @ApiParam({ name: 'groupId', example: '507f1f77bcf86cd799439099' })
  @Post('/groups/:groupId/questions')
  async createQuestion(
    @Param('groupId') groupId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    await this.questionGroupsService.findOne(groupId);
    return this.questionsService.create({ ...dto, questionGroupId: groupId });
  }

  @ApiOperation({ summary: 'Admin - update question' })
  @ApiParam({ name: 'questionId', example: '507f1f77bcf86cd799439123' })
  @Patch('/questions/:questionId')
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(questionId, dto);
  }

  @ApiOperation({ summary: 'Admin - delete question' })
  @ApiParam({ name: 'questionId', example: '507f1f77bcf86cd799439123' })
  @Delete('/questions/:questionId')
  async deleteQuestion(@Param('questionId') questionId: string) {
    return this.questionsService.remove(questionId);
  }

  @ApiOperation({ summary: 'Admin - upsert answer for section' })
  @ApiParam({ name: 'testId', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sectionId', example: '507f1f77bcf86cd799439012' })
  @Post(':testId/sections/:sectionId/answers')
  async upsertAnswer(
    @Param('testId') testId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: CreateAnswerDto,
  ) {
    await this.testsService.findOne(testId);
    await this.testSectionsService.findOne(sectionId);
    const existing = await this.answersService.findBySectionId(sectionId);
    if (existing?._id) {
      const updateDto: UpdateAnswerDto = { ...dto };
      return this.answersService.update(existing._id.toString(), updateDto);
    }
    return this.answersService.create({ ...dto, testId, sectionId });
  }
}

