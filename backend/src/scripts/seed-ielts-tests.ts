import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose, { Types } from 'mongoose';
import { Test, TestSchema, TestStatus } from '../modules/tests/schema/test.schema';
import { TestSection, TestSectionSchema } from '../modules/test-sections/schema/test-section.schema';
import { QuestionGroup, QuestionGroupSchema } from '../modules/question-groups/schema/question-group.schema';
import { Answer, AnswerSchema } from '../modules/answers/schema/answer.schema';

type AnyRecord = Record<string, any>;

const workspaceRoot = '/home/vvt/D/SubjectResource/IT4409_Web_Technology_and_e_service/E-learning';
const collectionsDir = path.join(
  workspaceRoot,
  'Crawl_Ielts_Test/export/collections',
);

const filePaths = {
  tests: path.join(collectionsDir, 'tests.json'),
  sections: path.join(collectionsDir, 'test_sections.json'),
  groups: path.join(collectionsDir, 'question_groups.json'),
  answers: path.join(collectionsDir, 'answers.json'),
};

const toObjectId = (value: any) => {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value;
  if (typeof value === 'string') return new Types.ObjectId(value);
  if (value.$oid) return new Types.ObjectId(value.$oid);
  return new Types.ObjectId(String(value));
};

const loadJson = <T = AnyRecord[]>(p: string): T => {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
};

async function seed() {
  const mongoUrl =
    process.env.MONGGO_URL ||
    process.env.MONGO_URL ||
    'mongodb://localhost:27017/elearning';

  await mongoose.connect(mongoUrl);
  const TestModel = mongoose.model(Test.name, TestSchema);
  const SectionModel = mongoose.model(TestSection.name, TestSectionSchema);
  const GroupModel = mongoose.model(QuestionGroup.name, QuestionGroupSchema);
  const AnswerModel = mongoose.model(Answer.name, AnswerSchema);

  const tests = loadJson<AnyRecord[]>(filePaths.tests);
  const sections = loadJson<AnyRecord[]>(filePaths.sections);
  const groups = loadJson<AnyRecord[]>(filePaths.groups);
  const answers = loadJson<AnyRecord[]>(filePaths.answers);

  console.log(`Loaded ${tests.length} tests, ${sections.length} sections, ${groups.length} groups, ${answers.length} answers from collections`);

  // Upsert tests
  for (const t of tests) {
    const _id = toObjectId(t._id);
    const doc: AnyRecord = {
      _id,
      title: t.title,
      testType: t.testType,
      language: t.language || 'English',
      level: t.level || 'Intermediate',
      durationMinutes: t.durationMinutes || 0,
      totalQuestions: t.totalQuestions || 0,
      totalUser: t.totalUser || 0,
      totalComment: t.totalComment || 0,
      hastag: t.hastag || [],
      description: t.description,
      externalSlug: t.externalSlug,
      series: t.series,
      testNumber: t.testNumber,
      skill: t.skill,
      sourceUrl: t.sourceUrl,
      status: TestStatus.ACTIVE,
      createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
    };

    await TestModel.replaceOne({ _id }, doc, { upsert: true });
  }

  // Upsert sections
  for (const s of sections) {
    const _id = toObjectId(s._id);
    const doc: AnyRecord = {
      _id,
      testId: toObjectId(s.testId),
      sectionType: s.sectionType,
      partNumber: s.partNumber,
      title: s.title,
      questionRange: s.questionRange,
      resources: s.resources || {},
      order: s.order ?? 0,
      deletedAt: null,
      createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
      updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined,
    };
    await SectionModel.replaceOne({ _id }, doc, { upsert: true });
  }

  // Upsert question groups
  for (const g of groups) {
    const _id = toObjectId(g._id);
    const doc: AnyRecord = {
      _id,
      sectionId: toObjectId(g.sectionId),
      groupType: g.groupType,
      title: g.title,
      instructions: g.instructions || '',
      questionRange: g.questionRange,
      sharedContent: g.sharedContent || {},
      order: g.order ?? 0,
      deletedAt: null,
      createdAt: g.createdAt ? new Date(g.createdAt) : undefined,
      updatedAt: g.updatedAt ? new Date(g.updatedAt) : undefined,
    };
    await GroupModel.replaceOne({ _id }, doc, { upsert: true });
  }

  // Upsert answers
  for (const a of answers) {
    const _id = toObjectId(a._id);
    const doc: AnyRecord = {
      _id,
      testId: toObjectId(a.testId),
      sectionId: toObjectId(a.sectionId),
      partNumber: a.partNumber,
      transcriptHtml: a.transcriptHtml,
      answerKeys: a.answerKeys || [],
      audioUrl: a.audioUrl,
      sourceUrl: a.sourceUrl,
      deletedAt: null,
      createdAt: a.createdAt ? new Date(a.createdAt) : undefined,
      updatedAt: a.updatedAt ? new Date(a.updatedAt) : undefined,
    };
    await AnswerModel.replaceOne({ _id }, doc, { upsert: true });
  }

  console.log('Seeding completed.');
  await mongoose.disconnect();
}

seed()
  .then(() => {
    console.log('Seed script finished successfully');
  })
  .catch((err) => {
    console.error('Seed script failed', err);
    process.exit(1);
  });

