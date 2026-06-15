# 🚀 Panduan Pemasangan dan Penyebaran (Deployment)

Dokumen ini menyediakan panduan langkah demi langkah untuk meluncurkan Sistem Tempahan Produk Unggas (S.T.P.U) menggunakan ekosistem Google Drive anda.

---

## 📋 Keperluan Asas
Sebelum bermula, pastikan anda mempunyai:
1. Akaun Google (Google Workspace atau Gmail peribadi).
2. **6 fail Google Sheets** yang dijana daripada Borang Google (Google Forms) bagi setiap produk.
3. Akses kepada pemacu Google Drive untuk menyemak ID fail.

---

## 🛠️ Langkah demi Langkah

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

### Langkah 2: Cipta Projek Google Apps Script
1. Layari [Google Apps Script Dashboard](https://script.google.com/).
2. Klik **New Project** dan namakan projek sebagai `S.T.P.U Backend`.
3. Padam sebarang kod sedia ada di dalam fail `Code.gs` dan gantikan dengan kandungan fail `Code.gs` daripada repositori ini.
4. Kemas kini senarai `SPREADSHEETS` pada baris awal kod dengan memasukkan ID spreadsheet sebenar anda beserta nombor indeks kolum bagi **Status** dan **Slip** (1-based index, contoh: Kolum M = 13).

### Langkah 3: Cipta Fail HTML Antaramuka
1. Di dalam editor Google Apps Script, klik butang **+** (Add a file) di sebelah kiri.
2. Pilih **HTML** dan namakan fail tersebut sebagai `Index` (Rujuk fail `index.html` dalam repositori ini).
3. Salin keseluruhan kod dari fail `index.html` repositori dan tampalkan (*paste*) ke dalam fail baru tersebut.
4. *Pilihan:* Tukar pautan Google Forms pada fungsi `onclick="bukaTempahan(...)"` dalam fail HTML kepada pautan borang rasmi anda.

### Langkah 4: Lancarkan Aplikasi Web (Deployment)
1. Klik butang **Deploy** di bahagian atas kanan editor, kemudian pilih **New deployment**.
2. Klik ikon *Gear* (Select type) dan pilih **Web app**.
3. Tetapkan konfigurasi berikut:
   * **Description**: `S.T.P.U Versi 1.0`
   * **Execute as**: `Me (emel-anda@gmail.com)` *(Penting supaya skrip boleh membaca data spreadsheet anda)*
   * **Who has access**: `Anyone` *(Supaya orang awam boleh mengakses laman semakan)*
4. Klik **Deploy**.
5. Google akan meminta kebenaran (*Authorization*). Klik **Authorize Access**, pilih akaun Google anda, klik **Advanced**, dan pilih **Go to S.T.P.U Backend (unsafe)** untuk membenarkan skrip berjalan.
6. Salin **Web app URL** yang diberikan. URL inilah yang akan disebarkan kepada pengguna/pelanggan.

---

## 🔍 Log Ralat & Diagnostik
Jika sistem gagal memaparkan keputusan atau sangkut pada fasa *loading*:
* Buka **Apps Script** ──► Menu **Executions** di bar sisi kiri untuk melihat log ralat rantaian data.
* Pastikan tiada format nombor IC yang lari (kod secara automatik membuang aksara sempang `-` semasa proses padanan).
* Pastikan akaun pelaksana aplikasi mempunyai hak akses "Editor" atau "Viewer" pada kesemua 6 fail spreadsheet produk.