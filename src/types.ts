export type Role = "guru" | "siswa";

export type Question = {
  id: string;
  type: "pg" | "esai";
  text: string;
  options?: string[];
  answerIndex?: number;
  points: number;
};

export type Exam = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  durationMin: number;
  published: boolean;
  questions: Question[];
};

export type Violation = { type: string; at: number };

export type Answer = {
  value: string | number | null;
  score?: number;
  graded?: boolean;
};

export type Submission = {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  startedAt: number;
  submittedAt: number | null;
  answers: Record<string, Answer>;
  violations: Violation[];
  status: "berlangsung" | "selesai" | "dinilai";
  autoSubmitted?: boolean;
};

export type AppState = {
  exams: Exam[];
  submissions: Submission[];
  seededAt: number;
};

export type Session = { role: Role; name: string; id: string } | null;
