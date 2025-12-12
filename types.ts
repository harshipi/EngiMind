
export type InputType = 'text' | 'files';

export interface Flashcard {
  front: string;
  back: string;
}

export interface VideoRecommendation {
  title: string;
  query: string; // Search query to find it
  source: 'MIT' | 'Stanford' | 'Yale' | 'YouTube' | 'LibreTexts';
}

export interface GeneratedContent {
  longNotes: string;
  shortNotes: string;
  practiceQuestions: string;
  mcqs?: QuizQuestion[];
  flashcards?: Flashcard[];
  mindMap?: string; // Markdown hierarchical list
  videoTopics?: VideoRecommendation[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface ProcessingState {
  isLoading: boolean;
  error: string | null;
  step: 'idle' | 'analyzing' | 'generating' | 'complete';
}

export interface FileInput {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface SessionProgress {
  notesRead: boolean;
  summaryRead: boolean;
  quizScore?: number;
  quizTotal?: number;
  practiceCompleted: boolean;
}

export interface LearningSession {
  id: string;
  timestamp: number;
  topic: string;
  type: InputType | 'mixed';
  content: GeneratedContent;
  progress: SessionProgress;
}

// Settings Types
export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange';

export interface UserSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
  name: string;
  major: string;
  year: string;
  semester: string;
  college: string;
  attendanceThreshold: number; // Percentage (e.g., 75)
}

export interface ResourceItem {
  id: string;
  title: string;
  type: 'link' | 'file';
  format?: 'book' | 'video' | 'website'; // Added format
  url?: string; // For links
  fileName?: string; // For mock files
  dateAdded: number;
  source?: string;
}

export interface TestResult {
  id: string;
  subject: string;
  score: number;
  total: number;
  date: number;
}

// Grade & Results Types
export interface SubjectGrade {
  id: string;
  name: string;
  obtained: string; // Grade obtained (e.g., 9 or 85)
  max: string;      // Max grade (e.g., 10 or 100)
  credits: string;
}

export interface AcademicAttachment {
  id: string;
  name: string;     // User defined name (e.g., "Sem 1 Marksheet")
  data: string;     // Base64
  type: 'image' | 'pdf';
  date: number;
}

export interface SemesterData {
  semester: number;
  subjects: SubjectGrade[];
  attachments: AcademicAttachment[];
}

// Portfolio Types
export interface Internship {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface Achievement {
  id: string;
  title: string;
  date: string;
  description: string;
}

export interface ClubActivity {
  id: string;
  role: string;
  clubName: string;
  description: string;
}

export interface StudentPortfolio {
  internships: Internship[];
  achievements: Achievement[];
  clubs: ClubActivity[];
}

// TimeTable Types
export interface TimeTableEntry {
  day: number; // 0-4 (Mon-Fri)
  period: number; // 0-7 (8 periods)
  subject: string;
}

export interface Assignment {
  id: string;
  title: string;
  dueDate: number; // timestamp
  completed: boolean;
  subject?: string;
}

// Activity Hub Types
export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isAi: boolean;
  timestamp: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  members: number;
  topic: string;
}

// Attendance Types
export interface AttendanceLog {
  timestamp: number;
  status: 'present' | 'absent';
}

export interface AttendanceSubject {
  id: string;
  name: string;
  logs: AttendanceLog[];
}
