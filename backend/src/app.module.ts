import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/passport/jwt-auth.guard';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { TestsModule } from './modules/tests/tests.module';
import { ContentsModule } from './modules/contents/contents.module';
import { ResultsModule } from './modules/results/results.module';
import { AnswersModule } from './modules/answers/answers.module';
import { CommentsModule } from './modules/comments/comments.module';
import { CoursesModule } from './modules/courses/courses.module';
import { FlashcardsModule } from './modules/flashcards/flashcards.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TestSectionsModule } from './modules/test-sections/test-sections.module';
import { QuestionGroupsModule } from './modules/question-groups/question-groups.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { StatisticsModule } from './modules/statistics/statistics.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    TestsModule,
    ContentsModule,
    ResultsModule,
    AnswersModule,
    CommentsModule,
    CoursesModule,
    FlashcardsModule,
    PaymentsModule,
    TestSectionsModule,
    QuestionGroupsModule,
    QuestionsModule,
    StatisticsModule,

    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGGO_URL'),
      }),
      inject: [ConfigService],
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService)  => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          // ignoreTLS: true,
          secure: true,
          auth: {
            user: configService.get<string>('MAILDEV_INCOMING_USER'),
            pass: configService.get<string>('MAILDEV_INCOMING_PASS'),
          },
        },
        defaults: {
          from: '"No Reply" <no-reply@localhost>',
        },

        // preview: true,
        template: {
          dir: process.cwd() + '/src/mail/templates/',
          adapter: new HandlebarsAdapter(), 
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
     {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
