# 05 — Implementasi Web3 Indexer (Ponder)

> Stack: Ponder v0.8+ · TypeScript · Viem · GraphQL · Base L2

---

## 5.1 Mengapa Membutuhkan Indexer?

Smart contract Ethereum (termasuk Base L2) menyimpan data dalam bentuk `mapping` dan `storage slot` — **bukan** dalam bentuk tabel relasional yang bisa di-*query* secara fleksibel. Ini menimbulkan tiga masalah kritis bagi frontend:

| Masalah | Penjelasan | Dampak |
|---------|------------|--------|
| **Tidak Bisa Looping** | `mapping(uint256 => Listing)` tidak bisa di-iterasi dari luar. Frontend harus tahu `listingId` secara eksplisit untuk membaca data. | Mustahil menampilkan "Semua Tiket Aktif" tanpa mengetahui semua ID. |
| **Out-of-Gas / Rate Limit** | Memanggil `getListing(0)`, `getListing(1)`, ... `getListing(999)` secara berurutan akan menghabiskan kuota RPC (Alchemy/Infura) dan membuat website sangat lambat. | UX buruk, loading >10 detik. |
| **Tidak Ada Filter/Sort** | RPC hanya bisa membaca per-slot. Query kompleks seperti *"Tiket VIP aktif, harga < Rp500.000, urut termurah"* mustahil dilakukan langsung dari blockchain. | Fitur pencarian/filter tidak bisa dibangun. |

**Solusi: Ponder** — Web3 Indexer modern yang mendengarkan *events* dari smart contract, membangun database lokal, dan mengekspos **GraphQL API** yang bisa di-*query* oleh frontend secara instan.

---

## 5.2 Mengapa Ponder, Bukan The Graph?

| Kriteria | **Ponder** ✅ | **The Graph** |
|----------|--------------|---------------|
| Bahasa | 100% TypeScript (Viem native) | AssemblyScript (subset WebAssembly) |
| Setup | `npm create ponder` — langsung jalan | Perlu deploy Subgraph ke hosted/decentralized network |
| Hot Reload | ✅ Auto-reload saat file berubah | ❌ Harus re-deploy subgraph |
| Kompatibilitas ABI | Langsung pakai `.json` dari Foundry `out/` | Perlu konversi format ABI |
| Cocok untuk Skripsi | ✅ Lokal, cepat, mudah debug | Overkill untuk PoC/skripsi |
| Biaya | Gratis (self-hosted) | Perlu GRT token untuk query di production |

---

## 5.3 Arsitektur Alur Data

```mermaid
sequenceDiagram
    participant SC as Smart Contract (Base L2)
    participant P as Ponder Indexer
    participant DB as SQLite/PostgreSQL
    participant FE as Frontend (Next.js)

    SC->>P: Emit Event (TicketListed, TicketSold, dll.)
    P->>P: Event Handler memproses data
    P->>DB: Simpan/Update record di database
    FE->>P: GraphQL Query (GET /graphql)
    P->>DB: Baca data dari database
    DB-->>P: Return hasil query
    P-->>FE: Response JSON (listings, tickets, stats)
    FE-->>FE: Render UI dengan data real-time
```

**Alur ringkas:**
1. Smart contract memancarkan **event** setiap kali terjadi transaksi (listing, pembelian, pembatalan).
2. Ponder **mendengarkan** event tersebut melalui RPC WebSocket/HTTP.
3. Event handler **memproses** dan **menyimpan** data ke database lokal.
4. Frontend **mengambil** data melalui **GraphQL API** yang otomatis dibuat oleh Ponder.

---

## 5.4 Event yang Diindeks

Ponder akan mendengarkan **4 event** dari dua smart contract:

### Dari `TicketMarketplace.sol`

| Event | Kapan Dipancarkan | Data yang Dibawa |
|-------|-------------------|------------------|
| `TicketListed` | Saat tiket didaftarkan (primary/resale) | `listingId`, `seller`, `tokenId`, `amount`, `pricePerUnit`, `isResale` |
| `TicketSold` | Saat tiket berhasil dibeli | `listingId`, `buyer`, `amount`, `totalPrice` |
| `ListingCancelled` | Saat seller membatalkan listing | `listingId`, `seller` |

