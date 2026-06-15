/**
 * SISTEM TEMPAHAN PRODUK UNGGAS (S.T.P.U)
 * Copyright 2026 Institut Teknologi Unggas, JPV
 *
 * Aliran data: HTML (Index.html) → Google Forms → Google Sheets
 * Backend ini bertanggungjawab untuk serve halaman web dan semakan tempahan.
 */

// Konfigurasi semua spreadsheet produk
const SPREADSHEETS = [
  { id: "131xIA9dGUmNc6CrWN-4R7N6t4f-bZQ9jSwx0pdzjMHg", statusCol: 13, slipCol: 15 }, // TELUR_BERNAS_AK        (L=12, O=15)
  { id: "1kl6M-eDIJ7lHvX84sijOYdgJKbk4OLhW4Sk5eseLoz0", statusCol: 13, slipCol: 15 }, // ANAK_AYAM_AK           (M=13, P=15)
  { id: "1v6nnt-6wFp4ha_QfjORBQ5Gh6gOg0p0VxKc-FSbG5qI", statusCol: 12, slipCol: 14 }, // TELUR_PUYUH_PEDAGING   (L=13, O=15)
  { id: "1HbXJUqBOyu-dUixgaPNlFfZhPqLibq_AeVju2JfbYfU", statusCol: 12, slipCol: 14 }, // ANAK_PUYUH_PEDAGING    (M=12, P=14)
  { id: "1mmB7bVyPvAE4SPSoQp5EiSQUGxa9XgbMg63U90lexHA", statusCol: 12, slipCol: 14 }, // TELUR_PUYUH_PENELUR    (L=12, O=14)
  { id: "1eiHYWxtkdOrf9FU_vvutbESskAY9klFtWtKpsFYbM_s", statusCol: 12, slipCol: 15 }, // ANAK_PUYUH_PENELUR     (M=12, P=15)
];

// Indeks kolum (0-based)
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

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('S.T.P.U - Sistem Tempahan Produk Unggas')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Cari tempahan berdasarkan nombor IC.
 * IC tidak dihantar balik ke frontend.
 */
function semakTempahan(ic) {
  const icBersih = ic.replace(/\D/g, ''); // buang semua bukan nombor
  const results  = [];

  SPREADSHEETS.forEach(function(cfg) {
    try {
      const ss    = SpreadsheetApp.openById(cfg.id);
      const sheet = ss.getSheets()[0];
      const data  = sheet.getDataRange().getValues();

      for (var i = 1; i < data.length; i++) { // skip header row
        const row    = data[i];
        const icRow  = String(row[COL.IC] || '').replace(/\D/g, '');

        if (icRow === icBersih) {
          const statusIdx = cfg.statusCol - 1; // convert ke 0-based
          const slipIdx   = cfg.slipCol   - 1;

          results.push({
            timestamp : row[COL.TIMESTAMP] ? Utilities.formatDate(new Date(row[COL.TIMESTAMP]), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') : '',
            email     : row[COL.EMAIL]     || '',
            nama      : row[COL.NAMA]      || '',
            tel       : row[COL.TEL]       || '',
            alamat    : row[COL.ALAMAT]    || '',
            produk    : row[COL.PRODUK]    || '',
            kuantiti  : row[COL.KUANTITI]  || '',
            nota      : row[COL.NOTA]      || '',
            status    : row[statusIdx]     || '',
            slipUrl   : row[slipIdx]       || '',
          });
        }
      }
    } catch(e) {
      // skip spreadsheet yang tak boleh diakses
      Logger.log('Ralat spreadsheet ' + cfg.id + ': ' + e.toString());
    }
  });

  return results;
}