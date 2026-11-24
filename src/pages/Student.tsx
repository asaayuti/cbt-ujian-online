import { useEffect, useMemo, useRef, useState } from "react";
import { navigate } from "../App";
import { scoreSubmission, useStore } from "../store";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function StudentShell({ children }: { children: React.ReactNode }) {
  const { session, signOut } = useStore();
  return (
    <div className="shell" style={{ gridTemplateColumns: "1fr" }}>
      <header className="exam-top no-print">
        <div className="brand" style={{ fontSize: 16 }}>
          <span className="brand-mark" style={{ width: 30, height: 30, fontSize: 14 }}>
            U
          </span>
          UjianAman
          <span className="chip" style={{ marginLeft: 8 }}>
            Mode siswa
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="small muted">
            {session?.name} · Kelas XII IPA
          </span>
          <span className="avatar">{initials(session?.name ?? "S")}</span>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>
            Keluar
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

export function StudentApp({ section, id }: { section?: string; id?: string }) {
  if (section === "ujian" && id) return <ExamRunner examId={id} />;
  if (section === "selesai" && id) return <Finished submissionId={id} />;
  return <StudentHome />;
}

function StudentHome() {
  const { state, session, startExam } = useStore();

  const available = state.exams.filter((exam) => exam.published);

  const start = (examId: string) => {
    if (!session) return;
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        /* browser bisa menolak; tetap lanjut dengan peringatan di dalam ujian */
      });
    }
    startExam(examId, session.id, session.name);
    navigate(`/siswa/ujian/${examId}`);
  };

  return (
    <StudentShell>
      <div className="main" style={{ maxWidth: 980, margin: "0 auto", width: "100%" }}>
        <div className="page-head">
          <div>
            <h1>Ujian tersedia</h1>
            <p>Hanya ujian yang sudah dipublikasikan guru yang muncul di sini.</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {available.map((exam) => {
            const mine = state.submissions.find(
              (sub) => sub.examId === exam.id && sub.studentId === session?.id,
            );
            const done = mine && mine.status !== "berlangsung";
            return (
              <article className="card panel" key={exam.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <span className="chip">{exam.subject}</span>
                    <h3 style={{ marginTop: 10, fontSize: 18 }}>{exam.title}</h3>
                    <p className="muted small" style={{ marginTop: 4 }}>
                      {exam.questions.length} soal · {exam.durationMin} menit ·{" "}
                      {exam.questions.reduce((sum, question) => sum + question.points, 0)} poin
                    </p>
                    <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                      Ujian diawasi: pindah tab, keluar layar penuh, copy-paste, dan klik kanan
                      akan dicatat.
                    </p>
                  </div>
                  {done ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="btn btn-ghost"
                        onClick={() => navigate(`/siswa/selesai/${mine.id}`)}
                      >
                        Lihat hasil
                      </button>
                      <button className="btn btn-primary" onClick={() => start(exam.id)}>
                        Kerjakan ulang
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={() => start(exam.id)}
                    >
                      Mulai ujian
                    </button>
                  )}
                </div>
              </article>
            );
          })}
          {available.length === 0 && (
            <div className="card empty">Belum ada ujian yang dipublikasikan.</div>
          )}
        </div>

        <div className="note">
          <b>Catatan demo:</b> layar penuh diminta saat Anda menekan “Mulai ujian”. Jika browser
          menolak, ujian tetap berjalan dan setiap keluar-masuk layar penuh akan dicatat sebagai
          pelanggaran.
        </div>
      </div>
    </StudentShell>
  );
}

const VIOLATION_LIMIT = 8;