### Dari `TicketNFT.sol`

| Event | Kapan Dipancarkan | Data yang Dibawa |
|-------|-------------------|------------------|
| `TicketCheckedIn` | Saat gatekeeper melakukan check-in tiket di gerbang | `from`, `tokenId`, `index` |

---

## 5.5 Setup Proyek Ponder

### 5.5.1 Inisialisasi

```bash
# Dari root monorepo (billet-monorepo/)
cd indexer

# Inisialisasi project Ponder baru
npm create ponder@latest ./

# Pilih opsi:
# - Template: Empty
# - Package manager: npm
```

### 5.5.2 Struktur Folder Indexer

Setelah inisialisasi, struktur folder `indexer/` akan terlihat seperti ini:

```text
indexer/
├── ponder.config.ts          # Konfigurasi RPC, alamat kontrak, ABI
├── ponder.schema.ts          # Definisi tabel database (schema GraphQL)
├── src/
│   ├── TicketMarketplace.ts  # Event handlers untuk Marketplace
│   └── TicketNFT.ts          # Event handlers untuk TicketNFT
├── abis/
│   ├── TicketMarketplace.json # ABI hasil kompilasi Foundry
│   └── TicketNFT.json         # ABI hasil kompilasi Foundry
├── .env.local                 # Environment variables (RPC URL)
├── package.json
└── tsconfig.json
```

### 5.5.3 Install Dependencies

```bash
cd indexer
npm install
```

### 5.5.4 Salin ABI dari Foundry

ABI (Application Binary Interface) dibutuhkan Ponder untuk mengenali event dan fungsi smart contract. Salin file ABI dari hasil kompilasi Foundry:

```bash
# Dari root monorepo
mkdir -p indexer/abis

# Salin ABI TicketMarketplace
cp contracts/out/TicketMarketplace.sol/TicketMarketplace.json indexer/abis/

# Salin ABI TicketNFT
cp contracts/out/TicketNFT.sol/TicketNFT.json indexer/abis/
```

> 💡 **Tips:** Anda bisa menambahkan perintah ini ke dalam file `sync-abi.sh` yang sudah ada di root monorepo agar sinkronisasi ABI ke indexer juga otomatis.

**Update `sync-abi.sh`:**

```bash
#!/bin/bash

echo "Memulai kompilasi Smart Contract..."
cd contracts && forge build
cd ..

echo "Menyinkronkan ABI ke Frontend..."
mkdir -p frontend/src/config/abi
cp contracts/out/TicketMarketplace.sol/TicketMarketplace.json frontend/src/config/abi/
cp contracts/out/TicketNFT.sol/TicketNFT.json frontend/src/config/abi/

echo "Menyinkronkan ABI ke Indexer..."
mkdir -p indexer/abis
cp contracts/out/TicketMarketplace.sol/TicketMarketplace.json indexer/abis/
cp contracts/out/TicketNFT.sol/TicketNFT.json indexer/abis/

echo "Sinkronisasi ABI selesai! ✨"
```

---

## 5.6 Konfigurasi Ponder (`ponder.config.ts`)

File ini adalah **jantung** dari indexer. Di sini Anda mendefinisikan:
- Jaringan blockchain yang digunakan (Base Sepolia / Base Mainnet)
- Alamat smart contract yang akan diindeks
- ABI yang digunakan untuk mendekode event
- Block mulai indexing (agar tidak perlu scan dari genesis block)

