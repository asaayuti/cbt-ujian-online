import { useState } from "react";
import { navigate } from "../App";
import { useStore } from "../store";
import type { Role } from "../types";

const students = [
  { id: "s1", name: "Aditya Pratama" },
  { id: "s2", name: "Bunga Lestari" },
  { id: "s3", name: "Citra Maharani" },
  { id: "s4", name: "Dimas Saputra" },
  { id: "s5", name: "Eka Wulandari" },
  { id: "s6", name: "Fajar Ramadhan" },
  { id: "s7", name: "Gita Permata" },
];

export function Login({ notice }: { notice?: string }) {
  const { signIn } = useStore();
  const [role, setRole] = useState<Role>("guru");

  const enterAsTeacher = () => {
    signIn({ role: "guru", id: "guru-1", name: "Bu Rina Kartika" });
    navigate("/guru");
  };

  const enterAsStudent = (id: string, name: string) => {
    signIn({ role: "siswa", id, name });
    navigate("/siswa");
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="brand" style={{ marginBottom: 22 }}>
          <span className="brand-mark">U</span>
          UjianAman
        </div>

        <h1>Masuk ke demo</h1>
        <p className="muted small">
          Pilih peran untuk mencoba alur guru atau alur siswa. Tidak perlu email dan kata sandi.
        </p>

        {notice && (
          <p className="small" style={{ marginTop: 12, color: "#8a4c07" }}>
            {notice}
          </p>
        )}

        <div className="role-toggle" role="tablist" aria-label="Pilih peran">
          <button
            role="tab"
            aria-selected={role === "guru"}
            className={role === "guru" ? "active" : ""}
            onClick={() => setRole("guru")}
          >
            Saya Guru
          </button>
          <button
            role="tab"
            aria-selected={role === "siswa"}
            className={role === "siswa" ? "active" : ""}
            onClick={() => setRole("siswa")}
          >
            Saya Siswa
          </button>
        </div>

        {role === "guru" ? (
          <div>
            <div
              className="card"
              style={{ padding: 16, display: "flex", gap: 12, alignItems: "center", boxShadow: "none" }}
            >
              <span className="avatar">RK</span>
              <div>
                <b style={{ fontSize: 14 }}>Bu Rina Kartika</b>
                <div className="muted" style={{ fontSize: 12 }}>
                  Guru Matematika · Kelas XII IPA
                </div>
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              onClick={enterAsTeacher}
            >
              Masuk sebagai guru
            </button>
          </div>
        ) : (
          <div className="student-pick">
            {students.map((student) => (
              <button key={student.id} onClick={() => enterAsStudent(student.id, student.name)}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="avatar">
                    {student.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  {student.name}
                </span>
                <span className="muted" style={{ fontSize: 12 }}>
                  Kelas XII IPA
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="muted" style={{ fontSize: 12, marginTop: 20, lineHeight: 1.6 }}>
          Demo menyimpan data di browser Anda. Muat ulang halaman tidak menghapus jawaban,
          namun menghapus data situs akan mengembalikannya ke data contoh.
        </p>

        <button
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: 14 }}
          onClick={() => navigate("/")}
        >
          Kembali ke halaman studi kasus
        </button>
      </div>
    </div>
  );
}
