# 📐 Spesifikasi Teknikal & Struktur Data

Dokumen ini memperincikan logik fungsi pembinaan kod untuk rujukan penyelenggaraan sistem atau integrasi ejen pintar (AI/Claude).

---

## 🏗️ Seni Bina Sistem

```
stpuitu.github.io/tempah/   (GitHub Pages, PWA)
  index.html  - UI penuh: Senarai Produk, Semakan Status, Maklumbalas
  manifest.json - konfigurasi PWA (start_url: ./index.html)
  sw.js          - service worker (cache shell, network-first untuk API)
  icon-192.png / icon-512.png

script.google.com/.../exec  (Google Apps Script, API + redirect)
  Code.gs         - doGet(e), semakTempahan(ic)
  appsscript.json - manifest projek (timezone, webapp access)
```

`index.html` adalah **satu-satunya** sumber UI. Apps Script `/exec` **tidak lagi** menyajikan HTML penuh — ia hanya:
1. `?action=semak&ic=xxxxx` → JSON API
2. Tanpa parameter → redirect ke GitHub Pages

---

## 🔌 Komunikasi Frontend ↔ Backend

`index.html` mengesan persekitaran semasa runtime dalam fungsi `cariTempahan()`:

```javascript
if (window.google && window.google.script && window.google.script.run) {
  // Dilayan dari Apps Script /exec secara langsung (warisan / fallback)
  google.script.run.withSuccessHandler(paparHasil)...semakTempahan(ic);
} else {
  // Dilayan dari GitHub Pages (PWA) - guna fetch ke /exec sebagai API
  fetch(EXEC_URL + '?action=semak&ic=' + encodeURIComponent(ic))
    .then(res => res.json())
    .then(data => data.ok ? paparHasil(data.results) : onError())
    .catch(onError);
}
```

`EXEC_URL` adalah konstanta dalam `index.html` yang menunjuk ke URL deployment `/exec` semasa. **Kemas kini nilai ini jika deployment Apps Script baru dibuat** (URL `/exec` berubah hanya jika deployment ID berubah; "New version" pada deployment sedia ada mengekalkan URL yang sama).

---

## 📡 `doGet(e)` — Apps Script API

```javascript
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === 'semak') {
    const ic = (e.parameter.ic || '').toString();
    const results = semakTempahan(ic);
    return ContentService
        .createTextOutput(JSON.stringify({ ok: true, results: results }))
        .setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createHtmlOutput(
      '<script>window.top.location.href="https://stpuitu.github.io/tempah/";</script>' +
      '<p>Mengalihkan ke <a href="https://stpuitu.github.io/tempah/">https://stpuitu.github.io/tempah/</a>...</p>'
  );
}
```

**Respons JSON** (`?action=semak&ic=xxxxx`):
```json
{
  "ok": true,
  "results": [
    {
      "timestamp": "24/04/2024 12:11",
      "email": "contoh@gmail.com",
      "nama": "NAMA PEMBELI",
      "tel": "0123456789",
      "alamat": "ALAMAT PENUH",
      "produk": "ANAK AYAM KAMPUNG",
      "kuantiti": 500,
      "nota": "AK004",
      "status": "Selesai",
      "slipUrl": "https://drive.google.com/file/d/.../view"
    }
  ]
}
```

---

## 📊 Konfigurasi `SPREADSHEETS` & Pemetaan Kolum

### `COL` — Lajur input borang (0-based, sama untuk semua 6 sheet)
```javascript
const COL = {
  TIMESTAMP : 0,  // Lajur A
  EMAIL     : 1,  // Lajur B
  NAMA      : 2,  // Lajur C
  IC        : 3,  // Lajur D
  TEL       : 4,  // Lajur E
  ALAMAT    : 5,  // Lajur F
  PRODUK    : 6,  // Lajur G
  KUANTITI  : 7,  // Lajur H
  NOTA      : 8,  // Lajur I
};
```

### `SPREADSHEETS` — `statusCol` / `slipCol` (1-based, berbeza per sheet)

`statusCol` dan `slipCol` merujuk lajur "STATUS TEMPAHAN" dan "Merged Doc URL - SLIP TEMPAHAN ..." pada setiap helaian — **nombor lajur sebenar (1-based: A=1, B=2, ...)**, ditukar ke 0-based (`-1`) di dalam `semakTempahan()`.