```typescript
// indexer/ponder.config.ts
import { createConfig } from "ponder";
import { http } from "viem";

import TicketMarketplaceAbi from "./abis/TicketMarketplace.json";
import TicketNFTAbi from "./abis/TicketNFT.json";

export default createConfig({
  networks: {
    baseSepolia: {
      chainId: 84532,
      transport: http(process.env.PONDER_RPC_URL_84532),
    },
    // Uncomment untuk produksi Base Mainnet:
    // base: {
    //   chainId: 8453,
    //   transport: http(process.env.PONDER_RPC_URL_8453),
    // },
  },
  contracts: {
    TicketMarketplace: {
      network: "baseSepolia",
      abi: TicketMarketplaceAbi.abi,
      address: "0xYOUR_MARKETPLACE_CONTRACT_ADDRESS",
      startBlock: 12345678,  // Block number saat contract di-deploy
    },
    TicketNFT: {
      network: "baseSepolia",
      abi: TicketNFTAbi.abi,
      address: "0xYOUR_TICKET_NFT_CONTRACT_ADDRESS",
      startBlock: 12345678,  // Block number saat contract di-deploy
    },
  },
});
```

### Penjelasan Parameter Penting

| Parameter | Penjelasan |
|-----------|------------|
| `chainId` | ID jaringan blockchain. Base Sepolia = `84532`, Base Mainnet = `8453` |
| `transport` | Koneksi RPC. Gunakan URL dari Alchemy, Infura, atau public RPC Base. |
| `address` | Alamat smart contract yang sudah di-deploy (hasil dari `Deploy.s.sol`). |
| `startBlock` | Nomor block saat contract pertama kali di-deploy. Ponder mulai indexing dari block ini, **bukan** dari genesis block (block 0), sehingga proses sinkronisasi awal jauh lebih cepat. |

### 5.6.1 Environment Variables (`.env.local`)

```env
# RPC URL untuk Base Sepolia (dari Alchemy/Infura/Public)
PONDER_RPC_URL_84532=https://base-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# (Opsional) Untuk Base Mainnet
# PONDER_RPC_URL_8453=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
```

> ⚠️ **Jangan commit `.env.local` ke Git!** Tambahkan ke `.gitignore`.

---

## 5.7 Definisi Schema (`ponder.schema.ts`)

Schema mendefinisikan **tabel database** yang akan dibuat oleh Ponder. Setiap tabel secara otomatis menghasilkan **GraphQL type** yang bisa di-query oleh frontend.

```typescript
// indexer/ponder.schema.ts
import { onchainTable, index } from "ponder";

// ─── Tabel Listing Tiket ────────────────────────────────────────────────────

/**
 * Menyimpan semua listing tiket (primary + resale).
 * Ini adalah tabel utama yang dibaca oleh halaman "Daftar Tiket" di frontend.
 */
export const listing = onchainTable("listing", (t) => ({
  // Primary Key: listingId dari smart contract
  id: t.text().primaryKey(),

  // Data dari event TicketListed
  seller: t.text().notNull(),
  tokenId: t.bigint().notNull(),
  amount: t.bigint().notNull(),
  pricePerUnit: t.bigint().notNull(),
  isResale: t.boolean().notNull(),

  // Status listing (diupdate saat TicketSold / ListingCancelled)
  active: t.boolean().notNull().default(true),

  // Metadata tambahan
  createdAt: t.bigint().notNull(),       // block.timestamp saat listing dibuat
  blockNumber: t.bigint().notNull(),      // block number untuk referensi
}), (table) => ({
  // Index untuk mempercepat query filter
  activeIdx: index().on(table.active),
  tokenIdIdx: index().on(table.tokenId),
  sellerIdx: index().on(table.seller),
}));

// ─── Tabel Penjualan Tiket ──────────────────────────────────────────────────

/**
 * Menyimpan riwayat transaksi pembelian tiket.
 * Berguna untuk halaman "Riwayat Transaksi" dan analitik dashboard.
 */
export const sale = onchainTable("sale", (t) => ({
  // Primary Key: kombinasi listingId + buyer + txHash untuk keunikan
  id: t.text().primaryKey(),

  listingId: t.text().notNull(),
  buyer: t.text().notNull(),
  amount: t.bigint().notNull(),
  totalPrice: t.bigint().notNull(),

  // Metadata
  soldAt: t.bigint().notNull(),          // block.timestamp saat terjual
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
}), (table) => ({
  buyerIdx: index().on(table.buyer),
  listingIdIdx: index().on(table.listingId),
}));

// ─── Tabel Check-In Tiket ───────────────────────────────────────────────────

/**
 * Menyimpan riwayat check-in tiket di gerbang masuk.
 * Berguna untuk dashboard panitia dan statistik kehadiran.
 */
export const checkIn = onchainTable("check_in", (t) => ({
  // Primary Key: kombinasi dari + tokenId + index + txHash
  id: t.text().primaryKey(),

  holder: t.text().notNull(),           // address pemegang tiket
  tokenId: t.bigint().notNull(),
  holderIndex: t.bigint().notNull(),    // index di array TicketHolder

  // Metadata
  checkedInAt: t.bigint().notNull(),     // block.timestamp saat check-in
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
}), (table) => ({
  holderIdx: index().on(table.holder),
  tokenIdIdx: index().on(table.tokenId),
}));
```

