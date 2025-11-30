import { Module } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { FlashcardsController } from './flashcards.controller';
import { FlashcardDecksController } from './flashcard-decks.controller';
import { FlashcardProgressController } from './flashcard-progress.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Flashcard, FlashcardSchema } from './schema/flashcard.schema';
import { FlashcardDeck, FlashcardDeckSchema } from './schema/flashcard-deck.schema';
import { FlashcardProgress, FlashcardProgressSchema } from './schema/flashcard-progress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Flashcard.name,
        schema: FlashcardSchema,
      },
      {
        name: FlashcardDeck.name,
        schema: FlashcardDeckSchema,
      },
      {
        name: FlashcardProgress.name,
        schema: FlashcardProgressSchema,
      },
    ]),
  ],
  // Order matters: More specific routes should be registered first
  // FlashcardProgressController must come before FlashcardsController to avoid route conflict
  controllers: [FlashcardProgressController, FlashcardDecksController, FlashcardsController],
  providers: [FlashcardsService],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}

