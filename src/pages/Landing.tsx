import { navigate } from "../App";

const icons: Record<string, string> = {
  shield: "M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z",
  timer: "M12 8v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z",
  chart: "M4 19V5M4 19h16M8 16v-4M13 16V8M18 16v-6",
  file: "M7 3h7l4 4v14H7V3zM14 3v4h4M10 13h6M10 17h6",
  lock: "M6 11V8a6 6 0 1112 0v3M5 11h14v10H5V11z",
  users: "M16 20v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8zM21 20v-2a4 4 0 00-3-3.9",
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M20 6L9 17l-5-5",
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={icons[name]} />
    </svg>
  );
}

const features = [
  {
    icon: "shield",
    title: "Deteksi kecurangan berlapis",
    body: "Pindah tab, kehilangan fokus, keluar layar penuh, copy-paste, dan klik kanan tercatat otomatis lengkap dengan waktunya.",
  },
  {
    icon: "timer",
    title: "Timer yang tidak bisa diakali",
    body: "Sisa waktu disimpan di perangkat, jadi menutup atau me-refresh halaman tidak mengembalikan waktu ujian.",
  },
  {
    icon: "check",
    title: "Penilaian otomatis",
    body: "Pilihan ganda dinilai saat dikumpulkan. Esai dinilai guru dengan rubrik poin, lalu total nilai dihitung ulang.",
  },
  {
    icon: "chart",
    title: "Analisis per butir soal",
    body: "Tingkat kesulitan, distribusi pilihan jawaban, dan rata-rata esai per soal — bukan cuma nilai akhir siswa.",
  },
  {
    icon: "file",
    title: "Laporan siap cetak",
    body: "Satu klik langsung ke dialog cetak dengan tata letak A4: rekap nilai, ranking, dan catatan pelanggaran.",
  },
  {
    icon: "users",
    title: "Dua peran, satu alur",
    body: "Guru mengelola bank soal, jadwal, dan hasil. Siswa hanya melihat ujian yang memang dipublikasikan.",
  },
];

export function Landing() {
  return (
    <div className="landing">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">U</span>
          UjianAman
        </div>
        <nav>
          <a href="#fitur">Fitur</a>
          <a href="#alur">Alur</a>
          <a href="#teknologi">Teknologi</a>
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/masuk")}>
            Coba demo
          </button>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-grid">
          <div>
            <span className="chip">Studi kasus · Aplikasi web ujian</span>
            <h1>
              Ujian online yang <em>mengawasi dirinya sendiri</em>.
            </h1>
            <p className="lead">
              Aplikasi ujian dan tryout sekolah dengan deteksi kecurangan, penilaian
              otomatis, dan laporan analisis jawaban yang siap dicetak. Dibangun untuk
              ujian yang benar-benar dipakai — bukan sekadar tampilan.
            </p>
            <div className="hero-cta">
              <button className="btn btn-primary btn-lg" onClick={() => navigate("/masuk")}>
                Buka demo interaktif <Icon name="arrow" size={16} />
              </button>
              <a className="btn btn-ghost btn-lg" href="#fitur">
                Lihat fitur
              </a>
            </div>
            <div className="hero-meta">
              <div>
                <strong>5 sinyal</strong>
                <span>Anti-kecurangan</span>
              </div>
              <div>
                <strong>± 3 detik</strong>
                <span>Nilai PG otomatis</span>
              </div>
              <div>
                <strong>A4</strong>
                <span>Laporan siap cetak</span>
              </div>
            </div>
          </div>

          <div className="preview" aria-hidden="true">
            <div className="preview-bar">
              <i />
              <i />
              <i />
            </div>
            <div className="preview-body">
              <div className="preview-stat">
                <div>
                  <strong>6</strong>
                  <span>Peserta</span>
                </div>
                <div>
                  <strong>80</strong>
                  <span>Rata-rata</span>
                </div>
                <div>
                  <strong>11</strong>
                  <span>Pelanggaran</span>
                </div>
              </div>
              <div className="preview-row">
                <div>
                  <b>Aditya Pratama</b>
                  <span> · 96 poin</span>
                </div>
                <span className="badge badge-live">Aman</span>
              </div>
              <div className="preview-row">
                <div>
                  <b>Dimas Saputra</b>
                  <span> · 61 poin</span>
                </div>
                <span className="badge badge-danger">4 pelanggaran</span>
              </div>
              <div className="preview-row">
                <div>
                  <b>Bunga Lestari</b>
                  <span> · 89 poin</span>
                </div>
                <span className="badge badge-live">Aman</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span className="chip">Analisis butir soal</span>
                <span className="chip">Cetak PDF</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="fitur">
        <div className="section-head">
          <div>
            <h2>Yang membuatnya beda</h2>
            <p>Fitur yang benar-benar dibutuhkan pengawas ujian, bukan daftar panjang tanpa isi.</p>
          </div>
        </div>
        <div className="grid-3">
          {features.map((feature) => (
            <article className="card feature" key={feature.title}>
              <div className="feature-icon">
                <Icon name={feature.icon} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="alur">
        <div className="section-head">
          <div>
            <h2>Tiga langkah mencoba</h2>
            <p>Demo berisi data contoh yang bisa Anda ubah seenaknya. Tidak ada data yang dikirim ke server.</p>
          </div>
        </div>
        <div className="steps">
          <article className="card step">
            <div className="step-num">01 · MASUK</div>
            <h3>Pilih peran</h3>
            <p>Masuk sebagai guru untuk mengelola ujian, atau pilih salah satu siswa untuk mengerjakan try out.</p>
          </article>
          <article className="card step">
            <div className="step-num">02 · KERJAKAN</div>
            <h3>Rasakan pengawasannya</h3>
            <p>Coba pindah tab, tekan klik kanan, atau keluar dari layar penuh. Setiap tindakan langsung tercatat.</p>
          </article>
          <article className="card step">
            <div className="step-num">03 · NILAI</div>
            <h3>Lihat analisis &amp; cetak</h3>
            <p>Kembali sebagai guru, buka hasil, nilai esai, lalu cetak laporan analisis jawaban per siswa dan per soal.</p>
          </article>
        </div>
      </section>

      <section className="section" id="teknologi">
        <div className="section-head">
          <div>
            <h2>Dibangun dengan</h2>
            <p>Stack yang familiar, mudah dirawat, dan gampang dipindah ke server sekolah.</p>
          </div>
        </div>
        <div className="stack">
          <span>React 19</span>
          <span>TypeScript</span>
          <span>Vite</span>
          <span>CSS murni</span>
          <span>localStorage (mode demo)</span>
          <span>Siap PostgreSQL + REST API</span>
          <span>Cetak A4 / PDF</span>
        </div>
        <div className="note">
          <b>Transparansi:</b> demo ini berjalan sepenuhnya di browser dan menyimpan data di
          localStorage perangkat Anda. Untuk produksi, lapisan penyimpanan diganti API +
          PostgreSQL, autentikasi memakai akun sekolah, dan anti-kecurangan ditambah
          pencatatan sisi server agar tidak bisa dimanipulasi dari perangkat siswa.
        </div>
      </section>

      <footer className="footer">
        <div>
          <b>UjianAman</b> · Ahmad Sayuti — Mobile &amp; Web Developer
        </div>
        <div>
          <a href="https://github.com/asaayuti" target="_blank" rel="noreferrer">
            github.com/asaayuti
          </a>
        </div>
      </footer>
    </div>
  );
}
