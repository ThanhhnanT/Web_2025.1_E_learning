import { 
  Controller, 
  Get, 
  UseGuards,
  Query,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AiLearningPathsService } from './ai-learning-paths.service';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { AdminGuard } from '@/auth/admin.guard';

@ApiTags('Admin AI Learning Paths')
@Controller('admin/ai-learning-paths')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AiLearningPathsAdminController {
  constructor(private readonly aiLearningPathsService: AiLearningPathsService) {}

  @ApiOperation({ 
    summary: 'Get all AI learning paths (Admin)',
    description: 'Get all learning paths created by AI for admin management'
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Learning paths retrieved successfully' })
  @Get()
  async getAllLearningPaths(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;
    const skip = (pageNum - 1) * limitNum;

    const [learningPaths, total] = await Promise.all([
      this.aiLearningPathsService['learningPathModel']
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
        .exec(),
      this.aiLearningPathsService['learningPathModel'].countDocuments({}),
    ]);

    // Get corresponding roadmaps
    const roadmapIds = learningPaths.map((lp: any) => lp.roadmapId).filter(Boolean);
    const roadmaps = await this.aiLearningPathsService['roadMapModel']
      .find({ roadmapId: { $in: roadmapIds } })
      .lean()
      .exec();

    const roadmapMap = new Map(roadmaps.map((rm: any) => [rm.roadmapId, rm]));

    const result = learningPaths.map((lp: any) => {
      const roadmap = roadmapMap.get(lp.roadmapId);
      return {
        _id: lp._id,
        learningPathId: lp._id.toString(),
        roadmapId: lp.roadmapId,
        userId: lp.userId,
        title: roadmap?.goal || 'Untitled',
        level: roadmap?.level || 'Beginner',
        description: roadmap?.description || '',
        totalDays: lp.totalDays,
        currentDay: lp.currentDay,
        progressPercentage: lp.progressPercentage || 0,
        estimatedHours: roadmap?.estimated_hours || 0,
        imageUrl: roadmap?.imageUrl || null,
        createdAt: lp.createdAt,
        lastAccessed: lp.lastAccessed,
      };
    });

    return {
      data: result,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalItems: total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}

