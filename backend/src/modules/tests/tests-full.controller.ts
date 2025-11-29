import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from '@/auth/decorate/customize';
import { TestsService } from './tests.service';
import { TestSectionsService } from '../test-sections/test-sections.service';
import { QuestionGroupsService } from '../question-groups/question-groups.service';
import { QuestionsService } from '../questions/questions.service';

@ApiTags('Tests - Full Structure')
@Controller('tests')
export class TestsFullController {
  constructor(
    private readonly testsService: TestsService,
    private readonly testSectionsService: TestSectionsService,
    private readonly questionGroupsService: QuestionGroupsService,
    private readonly questionsService: QuestionsService,
  ) {}

  @ApiOperation({ 
    summary: 'Get test with full structure for taking test',
    description: 'Returns test with all sections, question groups, and questions. Use this for test-taking interface.'
  })
  @ApiParam({ name: 'id', description: 'Test ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Test with full structure retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Test not found' })
  @Public()
  @Get(':id/full')
  async getTestWithFullStructure(@Param('id') id: string) {
    // Get test metadata
    const test: any = await this.testsService.findOne(id);
    
    // Get all sections for this test
    const sections = await this.testSectionsService.findByTestId(id);
    
    // For each section, get question groups and questions
    const sectionsWithContent = await Promise.all(
      sections.map(async (section: any) => {
        const questionGroups = await this.questionGroupsService.findBySectionId(section._id.toString());
        
        const groupsWithQuestions = await Promise.all(
          questionGroups.map(async (group: any) => {
            const questions = await this.questionsService.findByQuestionGroupId(group._id.toString());
            return {
              ...(typeof group.toObject === 'function' ? group.toObject() : group),
              questions,
            };
          })
        );
        
        return {
          ...(typeof section.toObject === 'function' ? section.toObject() : section),
          questionGroups: groupsWithQuestions,
        };
      })
    );
    
    return {
      ...(typeof test.toObject === 'function' ? test.toObject() : test),
      sections: sectionsWithContent,
    };
  }

  @ApiOperation({ 
    summary: 'Get test structure without questions (for navigation)',
    description: 'Returns test with sections and question groups but without full question content. Use this for navigation sidebar.'
  })
  @ApiParam({ name: 'id', description: 'Test ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Test structure retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Test not found' })
  @Public()
  @Get(':id/structure')
  async getTestStructure(@Param('id') id: string) {
    const test: any = await this.testsService.findOne(id);
    const sections = await this.testSectionsService.findByTestId(id);
    
    const sectionsWithGroups = await Promise.all(
      sections.map(async (section: any) => {
        const questionGroups = await this.questionGroupsService.findBySectionId(section._id.toString());
        return {
          ...(typeof section.toObject === 'function' ? section.toObject() : section),
          questionGroups: questionGroups.map((group: any) => ({
            _id: group._id,
            title: group.title,
            questionRange: group.questionRange,
            groupType: group.groupType,
          })),
        };
      })
    );
    
    return {
      _id: test._id,
      title: test.title,
      testType: test.testType,
      durationMinutes: test.durationMinutes,
      totalQuestions: test.totalQuestions,
      sections: sectionsWithGroups,
    };
  }

  @ApiOperation({ 
    summary: 'Get specific section with all questions',
    description: 'Returns a specific section with all question groups and questions. Use this when user navigates to a section.'
  })
  @ApiParam({ name: 'testId', description: 'Test ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sectionId', description: 'Section ID', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'Section with questions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  @Public()
  @Get(':testId/sections/:sectionId')
  async getSectionWithQuestions(
    @Param('testId') testId: string,
    @Param('sectionId') sectionId: string,
  ) {
    const section: any = await this.testSectionsService.findOne(sectionId);
    const questionGroups = await this.questionGroupsService.findBySectionId(sectionId);
    
    const groupsWithQuestions = await Promise.all(
      questionGroups.map(async (group: any) => {
        const questions = await this.questionsService.findByQuestionGroupId(group._id.toString());
        return {
          ...(typeof group.toObject === 'function' ? group.toObject() : group),
          questions,
        };
      })
    );
    
    return {
      ...(typeof section.toObject === 'function' ? section.toObject() : section),
      questionGroups: groupsWithQuestions,
    };
  }
}

