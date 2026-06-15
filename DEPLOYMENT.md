# 🚀 Panduan Pemasangan dan Penyebaran (Deployment)

Dokumen ini menerangkan cara menyebarkan Sistem Tempahan Produk Unggas (S.T.P.U), yang terdiri daripada **dua bahagian**:

1. **PWA / Antara muka utama** — dihoskan di **GitHub Pages** (`stpuitu.github.io/tempah`), fail `index.html` + `manifest.json` + `sw.js` + ikon.
2. **API Backend** — dihoskan di **Google Apps Script** (`/exec`), fail `Code.gs` + `appsscript.json`. Hanya menyediakan endpoint `?action=semak&ic=xxxxx` dan redirect ke GitHub Pages.

---

## 📋 Keperluan Asas

1. Akaun Google (untuk Apps Script & Google Sheets).
2. Akaun GitHub dengan repo + GitHub Pages diaktifkan.
3. **6 fail Google Sheets** yang dijana daripada Borang Google (Google Forms) bagi setiap produk.
4. (Pilihan) [Node.js](https://nodejs.org/) + [clasp](https://github.com/google/clasp) untuk sync `Code.gs` terus dari repo ke Apps Script tanpa copy-paste manual.

---

## 🅰️ Bahagian A — PWA (GitHub Pages)

### Langkah 1: Aktifkan GitHub Pages
1. Di repo GitHub, pergi ke **Settings → Pages**.
2. Pilih branch `main` dan folder root (`/`) sebagai sumber.
3. URL akan tersedia di `https://<username>.github.io/<repo>/`.

### Langkah 2: Pastikan fail-fail berikut wujud di root repo
- `index.html` — **mesti huruf kecil**, ini default document yang GitHub Pages perlukan untuk root URL.
- `manifest.json` — `start_url` mesti menunjuk ke `./index.html`.
- `sw.js` — service worker; `ASSETS_TO_CACHE` mesti senaraikan `./index.html` (bukan `Index.html`).
- `icon-192.png`, `icon-512.png` — ikon PWA.

> ⚠️ **Amaran case-sensitivity**: GitHub Pages memerlukan `index.html` (huruf kecil tepat) untuk root URL. Jangan rename ke `Index.html` — ini akan menyebabkan ralat 404 selepas cache dikosongkan.

### Langkah 3: Sahkan `EXEC_URL` dalam `index.html`
Dalam fungsi `cariTempahan()` di `index.html`, pastikan pemboleh ubah `EXEC_URL` menunjuk ke URL deployment Apps Script `/exec` yang betul (lihat Bahagian B).

### Langkah 4: PWA Install
Selepas dilawat melalui HTTPS, pelawat boleh "Add to Home Screen" / "Install" dari menu pelayar (Chrome, Edge, Safari) untuk memasang S.T.P.U sebagai aplikasi.

---

## 🅱️ Bahagian B — API Backend (Google Apps Script)

### Langkah 1: Sediakan Google Sheets & Dapatkan ID
1. Buka setiap fail Google Sheets bagi produk unggas anda.
2. Ambil **ID Spreadsheet** daripada URL pelayar anda.
   * *Contoh URL:* `https://docs.google.com/spreadsheets/d/131xIA9dGUmNc6CrWN-4R7N6t4f-bZQ9jSwx0pdzjMHg/edit`
   * *ID Fail:* `131xIA9dGUmNc6CrWN-4R7N6t4f-bZQ9jSwx0pdzjMHg`
3. Pastikan struktur susunan kolum standard (0-based index) dalam borang anda adalah seperti berikut:
   * Kolum A: Timestamp (`0`)
   * Kolum B: Email (`1`)
   * Kolum C: Nama (`2`)
   * Kolum D: IC (`3`)
   * Kolum E: Tel (`4`)
   * Kolum F: Alamat (`5`)
   * Kolum G: Produk (`6`)
   * Kolum H: Kuantiti (`7`)
   * Kolum I: Nota (`8`)
4. Kemas kini senarai `SPREADSHEETS` dalam `Code.gs` dengan ID sebenar serta `statusCol`/`slipCol` (nombor lajur 1-based, cth Kolum M = 13) bagi setiap produk.

### Langkah 2: Cipta / Kemaskini Projek Google Apps Script

**Cara A — Manual (copy-paste):**
1. Layari [Google Apps Script Dashboard](https://script.google.com/).
2. Klik **New Project**, namakan `S.T.P.U Backend`.
3. Padam kod sedia ada dalam `Code.gs`, gantikan dengan kandungan `Code.gs` daripada repo ini.
4. Tambah fail `appsscript.json` (Project Settings → tunjukkan fail manifest) dengan kandungan dari repo ini.

**Cara B — Automatik dengan `clasp` (disyorkan):**
```bash
npm install -g @google/clasp
clasp login
# Dalam folder repo, .clasp.json sudah mengandungi scriptId projek
clasp push --force
```
`.claspignore` dikonfigurasi untuk hanya push `Code.gs` dan `appsscript.json` — fail PWA (`index.html`, `manifest.json`, `sw.js`, ikon) **tidak** dihantar ke Apps Script.

### Langkah 3: Lancarkan / Kemaskini Web App (Deployment)
1. Klik **Deploy → Manage deployments**.
2. Jika deployment sedia ada: klik ikon pensel (**Edit**) → **Version: New version** → **Deploy**. (URL `/exec` kekal sama.)
3. Jika deployment baru:
   * Klik **New deployment** → ikon *Gear* → **Web app**.
   * **Execute as**: `Me (emel-anda@gmail.com)`
   * **Who has access**: `Anyone`
   * Klik **Deploy**, kemudian **Authorize Access** mengikut arahan.
4. Salin **Web app URL** (`/exec`) dan kemas kini pemboleh ubah `EXEC_URL` dalam `index.html` (Bahagian A, Langkah 3) jika berbeza.

### Apa yang `/exec` lakukan sekarang
- `/exec?action=semak&ic=xxxxx` → return JSON `{ ok: true, results: [...] }` (dipanggil oleh `index.html` melalui `fetch()`).
- `/exec` (tanpa parameter) → redirect automatik ke `https://stpuitu.github.io/tempah/`.

---

## 🔄 Aliran Kerja Penyelenggaraan

Selepas setup awal, untuk membuat perubahan:

| Perubahan pada | Tindakan |
| :--- | :--- |
| `index.html`, `manifest.json`, `sw.js`, ikon (PWA) | `git push` — GitHub Pages auto-rebuild dalam 1-2 minit. |
| `Code.gs`, `appsscript.json` (API) | `git push` + `clasp push --force`, kemudian **Deploy → New version** di Apps Script Editor. |
| Kedua-dua | Lakukan kedua-duanya secara berasingan seperti di atas. |

> 💡 Service worker (`sw.js`) menggunakan `CACHE_NAME` bervariasi (cth `stpu-cache-v3`). Jika membuat perubahan besar pada fail yang di-cache, naikkan versi `CACHE_NAME` supaya pengguna sedia ada menerima kemas kini.

---

## 🔍 Log Ralat & Diagnostik

* Buka **Apps Script** → menu **Executions** di bar sisi kiri untuk melihat log ralat `semakTempahan` / `doGet`.
* Pastikan tiada format nombor IC yang lari (kod secara automatik membuang aksara sempang `-` semasa proses padanan).
* Pastikan akaun pelaksana aplikasi mempunyai hak akses "Editor" atau "Viewer" pada kesemua 6 fail spreadsheet produk.
* Jika `stpuitu.github.io/tempah` menunjukkan **404**: sahkan fail `index.html` (huruf kecil) wujud di root repo dan GitHub Pages telah selesai rebuild.
* Jika "Semak Status Tempahan" menunjukkan "Ralat semasa mencari": sahkan `EXEC_URL` dalam `index.html` betul dan deployment Apps Script telah di-**Deploy → New version** selepas sebarang perubahan `Code.gs`.
