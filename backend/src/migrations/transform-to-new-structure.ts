import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TestsService } from '../modules/tests/tests.service';
import { ContentsService } from '../modules/contents/contents.service';
import { AnswersService } from '../modules/answers/answers.service';
import { TestSectionsService } from '../modules/test-sections/test-sections.service';
import { QuestionGroupsService } from '../modules/question-groups/question-groups.service';
import { QuestionsService } from '../modules/questions/questions.service';
import { TestType } from '../modules/tests/schema/test.schema';
import { SectionType } from '../modules/test-sections/schema/test-section.schema';
import { GroupType } from '../modules/question-groups/schema/question-group.schema';
import { QuestionType } from '../modules/questions/schema/question.schema';

/**
 * Migration script to transform old content/answer structure to new structured format
 * 
 * Old structure:
 * - Test (metadata)
 * - Content (questionContent as Mixed type with parts array)
 * - Answer (correctAnswer as Mixed type with parts array)
 * 
 * New structure:
 * - Test (metadata with testType, series, etc.)
 * - TestSection (one per part, with resources)
 * - QuestionGroup (one per question group with shared content)
 * - Question (individual questions with type, options, correct answer, explanation)
 */

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const testsService = app.get(TestsService);
  const contentsService = app.get(ContentsService);
  const answersService = app.get(AnswersService);
  const testSectionsService = app.get(TestSectionsService);
  const questionGroupsService = app.get(QuestionGroupsService);
  const questionsService = app.get(QuestionsService);

  console.log('🚀 Starting migration...\n');

  try {
    // Get all tests
    const tests = await testsService.findAll();
    console.log(`Found ${tests.length} tests to migrate\n`);

    for (const test of tests) {
      console.log(`\n📝 Processing test: ${test.title} (${test._id})`);
      
      // Find associated content and answers
      const contents = await contentsService.findAll();
      const content = contents.find(c => c.testId?.toString() === test._id.toString());
      
      if (!content) {
        console.log(`⚠️  No content found for test ${test._id}, skipping...`);
        continue;
      }

      const answers = await answersService.findAll();
      const answer = answers.find(a => a.contentId?.toString() === content._id.toString());
      
      if (!answer) {
        console.log(`⚠️  No answers found for content ${content._id}, skipping...`);
        continue;
      }

      // Extract metadata from content
      const questionContent = content.questionContent as any;
      const skill = questionContent.skill || test.skill || 'listening';
      const series = questionContent.series || test.series;
      const testNumber = questionContent.testNumber || test.testNumber;
      const sourceUrl = questionContent.sourceUrl || test.sourceUrl;

      // Update test with new fields
      await testsService.update(test._id.toString(), {
        testType: TestType.IELTS,
        skill,
        series,
        testNumber,
        sourceUrl,
      });
      console.log(`✅ Updated test metadata`);

      // Process parts (sections)
      const parts = questionContent.parts || [];
      const correctAnswers = (answer.correctAnswer as any)?.parts || [];

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const partNumber = part.part || i + 1;
        const partAnswers = correctAnswers.find((p: any) => p.part === partNumber);

        console.log(`  📑 Processing Part ${partNumber}`);

        // Create TestSection
        const section: any = await testSectionsService.create({
          testId: test._id.toString(),
          sectionType: skill === 'listening' ? SectionType.LISTENING : SectionType.READING,
          partNumber,
          title: part.title || `Part ${partNumber}`,
          questionRange: part.questionRange || [0, 0],
          resources: {
            audio: part.audio,
            passageHtml: part.passageHtml,
            transcriptHtml: part.transcriptHtml,
            transcriptText: part.transcriptText,
            instructions: part.instructions || part.notes,
          },
          order: i,
        });
        console.log(`    ✅ Created section: ${section.title}`);

        // Create question group for this part
        // In the old structure, each part is essentially one big question group
        const [startQ, endQ] = part.questionRange || [0, 0];
        
        const questionGroup: any = await questionGroupsService.create({
          sectionId: section._id.toString(),
          groupType: skill === 'listening' ? GroupType.SHARED_INSTRUCTION : GroupType.SHARED_PASSAGE,
          title: `Questions ${startQ}-${endQ}`,
          instructions: part.instructions || '',
          questionRange: part.questionRange,
          sharedContent: {
            passage: part.passageHtml || part.questionHtml,
            contextHtml: part.explanationHtml,
          },
          order: 0,
        });
        console.log(`    ✅ Created question group: ${questionGroup.title}`);

        // Create individual questions
        if (partAnswers && partAnswers.answers) {
          for (const answerItem of partAnswers.answers) {
            const questionNumber = answerItem.question;
            const correctValue = answerItem.value || [];
            const alternatives = answerItem.raw ? [answerItem.raw] : [];

            // Determine question type based on answer pattern
            let questionType = QuestionType.FILL_IN_BLANK;
            let options = [];

            if (correctValue.length > 0) {
              const firstValue = correctValue[0];
              
              // Check if it's multiple choice (A, B, C, D, etc.)
              if (/^[A-H]$/i.test(firstValue)) {
                if (correctValue.length > 1) {
                  questionType = QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS;
                } else {
                  questionType = QuestionType.MULTIPLE_CHOICE;
                }
              } 
              // Check for TRUE/FALSE/NOT GIVEN
              else if (['TRUE', 'FALSE', 'NOT', 'NOT GIVEN'].includes(firstValue)) {
                questionType = QuestionType.TRUE_FALSE_NOTGIVEN;
              }
              // Check for YES/NO/NOT GIVEN
              else if (['YES', 'NO', 'NOT', 'NOT GIVEN'].includes(firstValue)) {
                questionType = QuestionType.YES_NO_NOTGIVEN;
              }
              // Otherwise it's fill in the blank or short answer
              else {
                questionType = QuestionType.FILL_IN_BLANK;
              }
            }

            await questionsService.create({
              questionGroupId: questionGroup._id.toString(),
              questionNumber,
              questionType,
              questionText: `Question ${questionNumber}`, // Old structure doesn't have individual question text
              options,
              correctAnswer: {
                value: correctValue,
                alternatives: alternatives.length > 0 ? alternatives : correctValue,
              },
              explanation: {},
              points: 1,
              order: questionNumber - startQ,
            });
          }
          console.log(`    ✅ Created ${partAnswers.answers.length} questions`);
        }
      }
      
      console.log(`✅ Completed migration for test: ${test.title}\n`);
    }

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run migration
bootstrap()
  .then(() => {
    console.log('\n✨ Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });

