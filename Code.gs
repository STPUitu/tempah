/**
 * SISTEM TEMPAHAN PRODUK UNGGAS (S.T.P.U)
 * Copyright 2026 Institut Teknologi Unggas, JPV
 *
 * Seni bina semasa: API sahaja.
 *   - UI penuh dihoskan di GitHub Pages (stpuitu.github.io/tempah, index.html).
 *   - /exec di sini hanya melayani:
 *       1. ?action=semak&ic=xxxxx  -> JSON hasil semakan (dipanggil via fetch()).
 *       2. tanpa parameter          -> redirect ke GitHub Pages.
 *
 * Aliran data: Google Forms -> Google Sheets -> API ini -> PWA.
 */

// ============================================================
// KONFIGURASI
// ============================================================

// Cache hasil semakan (saat). Kurangkan/0 kalau nak status lebih real-time,
// naikkan kalau nak kurangkan bacaan spreadsheet (jimat kuota).
//   - 0        : matikan cache (setiap carian baca sheet)
//   - 30       : kompromi (default)
//   - 60-120   : jimat kuota, tapi perubahan status admin lambat nampak
const CACHE_SECONDS = 30;

// Auto-detect lajur Status/Slip ikut nama header dalam sheet.
// Kalau header dijumpai, ia mengatasi statusCol/slipCol di bawah (lebih tahan
// bila borang tambah lajur baru). Kalau tak jumpa, fallback ke nombor lajur tetap.
const AUTO_DETECT_COLS = false;

// Konfigurasi semua spreadsheet produk.
// statusCol/slipCol ialah nombor lajur 1-based (A=1, B=2, ...) - digunakan
// sebagai FALLBACK bila AUTO_DETECT_COLS gagal jumpa header padanan.
const SPREADSHEETS = [
  { id: "131xIA9dGUmNc6CrWN-4R7N6t4f-bZQ9jSwx0pdzjMHg", statusCol: 13, slipCol: 15 }, // TELUR_BERNAS_AK       -> Status=M(13), Slip URL=O(15)
  { id: "1kl6M-eDIJ7lHvX84sijOYdgJKbk4OLhW4Sk5eseLoz0", statusCol: 13, slipCol: 15 }, // ANAK_AYAM_AK          -> Status=M(13), Slip URL=O(15)
  { id: "1v6nnt-6wFp4ha_QfjORBQ5Gh6gOg0p0VxKc-FSbG5qI", statusCol: 12, slipCol: 14 }, // TELUR_PUYUH_PEDAGING  -> Status=L(12), Slip URL=N(14)
  { id: "1HbXJUqBOyu-dUixgaPNlFfZhPqLibq_AeVju2JfbYfU", statusCol: 12, slipCol: 14 }, // ANAK_PUYUH_PEDAGING   -> Status=L(12), Slip URL=N(14)
  { id: "1mmB7bVyPvAE4SPSoQp5EiSQUGxa9XgbMg63U90lexHA", statusCol: 12, slipCol: 14 }, // TELUR_PUYUH_PENELUR   -> Status=L(12), Slip URL=N(14)
  { id: "1eiHYWxtkdOrf9FU_vvutbESskAY9klFtWtKpsFYbM_s", statusCol: 12, slipCol: 15 }, // ANAK_PUYUH_PENELUR    -> Status=L(12), Slip URL=O(15)
];

// Indeks kolum input borang (0-based) - sama untuk semua 6 sheet.
const COL = {
  TIMESTAMP : 0,  // A
  EMAIL     : 1,  // B
  NAMA      : 2,  // C
  IC        : 3,  // D
  TEL       : 4,  // E
  ALAMAT    : 5,  // F
  PRODUK    : 6,  // G
  KUANTITI  : 7,  // H
  NOTA      : 8,  // I
};

// Panjang IC Malaysia (selepas buang aksara bukan nombor).
const IC_LENGTH = 12;

// URL PWA untuk redirect.
const PWA_URL = 'https://stpuitu.github.io/tempah/';

// ============================================================
// ENDPOINT
// ============================================================

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === 'semak') {
    return handleSemak_(e);
  }

  // Tiada parameter -> redirect ke PWA.
  return HtmlService.createHtmlOutput(
      '<script>window.top.location.href="' + PWA_URL + '";</script>' +
      '<p>Mengalihkan ke <a href="' + PWA_URL + '">' + PWA_URL + '</a>...</p>'
  );
}

/**
 * Handle ?action=semak. SENTIASA pulangkan JSON (walau ralat) supaya
 * frontend .json() tak pecah.
 */
function handleSemak_(e) {
  try {
    const icRaw = ((e.parameter && e.parameter.ic) || '').toString().replace(/\D/g, '');

    // Validasi server-side: IC mesti tepat 12 digit.
    // Elak dump data bila ic kosong/separa (cth ?ic= akan padan baris IC kosong).
    if (icRaw.length !== IC_LENGTH) {
      return jsonOutput_({ ok: false, error: 'IC tidak sah', results: [] });
    }

    const results = semakTempahan(icRaw);
    return jsonOutput_({ ok: true, results: results });

  } catch (err) {
    Logger.log('handleSemak_ error: ' + err);
    return jsonOutput_({ ok: false, error: 'ralat pelayan', results: [] });
  }
}

