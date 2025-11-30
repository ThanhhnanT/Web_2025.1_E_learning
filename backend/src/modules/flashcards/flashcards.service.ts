import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Flashcard } from './schema/flashcard.schema';
import { FlashcardDeck } from './schema/flashcard-deck.schema';
import { FlashcardProgress } from './schema/flashcard-progress.schema';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class FlashcardsService {
  constructor(
    @InjectModel(Flashcard.name) private flashcardModel: Model<Flashcard>,
    @InjectModel(FlashcardDeck.name) private flashcardDeckModel: Model<FlashcardDeck>,
    @InjectModel(FlashcardProgress.name) private flashcardProgressModel: Model<FlashcardProgress>,
  ) {}

  async create(createFlashcardDto: CreateFlashcardDto) {
    const newFlashcard = await this.flashcardModel.create(createFlashcardDto);
    return newFlashcard;
  }

  async findAll(userId?: string, courseId?: string, lessonId?: string, deckId?: string) {
    const query: any = { deletedAt: null };
    if (userId) query.userId = userId;
    if (courseId) query.courseId = courseId;
    if (lessonId) query.lessonId = lessonId;
    if (deckId) query.deckId = deckId;

    return await this.flashcardModel
      .find(query)
      .populate('userId', 'name email')
      .populate('deckId', 'name')
      .populate('courseId', 'title')
      .populate('lessonId', 'title')
      .exec();
  }

  async findOne(id: string) {
    try {
      // Validate that id is a valid ObjectId
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }
      
      return await this.flashcardModel
        .findById(id)
        .populate('userId', 'name email')
        .populate('deckId', 'name')
        .populate('courseId', 'title')
        .populate('lessonId', 'title')
        .exec();
    } catch (error) {
      console.error('Error in findOne:', error);
      return null;
    }
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

  // Deck methods
  async findAllDecks(userId?: string) {
    try {
      const query: any = { deletedAt: null };
      if (userId) {
        // Convert to ObjectId if valid
        if (Types.ObjectId.isValid(userId)) {
          query.createdBy = new Types.ObjectId(userId);
        } else {
          query.createdBy = userId;
        }
      }

      const decks = await this.flashcardDeckModel
        .find(query)
        .populate({
          path: 'createdBy',
          select: 'name email'
        })
        .exec();
      
      return decks || [];
    } catch (error) {
      console.error('Error in findAllDecks:', error);
      // Return empty array instead of throwing to prevent 500 errors
      return [];
    }
  }

  async createDeck(createDeckDto: CreateDeckDto) {
    const newDeck = await this.flashcardDeckModel.create(createDeckDto);
    return newDeck.populate('createdBy', 'name email');
  }

  async findOneDeck(id: string) {
    return await this.flashcardDeckModel
      .findById(id)
      .populate('createdBy', 'name email')
      .exec();
  }

  async updateDeck(id: string, updateDeckDto: UpdateDeckDto) {
    return await this.flashcardDeckModel
      .findByIdAndUpdate(id, updateDeckDto, { new: true })
      .populate('createdBy', 'name email')
      .exec();
  }

  async removeDeck(id: string) {
    const deck = await this.flashcardDeckModel.findById(id).exec();
    if (deck) {
      deck.deletedAt = new Date();
      await deck.save();
      return deck;
    }
    return null;
  }

  // Card methods
  async findCardsByDeck(deckId: string) {
    return await this.flashcardModel
      .find({ deckId, deletedAt: null })
      .populate('userId', 'name email')
      .populate('deckId', 'name')
      .exec();
  }

  async createCard(deckId: string, createCardDto: CreateCardDto) {
    const cardData = { ...createCardDto, deckId };
    const newCard = await this.flashcardModel.create(cardData);
    
    // Update wordCount in deck
    await this.flashcardDeckModel.findByIdAndUpdate(deckId, {
      $inc: { wordCount: 1 }
    }).exec();

    return newCard.populate('deckId', 'name');
  }

  async createCardsBatch(deckId: string, createCardDtos: CreateCardDto[]) {
    const cardsData = createCardDtos.map(dto => ({ ...dto, deckId }));
    const newCards = await this.flashcardModel.insertMany(cardsData);
    
    // Update wordCount in deck
    await this.flashcardDeckModel.findByIdAndUpdate(deckId, {
      $inc: { wordCount: newCards.length }
    }).exec();

    return newCards;
  }

  async updateCard(deckId: string, cardId: string, updateFlashcardDto: UpdateFlashcardDto) {
    return await this.flashcardModel
      .findOneAndUpdate({ _id: cardId, deckId }, updateFlashcardDto, { new: true })
      .populate('deckId', 'name')
      .exec();
  }

  async removeCard(deckId: string, cardId: string) {
    const card = await this.flashcardModel.findOne({ _id: cardId, deckId }).exec();
    if (card) {
      card.deletedAt = new Date();
      await card.save();
      
      // Update wordCount in deck
      await this.flashcardDeckModel.findByIdAndUpdate(deckId, {
        $inc: { wordCount: -1 }
      }).exec();

      return card;
    }
    return null;
  }

  // Progress methods
  async findProgress(deckId: string, userId?: string) {
    try {
      if (!userId) return null;
      
      // Convert to ObjectId if valid
      const userIdQuery = Types.ObjectId.isValid(userId) 
        ? new Types.ObjectId(userId) 
        : userId;
      const deckIdQuery = Types.ObjectId.isValid(deckId) 
        ? new Types.ObjectId(deckId) 
        : deckId;
      
      return await this.flashcardProgressModel
        .findOne({ deckId: deckIdQuery, userId: userIdQuery })
        .populate({
          path: 'userId',
          select: 'name email'
        })
        .populate({
          path: 'deckId',
          select: 'name'
        })
        .exec();
    } catch (error) {
      console.error('Error in findProgress:', error);
      // Return null instead of throwing to prevent 500 errors
      return null;
    }
  }

  async updateProgress(deckId: string, updateProgressDto: UpdateProgressDto, userId?: string) {
    try {
      if (!userId) {
        throw new Error('UserId is required');
      }

      // Convert to ObjectId if valid
      const userIdQuery = Types.ObjectId.isValid(userId) 
        ? new Types.ObjectId(userId) 
        : userId;
      const deckIdQuery = Types.ObjectId.isValid(deckId) 
        ? new Types.ObjectId(deckId) 
        : deckId;

      // Check if this is the first time user is creating progress for this deck
      const existingProgress = await this.flashcardProgressModel
        .findOne({ deckId: deckIdQuery, userId: userIdQuery })
        .exec();

      // If this is the first time (no existing progress), increment userCount
      if (!existingProgress) {
        await this.flashcardDeckModel.findByIdAndUpdate(deckIdQuery, {
          $inc: { userCount: 1 }
        }).exec();
      }

      return await this.flashcardProgressModel
        .findOneAndUpdate(
          { deckId: deckIdQuery, userId: userIdQuery },
          updateProgressDto,
          { new: true, upsert: true }
        )
        .populate({
          path: 'userId',
          select: 'name email'
        })
        .populate({
          path: 'deckId',
          select: 'name'
        })
        .exec();
    } catch (error) {
      console.error('Error in updateProgress:', error);
      throw error;
    }
  }

  async findAllProgress(userId?: string) {
    try {
      if (!userId) return [];

      // Convert to ObjectId if valid
      const userIdQuery = Types.ObjectId.isValid(userId) 
        ? new Types.ObjectId(userId) 
        : userId;

      const progress = await this.flashcardProgressModel
        .find({ userId: userIdQuery })
        .populate({
          path: 'userId',
          select: 'name email'
        })
        .populate({
          path: 'deckId',
          select: 'name'
        })
        .exec();
      
      return progress || [];
    } catch (error) {
      console.error('Error in findAllProgress:', error);
      // Return empty array instead of throwing to prevent 500 errors
      return [];
    }
  }

  // Sample data methods
  async getSampleDecks() {
    return await this.flashcardDeckModel
      .find({ deletedAt: null })
      .populate('createdBy', 'name email')
      .exec();
  }

  async importSampleData() {
    // This method can be used to import sample data from JSON files
    // Implementation depends on how you want to load the JSON files
    // For now, return a message indicating the feature
    return {
      message: 'Sample data import feature. Use mongoimport to import JSON files directly.',
      instructions: [
        '1. Import flashcarddecks.json into flashcarddecks collection',
        '2. Get ObjectIds from imported decks',
        '3. Update flashcards.json with correct deckId',
        '4. Import flashcards.json into flashcards collection'
      ]
    };
  }
}

