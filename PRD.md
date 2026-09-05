# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Platform Survei Lapangan & Analytics Engine: Riset Respon Siswa terhadap Narasi Radikal Terorisme di Media Sosial

* **Target Environment:** Antigravity IDE / Full-Stack Automated Survey & Analytics Engine
* **Version:** 1.0.0
* **Status:** Ready for Implementation
* **Focus Modules:** Role-Based Access Control (Admin/Peneliti vs Enumerator/Surveyor), PIN Authentication, Isolated Survey Data Ingestion, Psychometric Likert Inversion Engine, Index Aggregation Formulas, Cross-Tabulation Matrix, Structured JSON Output, & Visual Analytics Specifications.

---

## 1. Executive Summary & System Objectives

Satuan pendidikan merupakan ekosistem strategis sekaligus rentan terhadap infiltrasi narasi intoleransi, ekstremisme, dan radikalisme digital. Sistem ini dirancang untuk mendigitalkan dan mengotomatiskan survei kuantitatif di sekolah, memastikan integritas pengumpulan data lapangan, serta mengeliminasi kesalahan fatal dalam pengolahan data numerik melalui standardisasi psikometri.

### Core System Goals
1. **Isolated Field Data Collection (RBAC & PIN Access):** Memisahkan akses antara Peneliti/Admin dan Enumerator/Surveyor lapangan. Surveyor mengakses formulir survei melalui kode PIN unik 6-digit tanpa akun/kata sandi rumit, dan diisolasi sehingga hanya dapat melihat instrumen kuesioner tanpa akses ke data analitik maupun proyek lain.
2. **Standardized Analytics & Scoring Engine:** Mengonversi respons teks ordinal menjadi bobot numerik melalui aturan pembalikan (inversi) butir *unfavorable*, menghitung persentase indeks komposit pada 7 indikator dan 4 dimensi, menyusun tabulasi silang multi-variabel (Gender, Platform Medsos, Durasi Harian), serta menyajikan output terstruktur JSON dan blueprint visualisasi.

---

## 2. Architecture & Role-Based Access Control (RBAC)

Sistem membedakan secara tegas hak akses antara Peneliti/Admin dan Enumerator/Surveyor.

```
                  +----------------------------------------------+
                  |           AKUN PENELITI / ADMIN              |
                  |     (Email + Password / Full Privilege)      |
                  +----------------------+-----------------------+
                                         |
                                         | 1. Buat Proyek Riset Baru
                                         | 2. Daftarkan Nama Enumerator / Surveyor
                                         | 3. Sistem Generate PIN Unik (6-digit)
                                         v
                  +----------------------------------------------+
                  |         DISTRIBUSI KREDENSIAL LAPANGAN       |
                  |         (Tautan Survei + PIN Enumerator)     |
                  +----------------------+-----------------------+
                                         |
                                         | Enumerator login via PIN
                                         v
                  +----------------------------------------------+
                  |         AKUN ENUMERATOR / SURVEYOR           |
                  |          (Restricted Survey Interface)       |
                  +----------------------+-----------------------+
                                         |
                     HANYA MENAMPILKAN FORMULIR SURVEI:
                     - Data Profil Siswa (Gender, Agama, Kelas, Sekolah)
                     - Perilaku Media Sosial (Durasi, Platform, Konten)
                     - 24 Butir Pernyataan Skala Likert (Q1 s/d Q24)
                                         |
                                         | Siswa selesai mengisi -> Klik Submit
                                         v
                  +----------------------------------------------+
                  |          DATABASE PROYEK (REAL-TIME)         |
                  +----------------------+-----------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        DASHBOARD KONTROL PENELITI / ADMIN                         |
|  - Live monitoring jumlah kuesioner terinput per enumerator & per sekolah         |
|  - Fitur lock / revoke PIN jika kuota responden target terpenuhi                  |
|  - Eksekusi Analytics Engine (Inversi Likert, Skor Indeks, Tabulasi Silang)       |
|  - Ekspor Laporan Lengkap (JSON Data, Grafik Visual, Ringkasan Temuan Riset)      |
+-----------------------------------------------------------------------------------+
```

### 2.1. Role Privilege Matrix

