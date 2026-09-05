/**
 * Instrumen Riset & Taksonomi Indikator
 * Sesuai Dokumen PRD Bagian 4: Research Instrument & Taxonomy Mapping (Q1 - Q24)
 */

export const LIKERT_OPTIONS = [
  { value: 'SS', label: 'Sangat Setuju', desc: 'Sangat setuju dengan pernyataan ini' },
  { value: 'S', label: 'Setuju', desc: 'Setuju dengan pernyataan ini' },
  { value: 'TS', label: 'Tidak Setuju', desc: 'Tidak setuju dengan pernyataan ini' },
  { value: 'STS', label: 'Sangat Tidak Setuju', desc: 'Sangat tidak setuju dengan pernyataan ini' },
];

export const DIMENSIONS = {
  literasi_digital: {
    id: 'literasi_digital',
    title: 'Literasi Digital',
    description: 'Kemampuan membandingkan dan mengkritisi informasi serta kredibilitas konten di media sosial.',
    indicators: ['a_membandingkan_sumber', 'b_mengkritisi_konten'],
    items: ['Q1', 'Q3', 'Q13', 'Q2', 'Q6', 'Q7', 'Q17']
  },
  toleransi: {
    id: 'toleransi',
    title: 'Toleransi',
    description: 'Penerimaan terhadap perbedaan keyakinan, tidak memaksakan opini, dan penolakan ujaran kebencian.',
    indicators: ['a_menerima_perbedaan', 'b_tidak_memaksakan_opini', 'c_mengecam_ujaran_kebencian'],
    items: ['Q5', 'Q14', 'Q20', 'Q24', 'Q9', 'Q10', 'Q8', 'Q12']
  },
  anti_kekerasan: {
    id: 'anti_kekerasan',
    title: 'Anti Kekerasan',
    description: 'Sikap penolakan terhadap aksi kekerasan, tawuran pelajar, persekusi, dan intimidasi.',
    indicators: ['a_menolak_kekerasan'],
    items: ['Q11', 'Q15', 'Q16', 'Q19', 'Q22']
  },
  anti_radikal_terorisme: {
    id: 'anti_radikal_terorisme',
    title: 'Anti Radikal Terorisme',
    description: 'Ketahanan ideologis terhadap perubahan sistem negara drastis dan simpati terhadap kekerasan.',
    indicators: ['a_menolak_ideologi_radikal'],
    items: ['Q4', 'Q18', 'Q21', 'Q23']
  }
};

export const INDICATORS = {
  a_membandingkan_sumber: {
    id: 'a_membandingkan_sumber',
    dimensionId: 'literasi_digital',
    title: 'Membandingkan Sumber Informasi',
    description: 'Kemampuan siswa membandingkan informasi dari sumber lain.',
    items: ['Q1', 'Q3', 'Q13']
  },
  b_mengkritisi_konten: {
    id: 'b_mengkritisi_konten',
    dimensionId: 'literasi_digital',
    title: 'Mengkritisi Kredibilitas Konten',
    description: 'Kemampuan siswa mengkritisi, memunculkan pertanyaan, meragukan kredibilitas konten.',
    items: ['Q2', 'Q6', 'Q7', 'Q17']
  },
  a_menerima_perbedaan: {
    id: 'a_menerima_perbedaan',
    dimensionId: 'toleransi',
    title: 'Menerima Perbedaan Keyakinan',
    description: 'Menerima keberadaan individu/kelompok lain yang memiliki perbedaan agama dan keyakinan.',
    items: ['Q5', 'Q14', 'Q20', 'Q24']
  },
  b_tidak_memaksakan_opini: {
    id: 'b_tidak_memaksakan_opini',
    dimensionId: 'toleransi',
    title: 'Tidak Memaksakan Opini',
    description: 'Tidak memaksa orang lain untuk menerima kebenaran versi dirinya.',
    items: ['Q9', 'Q10']
  },
  c_mengecam_ujaran_kebencian: {
    id: 'c_mengecam_ujaran_kebencian',
    dimensionId: 'toleransi',
    title: 'Mengecam Ujaran Kebencian',
    description: 'Mengecam penggunaan ujaran kebencian terhadap minoritas agama dan kepercayaan lain.',
    items: ['Q8', 'Q12']
  },
  a_menolak_kekerasan: {
    id: 'a_menolak_kekerasan',
    dimensionId: 'anti_kekerasan',
    title: 'Menolak Segala Bentuk Kekerasan',
    description: 'Menolak segala bentuk kekerasan, persekusi, atau penyerangan dengan motif dan alasan apapun.',
    items: ['Q11', 'Q15', 'Q16', 'Q19', 'Q22']
  },
  a_menolak_ideologi_radikal: {
    id: 'a_menolak_ideologi_radikal',
    dimensionId: 'anti_radikal_terorisme',
    title: 'Menolak Paham Radikal Terorisme',
    description: 'Paham atau aliran perubahan ideologi negara secara mendasar dan drastis yang mengarah pada perilaku dan/atau simpati terhadap kekerasan.',
    items: ['Q4', 'Q18', 'Q21', 'Q23']
  }
};

