// Test Types for Frontend

export enum TestType {
  IELTS = 'IELTS',
  HSK = 'HSK',
  TOEFL = 'TOEFL',
  TOEIC = 'TOEIC',
  OTHER = 'OTHER',
}

export enum SectionType {
  LISTENING = 'listening',
  READING = 'reading',
  WRITING = 'writing',
  SPEAKING = 'speaking',
}

export enum GroupType {
  SHARED_PASSAGE = 'shared_passage',
  SHARED_INSTRUCTION = 'shared_instruction',
  DIAGRAM = 'diagram',
  TABLE = 'table',
  FORM = 'form',
  NOTE_COMPLETION = 'note_completion',
  FLOW_CHART = 'flow_chart',
  MAP = 'map',
  PLAN = 'plan',
  MULTIPLE_CHOICE = 'multiple_choice',
  MATCHING = 'matching',
  SHORT_ANSWER = 'short_answer',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_IN_BLANK = 'fill_in_blank',
  MATCHING = 'matching',
  TRUE_FALSE_NOTGIVEN = 'true_false_notgiven',
  YES_NO_NOTGIVEN = 'yes_no_notgiven',
  SENTENCE_COMPLETION = 'sentence_completion',
  DIAGRAM_LABELING = 'diagram_labeling',
  TABLE_COMPLETION = 'table_completion',
  SHORT_ANSWER = 'short_answer',
  MULTIPLE_CHOICE_MULTIPLE_ANSWERS = 'multiple_choice_multiple_answers',
}

export interface QuestionOption {
  key: string;
  text: string;
}

export interface CorrectAnswer {
  value: string[];
  alternatives?: string[];
}

export interface Explanation {
  explanationHtml?: string;
  keywords?: string[];
  relatedPassageLocation?: string;
}

export interface Question {
  _id: string;
  questionGroupId: string;
  questionNumber: number;
  questionType: QuestionType;
  questionText: string;
  options?: QuestionOption[];
  correctAnswer: CorrectAnswer;
  explanation?: Explanation;
  points: number;
  order: number;
}

export interface SharedContent {
  passage?: string;
  diagram?: string;
  options?: QuestionOption[];
  contextHtml?: string;
}

export interface QuestionGroup {
  _id: string;
  sectionId: string;
  groupType: GroupType;
  title: string;
  instructions: string;
  questionRange: number[];
  sharedContent: SharedContent;
  order: number;
  questions?: Question[];
}

export interface SectionResources {
  audio?: string;
  passageHtml?: string;
  transcriptHtml?: string;
  transcriptText?: string;
  instructions?: string;
}

export interface TestSection {
  _id: string;
  testId: string;
  sectionType: SectionType;
  partNumber: number;
  title: string;
  questionRange: number[];
  resources: SectionResources;
  order: number;
  questionGroups?: QuestionGroup[];
}

export interface Test {
  _id: string;
  title: string;
  testType: TestType;
  language: 'English' | 'Chinese';
  level: string;
  durationMinutes: number;
  totalQuestions: number;
  totalUser: number;
  totalComment: number;
  hastag: string[];
  description?: string;
  externalSlug?: string;
  series?: string;
  testNumber?: string;
  skill?: string;
  sourceUrl?: string;
  sections?: TestSection[];
  createdAt?: string;
  updatedAt?: string;
}

// For test-taking flow
export interface UserAnswer {
  questionId: string;
  questionNumber: number;
  userAnswer: string[];
  isAnswered: boolean;
  timeSpent?: number;
}

export interface TestAttempt {
  testId: string;
  answers: UserAnswer[];
  startedAt: Date;
  completedAt?: Date;
  currentSection?: string;
  currentQuestion?: number;
}

// For navigation
export interface TestNavigation {
  sections: Array<{
    _id: string;
    title: string;
    partNumber: number;
    questionRange: number[];
    groups: Array<{
      _id: string;
      title: string;
      questionRange: number[];
    }>;
  }>;
}

// For review/results
export interface QuestionResult {
  questionId: string;
  questionNumber: number;
  userAnswer: string[];
  correctAnswer: string[];
  isCorrect: boolean;
  timeSpent: number;
}

export interface TestResult {
  _id: string;
  userId: string;
  testId: string;
  answers: QuestionResult[];
  score: number;
  bandScore?: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  completedAt: Date;
}