### Penjelasan Desain Schema

1. **`listing`** — Tabel utama. Setiap kali event `TicketListed` dipancarkan, satu baris baru dibuat. Saat `TicketSold` terjadi, kolom `amount` dikurangi dan `active` diubah ke `false` jika habis. Saat `ListingCancelled`, `active` langsung `false`.

2. **`sale`** — Tabel riwayat. Mencatat setiap transaksi pembelian yang berhasil. Tidak pernah diupdate setelah dibuat (append-only log).

3. **`checkIn`** — Tabel check-in. Mencatat setiap aktivitas check-in di gerbang. Berguna untuk dashboard statistik panitia (*"Berapa persen pemegang tiket VIP yang sudah datang?"*).

---

## 5.8 Event Handlers (`src/`)

Event handlers adalah **fungsi TypeScript** yang dipanggil setiap kali Ponder mendeteksi event baru dari blockchain. Di sinilah logika transformasi data terjadi.

### 5.8.1 Handler TicketMarketplace

```typescript
// indexer/src/TicketMarketplace.ts
import { ponder } from "ponder:registry";
import { listing, sale } from "ponder:schema";

// ─── Handler: TicketListed ──────────────────────────────────────────────────

/**
 * Dipanggil setiap kali organizer/user mendaftarkan tiket untuk dijual.
 * Membuat record baru di tabel `listing`.
 */
ponder.on("TicketMarketplace:TicketListed", async ({ event, context }) => {
  const { db } = context;

  await db.insert(listing).values({
    id: event.args.listingId.toString(),
    seller: event.args.seller.toLowerCase(),
    tokenId: event.args.tokenId,
    amount: event.args.amount,
    pricePerUnit: event.args.pricePerUnit,
    isResale: event.args.isResale,
    active: true,
    createdAt: event.block.timestamp,
    blockNumber: event.block.number,
  });
});

// ─── Handler: TicketSold ────────────────────────────────────────────────────

/**
 * Dipanggil setiap kali tiket berhasil dibeli.
 * 1. Mencatat transaksi ke tabel `sale`.
 * 2. Mengupdate sisa amount dan status `active` di tabel `listing`.
 */
ponder.on("TicketMarketplace:TicketSold", async ({ event, context }) => {
  const { db } = context;

  // 1. Catat riwayat penjualan
  await db.insert(sale).values({
    id: `${event.args.listingId}-${event.transaction.hash}`,
    listingId: event.args.listingId.toString(),
    buyer: event.args.buyer.toLowerCase(),
    amount: event.args.amount,
    totalPrice: event.args.totalPrice,
    soldAt: event.block.timestamp,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });

  // 2. Update listing: kurangi amount, set inactive jika habis
  const currentListing = await db.find(listing, {
    id: event.args.listingId.toString(),
  });

  if (currentListing) {
    const remainingAmount = currentListing.amount - event.args.amount;
    await db
      .update(listing, { id: event.args.listingId.toString() })
      .set({
        amount: remainingAmount,
        active: remainingAmount > 0n,
      });
  }
});

// ─── Handler: ListingCancelled ──────────────────────────────────────────────

/**
 * Dipanggil saat seller membatalkan listing.
 * Mengubah status listing menjadi inactive.
 */
ponder.on("TicketMarketplace:ListingCancelled", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(listing, { id: event.args.listingId.toString() })
    .set({ active: false });
});
```