```javascript
const SPREADSHEETS = [
  { id: "131xIA9dGUmNc6CrWN-4R7N6t4f-bZQ9jSwx0pdzjMHg", statusCol: 13, slipCol: 15 }, // TELUR_BERNAS_AK       -> Status=M(13), Slip URL=O(15)
  { id: "1kl6M-eDIJ7lHvX84sijOYdgJKbk4OLhW4Sk5eseLoz0", statusCol: 13, slipCol: 15 }, // ANAK_AYAM_AK          -> Status=M(13), Slip URL=O(15)
  { id: "1v6nnt-6wFp4ha_QfjORBQ5Gh6gOg0p0VxKc-FSbG5qI", statusCol: 12, slipCol: 14 }, // TELUR_PUYUH_PEDAGING  -> Status=L(12), Slip URL=N(14)
  { id: "1HbXJUqBOyu-dUixgaPNlFfZhPqLibq_AeVju2JfbYfU", statusCol: 12, slipCol: 14 }, // ANAK_PUYUH_PEDAGING   -> Status=L(12), Slip URL=N(14)
  { id: "1mmB7bVyPvAE4SPSoQp5EiSQUGxa9XgbMg63U90lexHA", statusCol: 12, slipCol: 14 }, // TELUR_PUYUH_PENELUR   -> Status=L(12), Slip URL=N(14)
  { id: "1eiHYWxtkdOrf9FU_vvutbESskAY9klFtWtKpsFYbM_s", statusCol: 12, slipCol: 15 }, // ANAK_PUYUH_PENELUR    -> Status=L(12), Slip URL=O(15)
];
```

> ⚠️ Setiap sheet boleh mempunyai lajur tambahan (cth lajur "SERTAKAN BUKTI PEMBAYARAN" atau "STATUS" berasingan) yang menyebabkan offset berbeza antara produk — **jangan andaikan semua sheet ada struktur sama**. Sahkan header sebenar sebelum mengubah `statusCol`/`slipCol`.

---

## 🔍 `semakTempahan(ic)` — Logik Carian

1. Buang semua aksara bukan nombor dari IC input (`ic.replace(/\D/g, '')`).
2. Untuk setiap entri dalam `SPREADSHEETS`:
   - Buka spreadsheet (`SpreadsheetApp.openById`), ambil sheet pertama (`getSheets()[0]`).
   - Baca semua data (`getDataRange().getValues()`), skip baris header.
   - Padankan lajur IC (`COL.IC`) dengan IC input (selepas dibuang aksara bukan nombor).
   - Jika padan, push objek hasil (lihat struktur JSON di atas) ke `results`.
   - Ralat akses sheet (cth permission) di-`catch` dan log — sheet tersebut dilangkau, tidak menggagalkan keseluruhan carian.
3. Pulangkan `results` (array, boleh kosong jika tiada padanan).

---

## 📱 PWA — `manifest.json` & `sw.js`

### `manifest.json`
- `start_url: "./index.html"` — **wajib huruf kecil**, padan dengan fail root GitHub Pages.
- `display: "standalone"` — buka tanpa UI pelayar bila dipasang.
- `icons` — `icon-192.png` (192×192) dan `icon-512.png` (512×512), `purpose: "any maskable"`.

### `sw.js` — Strategi Cache
- **Network-first** untuk request ke `script.google.com` (data semakan sentiasa terkini; fallback JSON `{ok:false, error:'offline'}` jika gagal).
- **Cache-first** untuk shell statik (`index.html`, `manifest.json`, ikon) — fallback ke `index.html` jika offline dan fail tidak dalam cache.
- `CACHE_NAME` (cth `stpu-cache-v3`) — **naikkan versi** setiap kali `ASSETS_TO_CACHE` atau fail yang di-cache berubah, supaya `activate` event membersihkan cache lama.

---

## 🔧 `clasp` — Sync Repo ↔ Apps Script

| Fail | Konfigurasi |
| :--- | :--- |
| `.clasp.json` | `scriptId` projek Apps Script S.T.P.U, `rootDir: "."` |
| `.claspignore` | `**/**` (ignore semua) kecuali `!Code.gs` dan `!appsscript.json` |

```bash
clasp push --force   # hantar Code.gs + appsscript.json ke Apps Script Editor
```
Selepas `clasp push`, kod di Apps Script Editor terkini — tetapi **deployment `/exec` tidak auto-update**. Perlu **Deploy → Manage deployments → Edit → New version → Deploy** secara manual untuk kod baru berkuat kuasa di `/exec`.

---

## ⚠️ Isu Diketahui

- Sesetengah rekod tempahan lama (sebelum sistem "diproperkan") mempunyai ralat trigger emel `Invalid email: <<Email Address>>` pada skrip merge-dokumen berasingan (bukan sebahagian repo ini). Slip PDF tetap berjaya dijana (`slipUrl` terisi); hanya notifikasi emel automatik yang gagal untuk rekod tersebut. Tempahan baru (selepas sistem terkini) tidak terjejas.
