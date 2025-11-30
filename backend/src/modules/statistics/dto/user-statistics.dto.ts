import { ApiProperty } from '@nestjs/swagger';

export class TestStatsDto {
  @ApiProperty({ description: 'Tổng số lần làm bài' })
  totalAttempts: number;

  @ApiProperty({ description: 'Điểm trung bình' })
  averageScore: number;

  @ApiProperty({ description: 'Điểm cao nhất' })
  bestScore: number;

  @ApiProperty({ description: 'Điểm thấp nhất' })
  worstScore: number;

  @ApiProperty({ description: 'Số bài theo ngôn ngữ', example: { English: 10, Chinese: 5 } })
  byLanguage: { [language: string]: number };

  @ApiProperty({ description: 'Số bài theo level', example: { Beginner: 5, Intermediate: 10 } })
  byLevel: { [level: string]: number };

  @ApiProperty({ description: 'Kết quả gần đây' })
  recentResults: any[];
}

export class CourseStatsDto {
  @ApiProperty({ description: 'Số khóa học đã đăng ký' })
  enrolled: number;

  @ApiProperty({ description: 'Số khóa học đã hoàn thành' })
  completed: number;

  @ApiProperty({ description: 'Số khóa học đang học' })
  inProgress: number;

  @ApiProperty({ description: 'Danh sách khóa học' })
  courses: any[];
}

export class FlashcardStatsDto {
  @ApiProperty({ description: 'Tổng số deck đang học' })
  totalDecks: number;

  @ApiProperty({ description: 'Tổng số từ đã học' })
  totalWordsLearned: number;

  @ApiProperty({ description: 'Tổng số từ đã nhớ' })
  totalWordsRemembered: number;

  @ApiProperty({ description: 'Tổng số từ cần ôn lại' })
  totalWordsToReview: number;

  @ApiProperty({ description: 'Danh sách progress theo deck' })
  decks: any[];
}

export class OverviewDto {
  @ApiProperty({ description: 'Tổng số bài test đã làm' })
  totalTests: number;

  @ApiProperty({ description: 'Điểm trung bình' })
  averageScore: number;

  @ApiProperty({ description: 'Điểm cao nhất' })
  bestScore: number;

  @ApiProperty({ description: 'Tổng số khóa học' })
  totalCourses: number;

  @ApiProperty({ description: 'Số khóa học đang học' })
  activeCourses: number;

  @ApiProperty({ description: 'Tổng số flashcard deck' })
  totalFlashcardDecks: number;

  @ApiProperty({ description: 'Tổng số từ đã học' })
  totalWordsLearned: number;
}

export class UserStatisticsDto {
  @ApiProperty({ type: OverviewDto, description: 'Tổng quan thống kê' })
  overview: OverviewDto;

  @ApiProperty({ type: TestStatsDto, description: 'Thống kê bài test' })
  testStats: TestStatsDto;

  @ApiProperty({ type: CourseStatsDto, description: 'Thống kê khóa học' })
  courseStats: CourseStatsDto;

  @ApiProperty({ type: FlashcardStatsDto, description: 'Thống kê flashcard' })
  flashcardStats: FlashcardStatsDto;
}