### 5.8.2 Handler TicketNFT

```typescript
// indexer/src/TicketNFT.ts
import { ponder } from "ponder:registry";
import { checkIn } from "ponder:schema";

// ─── Handler: TicketCheckedIn ───────────────────────────────────────────────

/**
 * Dipanggil saat gatekeeper melakukan check-in tiket pengunjung di gerbang.
 * Mencatat aktivitas check-in ke tabel `checkIn`.
 */
ponder.on("TicketNFT:TicketCheckedIn", async ({ event, context }) => {
  const { db } = context;

  await db.insert(checkIn).values({
    id: `${event.args.from}-${event.args.tokenId}-${event.args.index}-${event.transaction.hash}`,
    holder: event.args.from.toLowerCase(),
    tokenId: event.args.tokenId,
    holderIndex: event.args.index,
    checkedInAt: event.block.timestamp,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});
```

---

## 5.9 Menjalankan Ponder (Development)

### 5.9.1 Start Development Server

```bash
cd indexer

# Jalankan Ponder dalam mode development (hot-reload)
npm run dev
```

Ponder akan:
1. 🔄 Membaca `ponder.config.ts` untuk mengetahui kontrak target.
2. 📡 Terhubung ke RPC Base Sepolia via URL di `.env.local`.
3. 🧱 Mulai indexing dari `startBlock` yang dikonfigurasi.
4. 🗄️ Membuat database SQLite lokal (otomatis, di folder `.ponder/`).
5. 🚀 Mengekspos **GraphQL Playground** di `http://localhost:42069/graphql`.

### 5.9.2 Verifikasi Indexer Berjalan

Buka browser dan akses:
```
http://localhost:42069/graphql
```

Anda akan melihat **GraphQL Playground** interaktif yang bisa digunakan untuk menguji query.

---

## 5.10 Contoh GraphQL Queries

Setelah Ponder berjalan dan berhasil mengindeks data dari blockchain, berikut adalah contoh query yang bisa dilakukan oleh frontend:

### 5.10.1 Ambil Semua Listing Aktif

```graphql
query GetActiveListings {
  listings(
    where: { active: true }
    orderBy: "createdAt"
    orderDirection: "desc"
  ) {
    items {
      id
      seller
      tokenId
      amount
      pricePerUnit
      isResale
      createdAt
    }
  }
}
```

### 5.10.2 Filter Listing Berdasarkan Kategori Tiket

```graphql
query GetVIPListings {
  listings(
    where: {
      active: true
      tokenId: "2"
    }
    orderBy: "pricePerUnit"
    orderDirection: "asc"
  ) {
    items {
      id
      seller
      amount
      pricePerUnit
      isResale
    }
  }
}
```

### 5.10.3 Riwayat Pembelian User

```graphql
query GetUserPurchases($buyer: String!) {
  sales(
    where: { buyer: $buyer }
    orderBy: "soldAt"
    orderDirection: "desc"
  ) {
    items {
      id
      listingId
      amount
      totalPrice
      soldAt
      transactionHash
    }
  }
}
```

### 5.10.4 Statistik Check-In per Kategori Tiket

```graphql
query GetCheckInsByCategory($tokenId: BigInt!) {
  checkIns(
    where: { tokenId: $tokenId }
    orderBy: "checkedInAt"
    orderDirection: "desc"
  ) {
    items {
      id
      holder
      holderIndex
      checkedInAt
      transactionHash
    }
  }
}
```

### 5.10.5 Listing Resale Saja (Pasar Sekunder)

