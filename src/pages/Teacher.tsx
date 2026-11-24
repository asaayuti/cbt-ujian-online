import { useMemo, useState } from "react";
import { navigate } from "../App";
import {
  createQuestion,
  questionStats,
  scoreSubmission,
  useStore,
} from "../store";
import type { Exam, Question, Submission } from "../types";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function clock(ts: number) {
  return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function dateLong(ts: number) {
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Shell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "ringkasan" | "ujian";
}) {
  const { session, signOut } = useStore();
  return (
    <div className="shell">
      <aside className="side no-print">
        <div className="brand">
          <span className="brand-mark">U</span>
          UjianAman
        </div>
        <nav className="side-nav">
          <a href="#/guru" className={active === "ringkasan" ? "active" : ""}>
            Ringkasan
          </a>
          <a href="#/guru" className={active === "ujian" ? "active" : ""}>
            Ujian &amp; hasil
          </a>
          <button onClick={() => navigate("/masuk")}>Ganti peran</button>
        </nav>
        <div className="side-user">
          <span className="avatar">{initials(session?.name ?? "Guru")}</span>
          <div>
            <b>{session?.name}</b>
            <span>Guru · Panel pengajar</span>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={signOut}>
          Keluar
        </button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

export function TeacherApp({ section, id }: { section?: string; id?: string }) {
  if (section === "buat") return <ExamEditor />;
  if (section === "edit" && id) return <ExamEditor examId={id} />;
  if (section === "ujian" && id) return <Results examId={id} />;
  return <Dashboard />;
}

function Dashboard() {
  const { state, togglePublish, deleteExam } = useStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const graded = state.submissions.filter((sub) => sub.status !== "berlangsung");
  const avg = graded.length
    ? Math.round(
        graded.reduce((total, sub) => {
          const exam = state.exams.find((item) => item.id === sub.examId);
          return total + (exam ? scoreSubmission(sub, exam).percent : 0);
        }, 0) / graded.length,
      )
    : 0;
  const violations = state.submissions.reduce((total, sub) => total + sub.violations.length, 0);

  return (
    <Shell active="ringkasan">
      <div className="page-head">
        <div>
          <h1>Ringkasan kelas</h1>
          <p>Kelola ujian, pantau pelanggaran, dan lihat analisis hasil siswa.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/guru/buat")}>
          + Buat ujian
        </button>
      </div>

      <div className="stat-row">
        <div className="card stat">
          <span>Ujian dibuat</span>
          <strong>{state.exams.length}</strong>
          <small>{state.exams.filter((exam) => exam.published).length} dipublikasikan</small>
        </div>
        <div className="card stat">
          <span>Peserta</span>
          <strong>{graded.length}</strong>
          <small>7 siswa kelas XII IPA</small>
        </div>
        <div className="card stat">
          <span>Rata-rata nilai</span>
          <strong>{avg}</strong>
          <small>skala 0–100</small>
        </div>
        <div className="card stat">
          <span>Pelanggaran tercatat</span>
          <strong>{violations}</strong>
          <small>selama ujian berlangsung</small>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Ujian</th>
                <th>Soal</th>
                <th>Durasi</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {state.exams.map((exam) => {
                const subs = state.submissions.filter(
                  (sub) => sub.examId === exam.id && sub.status !== "berlangsung",
                );
                return (
                  <tr key={exam.id}>
                    <td>
                      <div className="row-title">{exam.title}</div>
                      <div className="row-sub">
                        {exam.subject} · {exam.grade} · {subs.length} peserta
                      </div>
                    </td>
                    <td>{exam.questions.length}</td>
                    <td>{exam.durationMin} menit</td>
                    <td>
                      <span className={`badge ${exam.published ? "badge-live" : "badge-draft"}`}>
                        {exam.published ? "Aktif" : "Draft"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        className="btn btn-soft btn-sm"
                        onClick={() => navigate(`/guru/ujian/${exam.id}`)}
                      >
                        Lihat hasil
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginLeft: 6 }}
                        onClick={() => navigate(`/guru/edit/${exam.id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginLeft: 6 }}
                        onClick={() => togglePublish(exam.id)}
                      >
                        {exam.published ? "Jadikan draft" : "Publikasikan"}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ marginLeft: 6 }}
                        onClick={() => setConfirmId(exam.id)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
              {state.exams.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">Belum ada ujian. Buat ujian pertama Anda.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmId && (
        <div className="card" style={{ padding: 18, marginTop: 16, borderColor: "#f3c1c1" }}>
          <b>Hapus ujian ini beserta semua hasilnya?</b>
          <p className="muted small" style={{ marginTop: 4 }}>
            Tindakan ini tidak bisa dibatalkan.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                deleteExam(confirmId);
                setConfirmId(null);
              }}
            >
              Ya, hapus
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmId(null)}>
              Batal
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}

function ExamEditor({ examId }: { examId?: string }) {
  const { state, saveExam } = useStore();
  const existing = state.exams.find((exam) => exam.id === examId);

  const [draft, setDraft] = useState<Exam>(
    existing ?? {
      id: `ex-${Date.now()}`,
      title: "",
      subject: "Matematika",
      grade: "Kelas XII IPA",
      durationMin: 45,
      published: false,
      questions: [createQuestion("pg", 0)],
    },
  );
  const [error, setError] = useState("");

  const update = (patch: Partial<Exam>) => setDraft((prev) => ({ ...prev, ...patch }));

  const updateQuestion = (index: number, patch: Partial<Question>) => {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((question, qi) =>
        qi === index ? { ...question, ...patch } : question,
      ),
    }));
  };

  const save = () => {
    if (!draft.title.trim()) {
      setError("Judul ujian wajib diisi.");
      return;
    }
    if (draft.questions.some((question) => !question.text.trim())) {
      setError("Semua soal harus punya teks pertanyaan.");
      return;
    }
    saveExam(draft);
    navigate("/guru");
  };

  return (
    <Shell active="ujian">
      <div className="page-head">
        <div>
          <h1>{examId ? "Edit ujian" : "Buat ujian baru"}</h1>
          <p>Perubahan langsung tersimpan saat Anda menekan Simpan.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => navigate("/guru")}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={save}>
            Simpan ujian
          </button>
        </div>
      </div>

      {error && (
        <div className="violation-banner" style={{ marginBottom: 18 }}>
          {error}
        </div>
      )}

      <div className="card panel" style={{ marginBottom: 18 }}>
        <div className="two-col" style={{ gap: 16 }}>
          <label className="field">
            <span>Judul ujian</span>
            <input
              className="input"
              value={draft.title}
              placeholder="Contoh: Try Out Matematika — Kelas XII"
              onChange={(event) => update({ title: event.target.value })}
            />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label className="field">
              <span>Mata pelajaran</span>
              <input
                className="input"
                value={draft.subject}
                onChange={(event) => update({ subject: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Durasi (menit)</span>
              <input
                className="input"
                type="number"
                min={1}
                value={draft.durationMin}
                onChange={(event) => update({ durationMin: Number(event.target.value) })}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="card panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3>Soal ({draft.questions.length})</h3>
            <p className="sub">Total {draft.questions.reduce((sum, q) => sum + q.points, 0)} poin</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                update({ questions: [...draft.questions, createQuestion("pg", draft.questions.length)] })
              }
            >
              + Pilihan ganda
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                update({ questions: [...draft.questions, createQuestion("esai", draft.questions.length)] })
              }
            >
              + Esai
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
          {draft.questions.map((question, index) => (
            <div key={question.id} className="analysis-item">
              <div className="analysis-head">
                <b>
                  Soal {index + 1} · {question.type === "pg" ? "Pilihan ganda" : "Esai"}
                </b>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label className="small muted">
                    Poin{" "}
                    <input
                      className="grade-input"
                      type="number"
                      min={1}
                      value={question.points}
                      onChange={(event) =>
                        updateQuestion(index, { points: Number(event.target.value) })
                      }
                    />
                  </label>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() =>
                      update({
                        questions: draft.questions.filter((_, qi) => qi !== index),
                      })
                    }
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <textarea
                className="textarea"
                style={{ minHeight: 64 }}
                placeholder="Tulis pertanyaan…"
                value={question.text}
                onChange={(event) => updateQuestion(index, { text: event.target.value })}
              />
              {question.type === "pg" && (
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {(question.options ?? []).map((option, optionIndex) => (
                    <div key={optionIndex} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="radio"
                        name={`answer-${question.id}`}
                        checked={question.answerIndex === optionIndex}
                        onChange={() => updateQuestion(index, { answerIndex: optionIndex })}
                        title="Tandai sebagai jawaban benar"
                      />
                      <input
                        className="input"
                        value={option}
                        placeholder={`Opsi ${String.fromCharCode(65 + optionIndex)}`}
                        onChange={(event) => {
                          const options = [...(question.options ?? [])];
                          options[optionIndex] = event.target.value;
                          updateQuestion(index, { options });
                        }}
                      />
                    </div>
                  ))}
                  <p className="muted" style={{ fontSize: 12 }}>
                    Klik radio di kiri untuk menandai jawaban benar.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Results({ examId }: { examId: string }) {
  const { state, gradeEssay } = useStore();
  const exam = state.exams.find((item) => item.id === examId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const subs = useMemo(
    () => state.submissions.filter((sub) => sub.examId === examId && sub.status !== "berlangsung"),
    [state.submissions, examId],
  );

  if (!exam) {
    return (
      <Shell active="ujian">
        <div className="empty">Ujian tidak ditemukan.</div>
      </Shell>
    );
  }

  const scores = subs.map((sub) => ({ sub, score: scoreSubmission(sub, exam) }));
  const percentList = scores.map((item) => item.score.percent);
  const average = percentList.length
    ? Math.round(percentList.reduce((a, b) => a + b, 0) / percentList.length)
    : 0;
  const highest = percentList.length ? Math.max(...percentList) : 0;
  const lowest = percentList.length ? Math.min(...percentList) : 0;
  const violations = subs.reduce((total, sub) => total + sub.violations.length, 0);
  const stats = questionStats(subs, exam);
  const selected = subs.find((sub) => sub.id === selectedId) ?? subs[0];

  return (
    <Shell active="ujian">
      <div className="page-head">
        <div>
          <button
            className="btn btn-ghost btn-sm no-print"
            style={{ marginBottom: 10 }}
            onClick={() => navigate("/guru")}
          >
            ← Kembali
          </button>
          <h1>{exam.title}</h1>
          <p>
            {exam.subject} · {exam.grade} · {exam.durationMin} menit · {exam.questions.length} soal
          </p>
        </div>
        <button className="btn btn-primary no-print" onClick={() => window.print()}>
          Cetak laporan
        </button>
      </div>

      <div className="print-only" style={{ marginBottom: 16 }}>
        <h2 className="print-title">Laporan Hasil Ujian</h2>
        <p className="small">
          {exam.title} · {exam.subject} · {exam.grade} · Dicetak {dateLong(Date.now())}
        </p>
      </div>

      <div className="stat-row">
        <div className="card stat">
          <span>Rata-rata</span>
          <strong>{average}</strong>
          <small>skala 0–100</small>
        </div>
        <div className="card stat">
          <span>Tertinggi</span>
          <strong>{highest}</strong>
          <small>nilai terbaik</small>
        </div>
        <div className="card stat">
          <span>Terendah</span>
          <strong>{lowest}</strong>
          <small>perlu pendampingan</small>
        </div>
        <div className="card stat">
          <span>Pelanggaran</span>
          <strong>{violations}</strong>
          <small>{subs.length} peserta</small>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>#</th>
                <th>Siswa</th>
                <th>Nilai</th>
                <th>Benar (PG)</th>
                <th>Poin esai</th>
                <th>Pelanggaran</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...scores]
                .sort((a, b) => b.score.percent - a.score.percent)
                .map(({ sub, score }, index) => {
                  const correct = exam.questions.filter(
                    (question) =>
                      question.type === "pg" &&
                      sub.answers[question.id]?.value === question.answerIndex,
                  ).length;
                  const essayScore = exam.questions
                    .filter((question) => question.type === "esai")
                    .reduce((sum, question) => sum + (sub.answers[question.id]?.score ?? 0), 0);
                  return (
                    <tr key={sub.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="row-title">{sub.studentName}</div>
                        <div className="row-sub">{clock(sub.submittedAt ?? sub.startedAt)}</div>
                      </td>
                      <td>
                        <b>{score.earned}</b>
                        <span className="muted"> / {score.max}</span>
                      </td>
                      <td>
                        {correct} / {exam.questions.filter((q) => q.type === "pg").length}
                      </td>
                      <td>{essayScore}</td>
                      <td>
                        {sub.violations.length ? (
                          <span className="badge badge-danger">{sub.violations.length}×</span>
                        ) : (
                          <span className="badge badge-live">Aman</span>
                        )}
                      </td>
                      <td>
                        {score.pending > 0 ? (
                          <span className="badge badge-draft">Perlu dinilai</span>
                        ) : (
                          <span className="badge badge-live">Selesai</span>
                        )}
                        {sub.autoSubmitted && (
                          <span className="badge badge-danger" style={{ marginLeft: 6 }}>
                            Auto-submit
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="two-col">
        <div className="card panel">
          <h3>Analisis butir soal</h3>
          <p className="sub">
            Persentase menjawab benar per soal. Soal dengan capaian rendah ditandai merah.
          </p>
          <div className="analysis-list">
            {stats.map((item, index) => (
              <div className="analysis-item" key={item.question.id}>
                <div className="analysis-head">
                  <b>
                    Soal {index + 1} · {item.question.type === "pg" ? "PG" : "Esai"}
                  </b>
                  <span className="muted">
                    {item.question.type === "pg"
                      ? `${item.correct}/${item.answered} benar`
                      : `rata-rata ${item.average ?? 0}/${item.question.points}`}
                  </span>
                </div>
                <p className="small" style={{ marginBottom: 8, lineHeight: 1.5 }}>
                  {item.question.text}
                </p>
                <div
                  className={`bar ${item.percent >= 70 ? "success" : item.percent >= 40 ? "" : "danger"}`}
                >
                  <i style={{ width: `${Math.max(3, item.percent)}%` }} />
                </div>
                <div className="dist">
                  <span>{item.percent}% capaian</span>
                  {item.question.type === "pg" &&
                    item.distribution.map((count, optionIndex) => (
                      <span key={optionIndex}>
                        {String.fromCharCode(65 + optionIndex)}: {count}
                        {optionIndex === item.question.answerIndex ? " ✓" : ""}
                      </span>
                    ))}
                  {item.question.type === "esai" && <span>Dinilai guru</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card panel">
          <h3>Lembar jawaban siswa</h3>
          <p className="sub">Pilih siswa pada tabel untuk memeriksa dan menilai esai.</p>

          <select
            className="select no-print"
            value={selected?.id ?? ""}
            onChange={(event) => setSelectedId(event.target.value)}
            style={{ marginBottom: 14 }}
          >
            {subs.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.studentName}
              </option>
            ))}
          </select>

          {selected && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <b>{selected.studentName}</b>
                <span className="muted small">
                  {selected.violations.length} pelanggaran
                </span>
              </div>

              {selected.violations.length > 0 && (
                <div className="violation-banner" style={{ marginBottom: 12 }}>
                  <div>
                    <b>Catatan pengawasan:</b>
                    <ul style={{ marginTop: 4 }}>
                      {selected.violations.map((violation, index) => (
                        <li key={index} style={{ fontSize: 12 }}>
                          {clock(violation.at)} — {violation.type}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gap: 10 }}>
                {exam.questions.map((question, index) => {
                  const answer = selected.answers[question.id];
                  const isEssay = question.type === "esai";
                  const correct = answer?.value === question.answerIndex;
                  return (
                    <div className="analysis-item" key={question.id}>
                      <div className="analysis-head">
                        <b>Soal {index + 1}</b>
                        <span
                          className={`badge ${
                            isEssay
                              ? answer?.graded
                                ? "badge-live"
                                : "badge-draft"
                              : correct
                                ? "badge-live"
                                : "badge-danger"
                          }`}
                        >
                          {isEssay
                            ? answer?.graded
                              ? `${answer.score}/${question.points}`
                              : "Belum dinilai"
                            : correct
                              ? `+${question.points}`
                              : "Salah"}
                        </span>
                      </div>
                      <p className="small" style={{ lineHeight: 1.5 }}>
                        {question.text}
                      </p>

                      {isEssay ? (
                        <>
                          <div className="answer-box">
                            {String(answer?.value ?? "— tidak dijawab —")}
                          </div>
                          <label className="small muted">
                            Nilai{" "}
                            <input
                              className="grade-input"
                              type="number"
                              min={0}
                              max={question.points}
                              value={answer?.score ?? 0}
                              onChange={(event) =>
                                gradeEssay(
                                  selected.id,
                                  question.id,
                                  Math.max(0, Math.min(question.points, Number(event.target.value))),
                                )
                              }
                            />{" "}
                            / {question.points}
                          </label>
                        </>
                      ) : (
                        <p className="small muted" style={{ marginTop: 6 }}>
                          Jawaban:{" "}
                          <b>
                            {typeof answer?.value === "number"
                              ? `${String.fromCharCode(65 + answer.value)}. ${
                                  question.options?.[answer.value] ?? ""
                                }`
                              : "—"}
                          </b>{" "}
                          · Kunci: {String.fromCharCode(65 + (question.answerIndex ?? 0))}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

export type { Submission };
