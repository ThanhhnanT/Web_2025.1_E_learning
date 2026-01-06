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
import { PostsModule } from './modules/posts/posts.module';
import { FriendsModule } from './modules/friends/friends.module';
import { ChatsModule } from './modules/chats/chats.module';
import { AiLearningPathsModule } from './modules/ai-learning-paths/ai-learning-paths.module';
import { FaceRecognitionModule } from './modules/face-recognition/face-recognition.module';

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
    PostsModule,
    FriendsModule,
    ChatsModule,
    AiLearningPathsModule,
    FaceRecognitionModule,

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
      useFactory: async (configService: ConfigService) => {
        const mailUser = configService.get<string>('MAILDEV_INCOMING_USER');
        const mailPass = configService.get<string>('MAILDEV_INCOMING_PASS');
        const mailSenderName = configService.get<string>('MAIL_SENDER_NAME') || 'Learnify';
        
        // Log email configuration status (without sensitive data)
        console.log('📧 Email Configuration:');
        console.log(`   - SMTP Host: smtp.gmail.com`);
        console.log(`   - SMTP Port: 465`);
        console.log(`   - User: ${mailUser ? '✅ Set' : '❌ Missing'}`);
        console.log(`   - Password: ${mailPass ? '✅ Set' : '❌ Missing'}`);
        console.log(`   - Sender Name: ${mailSenderName}`);
        
        if (!mailUser || !mailPass) {
          console.warn('⚠️  WARNING: Email credentials are missing. Email sending will fail!');
          console.warn('   Please set MAILDEV_INCOMING_USER and MAILDEV_INCOMING_PASS environment variables.');
        }

        return {
          transport: {
            host: configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
            port: parseInt(configService.get<string>('SMTP_PORT') || '465', 10),
            secure: true, // true for 465, false for other ports
            auth: {
              user: mailUser,
              pass: mailPass,
            },
            // Additional options for better reliability on Render
            connectionTimeout: 60000, // 60 seconds
            greetingTimeout: 30000, // 30 seconds
            socketTimeout: 60000, // 60 seconds
            // Retry configuration
            pool: true,
            maxConnections: 1,
            maxMessages: 3,
          },
          defaults: {
            from: `"${mailSenderName}" <${mailUser || 'Learnify@elearning.com'}>`,
          },
          template: {
            dir: process.cwd() + '/src/mail/templates/',
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
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
