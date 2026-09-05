import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { QUESTIONS, DIMENSIONS, INDICATORS } from '@/lib/instrument.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'docx').toLowerCase();

    // 1. Format DOCX (Berkas Resmi Dokumen Word)
    if (format === 'docx') {
      const filePath = path.join(process.cwd(), 'public', 'draft-kuesioner-survei.docx');
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Berkas draft Word tidak ditemukan' }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(filePath);
      return new Response(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="Draft_Kuesioner_Survei_Respon_Siswa_BNPT_RI.docx"'
        }
      });
    }

    // 2. Format JSON (Struktur Instrumen Riset)
    if (format === 'json') {
      const data = {
        judul: 'Draft Instrumen Kuesioner Survei Respon Siswa terhadap Narasi Radikal Terorisme di Media Sosial',
        instansi: 'Badan Nasional Penanggulangan Terorisme (BNPT RI)',
        petunjuk: 'Pilihlah salah satu opsi: SS (Sangat Setuju), S (Setuju), TS (Tidak Setuju), STS (Sangat Tidak Setuju)',
        dimensi: DIMENSIONS,
        indikator: INDICATORS,
        butir_pertanyaan: QUESTIONS.map((q, idx) => ({
          nomor: idx + 1,
          kode: q.code,
          dimensi: DIMENSIONS[q.dimensionId]?.title,
          indikator: INDICATORS[q.indicatorId]?.title,
          valensi: q.valence,
          pernyataan: q.text,
          pilihan_jawaban: ['SS', 'S', 'TS', 'STS']
        }))
      };

      return new Response(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Draft_Instrumen_Kuesioner_Q1-Q24.json"'
        }
      });
    }

    // 3. Format TXT (Lembar Kuesioner Blank Siap Cetak)
    const line = '='.repeat(80);
    const subLine = '-'.repeat(80);

    let txt = `${line}\n`;
    txt += `BADAN NASIONAL PENANGGULANGAN TERORISME REPUBLIK INDONESIA (BNPT RI)\n`;
    txt += `PUSAT MEDIA DAMAI (PMD) - KEGIATAN SURVEI SEKOLAH DAMAI\n`;
    txt += `LEMBAR KUESIONER SURVEI RESPON SISWA TERHADAP KONTEN DI MEDIA SOSIAL\n`;
    txt += `${line}\n\n`;

    txt += `I. DATA PROFIL RESPONDEN SISWA\n${subLine}\n`;
    txt += `Nama Lengkap        : _____________________________________________________\n`;
    txt += `Jenis Kelamin       : [ ] Laki-Laki        [ ] Perempuan\n`;
    txt += `Agama / Kepercayaan : _____________________________________________________\n`;
    txt += `Kelas               : [ ] X   [ ] XI   [ ] XII\n`;
    txt += `Asal Sekolah        : _____________________________________________________\n\n`;

    txt += `II. PERILAKU BERMEDIA SOSIAL\n${subLine}\n`;
    txt += `Durasi Bermedia Sosial per Hari (Pilih satu):\n`;
    txt += `[ ] 0-2 jam/hari     [ ] 3-5 jam/hari     [ ] 6-8 jam/hari     [ ] >8 jam/hari\n\n`;
    txt += `Media Sosial yang Paling Sering Digunakan (Pilih satu):\n`;
    txt += `[ ] Instagram   [ ] TikTok   [ ] YouTube   [ ] X (Twitter)   [ ] Facebook   [ ] Lainnya\n\n`;
    txt += `Kategori Konten yang Sering Diakses (Boleh pilih lebih dari satu):\n`;
    txt += `[ ] Musik   [ ] Game   [ ] Komedi   [ ] Agama   [ ] Olahraga   [ ] Berita/Politik   [ ] Pendidikan\n\n`;

    txt += `III. PETUNJUK PENGISIAN KUESIONER\n${subLine}\n`;
    txt += `Bacalah setiap butir pernyataan dengan teliti, kemudian berikan tanda centang (√)\n`;
    txt += `pada salah satu kolom pilihan jawaban yang paling sesuai dengan diri Anda:\n`;
    txt += `- SS  : SANGAT SETUJU\n`;
    txt += `- S   : SETUJU\n`;
    txt += `- TS  : TIDAK SETUJU\n`;
    txt += `- STS : SANGAT TIDAK SETUJU\n\n`;
    txt += `* Segala bentuk jawaban dan identitas Anda dijamin kerahasiaannya oleh BNPT RI.\n\n`;

    txt += `IV. 24 BUTIR PERNYATAAN KUESIONER SISWA\n${subLine}\n`;
    txt += `No. | Pernyataan Instrumen                                      | SS | S  | TS | STS |\n`;
    txt += `${subLine}\n`;

    QUESTIONS.forEach((q, idx) => {
      const noStr = String(idx + 1).padStart(2, ' ');
      // Format pernyataan dengan wrapping rapi
      txt += `${noStr}. | ${q.text}\n`;
      txt += `    | Pilihan Jawaban:                                          | [ ]| [ ]| [ ]| [ ] |\n`;
      txt += `${subLine}\n`;
    });

    txt += `\nTerima kasih atas partisipasi dan kejujuran Anda dalam mengisi kuesioner ini.\n`;
    txt += `${line}\n`;

    return new Response(txt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="Draft_Lembar_Kuesioner_Siswa_Siap_Cetak.txt"'
      }
    });
  } catch (err) {
    console.error('Error downloading instrument draft:', err);
    return NextResponse.json({ error: 'Gagal mengunduh draft kuesioner' }, { status: 500 });
  }
}
