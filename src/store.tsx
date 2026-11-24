import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppState, Exam, Question, Session, Submission } from "./types";
import { seedState } from "./seed";

const STORAGE_KEY = "ujianaman.demo.v1";
const SESSION_KEY = "ujianaman.session.v1";

type Store = {
  state: AppState;
  session: Session;
  signIn: (session: NonNullable<Session>) => void;
  signOut: () => void;
  resetDemo: () => void;
  saveExam: (exam: Exam) => void;
  deleteExam: (examId: string) => void;
  togglePublish: (examId: string) => void;
  startExam: (examId: string, studentId: string, studentName: string) => string;
  setAnswer: (submissionId: string, questionId: string, value: string | number | null) => void;
  addViolation: (submissionId: string, type: string) => void;
  submitExam: (submissionId: string, auto?: boolean) => void;
  gradeEssay: (submissionId: string, questionId: string, score: number) => void;
};

const StoreContext = createContext<Store | null>(null);

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed?.exams?.length && parsed?.submissions) return parsed;
    }
  } catch {
    /* ignore corrupt data */
  }
  return seedState();
}

function loadSession(): Session {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [session, setSession] = useState<Session>(loadSession);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  const signIn = useCallback((next: NonNullable<Session>) => setSession(next), []);
  const signOut = useCallback(() => setSession(null), []);
  const resetDemo = useCallback(() => setState(seedState()), []);

  const saveExam = useCallback((exam: Exam) => {
    setState((prev) => {
      const exists = prev.exams.some((item) => item.id === exam.id);
      return {
        ...prev,
        exams: exists
          ? prev.exams.map((item) => (item.id === exam.id ? exam : item))
          : [exam, ...prev.exams],
      };
    });
  }, []);

  const deleteExam = useCallback((examId: string) => {
    setState((prev) => ({
      ...prev,
      exams: prev.exams.filter((exam) => exam.id !== examId),
      submissions: prev.submissions.filter((sub) => sub.examId !== examId),
    }));
  }, []);

  const togglePublish = useCallback((examId: string) => {
    setState((prev) => ({
      ...prev,
      exams: prev.exams.map((exam) =>
        exam.id === examId ? { ...exam, published: !exam.published } : exam,
      ),
    }));
  }, []);

  const startExam = useCallback(
    (examId: string, studentId: string, studentName: string) => {
      const existing = state.submissions.find(
        (sub) =>
          sub.examId === examId &&
          sub.studentId === studentId &&
          sub.status === "berlangsung",
      );
      if (existing) return existing.id;

      const id = `sub-${Date.now()}`;
      const created: Submission = {
        id,
        examId,
        studentId,
        studentName,
        startedAt: Date.now(),
        submittedAt: null,
        answers: {},
        violations: [],
        status: "berlangsung",
      };
      setState((prev) => ({ ...prev, submissions: [created, ...prev.submissions] }));
      return id;
    },
    [state.submissions],
  );

  const setAnswer = useCallback(
    (submissionId: string, questionId: string, value: string | number | null) => {
      setState((prev) => ({
        ...prev,
        submissions: prev.submissions.map((sub) =>
          sub.id === submissionId
            ? {
                ...sub,
                answers: {
                  ...sub.answers,
                  [questionId]: { ...sub.answers[questionId], value },
                },
              }
            : sub,
        ),
      }));
    },
    [],
  );

  const addViolation = useCallback((submissionId: string, type: string) => {
    setState((prev) => ({
      ...prev,
      submissions: prev.submissions.map((sub) =>
        sub.id === submissionId
          ? { ...sub, violations: [...sub.violations, { type, at: Date.now() }] }
          : sub,
      ),
    }));
  }, []);

  const submitExam = useCallback((submissionId: string, auto = false) => {
    setState((prev) => ({
      ...prev,
      submissions: prev.submissions.map((sub) => {
        if (sub.id !== submissionId || sub.status !== "berlangsung") return sub;
        const exam = prev.exams.find((item) => item.id === sub.examId);
        const answers = { ...sub.answers };
        exam?.questions.forEach((question) => {
          if (question.type === "pg") {
            const chosen = answers[question.id]?.value;
            answers[question.id] = {
              ...answers[question.id],
              value: chosen ?? null,
              score: chosen === question.answerIndex ? question.points : 0,
              graded: true,
            };
          }
        });
        const allEssays = exam?.questions.filter((q) => q.type === "esai") ?? [];
        const gradedEssays = allEssays.filter((q) => answers[q.id]?.graded);
        return {
          ...sub,
          answers,
          submittedAt: Date.now(),
          status: gradedEssays.length === allEssays.length ? "dinilai" : "selesai",
          autoSubmitted: auto,
        };
      }),
    }));
  }, []);

  const gradeEssay = useCallback(
    (submissionId: string, questionId: string, score: number) => {
      setState((prev) => ({
        ...prev,
        submissions: prev.submissions.map((sub) => {
          if (sub.id !== submissionId) return sub;
          const exam = prev.exams.find((item) => item.id === sub.examId);
          const answers = {
            ...sub.answers,
            [questionId]: { ...sub.answers[questionId], score, graded: true },
          };
          const essays = exam?.questions.filter((q) => q.type === "esai") ?? [];
          const done = essays.every((q) => answers[q.id]?.graded);
          return { ...sub, answers, status: done ? "dinilai" : sub.status };
        }),
      }));
    },
    [],
  );

  const value = useMemo<Store>(
    () => ({
      state,
      session,
      signIn,
      signOut,
      resetDemo,
      saveExam,
      deleteExam,
      togglePublish,
      startExam,
      setAnswer,
      addViolation,
      submitExam,
      gradeEssay,
    }),
    [
      state,
      session,
      signIn,
      signOut,
      resetDemo,
      saveExam,
      deleteExam,
      togglePublish,
      startExam,
      setAnswer,
      addViolation,
      submitExam,
      gradeEssay,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore harus dipakai di dalam StoreProvider");
  return store;
}

export function scoreSubmission(submission: Submission, exam: Exam) {
  let earned = 0;
  let max = 0;
  let pending = 0;
  exam.questions.forEach((question) => {
    max += question.points;
    const answer = submission.answers[question.id];
    if (question.type === "pg") {
      if (answer?.value === question.answerIndex) earned += question.points;
    } else if (answer?.graded && typeof answer.score === "number") {
      earned += answer.score;
    } else {
      pending += question.points;
    }
  });
  return { earned, max, pending, percent: max ? Math.round((earned / max) * 100) : 0 };
}

export function questionStats(submissionList: Submission[], exam: Exam) {
  return exam.questions.map((question) => {
    if (question.type === "pg") {
      const distribution = (question.options ?? []).map(() => 0);
      let correct = 0;
      let answered = 0;
      submissionList.forEach((sub) => {
        const value = sub.answers[question.id]?.value;
        if (typeof value === "number") {
          answered += 1;
          distribution[value] = (distribution[value] ?? 0) + 1;
          if (value === question.answerIndex) correct += 1;
        }
      });
      return {
        question,
        correct,
        answered,
        percent: answered ? Math.round((correct / answered) * 100) : 0,
        distribution,
        average: null as number | null,
      };
    }
    const scores = submissionList
      .map((sub) => sub.answers[question.id]?.score)
      .filter((score): score is number => typeof score === "number");
    const average = scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;
    return {
      question,
      correct: scores.filter((score) => score >= question.points * 0.7).length,
      answered: scores.length,
      percent: average !== null ? Math.round((average / question.points) * 100) : 0,
      distribution: [] as number[],
      average,
    };
  });
}

export function createQuestion(type: Question["type"], index: number): Question {
  return type === "pg"
    ? {
        id: `q-${Date.now()}-${index}`,
        type: "pg",
        text: "",
        options: ["", "", "", ""],
        answerIndex: 0,
        points: 10,
      }
    : {
        id: `q-${Date.now()}-${index}`,
        type: "esai",
        text: "",
        points: 10,
      };
}