```graphql
query GetResaleListings {
  listings(
    where: {
      active: true
      isResale: true
    }
    orderBy: "pricePerUnit"
    orderDirection: "asc"
  ) {
    items {
      id
      seller
      tokenId
      amount
      pricePerUnit
      createdAt
    }
  }
}
```

---

## 5.11 Integrasi dengan Frontend (Next.js)

### 5.11.1 Konfigurasi GraphQL Client

Frontend Next.js perlu GraphQL client untuk berkomunikasi dengan Ponder. Gunakan `graphql-request` karena ringan dan mudah digunakan:

```bash
cd frontend
npm install graphql-request graphql
```

### 5.11.2 Setup GraphQL Client

```typescript
// frontend/src/config/ponder.ts
import { GraphQLClient } from "graphql-request";

// URL Ponder Indexer (development)
const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069/graphql";

export const ponderClient = new GraphQLClient(PONDER_URL);
```

### 5.11.3 Contoh Fetching Data di Page

```typescript
// frontend/src/app/events/page.tsx (contoh)
import { ponderClient } from "@/config/ponder";
import { gql } from "graphql-request";

const GET_ACTIVE_LISTINGS = gql`
  query GetActiveListings {
    listings(
      where: { active: true }
      orderBy: "createdAt"
      orderDirection: "desc"
    ) {
      items {
        id
        seller
        tokenId
        amount
        pricePerUnit
        isResale
        createdAt
      }
    }
  }
`;

export default async function EventsPage() {
  // Server-side fetch (Next.js App Router)
  const data = await ponderClient.request(GET_ACTIVE_LISTINGS);

  return (
    <div>
      {data.listings.items.map((listing) => (
        <TicketCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
```

### 5.11.4 Environment Variables Frontend

Tambahkan ke `frontend/.env`:

```env
# URL Ponder GraphQL API
NEXT_PUBLIC_PONDER_URL=http://localhost:42069/graphql
```

---

## 5.12 Deployment Ponder (Production)

### 5.12.1 Self-Hosted (VPS/Docker)

Untuk production, Ponder bisa di-deploy menggunakan Docker:

```dockerfile
# indexer/Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

# Ponder menggunakan port 42069 secara default
EXPOSE 42069

CMD ["npm", "run", "start"]
```

```bash
# Build dan jalankan
docker build -t billet-indexer .
docker run -d \
  -p 42069:42069 \
  -e PONDER_RPC_URL_84532=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY \
  --name billet-indexer \
  billet-indexer
```

### 5.12.2 Database PostgreSQL (Production)

Untuk production, ganti SQLite dengan PostgreSQL agar lebih robust:

```env
# indexer/.env.local (Production)
PONDER_RPC_URL_84532=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
DATABASE_URL=postgresql://user:password@localhost:5432/billet_indexer
```

Ponder secara otomatis mendeteksi `DATABASE_URL` dan beralih ke PostgreSQL.

### 5.12.3 Opsi Deployment Cloud

| Platform | Keterangan |
|----------|------------|
| **Railway** | One-click deploy, mendukung PostgreSQL built-in. Paling mudah. |
| **Render** | Free tier tersedia, cocok untuk PoC/skripsi. |
| **DigitalOcean Droplet** | Full control, cocok untuk production serius. |
| **Docker Compose** | Jalankan Ponder + PostgreSQL + Frontend sekaligus. |

---

## 5.13 Troubleshooting

### Masalah Umum

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| `Error: No events found` | `startBlock` terlalu tinggi atau alamat kontrak salah | Periksa block deployment di BaseScan dan sesuaikan `startBlock` di `ponder.config.ts` |
| `RPC rate limit exceeded` | Kuota RPC gratis habis | Upgrade plan di Alchemy/Infura, atau gunakan `maxRequestsPerSecond` di config |
| `Schema mismatch` | Schema berubah setelah indexing | Hapus folder `.ponder/` dan restart: `rm -rf .ponder && npm run dev` |
| `ABI decode error` | ABI tidak sinkron dengan kontrak deployed | Jalankan ulang `./sync-abi.sh` dan restart Ponder |
| Database locked | SQLite diakses oleh proses lain | Matikan semua instance Ponder, hapus `.ponder/`, restart |

