/**
 * Mesin Skoring Psikometri & Kalkulasi Agregasi Indeks
 * Sesuai Dokumen PRD Bagian 5 & 6
 */

import { QUESTIONS, QUESTION_MAP, DIMENSIONS, INDICATORS } from './instrument.js';

/**
 * Konversi nilai respon teks ke skor numerik (1-4) dengan aturan pembalikan (inversi)
 * @param {string} questionCode - Kode butir (misal 'Q1', 'Q13')
 * @param {string} rawAnswer - Jawaban teks ('SS', 'S', 'TS', 'STS')
 * @returns {number} Skor numerik 1-4
 */
export function scoreSingleResponse(questionCode, rawAnswer) {
  const item = QUESTION_MAP[questionCode];
  if (!item) return 0;

  const normalizedAnswer = (rawAnswer || '').trim().toUpperCase();
  const isFavorable = item.valence === 'FAVORABLE';

  switch (normalizedAnswer) {
    case 'SS':
      return isFavorable ? 4 : 1;
    case 'S':
      return isFavorable ? 3 : 2;
    case 'TS':
      return isFavorable ? 2 : 3;
    case 'STS':
      return isFavorable ? 1 : 4;
    default:
      return 0;
  }
}

/**
 * Cek apakah respon tergolong 'Aman' (Favorable Response) atau 'Rentan' (Unfavorable Response)
 * Sesuai PRD Bagian 5.4:
 * Aman: S atau SS pada butir Favorable (+), ATAU TS atau STS pada butir Unfavorable (-)
 * Rentan: TS atau STS pada butir Favorable (+), ATAU S atau SS pada butir Unfavorable (-)
 */
export function evaluateResponseSafety(questionCode, rawAnswer) {
  const item = QUESTION_MAP[questionCode];
  if (!item) return { isSafe: false, isVulnerable: false };

  const ans = (rawAnswer || '').trim().toUpperCase();
  const isFavorable = item.valence === 'FAVORABLE';

  if (isFavorable) {
    if (ans === 'SS' || ans === 'S') return { isSafe: true, isVulnerable: false };
    if (ans === 'TS' || ans === 'STS') return { isSafe: false, isVulnerable: true };
  } else {
    // Unfavorable
    if (ans === 'TS' || ans === 'STS') return { isSafe: true, isVulnerable: false };
    if (ans === 'SS' || ans === 'S') return { isSafe: false, isVulnerable: true };
  }
  return { isSafe: false, isVulnerable: false };
}

/**
 * Hitung seluruh scored responses dari raw responses kuesioner
 * @param {Object} rawResponses - { Q1: "S", Q2: "TS", ... Q24: "SS" }
 * @returns {Object} { Q1: 3, Q2: 2, ... Q24: 4 }
 */
export function scoreAllResponses(rawResponses = {}) {
  const scored = {};
  for (const q of QUESTIONS) {
    scored[q.code] = scoreSingleResponse(q.code, rawResponses[q.code]);
  }
  return scored;
}

/**
 * Penentuan status kategori capaian indeks (%)
 */
export function getIndexStatus(percent) {
  if (percent >= 70.0) return 'Kuat';
  if (percent >= 60.0) return 'Cukup';
  if (percent >= 50.0) return 'Waspada';
  return 'Kritis';
}

/**
 * Komputasi Agregasi Lengkap untuk Seluruh Responden Proyek
 * @param {Array} responses - Array objek dari tabel survey_responses
 * @param {Object} project - Objek metadata proyek
 * @param {Array} enumerators - Daftar enumerator proyek
 */
