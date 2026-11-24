import type { Answer, AppState, Exam, Question, Submission } from "./types";

const pg = (
  id: string,
  text: string,
  options: string[],
  answerIndex: number,
  points = 10,
): Question => ({ id, type: "pg", text, options, answerIndex, points });

const esai = (id: string, text: string, points = 10): Question => ({
  id,
  type: "esai",
  text,
  points,
});

const soal: Question[] = [
  pg("q1", "Hasil dari 2³ × 2⁴ adalah …", ["2⁷", "2¹²", "4⁷", "4¹²"], 0),
  pg("q2", "Jika f(x) = 2x + 3, maka nilai f(5) adalah …", ["10", "13", "16", "8"], 1),
  pg("q3", "Turunan pertama dari f(x) = x³ − 3x adalah …", ["3x² − 3", "x² − 3", "3x² + 3", "3x − 3"], 0),
  pg("q4", "Nilai dari lim (x→2) (x² − 4)/(x − 2) adalah …", ["0", "2", "4", "Tak terdefinisi"], 2),
  pg("q5", "Barisan aritmetika dengan a = 3 dan b = 4. Suku ke-10 adalah …", ["36", "39", "40", "43"], 1),
  pg("q6", "Sebuah dadu dilempar sekali. Peluang muncul mata dadu genap adalah …", ["1/6", "1/3", "1/2", "2/3"], 2),
  pg("q7", "Rata-rata dari data 6, 7, 8, 9, 10 adalah …", ["7", "7,5", "8", "8,5"], 2),
  pg("q8", "Akar-akar persamaan x² − 5x + 6 = 0 adalah …", ["1 dan 6", "2 dan 3", "−2 dan −3", "−1 dan 6"], 1),
  esai(
    "q9",
    "Jelaskan langkah menyelesaikan sistem persamaan linear dua variabel dengan metode eliminasi, lalu berikan satu contoh singkat.",
  ),
  esai(
    "q10",
    "Sebuah kotak berisi 4 bola merah dan 6 bola biru. Dua bola diambil sekaligus tanpa pengembalian. Hitung peluang terambilnya 2 bola merah dan tuliskan langkahnya.",
  ),
];

const essayAnswer =
  "Metode eliminasi dilakukan dengan menyamakan koefisien salah satu variabel pada kedua persamaan, lalu mengurangkan atau menjumlahkan kedua persamaan agar variabel tersebut hilang. Contoh: 2x + y = 7 dan x − y = 2. Jumlahkan kedua persamaan sehingga 3x = 9, x = 3. Substitusi x = 3 ke x − y = 2 sehingga y = 1. Himpunan penyelesaiannya (3, 1).";

const essayAnswer2 =
  "Total bola 10. Peluang bola merah pertama 4/10. Karena tanpa pengembalian, sisa 3 bola merah dari 9 bola, sehingga peluang kedua 3/9. Maka peluang 2 bola merah = 4/10 × 3/9 = 12/90 = 2/15.";

const exams: Exam[] = [
  {
    id: "ex1",
    title: "Try Out Matematika — Kelas XII",
    subject: "Matematika",
    grade: "Kelas XII IPA",
    durationMin: 45,
    published: true,
    questions: soal,
  },
  {
    id: "ex2",
    title: "Ulangan Harian — Limit & Turunan",
    subject: "Matematika",
    grade: "Kelas XII IPA",
    durationMin: 30,
    published: false,
    questions: soal.slice(2, 6),
  },
];

const students = [
  { id: "s1", name: "Aditya Pratama" },
  { id: "s2", name: "Bunga Lestari" },
  { id: "s3", name: "Citra Maharani" },
  { id: "s4", name: "Dimas Saputra" },
  { id: "s5", name: "Eka Wulandari" },
  { id: "s6", name: "Fajar Ramadhan" },
];

// Pola jawaban tetap agar analisis butir soal punya variasi yang masuk akal.
const patterns = [
  [0, 1, 0, 2, 1, 2, 2, 1, "baik", "kurang"],
  [0, 1, 0, 1, 1, 2, 2, 1, "baik", "baik"],
  [0, 2, 0, 2, 1, 2, 1, 1, "cukup", "baik"],
  [1, 1, 0, 2, 3, 2, 2, 0, "kurang", "kurang"],
  [0, 1, 2, 2, 1, 1, 2, 1, "baik", "cukup"],
  [0, 1, 0, 2, 1, 2, 2, 3, "cukup", "kurang"],
];

const essayScores: Record<string, [number, number]> = {
  s1: [9, 7],
  s2: [10, 9],
  s3: [7, 8],
  s4: [5, 6],
  s5: [8, 7],
  s6: [6, 8],
};

const violationSets = [
  [],
  [{ type: "Berpindah tab", at: 0 }],
  [
    { type: "Berpindah tab", at: 0 },
    { type: "Keluar dari layar penuh", at: 1 },
  ],
  [
    { type: "Berpindah tab", at: 0 },
    { type: "Menyalin soal (copy)", at: 1 },
    { type: "Berpindah tab", at: 2 },
    { type: "Klik kanan", at: 3 },
  ],
  [{ type: "Keluar dari layar penuh", at: 0 }],
  [
    { type: "Berpindah tab", at: 0 },
    { type: "Berpindah tab", at: 1 },
    { type: "Menempel jawaban (paste)", at: 2 },
  ],
];

const base = new Date("2026-11-24T09:15:00+07:00").getTime();

const submissions: Submission[] = students.map((student, i) => {
  const pattern = patterns[i];
  const answers: Record<string, Answer> = {};

  soal.forEach((question, qi) => {
    if (question.type === "pg") {
      const chosen = pattern[qi] as number;
      answers[question.id] = { value: chosen };
    } else {
      const [score] = essayScores[student.id];
      answers[question.id] = {
        value: question.id === "q9" ? essayAnswer : essayAnswer2,
        score: question.id === "q9" ? score : essayScores[student.id][1],
        graded: true,
      };
    }
  });

  const submittedAt = base + i * 1000 * 60 * 7;
  const violations = violationSets[i].map((v, vi) => ({
    type: v.type,
    at: base + vi * 1000 * 60 * 2,
  }));

  return {
    id: `sub${i + 1}`,
    examId: "ex1",
    studentId: student.id,
    studentName: student.name,
    startedAt: submittedAt - 1000 * 60 * 32,
    submittedAt,
    answers,
    violations,
    status: i === 5 ? "selesai" : "dinilai",
  };
});

export const seedState = (): AppState => ({
  exams,
  submissions,
  seededAt: Date.now(),
});