function jsonOutput_(obj) {
  return ContentService
      .createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// LOGIK CARIAN
// ============================================================

/**
 * Cari tempahan berdasarkan nombor IC (12 digit).
 * IC tidak dihantar balik ke frontend.
 */
function semakTempahan(ic) {
  const icBersih = String(ic || '').replace(/\D/g, '');

  // Guard: IC tak sah -> tak padan apa-apa (elak dump data).
  if (icBersih.length !== IC_LENGTH) return [];

  // Cache: elak baca 6 sheet berulang untuk IC yang sama.
  const cache = CacheService.getScriptCache();
  const cacheKey = 'ic_' + icBersih;
  if (CACHE_SECONDS > 0) {
    const cached = cache.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { /* cache rosak, teruskan baca */ }
    }
  }

  const results = [];

  SPREADSHEETS.forEach(function(cfg) {
    try {
      const ss    = SpreadsheetApp.openById(cfg.id);
      const sheet = ss.getSheets()[0]; // andaian: sheet pertama = respons borang
      const data  = sheet.getDataRange().getValues();
      if (data.length < 2) return; // header sahaja / kosong

      const headers = data[0];

      // Tentukan lajur Status/Slip: auto-detect ikut header, fallback ke config.
      const statusIdx = resolveColIndex_(headers, ['STATUS TEMPAHAN'], cfg.statusCol);
      const slipIdx   = resolveColIndex_(headers, ['SLIP TEMPAHAN', 'MERGED DOC'], cfg.slipCol);

      for (var i = 1; i < data.length; i++) { // skip header row
        const row   = data[i];
        const icRow = String(row[COL.IC] || '').replace(/\D/g, '');
        if (icRow !== icBersih) continue;

        results.push({
          timestamp : formatTimestamp_(row[COL.TIMESTAMP]),
          email     : row[COL.EMAIL]    || '',
          nama      : row[COL.NAMA]     || '',
          tel       : row[COL.TEL]      || '',
          alamat    : row[COL.ALAMAT]   || '',
          produk    : row[COL.PRODUK]   || '',
          kuantiti  : row[COL.KUANTITI] || '',
          nota      : row[COL.NOTA]     || '',
          status    : (statusIdx >= 0 ? row[statusIdx] : '') || '',
          slipUrl   : (slipIdx   >= 0 ? row[slipIdx]   : '') || '',
        });
      }
    } catch (err) {
      // Skip spreadsheet yang tak boleh diakses - jangan gagalkan carian penuh.
      Logger.log('Ralat spreadsheet ' + cfg.id + ': ' + err.toString());
    }
  });

  if (CACHE_SECONDS > 0) {
    try { cache.put(cacheKey, JSON.stringify(results), CACHE_SECONDS); } catch (e) { /* abaikan */ }
  }

  return results;
}

// ============================================================
// HELPER
// ============================================================

/**
 * Cari indeks lajur (0-based) ikut nama header.
 * @param headers    Array baris header.
 * @param candidates Senarai substring header untuk dipadan (ikut keutamaan).
 * @param fallbackCol Nombor lajur 1-based untuk digunakan kalau tak jumpa.
 * @return indeks 0-based, atau -1 kalau langsung tiada.
 */
function resolveColIndex_(headers, candidates, fallbackCol) {
  if (AUTO_DETECT_COLS && headers && headers.length) {
    const norm = headers.map(function(h) { return String(h || '').trim().toUpperCase(); });
    for (var c = 0; c < candidates.length; c++) {
      const needle = candidates[c].toUpperCase();
      for (var j = 0; j < norm.length; j++) {
        if (norm[j].indexOf(needle) !== -1) return j; // jumpa
      }
    }
  }
  // Fallback: nombor lajur tetap (1-based -> 0-based).
  return (fallbackCol && fallbackCol > 0) ? fallbackCol - 1 : -1;
}

/**
 * Format timestamp dengan selamat - satu baris rosak tak patut buang
 * keseluruhan hasil sheet.
 */
function formatTimestamp_(val) {
  if (!val) return '';
  try {
    return Utilities.formatDate(new Date(val), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  } catch (e) {
    return String(val); // fallback: papar nilai mentah
  }
}

// ============================================================
// DIAGNOSTIK (jalankan manual dari editor bila perlu)
// ============================================================

/**
 * Log header setiap sheet + indeks lajur Status/Slip yang di-resolve.
 * Guna untuk sahkan pemetaan lajur bila borang berubah.
 * Jalankan dari editor: pilih 'debugHeaders' -> Run -> lihat Executions/Logs.
 */
function debugHeaders() {
  SPREADSHEETS.forEach(function(cfg) {
    try {
      const ss = SpreadsheetApp.openById(cfg.id);
      const sheet = ss.getSheets()[0];
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const statusIdx = resolveColIndex_(headers, ['STATUS TEMPAHAN'], cfg.statusCol);
      const slipIdx   = resolveColIndex_(headers, ['SLIP TEMPAHAN', 'MERGED DOC'], cfg.slipCol);
      Logger.log('=== ' + ss.getName() + ' (' + cfg.id + ') ===');
      headers.forEach(function(h, idx) {
        Logger.log('  [' + idx + '] ' + h);
      });
      Logger.log('  -> statusIdx=' + statusIdx + ' (lajur ' + (statusIdx + 1) + '), ' +
                 'slipIdx=' + slipIdx + ' (lajur ' + (slipIdx + 1) + ')');
    } catch (err) {
      Logger.log('Ralat baca ' + cfg.id + ': ' + err);
    }
  });
}