export function computeComprehensiveAnalytics(responses = [], project = {}, enumerators = []) {
  const N = responses.length;
  if (N === 0) {
    return getEmptyAnalytics(project, enumerators);
  }

  // 1. Item Distribution & Stats (Q1 - Q24)
  const itemStats = {};
  for (const q of QUESTIONS) {
    itemStats[q.code] = {
      code: q.code,
      text: q.text,
      valence: q.valence,
      dimensionId: q.dimensionId,
      indicatorId: q.indicatorId,
      counts: { SS: 0, S: 0, TS: 0, STS: 0 },
      percentages: { SS: 0, S: 0, TS: 0, STS: 0 },
      safeCount: 0,
      vulnerableCount: 0,
      safeRate: 0,
      vulnerableRate: 0,
      totalScore: 0,
      meanScore: 0
    };
  }

  // Akumulasi data per responden
  for (const r of responses) {
    const raw = typeof r.raw_responses === 'string' ? JSON.parse(r.raw_responses) : r.raw_responses;
    const scored = typeof r.scored_responses === 'string' ? JSON.parse(r.scored_responses) : r.scored_responses;

    for (const q of QUESTIONS) {
      const ans = (raw[q.code] || '').trim().toUpperCase();
      if (itemStats[q.code].counts[ans] !== undefined) {
        itemStats[q.code].counts[ans]++;
      }
      const safety = evaluateResponseSafety(q.code, ans);
      if (safety.isSafe) itemStats[q.code].safeCount++;
      if (safety.isVulnerable) itemStats[q.code].vulnerableCount++;
      itemStats[q.code].totalScore += (scored[q.code] || scoreSingleResponse(q.code, ans));
    }
  }

  for (const q of QUESTIONS) {
    const st = itemStats[q.code];
    st.percentages.SS = Number(((st.counts.SS / N) * 100).toFixed(2));
    st.percentages.S = Number(((st.counts.S / N) * 100).toFixed(2));
    st.percentages.TS = Number(((st.counts.TS / N) * 100).toFixed(2));
    st.percentages.STS = Number(((st.counts.STS / N) * 100).toFixed(2));
    st.safeRate = Number(((st.safeCount / N) * 100).toFixed(2));
    st.vulnerableRate = Number(((st.vulnerableCount / N) * 100).toFixed(2));
    st.meanScore = Number((st.totalScore / N).toFixed(2));
  }

  // 2. Indeks 7 Indikator Operasional
  const indicatorResults = {};
  for (const [indKey, indDef] of Object.entries(INDICATORS)) {
    const items = indDef.items;
    let actualSum = 0;
    let safeSum = 0;
    let vulnerableSum = 0;
    const totalResponsesInInd = N * items.length;

    for (const code of items) {
      actualSum += itemStats[code].totalScore;
      safeSum += itemStats[code].safeCount;
      vulnerableSum += itemStats[code].vulnerableCount;
    }

    const maxSum = N * items.length * 4;
    const scorePercent = Number(((actualSum / maxSum) * 100).toFixed(2));
    const favRate = Number(((safeSum / totalResponsesInInd) * 100).toFixed(2));
    const unfavRate = Number(((vulnerableSum / totalResponsesInInd) * 100).toFixed(2));

    indicatorResults[indKey] = {
      id: indDef.id,
      dimensionId: indDef.dimensionId,
      title: indDef.title,
      description: indDef.description,
      items: indDef.items,
      actualScore: actualSum,
      maxScore: maxSum,
      skor_persen: scorePercent,
      status: getIndexStatus(scorePercent),
      fav_rate: favRate,
      unfav_rate: unfavRate
    };
  }

  // 3. Indeks 4 Dimensi Utama
  const dimensionResults = {};
  for (const [dimKey, dimDef] of Object.entries(DIMENSIONS)) {
    const items = dimDef.items;
    let actualSum = 0;
    for (const code of items) {
      actualSum += itemStats[code].totalScore;
    }
    const maxSum = N * items.length * 4;
    const dimPercent = Number(((actualSum / maxSum) * 100).toFixed(2));

    const childIndicators = {};
    for (const indKey of dimDef.indicators) {
      childIndicators[indKey] = indicatorResults[indKey];
    }

    dimensionResults[dimKey] = {
      id: dimDef.id,
      title: dimDef.title,
      description: dimDef.description,
      items: dimDef.items,
      actualScore: actualSum,
      maxScore: maxSum,
      skor_indeks_dimensi_persen: dimPercent,
      status: getIndexStatus(dimPercent),
      indikator: childIndicators
    };
  }

  // 4. Profil Perilaku Digital (Durasi, Medsos Favorit, Konten)
  const durationCounts = { '0-2 jam': 0, '3-5 jam': 0, '6-8 jam': 0, '>8 jam': 0 };
  const platformCounts = {};
  const contentCounts = {};

  for (const r of responses) {
    // Normalisasi durasi
    const dur = normalizeDuration(r.social_media_duration);
    durationCounts[dur] = (durationCounts[dur] || 0) + 1;

    // Platform
    const plat = (r.favorite_social_media || 'Lainnya').trim();
    platformCounts[plat] = (platformCounts[plat] || 0) + 1;

    // Konten (bisa JSON array atau string koma)
    let contents = [];
    if (Array.isArray(r.favorite_content)) {
      contents = r.favorite_content;
    } else if (typeof r.favorite_content === 'string') {
      try {
        contents = JSON.parse(r.favorite_content);
      } catch {
        contents = r.favorite_content.split(',').map(c => c.trim());
      }
    }
    for (const c of contents) {
      if (!c) continue;
      const clean = c.trim();
      contentCounts[clean] = (contentCounts[clean] || 0) + 1;
    }
  }

  const durationDistribution = {};
  for (const [k, count] of Object.entries(durationCounts)) {
    const keySlug = k.replace(/\s+/g, '_');
    durationDistribution[keySlug] = {
      label: k,
      frekuensi: count,
      persentase: Number(((count / N) * 100).toFixed(2))
    };
  }

  const platformDistribution = {};
  for (const [k, count] of Object.entries(platformCounts)) {
    const keySlug = k.toLowerCase().replace(/[^a-z0-9]/g, '_');
    platformDistribution[keySlug] = {
      label: k,
      frekuensi: count,
      persentase: Number(((count / N) * 100).toFixed(2))
    };
  }

  // 5. Tabulasi Silang (Cross-Tabulation Matrix)

  // 5.1 Gender vs 4 Dimensi
  const genderCross = {
    'Laki-Laki': { total: 0, dimensions: {} },
    'Perempuan': { total: 0, dimensions: {} }
  };
  for (const dimKey of Object.keys(DIMENSIONS)) {
    genderCross['Laki-Laki'].dimensions[dimKey] = { actual: 0, max: 0 };
    genderCross['Perempuan'].dimensions[dimKey] = { actual: 0, max: 0 };
  }

  // 5.2 Platform Medsos vs 7 Indikator
  const platformCross = {};

  // 5.3 Durasi Medsos vs Dimensi Kerentanan (Anti-Kekerasan & Anti-Radikal Terorisme)
  const durationCross = {
    '0-2 jam': { total: 0, anti_kekerasan: { actual: 0, max: 0 }, anti_radikal: { actual: 0, max: 0 } },
    '3-5 jam': { total: 0, anti_kekerasan: { actual: 0, max: 0 }, anti_radikal: { actual: 0, max: 0 } },
    '6-8 jam': { total: 0, anti_kekerasan: { actual: 0, max: 0 }, anti_radikal: { actual: 0, max: 0 } },
    '>8 jam': { total: 0, anti_kekerasan: { actual: 0, max: 0 }, anti_radikal: { actual: 0, max: 0 } }
  };

  // 5.4 Preferensi Konten vs Platform
  const contentVsPlatform = {};

  for (const r of responses) {
    const g = normalizeGender(r.gender);
    const plat = (r.favorite_social_media || 'Lainnya').trim();
    const dur = normalizeDuration(r.social_media_duration);
    const scored = typeof r.scored_responses === 'string' ? JSON.parse(r.scored_responses) : r.scored_responses;

    // Gender vs Dimensi
    if (genderCross[g]) {
      genderCross[g].total++;
      for (const [dimKey, dimDef] of Object.entries(DIMENSIONS)) {
        for (const code of dimDef.items) {
          genderCross[g].dimensions[dimKey].actual += (scored[code] || 0);
          genderCross[g].dimensions[dimKey].max += 4;
        }
      }
    }

    // Platform vs Indikator
    if (!platformCross[plat]) {
      platformCross[plat] = { total: 0, indicators: {} };
      for (const indKey of Object.keys(INDICATORS)) {
        platformCross[plat].indicators[indKey] = { actual: 0, max: 0 };
      }
    }
    platformCross[plat].total++;
    for (const [indKey, indDef] of Object.entries(INDICATORS)) {
      for (const code of indDef.items) {
        platformCross[plat].indicators[indKey].actual += (scored[code] || 0);
        platformCross[plat].indicators[indKey].max += 4;
      }
    }

    // Durasi vs Kerentanan
    if (durationCross[dur]) {
      durationCross[dur].total++;
      for (const code of DIMENSIONS.anti_kekerasan.items) {
        durationCross[dur].anti_kekerasan.actual += (scored[code] || 0);
        durationCross[dur].anti_kekerasan.max += 4;
      }
      for (const code of DIMENSIONS.anti_radikal_terorisme.items) {
        durationCross[dur].anti_radikal.actual += (scored[code] || 0);
        durationCross[dur].anti_radikal.max += 4;
      }
    }

    // Konten vs Platform
    let contents = [];
    if (Array.isArray(r.favorite_content)) contents = r.favorite_content;
    else if (typeof r.favorite_content === 'string') {
      try { contents = JSON.parse(r.favorite_content); } catch { contents = r.favorite_content.split(',').map(c => c.trim()); }
    }
    for (const c of contents) {
      if (!c) continue;
      const topic = c.trim();
      if (!contentVsPlatform[topic]) contentVsPlatform[topic] = {};
      contentVsPlatform[topic][plat] = (contentVsPlatform[topic][plat] || 0) + 1;
    }
  }

  // Format final Tabulasi Silang
  const finalGenderCross = {};
  for (const [g, data] of Object.entries(genderCross)) {
    const slug = g === 'Perempuan' ? 'perempuan' : 'laki_laki';
    finalGenderCross[slug] = {};
    for (const [dimKey, dimData] of Object.entries(data.dimensions)) {
      finalGenderCross[slug][dimKey] = dimData.max > 0 ? Number(((dimData.actual / dimData.max) * 100).toFixed(2)) : 0;
    }
  }

  const finalPlatformCross = {};
  for (const [plat, data] of Object.entries(platformCross)) {
    finalPlatformCross[plat] = { total: data.total, indicators: {} };
    for (const [indKey, indData] of Object.entries(data.indicators)) {
      finalPlatformCross[plat].indicators[indKey] = indData.max > 0 ? Number(((indData.actual / indData.max) * 100).toFixed(2)) : 0;
    }
  }

  const finalDurationCross = {};
  for (const [dur, data] of Object.entries(durationCross)) {
    finalDurationCross[dur] = {
      total: data.total,
      anti_kekerasan_persen: data.anti_kekerasan.max > 0 ? Number(((data.anti_kekerasan.actual / data.anti_kekerasan.max) * 100).toFixed(2)) : 0,
      anti_radikal_persen: data.anti_radikal.max > 0 ? Number(((data.anti_radikal.actual / data.anti_radikal.max) * 100).toFixed(2)) : 0
    };
  }

  // 6. Overall Project Safety Rate
  let totalAllResponses = N * 24;
  let totalAllSafe = 0;
  let totalAllVulnerable = 0;
  for (const q of QUESTIONS) {
    totalAllSafe += itemStats[q.code].safeCount;
    totalAllVulnerable += itemStats[q.code].vulnerableCount;
  }
  const overallSafeRate = Number(((totalAllSafe / totalAllResponses) * 100).toFixed(2));
  const overallVulnerableRate = Number(((totalAllVulnerable / totalAllResponses) * 100).toFixed(2));

  // Margin of Error Formula: MoE = 1 / sqrt(N) * 100% or 1.96 * sqrt(p*(1-p)/N)
  const marginOfError = N > 0 ? Number((1.96 * Math.sqrt(0.25 / N) * 100).toFixed(2)) : 0;

  // 7. Structured JSON Format (PRD Bagian 7.1)
  const structuredJson = {
    metadata_riset: {
      project_id: project.id || 'PRJ-2026-001',
      judul_kegiatan: project.project_name || 'Survei Respon Siswa terhadap Narasi Radikal Terorisme di Media Sosial',
      wilayah_analisis: project.province || 'Jawa Barat',
      total_responden_valid: N,
      margin_of_error_persen: marginOfError,
      jumlah_enumerator_aktif: enumerators.filter(e => e.status === 'ACTIVE').length || enumerators.length || 1,
      timestamp_pemrosesan: new Date().toISOString()
    },
    profil_perilaku_digital: {
      distribusi_durasi_harian: durationDistribution,
      platform_favorit: platformDistribution
    },
    indeks_dimensi_dan_indikator: {
      literasi_digital: {
        skor_indeks_dimensi_persen: dimensionResults.literasi_digital.skor_indeks_dimensi_persen,
        indikator: {
          a_membandingkan_sumber: {
            skor_persen: indicatorResults.a_membandingkan_sumber.skor_persen,
            status: indicatorResults.a_membandingkan_sumber.status,
            fav_rate: indicatorResults.a_membandingkan_sumber.fav_rate,
            unfav_rate: indicatorResults.a_membandingkan_sumber.unfav_rate
          },
          b_mengkritisi_konten: {
            skor_persen: indicatorResults.b_mengkritisi_konten.skor_persen,
            status: indicatorResults.b_mengkritisi_konten.status,
            fav_rate: indicatorResults.b_mengkritisi_konten.fav_rate,
            unfav_rate: indicatorResults.b_mengkritisi_konten.unfav_rate
          }
        }
      },
      toleransi: {
        skor_indeks_dimensi_persen: dimensionResults.toleransi.skor_indeks_dimensi_persen,
        indikator: {
          a_menerima_perbedaan: {
            skor_persen: indicatorResults.a_menerima_perbedaan.skor_persen,
            status: indicatorResults.a_menerima_perbedaan.status,
            fav_rate: indicatorResults.a_menerima_perbedaan.fav_rate,
            unfav_rate: indicatorResults.a_menerima_perbedaan.unfav_rate
          },
          b_tidak_memaksakan_opini: {
            skor_persen: indicatorResults.b_tidak_memaksakan_opini.skor_persen,
            status: indicatorResults.b_tidak_memaksakan_opini.status,
            fav_rate: indicatorResults.b_tidak_memaksakan_opini.fav_rate,
            unfav_rate: indicatorResults.b_tidak_memaksakan_opini.unfav_rate
          },
          c_mengecam_ujaran_kebencian: {
            skor_persen: indicatorResults.c_mengecam_ujaran_kebencian.skor_persen,
            status: indicatorResults.c_mengecam_ujaran_kebencian.status,
            fav_rate: indicatorResults.c_mengecam_ujaran_kebencian.fav_rate,
            unfav_rate: indicatorResults.c_mengecam_ujaran_kebencian.unfav_rate
          }
        }
      },
      anti_kekerasan: {
        skor_indeks_dimensi_persen: dimensionResults.anti_kekerasan.skor_indeks_dimensi_persen,
        indikator: {
          a_menolak_kekerasan: {
            skor_persen: indicatorResults.a_menolak_kekerasan.skor_persen,
            status: indicatorResults.a_menolak_kekerasan.status,
            fav_rate: indicatorResults.a_menolak_kekerasan.fav_rate,
            unfav_rate: indicatorResults.a_menolak_kekerasan.unfav_rate
          }
        }
      },
      anti_radikal_terorisme: {
        skor_indeks_dimensi_persen: dimensionResults.anti_radikal_terorisme.skor_indeks_dimensi_persen,
        indikator: {
          a_menolak_ideologi_radikal: {
            skor_persen: indicatorResults.a_menolak_ideologi_radikal.skor_persen,
            status: indicatorResults.a_menolak_ideologi_radikal.status,
            fav_rate: indicatorResults.a_menolak_ideologi_radikal.fav_rate,
            unfav_rate: indicatorResults.a_menolak_ideologi_radikal.unfav_rate
          }
        }
      }
    },
    hasil_tabulasi_silang: {
      gender_vs_dimensi: finalGenderCross,
      platform_vs_indikator: finalPlatformCross,
      durasi_vs_kerentanan: finalDurationCross,
      konten_vs_platform: contentVsPlatform
    }
  };

  return {
    totalResponden: N,
    marginOfError,
    overallSafeRate,
    overallVulnerableRate,
    itemStats,
    dimensionResults,
    indicatorResults,
    durationDistribution,
    platformDistribution,
    contentCounts,
    crossTabulations: {
      genderVsDimensions: finalGenderCross,
      platformVsIndicators: finalPlatformCross,
      durationVsVulnerability: finalDurationCross,
      contentVsPlatform: contentVsPlatform
    },
    structuredJson
  };
}

