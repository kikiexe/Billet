# Billet

Billet adalah protokol smart ticketing on-chain berbasis standar ERC-1155 yang dirancang dengan mekanisme trustless escrow dan restriksi ekonomi untuk mitigasi scalping tiket. Protokol ini menciptakan ekosistem tertutup yang memungkinkan penyelenggara acara untuk menentukan batas atas harga jual kembali (price ceiling) secara dinamis, mengotomatiskan pembagian royalti, dan melakukan verifikasi identitas (KTP) pada gerbang masuk secara on-chain. Sistem ini berjalan di atas jaringan Layer 2 (Base) untuk memastikan efisiensi biaya transaksi.

## Prasyarat

Sebelum menjalankan proyek ini, pastikan sistem Anda telah memiliki instalasi perangkat lunak berikut:
- Git
- Node.js (direkomendasikan versi 18 atau lebih baru)
- npm
- Foundry (Forge, Cast, Anvil, Chisel)

## Cara Clone Proyek

Gunakan perintah berikut pada terminal untuk melakukan clone repositori ini ke dalam mesin lokal Anda:

```bash
git clone https://github.com/kikiexe/Billet.git
cd Billet
```
*(Catatan: Sesuaikan URL repositori dengan URL yang sebenarnya jika berbeda).*

## Struktur Proyek

Proyek ini terdiri dari tiga bagian utama:
1. **contracts**: Berisi implementasi smart contract berbasis Solidity menggunakan framework Foundry.
2. **indexer**: Layanan indexer menggunakan Ponder untuk membaca dan mengindeks data dari blockchain.
3. **frontend**: Aplikasi antarmuka pengguna (User Interface) berbasis Next.js.

## Cara Menjalankan Proyek

### 1. Smart Contracts

Direktori `contracts` mengelola logika on-chain.

```bash
cd contracts
# Menginstal dependensi Foundry
forge install

# Melakukan kompilasi smart contract
forge build

# Menjalankan pengujian (unit testing)
forge test
```
*Catatan: Konfigurasi env seperti rpc URL dan private key dapat diatur pada file `.env` di dalam direktori `contracts` sebelum proses deployment menggunakan script.*

### 2. Indexer

Direktori `indexer` menangani proses indexing event blockchain.

```bash
cd indexer
# Menginstal dependensi NPM
npm install

# Menyalin file konfigurasi env
cp .env.local.example .env.local
# (Silakan isi parameter di dalam file .env.local sesuai dengan konfigurasi blockchain yang Anda tuju)

# Menjalankan indexer di mode development
npm run dev
```

### 3. Frontend

Direktori `frontend` adalah aplikasi berbasis Next.js.

```bash
cd frontend
# Menginstal dependensi NPM
npm install

# Menyiapkan konfigurasi env jika diperlukan (misal: menyalin dari .env.example)
# cp .env.example .env

# Menjalankan server development frontend
npm run dev
```

Aplikasi frontend akan dapat diakses secara default melalui `http://localhost:3000`.
