import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Flashcard } from './schema/flashcard.schema';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';

@Injectable()
export class FlashcardsService {
  constructor(
    @InjectModel(Flashcard.name) private flashcardModel: Model<Flashcard>,
  ) {}

  async create(createFlashcardDto: CreateFlashcardDto) {
    const newFlashcard = await this.flashcardModel.create(createFlashcardDto);
    return newFlashcard;
  }

  async findAll(userId?: string, courseId?: string, lessonId?: string, deckName?: string) {
    const query: any = { deletedAt: null };
    if (userId) query.userId = userId;
    if (courseId) query.courseId = courseId;
    if (lessonId) query.lessonId = lessonId;
    if (deckName) query.deckName = deckName;

    return await this.flashcardModel
      .find(query)
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .populate('lessonId', 'title')
      .exec();
  }

  async findOne(id: string) {
    return await this.flashcardModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .populate('lessonId', 'title')
      .exec();
  }

  async update(id: string, updateFlashcardDto: UpdateFlashcardDto) {
    return await this.flashcardModel
      .findByIdAndUpdate(id, updateFlashcardDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    const flashcard = await this.flashcardModel.findById(id).exec();
    if (flashcard) {
      // Soft delete
      flashcard.deletedAt = new Date();
      await flashcard.save();
      return flashcard;
    }
    return null;
  }

  async updateReview(id: string) {
    const flashcard = await this.flashcardModel.findById(id).exec();
    if (flashcard) {
      flashcard.reviewCount = (flashcard.reviewCount || 0) + 1;
      flashcard.lastReviewed = new Date();
      await flashcard.save();
      return flashcard;
    }
    return null;
  }
}

