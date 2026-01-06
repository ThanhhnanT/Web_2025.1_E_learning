import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import { CreateAiLearningPathDto } from './dto/create-ai-learning-path.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { LearningPath } from './schema/learning-path.schema';
import { RoadMap } from './schema/roadmap.schema';

@Injectable()
export class AiLearningPathsService {
  private readonly logger = new Logger(AiLearningPathsService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectModel(LearningPath.name) private learningPathModel: Model<LearningPath>,
    @InjectModel(RoadMap.name) private roadMapModel: Model<RoadMap>,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
  }

  /**
   * Generate a new learning path using AI service
   */
  async generateLearningPath(createDto: CreateAiLearningPathDto, userId: string) {
    try {
      this.logger.log(`Generating learning path for user ${userId}`);
      
      const requestData = {
        goal: createDto.goal,
        level: createDto.level || 'Beginner',
        discription: createDto.description || '',
        estimated_hours: createDto.estimatedHours,
        userId: userId,
      };

      const response = await axios.post(
        `${this.aiServiceUrl}/generate_schedule`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2 minutes timeout for AI generation
        }
      );

      if (response.data.error) {
        throw new BadRequestException(`AI service error: ${response.data.error}`);
      }

      return {
        success: true,
        data: response.data,
        message: 'Learning path generated successfully',
      };
    } catch (error: any) {
      this.logger.error(`Error generating learning path: ${error.message}`, error.stack);
      
      if (error.response) {
        throw new BadRequestException(
          `AI service returned error: ${error.response.data?.error || error.response.statusText}`
        );
      }
      
      if (error.code === 'ECONNREFUSED') {
        throw new BadRequestException('AI service is not available. Please try again later.');
      }
      
      throw new BadRequestException(`Failed to generate learning path: ${error.message}`);
    }
  }

  /**
   * Get learning paths for a user
   */
  async getUserLearningPaths(userId: string) {
    this.logger.log(`Getting learning paths for user ${userId}`);
    try {
      // Convert userId to string to ensure matching
      const userIdStr = userId.toString();
      
      // Try to convert to ObjectId if it's a valid ObjectId string
      let query: any = { userId: userIdStr };
      
      // Also try matching as ObjectId if userIdStr is a valid ObjectId format
      if (Types.ObjectId.isValid(userIdStr)) {
        query = {
          $or: [
            { userId: userIdStr },
            { userId: new Types.ObjectId(userIdStr) },
          ],
        };
      }
      
      this.logger.log(`Querying learning paths with query: ${JSON.stringify(query)}`);
      
      const learningPaths = await this.learningPathModel
        .find(query)
        .sort({ createdAt: -1 })
        .exec();

      this.logger.log(`Found ${learningPaths.length} learning paths for user ${userIdStr}`);

      if (learningPaths.length === 0) {
        this.logger.warn(`No learning paths found for user ${userIdStr}`);
        return [];
      }

      // Get corresponding roadmaps
      const roadmapIds = learningPaths.map(lp => lp.roadmapId).filter(Boolean);
      this.logger.log(`Fetching ${roadmapIds.length} roadmaps`);
      
      const roadmaps = await this.roadMapModel
        .find({ roadmapId: { $in: roadmapIds } })
        .exec();

      this.logger.log(`Found ${roadmaps.length} roadmaps`);

      const roadmapMap = new Map(roadmaps.map(rm => [rm.roadmapId, rm]));

      const result = learningPaths.map(lp => {
        const roadmap = roadmapMap.get(lp.roadmapId);
        return {
          _id: lp._id,
          learningPathId: lp._id.toString(),
          roadmapId: lp.roadmapId,
          title: roadmap?.goal || 'Untitled',
          level: roadmap?.level || 'Beginner',
          totalDays: lp.totalDays,
          currentDay: lp.currentDay,
          progressPercentage: lp.progressPercentage || 0,
          estimatedHours: roadmap?.estimated_hours || 0,
          imageUrl: roadmap?.imageUrl || null,
          createdAt: lp.createdAt,
          lastAccessed: lp.lastAccessed,
        };
      });

      this.logger.log(`Returning ${result.length} learning paths`);
      return result;
    } catch (error: any) {
      this.logger.error(`Error getting user learning paths: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to get learning paths: ${error.message}`);
    }
  }

  /**
   * Get a specific learning path by ID
   */
  async getLearningPath(learningPathId: string, userId: string) {
    this.logger.log(`Getting learning path ${learningPathId} for user ${userId}`);
    try {
      const learningPath = await this.learningPathModel.findById(learningPathId).exec();
      
      if (!learningPath) {
        throw new NotFoundException('Learning path not found');
      }

      // Verify ownership
      if (learningPath.userId !== userId) {
        throw new NotFoundException('Learning path not found');
      }

      // Get corresponding roadmap
      const roadmap = await this.roadMapModel.findOne({ roadmapId: learningPath.roadmapId }).exec();

      // Convert to plain object and format for frontend
      const result: any = {
        learningPathId: learningPath._id.toString(),
        roadmapId: learningPath.roadmapId,
        title: roadmap?.goal || 'Untitled',
        level: roadmap?.level || 'Beginner',
        description: roadmap?.description || '',
        totalDays: learningPath.totalDays,
        estimatedHours: roadmap?.estimated_hours || 0,
        imageUrl: roadmap?.imageUrl || null,
        currentDay: learningPath.currentDay,
        completedDays: learningPath.completedDays || [],
        progressPercentage: learningPath.progressPercentage || 0,
        skills: roadmap?.skills || {},
        learning_path: (learningPath.schedule || []).map((day: any) => ({
          day: day.day,
          skill: day.skill,
          subskill: day.subskill,
          youtube_links: day.youtube_links,
          theory: day.theory,
          question_review: day.question_review || [],
        })),
        createdAt: learningPath.createdAt,
        lastAccessed: learningPath.lastAccessed,
      };

      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error getting learning path: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to get learning path: ${error.message}`);
    }
  }

  /**
   * Update progress for a learning path
   */
  async updateProgress(learningPathId: string, updateDto: UpdateProgressDto, userId: string) {
    this.logger.log(`Updating progress for learning path ${learningPathId}`);
    try {
      const learningPath = await this.learningPathModel.findById(learningPathId).exec();
      
      if (!learningPath) {
        throw new NotFoundException('Learning path not found');
      }

      // Verify ownership
      if (learningPath.userId !== userId) {
        throw new NotFoundException('Learning path not found');
      }

      // Update fields
      const updateData: any = {
        lastAccessed: new Date(),
      };

      if (updateDto.completedDay !== undefined) {
        // Add to completedDays if not already there
        const currentCompletedDays = learningPath.completedDays || [];
        if (!currentCompletedDays.includes(updateDto.completedDay)) {
          updateData.$addToSet = { completedDays: updateDto.completedDay };
        }
      }

      if (updateDto.currentDay !== undefined) {
        updateData.currentDay = updateDto.currentDay;
      }

      if (updateDto.progressPercentage !== undefined) {
        updateData.progressPercentage = Math.max(0, Math.min(100, updateDto.progressPercentage));
      } else if (learningPath.totalDays && learningPath.totalDays > 0) {
        // Auto-calculate progress if not provided
        const completedCount = (learningPath.completedDays || []).length;
        updateData.progressPercentage = Math.round((completedCount / learningPath.totalDays) * 100);
      }

      const updated = await this.learningPathModel
        .findByIdAndUpdate(learningPathId, updateData, { new: true })
        .exec();

      if (!updated) {
        throw new NotFoundException('Learning path not found after update');
      }

      return {
        learningPathId: updated._id.toString(),
        currentDay: updated.currentDay,
        completedDays: updated.completedDays,
        progressPercentage: updated.progressPercentage,
        totalDays: updated.totalDays,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error updating progress: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to update progress: ${error.message}`);
    }
  }

  /**
   * Get progress for a learning path
   */
  async getProgress(learningPathId: string, userId: string) {
    this.logger.log(`Getting progress for learning path ${learningPathId}`);
    try {
      const learningPath = await this.learningPathModel.findById(learningPathId).exec();
      
      if (!learningPath) {
        throw new NotFoundException('Learning path not found');
      }

      // Verify ownership
      if (learningPath.userId !== userId) {
        throw new NotFoundException('Learning path not found');
      }

      return {
        learningPathId: learningPath._id.toString(),
        currentDay: learningPath.currentDay,
        completedDays: learningPath.completedDays,
        progressPercentage: learningPath.progressPercentage,
        totalDays: learningPath.totalDays,
        lastAccessed: learningPath.lastAccessed,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error getting progress: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to get progress: ${error.message}`);
    }
  }
}