function normalizeGender(g) {
  const clean = (g || '').trim().toLowerCase();
  if (clean.includes('perempuan') || clean === 'p') return 'Perempuan';
  return 'Laki-Laki';
}

function normalizeDuration(d) {
  const clean = (d || '').trim();
  if (clean.includes('0-2')) return '0-2 jam';
  if (clean.includes('3-5')) return '3-5 jam';
  if (clean.includes('6-8')) return '6-8 jam';
  if (clean.includes('>8') || clean.includes('8') || clean.includes('&gt;8')) return '>8 jam';
  return '3-5 jam';
}

function getEmptyAnalytics(project = {}, enumerators = []) {
  return {
    totalResponden: 0,
    marginOfError: 0,
    overallSafeRate: 0,
    overallVulnerableRate: 0,
    itemStats: {},
    dimensionResults: {},
    indicatorResults: {},
    durationDistribution: {},
    platformDistribution: {},
    contentCounts: {},
    crossTabulations: {
      genderVsDimensions: {},
      platformVsIndicators: {},
      durationVsVulnerability: {},
      contentVsPlatform: {}
    },
    structuredJson: {
      metadata_riset: {
        project_id: project.id || 'PRJ-2026-001',
        judul_kegiatan: project.project_name || '',
        wilayah_analisis: project.province || '',
        total_responden_valid: 0,
        margin_of_error_persen: 0,
        jumlah_enumerator_aktif: 0,
        timestamp_pemrosesan: new Date().toISOString()
      },
      profil_perilaku_digital: { distribusi_durasi_harian: {}, platform_favorit: {} },
      indeks_dimensi_dan_indikator: {},
      hasil_tabulasi_silang: {}
    }
  };
}