### Tips Rate Limiting RPC

Jika RPC provider membatasi jumlah request, tambahkan konfigurasi rate limiting:

```typescript
// ponder.config.ts
networks: {
  baseSepolia: {
    chainId: 84532,
    transport: http(process.env.PONDER_RPC_URL_84532),
    maxRequestsPerSecond: 10,  // Batasi 10 request/detik
  },
},
```

---

## 5.14 Checklist Verifikasi Setup Indexer

Gunakan daftar periksa ini untuk memastikan indexer sudah terkonfigurasi dengan benar:

- [ ] **ABI tersalin** — File `TicketMarketplace.json` dan `TicketNFT.json` ada di folder `indexer/abis/`.
- [ ] **Alamat kontrak benar** — Alamat di `ponder.config.ts` sesuai dengan hasil deployment (`forge script`).
- [ ] **`startBlock` benar** — Nomor block >= block deployment kontrak (cek di BaseScan).
- [ ] **RPC URL valid** — `PONDER_RPC_URL_84532` di `.env.local` bisa diakses.
- [ ] **Ponder berjalan** — `npm run dev` tidak error, log menunjukkan "Indexing started".
- [ ] **GraphQL Playground aktif** — `http://localhost:42069/graphql` menampilkan playground.
- [ ] **Data terindeks** — Query `listings` mengembalikan data yang sesuai dengan transaksi on-chain.
- [ ] **Frontend terhubung** — `NEXT_PUBLIC_PONDER_URL` di frontend `.env` mengarah ke Ponder.

---

## 5.15 Diagram Hubungan Komponen Lengkap

```mermaid
graph TB
    subgraph Blockchain["🔗 Base L2 Blockchain"]
        SC1["TicketNFT.sol<br/>(ERC-1155)"]
        SC2["TicketMarketplace.sol<br/>(Escrow + Listing)"]
    end

    subgraph Indexer["📡 Ponder Indexer"]
        CFG["ponder.config.ts<br/>(RPC + Alamat Kontrak)"]
        SCH["ponder.schema.ts<br/>(Tabel: listing, sale, checkIn)"]
        H1["src/TicketMarketplace.ts<br/>(3 Event Handlers)"]
        H2["src/TicketNFT.ts<br/>(1 Event Handler)"]
        DB["SQLite / PostgreSQL"]
        GQL["GraphQL API<br/>:42069/graphql"]
    end

    subgraph Frontend["🖥️ Next.js Frontend"]
        PC["config/ponder.ts<br/>(GraphQL Client)"]
        PG["app/events/page.tsx<br/>(Daftar Tiket)"]
        MK["app/marketplace/page.tsx<br/>(Pasar Sekunder)"]
    end

    SC1 -- "emit TicketCheckedIn" --> H2
    SC2 -- "emit TicketListed" --> H1
    SC2 -- "emit TicketSold" --> H1
    SC2 -- "emit ListingCancelled" --> H1

    CFG --> H1
    CFG --> H2
    H1 --> DB
    H2 --> DB
    SCH --> DB
    DB --> GQL

    GQL --> PC
    PC --> PG
    PC --> MK

    style Blockchain fill:#1e3a5f,color:#fff
    style Indexer fill:#2d4a3e,color:#fff
    style Frontend fill:#4a2d4a,color:#fff
```

---

## 5.16 Referensi & Dokumentasi Resmi

| Sumber | Link |
|--------|------|
| Ponder Documentation | https://ponder.sh/docs |
| Ponder GitHub | https://github.com/ponder-sh/ponder |
| Ponder Schema API | https://ponder.sh/docs/schema |
| Ponder Indexing API | https://ponder.sh/docs/indexing |
| GraphQL Playground | http://localhost:42069/graphql (lokal) |
| Base Sepolia Explorer | https://sepolia.basescan.org |
| Viem Documentation | https://viem.sh |
