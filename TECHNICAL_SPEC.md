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
  Code.gs         - doGet(e), handleSemak_(e), semakTempahan(ic),
                    resolveColIndex_(), formatTimestamp_(), debugHeaders()
  appsscript.json - manifest projek (timezone, webapp access)
```

`index.html` adalah **satu-satunya** sumber UI. Apps Script `/exec` **tidak lagi** menyajikan HTML penuh — ia hanya:
1. `?action=semak&ic=xxxxx` → JSON API
2. Tanpa parameter → redirect ke GitHub Pages

### Konfigurasi (pemalar di atas `Code.gs`)

| Pemalar | Default | Fungsi |
| :--- | :---: | :--- |
| `CACHE_SECONDS` | `30` | Tempoh cache hasil semakan (saat). `0` = matikan cache. Naikkan untuk jimat kuota; kurangkan untuk status lebih real-time. |
| `AUTO_DETECT_COLS` | `true` | Auto-detect lajur Status/Slip ikut nama header. Kalau `false`, guna `statusCol`/`slipCol` tetap sahaja. |
| `IC_LENGTH` | `12` | Panjang IC sah (selepas buang aksara bukan nombor). |
| `PWA_URL` | `stpuitu.github.io/tempah/` | Sasaran redirect bila `/exec` dipanggil tanpa parameter. |

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

## 📡 `doGet(e)` / `handleSemak_(e)` — Apps Script API

`doGet` hanya rute; logik semakan diasingkan ke `handleSemak_` yang **sentiasa
pulangkan JSON** (walau ralat) supaya `res.json()` di frontend tak pecah.

```javascript
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'semak') return handleSemak_(e);

  return HtmlService.createHtmlOutput(
      '<script>window.top.location.href="' + PWA_URL + '";</script>' +
      '<p>Mengalihkan ke <a href="' + PWA_URL + '">' + PWA_URL + '</a>...</p>'
  );
}

function handleSemak_(e) {
  try {
    const icRaw = ((e.parameter && e.parameter.ic) || '').toString().replace(/\D/g, '');

    // Validasi server-side: IC mesti tepat 12 digit.
    // Tanpa ini, ?ic= kosong akan padan baris IC kosong -> dump data.
    if (icRaw.length !== IC_LENGTH) {
      return jsonOutput_({ ok: false, error: 'IC tidak sah', results: [] });
    }

    return jsonOutput_({ ok: true, results: semakTempahan(icRaw) });
  } catch (err) {
    Logger.log('handleSemak_ error: ' + err);
    return jsonOutput_({ ok: false, error: 'ralat pelayan', results: [] });
  }
}
```

**Respons JSON — berjaya** (`?action=semak&ic=xxxxxxxxxxxx`):
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

**Respons JSON — ralat / IC tak sah** (IC bukan 12 digit, atau ralat pelayan):
```json
{ "ok": false, "error": "IC tidak sah", "results": [] }
```

> Frontend patut semak `data.ok` dahulu, dan hanya panggil `paparHasil(data.results)`
> bila `ok === true`. Bila `ok === false`, papar mesej ralat/tiada rekod.

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

> ℹ️ **Sejak penambahbaikan kestabilan:** bila `AUTO_DETECT_COLS = true`, indeks lajur
> Status/Slip ditentukan secara automatik ikut **nama header** (`resolveColIndex_`) —
> `statusCol`/`slipCol` di bawah kini bertindak sebagai **fallback** sahaja bila header
> padanan tak dijumpai. Ini melindungi sistem bila borang tambah lajur baru (offset
> berubah tanpa perlu edit kod). Jalankan `debugHeaders()` untuk sahkan padanan.

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

1. Buang aksara bukan nombor dari IC (`ic.replace(/\D/g, '')`).
2. **Guard IC:** jika bukan tepat `IC_LENGTH` (12) digit, terus pulangkan `[]` —
   elak IC kosong/separa padan baris IC kosong (lapisan pertahanan kedua selepas
   validasi di `handleSemak_`).
3. **Cache:** jika `CACHE_SECONDS > 0`, semak `CacheService` (kunci `ic_<12digit>`).
   Kalau ada, pulangkan terus tanpa baca sheet.
4. Untuk setiap entri dalam `SPREADSHEETS`:
   - Buka spreadsheet (`SpreadsheetApp.openById`), ambil sheet pertama (`getSheets()[0]`).
   - Baca semua data (`getDataRange().getValues()`); langkau jika hanya ada header/kosong.
   - Tentukan `statusIdx`/`slipIdx` guna `resolveColIndex_(headers, ...)` — auto-detect
     ikut header, fallback ke `statusCol`/`slipCol`.
   - Padankan lajur IC (`COL.IC`) dengan IC input.
   - Jika padan, push objek hasil ke `results`. `timestamp` diformat melalui
     `formatTimestamp_()` yang dibalut `try/catch` — satu tarikh rosak **tidak lagi**
     membuang keseluruhan hasil sheet (sebelum ni `catch` per-sheet buang semua).
   - Ralat akses sheet (cth permission) di-`catch` dan log — sheet dilangkau, tidak
     menggagalkan carian penuh.
5. Simpan `results` ke cache (jika diaktifkan), kemudian pulangkan (array, boleh kosong).

### Helper berkaitan

- **`resolveColIndex_(headers, candidates, fallbackCol)`** — cari indeks lajur (0-based)
  ikut senarai substring header (contoh `['STATUS TEMPAHAN']`, `['SLIP TEMPAHAN', 'MERGED DOC']`)
  mengikut keutamaan. Padanan case-insensitive. Kembali `fallbackCol - 1` jika tak jumpa
  (atau `AUTO_DETECT_COLS = false`), atau `-1` jika langsung tiada.
- **`formatTimestamp_(val)`** — format tarikh `dd/MM/yyyy HH:mm` ikut zon skrip; kalau
  nilai tak boleh di-parse, pulangkan nilai mentah sebagai string (tak throw).

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

## 🩺 Diagnostik — `debugHeaders()`

Fungsi bantuan untuk penyelenggaraan. Jalankan **manual** dari editor Apps Script
(pilih `debugHeaders` → **Run** → lihat **Executions / Logs**). Ia log:

- Nama setiap spreadsheet + senarai header (dengan indeks 0-based).
- `statusIdx` / `slipIdx` yang di-*resolve* (auto-detect atau fallback).

Guna ini untuk **sahkan pemetaan lajur** setiap kali borang berubah, atau bila
memutuskan sama ada nak kekalkan `AUTO_DETECT_COLS = true`. Jika mana-mana sheet
ada header ambiguous (cth dua lajur mengandungi "STATUS"), semak output — jika
auto-detect tersalah pilih, set `AUTO_DETECT_COLS = false` dan bergantung pada
`statusCol`/`slipCol` yang disahkan manual.

---

## ⚠️ Isu Diketahui

- Sesetengah rekod tempahan lama (sebelum sistem "diproperkan") mempunyai ralat trigger emel `Invalid email: <<Email Address>>` pada skrip merge-dokumen berasingan (bukan sebahagian repo ini). Slip PDF tetap berjaya dijana (`slipUrl` terisi); hanya notifikasi emel automatik yang gagal untuk rekod tersebut. Tempahan baru (selepas sistem terkini) tidak terjejas.