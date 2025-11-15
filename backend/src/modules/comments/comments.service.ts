import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from './schema/comment.schema';
import { Model } from 'mongoose';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
  ) {}

  async create(createCommentDto: CreateCommentDto) {
    const newComment = await this.commentModel.create(createCommentDto);
    return newComment;
  }

  async findAll() {
    return await this.commentModel
      .find({ deletedAt: null })
      .populate('userId', 'name email avatar_url')
      .populate('testId', 'title language level')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    return await this.commentModel
      .findById(id)
      .populate('userId', 'name email avatar_url')
      .populate('testId', 'title language level')
      .exec();
  }

  async findByTestId(testId: string) {
    // Lấy tất cả comments của một test
    return await this.commentModel
      .find({ testId, deletedAt: null })
      .populate('userId', 'name email avatar_url')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUserId(userId: string) {
    // Lấy tất cả comments của một user
    return await this.commentModel
      .find({ userId, deletedAt: null })
      .populate('testId', 'title language level')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updateCommentDto: UpdateCommentDto) {
    return await this.commentModel
      .findByIdAndUpdate(id, updateCommentDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    // Soft delete
    return await this.commentModel
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .exec();
  }

  async hardDelete(id: string) {
    // Xóa thật sự khỏi database
    return await this.commentModel.findByIdAndDelete(id).exec();
  }
}