export const QUESTIONS = [
  {
    code: 'Q1',
    dimensionId: 'literasi_digital',
    indicatorId: 'a_membandingkan_sumber',
    valence: 'FAVORABLE', // +
    text: 'Jika saya membutuhkan informasi tentang apapun, saya akan mencarinya di media sosial.'
  },
  {
    code: 'Q2',
    dimensionId: 'literasi_digital',
    indicatorId: 'b_mengkritisi_konten',
    valence: 'FAVORABLE', // +
    text: 'Saya selalu berkomentar di konten-konten yang sedang viral.'
  },
  {
    code: 'Q3',
    dimensionId: 'literasi_digital',
    indicatorId: 'a_membandingkan_sumber',
    valence: 'FAVORABLE', // +
    text: 'Media sosial adalah rujukan utama bagi saya ketika ingin mencari informasi keagamaan.'
  },
  {
    code: 'Q4',
    dimensionId: 'anti_radikal_terorisme',
    indicatorId: 'a_menolak_ideologi_radikal',
    valence: 'FAVORABLE', // +
    text: 'Saya percaya demokrasi di Indonesia selaras dengan nilai-nilai agama yang saya yakini.'
  },
  {
    code: 'Q5',
    dimensionId: 'toleransi',
    indicatorId: 'a_menerima_perbedaan',
    valence: 'UNFAVORABLE', // -
    text: 'Saya tidak mempertimbangkan latar belakang agamanya terlebih dahulu, sebelum memutuskan mengikuti akun di media sosial.'
  },
  {
    code: 'Q6',
    dimensionId: 'literasi_digital',
    indicatorId: 'b_mengkritisi_konten',
    valence: 'FAVORABLE', // +
    text: 'Saya percaya diri bahwa semua yang saya bagikan di media sosial adalah benar.'
  },
  {
    code: 'Q7',
    dimensionId: 'literasi_digital',
    indicatorId: 'b_mengkritisi_konten',
    valence: 'UNFAVORABLE', // -
    text: 'Saya lebih suka menanyakan persoalan agama kepada tokoh agama, daripada mencari di media sosial.'
  },
  {
    code: 'Q8',
    dimensionId: 'toleransi',
    indicatorId: 'c_mengecam_ujaran_kebencian',
    valence: 'FAVORABLE', // +
    text: 'Saya akan mencaci akun di media sosial yang menjelekkan keyakinan saya.'
  },
  {
    code: 'Q9',
    dimensionId: 'toleransi',
    indicatorId: 'b_tidak_memaksakan_opini',
    valence: 'UNFAVORABLE', // -
    text: 'Saya tidak mempermasalahkan unggahan orang lain di media sosial selama itu sesuai dengan opini saya.'
  },
  {
    code: 'Q10',
    dimensionId: 'toleransi',
    indicatorId: 'b_tidak_memaksakan_opini',
    valence: 'FAVORABLE', // +
    text: 'Saya akan mempertahankan opini saya di kolom komentar ketika saya merasa itu benar.'
  },
  {
    code: 'Q11',
    dimensionId: 'anti_kekerasan',
    indicatorId: 'a_menolak_kekerasan',
    valence: 'FAVORABLE', // +
    text: 'Saya percaya bahwa semua individu berhak hidup dalam damai tanpa takut menjadi sasaran persekusi atau penyerangan berdasarkan agama atau kepercayaan mereka.'
  },
  {
    code: 'Q12',
    dimensionId: 'toleransi',
    indicatorId: 'c_mengecam_ujaran_kebencian',
    valence: 'UNFAVORABLE', // -
    text: 'Saya tidak tertarik membagikan ulang (repost) unggahan media sosial yang berisi hujatan kepada pihak lain.'
  },
  {
    code: 'Q13',
    dimensionId: 'literasi_digital',
    indicatorId: 'a_membandingkan_sumber',
    valence: 'UNFAVORABLE', // -
    text: 'Saya tidak terbiasa mencari pembanding dari sebuah berita dan akan langsung sharing/posting ke media sosial.'
  },
  {
    code: 'Q14',
    dimensionId: 'toleransi',
    indicatorId: 'a_menerima_perbedaan',
    valence: 'UNFAVORABLE', // -
    text: 'Saya tidak mempermasalahkan opini orang lain meskipun bertentangan dengan opini saya di media sosial.'
  },
  {
    code: 'Q15',
    dimensionId: 'anti_kekerasan',
    indicatorId: 'a_menolak_kekerasan',
    valence: 'FAVORABLE', // +
    text: 'Saya percaya bahwa semua individu berhak hidup dalam damai tanpa takut menjadi sasaran persekusi atau penyerangan berdasarkan agama atau kepercayaan mereka.'
  },
  {
    code: 'Q16',
    dimensionId: 'anti_kekerasan',
    indicatorId: 'a_menolak_kekerasan',
    valence: 'UNFAVORABLE', // -
    text: 'Saya ragu-ragu mengikuti ajakan di media sosial untuk melakukan aksi dalam rangka membela suku atau agama ketika dijelekkan.'
  },
  {
    code: 'Q17',
    dimensionId: 'literasi_digital',
    indicatorId: 'b_mengkritisi_konten',
    valence: 'UNFAVORABLE', // -
    text: 'Saya tidak langsung mempercayai informasi yang berasal dari akun media sosial, meskipun itu dari figur/tokoh terkenal.'
  },
  {
    code: 'Q18',
    dimensionId: 'anti_radikal_terorisme',
    indicatorId: 'a_menolak_ideologi_radikal',
    valence: 'UNFAVORABLE', // -
    text: 'Saya tidak setuju negara diatur dengan satu hukum agama tertentu.'
  },
  {
    code: 'Q19',
    dimensionId: 'anti_kekerasan',
    indicatorId: 'a_menolak_kekerasan',
    valence: 'FAVORABLE', // +
    text: 'Saya tertarik dengan konten yang menampilkan tawuran antar pelajar di media sosial.'
  },
  {
    code: 'Q20',
    dimensionId: 'toleransi',
    indicatorId: 'a_menerima_perbedaan',
    valence: 'FAVORABLE', // +
    text: 'Saya lebih nyaman mengikuti akun medsos yang memiliki keyakinan yang sama dengan saya.'
  },
  {
    code: 'Q21',
    dimensionId: 'anti_radikal_terorisme',
    indicatorId: 'a_menolak_ideologi_radikal',
    valence: 'FAVORABLE', // +
    text: 'Saya lebih setuju negara menggunakan hukum agama daripada Pancasila.'
  },
  {
    code: 'Q22',
    dimensionId: 'anti_kekerasan',
    indicatorId: 'a_menolak_kekerasan',
    valence: 'UNFAVORABLE', // -
    text: 'Menyerang atau mengintimidasi orang berdasarkan keyakinan agama atau kepercayaan adalah tidak dapat diterima dalam masyarakat modern.'
  },
  {
    code: 'Q23',
    dimensionId: 'anti_radikal_terorisme',
    indicatorId: 'a_menolak_ideologi_radikal',
    valence: 'UNFAVORABLE', // -
    text: 'Saya tidak percaya demokrasi cocok dipertahankan sebagai sistem negara.'
  },
  {
    code: 'Q24',
    dimensionId: 'toleransi',
    indicatorId: 'a_menerima_perbedaan',
    valence: 'FAVORABLE', // +
    text: 'Ketika mendapat informasi yang menyinggung keyakinan saya di media sosial, saya bersedia membela keyakinan saya tanpa pikir panjang.'
  }
];

export const QUESTION_MAP = Object.fromEntries(
  QUESTIONS.map(q => [q.code, q])
);