| Fitur / Modul Sistem | Akun Peneliti / Admin | Akun Enumerator / Surveyor |
| :--- | :---: | :---: |
| **Metode Masuk (Authentication)** | Email & Kata Sandi Utama | **PIN Akses Unik (6-Digit)** |
| **Buat / Edit / Tutup Proyek Riset** | **Akses Penuh** | Tidak Ada Akses |
| **Pendaftaran Surveyor & Generate PIN** | **Akses Penuh** | Tidak Ada Akses |
| **Kunci / Cabut (*Revoke*) PIN Surveyor** | **Akses Penuh** | Tidak Ada Akses |
| **Akses Formulir Kuesioner Siswa** | Mode Pratinjau / Simulasi | **Antarmuka Utama (Restricted View)** |
| **Melihat Data Responden Mentah** | **Akses Penuh (Seluruh Responden)** | Dibatasi (Hanya angka total submit pribadi) |
| **Eksekusi Scoring & Tabulasi Silang** | **Akses Penuh** | Tidak Ada Akses |
| **Ekspor Laporan (JSON, CSV, Chart)** | **Akses Penuh** | Tidak Ada Akses |

### 2.2. User Journey: Enumerator Lapangan
1. Surveyor membuka tautan web app survei via smartphone/tablet/laptop.
2. Surveyor memasukkan PIN 6-digit.
3. Sistem memvalidasi status PIN:
   * **Active:** Sistem langsung menampilkan instrumen kuesioner siswa. Identitas surveyor (`enumerator_id`) otomatis tersemat di latar belakang.
   * **Inactive / Revoked:** Sistem menolak akses dengan pesan peringatan.
4. Siswa didampingi mengisi data profil, perilaku digital, serta 24 butir pernyataan Likert (Q1–Q24).
5. Surveyor menekan tombol **"Submit Respons"**. Data tersimpan ke database proyek.
6. Layar menampilkan tombol cepat **"Input Responden Baru"** untuk pengisian siswa selanjutnya.

---

## 3. Data Schema & Relational Models

