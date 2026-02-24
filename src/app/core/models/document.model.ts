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
