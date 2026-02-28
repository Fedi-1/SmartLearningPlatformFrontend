export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type FileType = 'PDF' | 'DOCX' | 'PPTX' | 'IMAGE';

export interface DocumentItem {
  id: number;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  uploadedAt: string;
  status: DocumentStatus;
  courseId: number | null;
  category: string | null;
}

export interface UploadResponse {
  documentId: number;
  courseId: number;
  courseTitle: string;
  totalLessons: number;
}

export interface FlashcardItem {
  id: number;
  term: string;
  definition: string;
}

export interface QuizQuestionItem {
  id: number;
  questionNumber: number;
  questionText: string;
  questionType: 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK';
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface LessonItem {
  id: number;
  lessonNumber: number;
  title: string;
  summary: string;
  content: string;
  estimatedReadTime?: number;

  recapVideoPath?: string | null;
  isLocked: boolean;
  quizId: number | null;
  quiz: QuizQuestionItem[];
  flashcards: FlashcardItem[];
}

export interface CourseDetail {
  id: number;
  title: string;
  description: string;
  totalLessons: number;
  lessons: LessonItem[];
}

// ─── Exam models ──────────────────────────────────────────────────────────────

export interface ExamInfo {
  id: number;
  title: string;
  passingScore: number;
  maxAttempts: number;
  totalPoints: number;
  sectionEasyCount: number;
  sectionMediumCount: number;
  sectionHardCount: number;
  timeLimitMinutes: number | null;
  createdAt: string;
}

export interface ExamQuestionItem {
  id: number;
  questionNumber: number;
  questionText: string;
  questionType: 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK';
  option1: string | null;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  difficulty: string;
  sectionNumber: number;
  pointsWorth: number;
}

export interface ExamAttemptInfo {
  id: number;
  examId: number;
  attemptNumber: number;
  score: number | null;
  isPassed: boolean;
  startedAt: string;
  submittedAt: string | null;
  finishReason: string | null;
  attemptsUsed: number;
  maxAttempts: number;
  timeLimitMinutes: number | null;
  hasCertificate: boolean;
  questions: ExamQuestionItem[] | null;
}

export interface SubmitExamResponse {
  attemptId: number;
  score: number;
  isPassed: boolean;
  totalPointsEarned: number;
  totalPointsPossible: number;
  attemptNumber: number;
  certificateUuid: string | null;
}