```sql
-- Tabel Proyek Riset
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(255) NOT NULL,
    target_sample INT NOT NULL DEFAULT 400,
    province VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'DRAFT', 'ACTIVE', 'CLOSED'
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Enumerator / Surveyor
CREATE TABLE enumerators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    assigned_school VARCHAR(255),
    pin_hash VARCHAR(255) NOT NULL, -- Hashed 6-digit PIN
    pin_raw VARCHAR(6) NOT NULL,    -- Displayed only to Admin
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'REVOKED'
    total_submissions INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Respons Survei Siswa
CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    enumerator_id UUID REFERENCES enumerators(id) ON DELETE SET NULL,
    student_name VARCHAR(255),
    gender VARCHAR(20) NOT NULL,       -- 'Laki-Laki', 'Perempuan'
    religion VARCHAR(50) NOT NULL,     -- 'Islam', 'Kristen Katolik', 'Kristen Protestan', dll.
    grade VARCHAR(20) NOT NULL,        -- 'X', 'XI', 'XII'
    school_name VARCHAR(255) NOT NULL,
    social_media_duration VARCHAR(50) NOT NULL, -- '0-2 jam', '3-5 jam', '6-8 jam', '>8 jam'
    favorite_social_media VARCHAR(50) NOT NULL, -- 'Instagram', 'TikTok', 'YouTube', 'X', dll.
    favorite_content TEXT[] NOT NULL,           -- Array topik: ['Musik', 'Game', 'Komedi', ...]
    raw_responses JSONB NOT NULL,               -- {"Q1": "S", "Q2": "TS", ... "Q24": "SS"}
    scored_responses JSONB NOT NULL,            -- {"Q1": 3, "Q2": 2, ... "Q24": 4}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. Research Instrument & Taxonomy Mapping (Q1 - Q24)

Setiap butir pernyataan menggunakan skala Likert 4 tingkat: `SS` (Sangat Setuju), `S` (Setuju), `TS` (Tidak Setuju), dan `STS` (Sangat Tidak Setuju).

| Dimensi | Indikator Operasional | Kode Butir | Sifat Valensi | Teks Pernyataan Instrumen |
| :--- | :--- | :---: | :---: | :--- |
| **1. Literasi Digital** | a. Kemampuan siswa membandingkan informasi dari sumber lain | **Q1** | Favorable (+) | Jika saya membutuhkan informasi tentang apapun, saya akan mencarinya di media sosial. |
| | | **Q3** | Favorable (+) | Media sosial adalah rujukan utama bagi saya ketika ingin mencari informasi keagamaan. |
| | | **Q13** | Unfavorable (-) | Saya tidak terbiasa mencari pembanding dari sebuah berita dan akan langsung sharing/posting ke media sosial. |
| | b. Kemampuan siswa mengkritisi, memunculkan pertanyaan, meragukan kredibilitas konten | **Q2** | Favorable (+) | Saya selalu berkomentar di konten-konten yang sedang viral. |
| | | **Q6** | Favorable (+) | Saya percaya diri bahwa semua yang saya bagikan di media sosial adalah benar. |
| | | **Q7** | Unfavorable (-) | Saya lebih suka menanyakan persoalan agama kepada tokoh agama, daripada mencari di media sosial. |
| | | **Q17** | Unfavorable (-) | Saya tidak langsung mempercayai informasi yang berasal dari akun media sosial, meskipun itu dari figur/tokoh terkenal. |
| **2. Toleransi** | a. Menerima keberadaan individu/kelompok lain yang memiliki perbedaan agama dan keyakinan | **Q5** | Unfavorable (-) | Saya tidak mempertimbangkan latar belakang agamanya terlebih dahulu, sebelum memutuskan mengikuti akun di media sosial. |
| | | **Q14** | Unfavorable (-) | Saya tidak mempermasalahkan opini orang lain meskipun bertentangan dengan opini saya di media sosial. |
| | | **Q20** | Favorable (+) | Saya lebih nyaman mengikuti akun medsos yang memiliki keyakinan yang sama dengan saya. |
| | | **Q24** | Favorable (+) | Ketika mendapat informasi yang menyinggung keyakinan saya di media sosial, saya bersedia membela keyakinan saya tanpa pikir panjang. |
| | b. Tidak memaksa orang lain untuk menerima kebenaran versi dirinya | **Q9** | Unfavorable (-) | Saya tidak mempermasalahkan unggahan orang lain di media sosial selama itu sesuai dengan opini saya. |
| | | **Q10** | Favorable (+) | Saya akan mempertahankan opini saya di kolom komentar ketika saya merasa itu benar. |
| | c. Mengecam penggunaan ujaran kebencian terhadap minoritas agama dan kepercayaan lain | **Q8** | Favorable (+) | Saya akan mencaci akun di media sosial yang menjelekkan keyakinan saya. |
| | | **Q12** | Unfavorable (-) | Saya tidak tertarik membagikan ulang (repost) unggahan media sosial yang berisi hujatan kepada pihak lain. |
| **3. Anti Kekerasan** | a. Menolak segala bentuk kekerasan, persekusi, atau penyerangan dengan motif dan alasan apapun | **Q11** | Favorable (+) | Saya percaya bahwa semua individu berhak hidup dalam damai tanpa takut menjadi sasaran persekusi atau penyerangan berdasarkan agama atau kepercayaan mereka. |
| | | **Q15** | Favorable (+) | Saya percaya bahwa semua individu berhak hidup dalam damai tanpa takut menjadi sasaran persekusi atau penyerangan berdasarkan agama atau kepercayaan mereka. |
| | | **Q16** | Unfavorable (-) | Saya ragu-ragu mengikuti ajakan di media sosial untuk melakukan aksi dalam rangka membela suku atau agama ketika dijelekkan. |
| | | **Q19** | Favorable (+) | Saya tertarik dengan konten yang menampilkan tawuran antar pelajar di media sosial. |
| | | **Q22** | Unfavorable (-) | Menyerang atau mengintimidasi orang berdasarkan keyakinan agama atau kepercayaan adalah tidak dapat diterima dalam masyarakat modern. |
| **4. Anti Radikal Terorisme** | a. Paham atau aliran perubahan ideologi negara secara mendasar dan drastis yang mengarah pada perilaku dan/atau simpati terhadap kekerasan | **Q4** | Favorable (+) | Saya percaya demokrasi di Indonesia selaras dengan nilai-nilai agama yang saya yakini. |
| | | **Q18** | Unfavorable (-) | Saya tidak setuju negara diatur dengan satu hukum agama tertentu. |
| | | **Q21** | Favorable (+) | Saya lebih setuju negara menggunakan hukum agama daripada Pancasila. |
| | | **Q23** | Unfavorable (-) | Saya tidak percaya demokrasi cocok dipertahankan sebagai sistem negara. |

---

## 5. Aggregation Engine: Exact Calculation Formulas

Engine analitik harus memproses data mentah melalui 4 tahapan matematis baku:

### 5.1. Likert Scoring & Inversion Logic
Transformasi nilai string respon responden ke skor numerik (1–4):
* **Butir Favorable (+):** `SS` = 4, `S` = 3, `TS` = 2, `STS` = 1
* **Butir Unfavorable (-):** `SS` = 1, `S` = 2, `TS` = 3, `STS` = 4 *(Inversi skor agar nilai tinggi selalu merepresentasikan sikap aman/toleran)*

### 5.2. Indeks Indikator (%)
Untuk indikator ke-$k$ dengan kumpulan butir $I_k$ dan total sampel $N$:
$$S_{\text{aktual}, k} = \sum_{r=1}^{N} \sum_{i \in I_k} \text{Skor}(r, Q_i)$$
$$S_{\text{maks}, k} = N \times |I_k| \times 4$$
$$\text{Indeks}_k (\%) = \left( \frac{S_{\text{aktual}, k}}{S_{\text{maks}, k}} \right) \times 100\%$$

### 5.3. Indeks Dimensi (%)
Untuk dimensi $D$ dengan kumpulan butir $I_D$ dan total sampel $N$:
$$S_{\text{aktual}, D} = \sum_{r=1}^{N} \sum_{i \in I_D} \text{Skor}(r, Q_i)$$
$$S_{\text{maks}, D} = N \times |I_D| \times 4$$
$$\text{Indeks}_D (\%) = \left( \frac{S_{\text{aktual}, D}}{S_{\text{maks}, D}} \right) \times 100\%$$

### 5.4. Rasio Respons Aman vs Rentan (Response Rate Ratio)
* **Kategori Aman (Favorable Response):** Menjawab `S` atau `SS` pada butir Favorable (+), ATAU menjawab `TS` atau `STS` pada butir Unfavorable (-).
* **Kategori Rentan (Unfavorable Response):** Menjawab `TS` atau `STS` pada butir Favorable (+), ATAU menjawab `S` atau `SS` pada butir Unfavorable (-).
* **Persentase:**
  $$\% \text{ Respons Aman} = \left( \frac{\text{Total Respons Aman}}{\text{Total Seluruh Respons}} \right) \times 100\%$$
  $$\% \text{ Respons Rentan} = \left( \frac{\text{Total Respons Rentan}}{\text{Total Seluruh Respons}} \right) \times 100\%$$

---

## 6. Cross-Tabulation Matrix Specification

Modul analitik wajib mengompilasi tabulasi silang berikut secara otomatis:

| Analisis Silang | Variabel Independen (Baris) | Variabel Dependen (Kolom) | Output Metrics |
| :--- | :--- | :--- | :--- |
| **1. Gender vs Dimensi** | Jenis Kelamin: `Laki-Laki`, `Perempuan` | 4 Dimensi Sikap (Literasi, Toleransi, Anti-Kekerasan, Anti-Radikalisme) | Skor Mean Numerik & Persentase Indeks (%) |
| **2. Platform Medsos vs Dimensi** | Medsos Pilihan: `Instagram`, `TikTok`, `YouTube`, `X`, `Facebook` | 7 Indikator Perilaku | Persentase Sikap Positif (%) per Platform |
| **3. Durasi Medsos vs Kerentanan** | Durasi Harian: `0-2 jam`, `3-5 jam`, `6-8 jam`, `>8 jam` | Dimensi Anti-Kekerasan & Anti-Radikal Terorisme | Indeks Kerentanan Ideologi & Korelasi Paparan Media |
| **4. Preferensi Konten vs Platform** | Topik Konten: `Musik`, `Komedi`, `Game`, `Agama`, dll. | Medsos Pilihan: `Instagram`, `TikTok`, `YouTube` | Distribusi Frekuensi Multi-Response |

---

## 7. Output Specifications (JSON & Visualization)

### 7.1. Structured JSON Output Schema
```json
{
  "metadata_riset": {
    "project_id": "PRJ-2026-JB-001",
    "judul_kegiatan": "Survei Respon Siswa terhadap Narasi Radikal Terorisme di Media Sosial",
    "wilayah_analisis": "Jawa Barat",
    "total_responden_valid": 400,
    "margin_of_error_persen": 5.0,
    "jumlah_enumerator_aktif": 8,
    "timestamp_pemrosesan": "2026-09-05T00:43:00Z"
  },
  "profil_perilaku_digital": {
    "distribusi_durasi_harian": {
      "0-2_jam": { "frekuensi": 53, "persentase": 13.25 },
      "3-5_jam": { "frekuensi": 149, "persentase": 37.25 },
      "6-8_jam": { "frekuensi": 112, "persentase": 28.00 },
      ">8_jam": { "frekuensi": 34, "persentase": 8.50 }
    },
    "platform_favorit": {
      "instagram": { "frekuensi": 183, "persentase": 45.75 },
      "tiktok": { "frekuensi": 92, "persentase": 23.00 },
      "youtube": { "frekuensi": 15, "persentase": 3.75 },
      "x": { "frekuensi": 2, "persentase": 0.50 }
    }
  },
  "indeks_dimensi_dan_indikator": {
    "literasi_digital": {
      "skor_indeks_dimensi_persen": 46.20,
      "indikator": {
        "a_membandingkan_sumber": { "skor_persen": 30.41, "status": "Kritis", "fav_rate": 30.41, "unfav_rate": 69.59 },
        "b_mengkritisi_konten": { "skor_persen": 61.98, "status": "Cukup", "fav_rate": 76.79, "unfav_rate": 45.18 }
      }
    },
    "toleransi": {
      "skor_indeks_dimensi_persen": 57.57,
      "indikator": {
        "a_menerima_perbedaan": { "skor_persen": 57.64, "status": "Waspada", "fav_rate": 75.93, "unfav_rate": 39.34 },
        "b_tidak_memaksakan_opini": { "skor_persen": 49.95, "status": "Kritis", "fav_rate": 69.25, "unfav_rate": 30.66 },
        "c_mengecam_ujaran_kebencian": { "skor_persen": 65.11, "status": "Cukup", "fav_rate": 84.26, "unfav_rate": 45.97 }
      }
    },
    "anti_kekerasan": {
      "skor_indeks_dimensi_persen": 70.69,
      "indikator": {
        "a_menolak_kekerasan": { "skor_persen": 70.69, "status": "Kuat", "fav_rate": 80.17, "unfav_rate": 61.20 }
      }
    },
    "anti_radikal_terorisme": {
      "skor_indeks_dimensi_persen": 63.77,
      "indikator": {
        "a_menolak_ideologi_radikal": { "skor_persen": 63.77, "status": "Cukup", "fav_rate": 77.16, "unfav_rate": 50.38 }
      }
    }
  },
  "hasil_tabulasi_silang": {
    "gender_vs_dimensi": {
      "perempuan": { "literasi_digital": 46.07, "toleransi": 55.84, "anti_kekerasan": 70.26, "anti_radikal": 64.31 },
      "laki_laki": { "literasi_digital": 46.42, "toleransi": 56.71, "anti_kekerasan": 71.45, "anti_radikal": 63.07 }
    }
  }
}
```

### 7.2. Visual Analytics Specifications
1. **Chart 1: Diverging 100% Stacked Horizontal Bar (Distribusi Item Q1–Q24)**
   * Sumbu Y: Kode Butir (Q1 s/d Q24).
   * Sumbu X: Persentase Responden (0% – 100%).
   * Warna: STS (Abu-abu), TS (Oranye/Kuning), S (Biru), SS (Hijau).
2. **Chart 2: Grouped Bar Chart Indikator Kinerja Sikap**
   * Sumbu X: 7 Indikator Operasional.
   * Sumbu Y: Persentase Capaian Indeks (0% – 100%).
   * Threshold: Hijau (>= 70%, Kuat), Kuning (50% – 69.9%, Waspada), Merah (< 50%, Kritis).
3. **Chart 3: Faceted Comparative Bar (Platform Medsos vs Dimensi)**
   * Subplot terpisah untuk pengguna Instagram, TikTok, dan YouTube guna memetakan kanal paling rentan.