function ExamRunner({ examId }: { examId: string }) {
  const { state, session, setAnswer, addViolation, submitExam } = useStore();
  const exam = state.exams.find((item) => item.id === examId);

  const submission = useMemo(
    () =>
      state.submissions.find(
        (sub) =>
          sub.examId === examId &&
          sub.studentId === session?.id &&
          sub.status === "berlangsung",
      ),
    [state.submissions, examId, session?.id],
  );

  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const lastLogged = useRef<Record<string, number>>({});
  const submittedRef = useRef(false);

  const deadline = submission && exam ? submission.startedAt + exam.durationMin * 60_000 : 0;
  const remaining = deadline ? deadline - now : 0;

  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  const log = (type: string) => {
    if (!submission || submittedRef.current) return;
    const now = Date.now();
    if (now - (lastLogged.current[type] ?? 0) < 2500) return;
    lastLogged.current[type] = now;
    addViolation(submission.id, type);
    setToast(type);
  };

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) log("Berpindah tab / aplikasi lain");
    };
    const onBlur = () => log("Jendela ujian kehilangan fokus");
    const onFullscreen = () => {
      if (!document.fullscreenElement) log("Keluar dari layar penuh");
    };
    const onContext = (event: MouseEvent) => {
      event.preventDefault();
      log("Klik kanan");
    };
    const onCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      log(event.type === "paste" ? "Menempel jawaban (paste)" : "Menyalin soal (copy)");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("paste", onCopy);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("paste", onCopy);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission?.id]);

  const doSubmit = (auto = false) => {
    if (!submission || submittedRef.current) return;
    submittedRef.current = true;
    submitExam(submission.id, auto);
    navigate(`/siswa/selesai/${submission.id}`);
  };

  useEffect(() => {
    if (!submission || submittedRef.current) return;
    if (submission.violations.length >= VIOLATION_LIMIT) doSubmit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission?.violations.length]);

  useEffect(() => {
    if (deadline && remaining <= 0 && !submittedRef.current) {
      doSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, deadline]);

  if (!exam) return <div className="empty">Ujian tidak ditemukan.</div>;
  if (!submission)
    return (
      <StudentShell>
        <div className="empty">
          Sesi ujian tidak ditemukan atau sudah dikumpulkan.
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => navigate("/siswa")}>
              Kembali ke daftar ujian
            </button>
          </div>
        </div>
      </StudentShell>
    );

  const question = exam.questions[index];
  const answeredCount = exam.questions.filter((q) => {
    const value = submission.answers[q.id]?.value;
    return value !== null && value !== undefined && value !== "";
  }).length;
  const danger = remaining < 5 * 60_000;
  const warn = remaining < 10 * 60_000;

  return (
    <StudentShell>
      <div className="exam-top no-print" style={{ top: 0 }}>
        <div>
          <div className="row-title" style={{ fontSize: 15 }}>
            {exam.title}
          </div>
          <div className="muted" style={{ fontSize: 12.5 }}>
            {exam.subject} · {exam.questions.length} soal · {exam.durationMin} menit
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="small muted">
            Pelanggaran: <b>{submission.violations.length}</b>/{VIOLATION_LIMIT}
          </span>
          <div className={`timer ${danger ? "danger" : warn ? "warn" : ""}`}>
            {formatClock(remaining)}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setConfirming(true)}>
            Kumpulkan
          </button>
        </div>
      </div>

      <div className="exam-body">
        <div>
          {toast && (
            <div className="violation-banner">
              <span style={{ fontSize: 16 }}>⚠</span>
              <div>
                <b>Pelanggaran tercatat:</b> {toast}.
                <div style={{ marginTop: 2 }}>
                  Tindakan ini dilaporkan ke guru. Ujian otomatis dikumpulkan pada{" "}
                  {VIOLATION_LIMIT} pelanggaran.
                </div>
              </div>
            </div>
          )}

          <div className="card q-card">
            <div className="q-meta">
              <span>
                Soal {index + 1} dari {exam.questions.length}
              </span>
              <span>{question.points} poin</span>
            </div>
            <p className="q-text">{question.text}</p>

            {question.type === "pg" ? (
              <div>
                {(question.options ?? []).map((option, optionIndex) => {
                  const selected = submission.answers[question.id]?.value === optionIndex;
                  return (
                    <label
                      key={optionIndex}
                      className={`option ${selected ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        checked={selected}
                        onChange={() => setAnswer(submission.id, question.id, optionIndex)}
                      />
                      <b>{String.fromCharCode(65 + optionIndex)}</b>
                      <span>{option || "—"}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <textarea
                className="textarea"
                style={{ minHeight: 150 }}
                placeholder="Tulis jawaban Anda di sini…"
                value={String(submission.answers[question.id]?.value ?? "")}
                onChange={(event) => setAnswer(submission.id, question.id, event.target.value)}
              />
            )}

            <div className="nav-row">
              <button
                className="btn btn-ghost"
                disabled={index === 0}
                onClick={() => setIndex((value) => Math.max(0, value - 1))}
              >
                ← Sebelumnya
              </button>
              <button
                className="btn btn-primary"
                disabled={index === exam.questions.length - 1}
                onClick={() => setIndex((value) => Math.min(exam.questions.length - 1, value + 1))}
              >
                Selanjutnya →
              </button>
            </div>
          </div>

          <p className="lock-note" style={{ marginTop: 14 }}>
            🔒 Pengawasan aktif · {formatClock(remaining)} tersisa
          </p>
        </div>

        <aside className="card palette">
          <h4>Navigasi soal</h4>
          <div className="palette-grid">
            {exam.questions.map((item, itemIndex) => {
              const value = submission.answers[item.id]?.value;
              const answered = value !== null && value !== undefined && value !== "";
              return (
                <button
                  key={item.id}
                  className={`${answered ? "answered" : ""} ${itemIndex === index ? "current" : ""}`}
                  onClick={() => setIndex(itemIndex)}
                >
                  {itemIndex + 1}
                </button>
              );
            })}
          </div>
          <div className="legend">
            <span>
              <i style={{ background: "#4f46e5", borderColor: "#4f46e5" }} />
              Soal aktif
            </span>
            <span>
              <i style={{ background: "#eef0ff", borderColor: "#c7c9f7" }} />
              Sudah dijawab
            </span>
            <span>
              <i /> Belum dijawab
            </span>
          </div>
          <div style={{ marginTop: 16, fontSize: 12.5, color: "#5b6b82" }}>
            Terjawab <b>{answeredCount}</b> dari {exam.questions.length} soal
          </div>
          <div className="bar" style={{ marginTop: 8 }}>
            <i style={{ width: `${(answeredCount / exam.questions.length) * 100}%` }} />
          </div>
        </aside>
      </div>

      {confirming && (
        <div
          className="no-print"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,18,32,.45)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 50,
          }}
        >
          <div className="card" style={{ padding: 26, maxWidth: 420, width: "100%" }}>
            <h3>Kumpulkan ujian sekarang?</h3>
            <p className="muted small" style={{ marginTop: 8, lineHeight: 1.6 }}>
              Anda sudah menjawab {answeredCount} dari {exam.questions.length} soal. Jawaban yang
              belum diisi akan dinilai 0.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => doSubmit(false)}>
                Ya, kumpulkan
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirming(false)}>
                Periksa lagi
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentShell>
  );
}

function Finished({ submissionId }: { submissionId: string }) {
  const { state } = useStore();
  const submission = state.submissions.find((sub) => sub.id === submissionId);
  const exam = state.exams.find((item) => item.id === submission?.examId);

  if (!submission || !exam) {
    return (
      <StudentShell>
        <div className="empty">Hasil tidak ditemukan.</div>
      </StudentShell>
    );
  }

  const score = scoreSubmission(submission, exam);

  return (
    <StudentShell>
      <div className="main" style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
        <div className="card panel" style={{ marginTop: 12 }}>
          <span className="chip">Ujian dikumpulkan</span>
          <h1 style={{ fontSize: 30, marginTop: 14 }}>Terima kasih, {submission.studentName.split(" ")[0]}!</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Jawaban Anda sudah diterima. Guru akan memeriksa bagian esai.
          </p>

          <div className="stat-row" style={{ marginTop: 22, marginBottom: 0 }}>
            <div className="card stat">
              <span>Nilai sementara</span>
              <strong>{score.percent}</strong>
              <small>
                {score.earned} / {score.max} poin
              </small>
            </div>
            <div className="card stat">
              <span>Status</span>
              <strong style={{ fontSize: 20 }}>
                {score.pending > 0 ? "Menunggu esai" : "Selesai"}
              </strong>
              <small>{score.pending} poin belum dinilai</small>
            </div>
            <div className="card stat">
              <span>Pelanggaran</span>
              <strong>{submission.violations.length}</strong>
              <small>{submission.autoSubmitted ? "Dikumpulkan otomatis" : "Tanpa auto-submit"}</small>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Rincian jawaban</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {exam.questions.map((question, index) => {
                const answer = submission.answers[question.id];
                const correct =
                  question.type === "pg" && answer?.value === question.answerIndex;
                return (
                  <div
                    key={question.id}
                    className="analysis-item"
                    style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
                  >
                    <div>
                      <b className="small">Soal {index + 1}</b>
                      <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                        {question.type === "pg"
                          ? typeof answer?.value === "number"
                            ? `Jawaban ${String.fromCharCode(65 + answer.value)}`
                            : "Tidak dijawab"
                          : answer?.graded
                            ? `Dinilai ${answer.score}/${question.points}`
                            : "Menunggu penilaian guru"}
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        question.type === "esai"
                          ? answer?.graded
                            ? "badge-live"
                            : "badge-draft"
                          : correct
                            ? "badge-live"
                            : "badge-danger"
                      }`}
                    >
                      {question.type === "esai"
                        ? answer?.graded
                          ? `${answer.score} poin`
                          : "Menunggu"
                        : correct
                          ? `${question.points} poin`
                          : "0 poin"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ marginTop: 22 }}
            onClick={() => navigate("/siswa")}
          >
            Kembali ke daftar ujian
          </button>
        </div>
      </div>
    </StudentShell>
  );
}
