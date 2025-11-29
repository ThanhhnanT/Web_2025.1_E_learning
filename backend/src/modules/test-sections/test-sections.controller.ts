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
import { TestSectionsService } from './test-sections.service';
import { CreateTestSectionDto } from './dto/create-test-section.dto';
import { UpdateTestSectionDto } from './dto/update-test-section.dto';

@ApiTags('test-sections')
@Controller('test-sections')
export class TestSectionsController {
  constructor(private readonly testSectionsService: TestSectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new test section' })
  @ApiResponse({ status: 201, description: 'Test section created successfully' })
  create(@Body() createTestSectionDto: CreateTestSectionDto) {
    return this.testSectionsService.create(createTestSectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all test sections' })
  @ApiResponse({ status: 200, description: 'List of all test sections' })
  findAll() {
    return this.testSectionsService.findAll();
  }

  @Get('test/:testId')
  @ApiOperation({ summary: 'Get all sections for a specific test' })
  @ApiResponse({ status: 200, description: 'List of sections for the test' })
  findByTestId(@Param('testId') testId: string) {
    return this.testSectionsService.findByTestId(testId);
  }

  @Get('test/:testId/filter')
  @ApiOperation({ summary: 'Get sections for a specific test with optional filters' })
  @ApiQuery({
    name: 'sectionType',
    required: false,
    type: String,
    description: 'Section type (listening, reading, writing, speaking)',
  })
  @ApiQuery({
    name: 'partNumber',
    required: false,
    type: Number,
    description: 'Part number within the skill (e.g., 1-4 for IELTS listening)',
  })
  @ApiResponse({ status: 200, description: 'Filtered list of sections for the test' })
  findByTestIdWithFilters(
    @Param('testId') testId: string,
    @Query('sectionType') sectionType?: string,
    @Query('partNumber') partNumber?: string,
  ) {
    const parsedPartNumber =
      typeof partNumber === 'string' ? parseInt(partNumber, 10) : undefined;

    return this.testSectionsService.findByTestAndFilters(testId, {
      sectionType,
      partNumber: parsedPartNumber,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific test section' })
  @ApiResponse({ status: 200, description: 'Test section found' })
  @ApiResponse({ status: 404, description: 'Test section not found' })
  findOne(@Param('id') id: string) {
    return this.testSectionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a test section' })
  @ApiResponse({ status: 200, description: 'Test section updated successfully' })
  @ApiResponse({ status: 404, description: 'Test section not found' })
  update(@Param('id') id: string, @Body() updateTestSectionDto: UpdateTestSectionDto) {
    return this.testSectionsService.update(id, updateTestSectionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a test section' })
  @ApiResponse({ status: 204, description: 'Test section deleted successfully' })
  @ApiResponse({ status: 404, description: 'Test section not found' })
  remove(@Param('id') id: string) {
    return this.testSectionsService.remove(id);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete a test section' })
  @ApiResponse({ status: 204, description: 'Test section permanently deleted' })
  @ApiResponse({ status: 404, description: 'Test section not found' })
  hardDelete(@Param('id') id: string) {
    return this.testSectionsService.hardDelete(id);
  }
}

