import { ApiProperty } from '@nestjs/swagger';

export class TestResultItemDto {
  @ApiProperty({ description: 'ID của kết quả' })
  _id: string;

  @ApiProperty({ description: 'Điểm số' })
  score: number;

  @ApiProperty({ description: 'Band Score (nếu có)' })
  bandScore?: number;

  @ApiProperty({ description: 'Thời gian hoàn thành' })
  completedAt: Date;

  @ApiProperty({ description: 'Thông tin bài test', type: Object })
  testId: {
    _id: string;
    title: string;
    language?: string;
    level?: string;
  };
}

export class TestChartDataDto {
  @ApiProperty({ description: 'Danh sách kết quả bài test', type: [TestResultItemDto] })
  results: TestResultItemDto[];

  @ApiProperty({ description: 'Tổng số kết quả' })
  total: number;
}

