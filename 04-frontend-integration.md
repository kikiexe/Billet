# 04 — Frontend Architecture & Integration

> Stack: Next.js (App Router) · Tailwind CSS · shadcn/ui · Wagmi v2 · Viem · ConnectKit / RainbowKit

---

## 4.1 Filosofi Desain Frontend
Tujuan dari frontend ini adalah memberikan pengalaman pengguna (UX) yang sangat mulus layaknya aplikasi konvensional, di mana kerumitan interaksi blockchain (Full Web3) disembunyikan semaksimal mungkin tanpa mengorbankan desentralisasi. 

Terdapat 3 tantangan utama UX di ekosistem Web3 yang dijawab oleh arsitektur ini:
1. **Jebakan "Approve-Drop-off"**: Diselesaikan dengan komponen UI Multi-step Loader otomatis.
2. **Keterbatasan Performa RPC**: Diselesaikan menggunakan lapisan Web3 Indexer (Ponder) alih-alih melakukan pemanggilan RPC *looping*.
3. **Error Blockchain yang Kriptik**: Diselesaikan dengan *Error Decoding* Viem untuk menerjemahkan *Custom Errors* dari kontrak menjadi notifikasi (Toast) yang ramah manusia.

---

## 4.2 Tech Stack & Library

| Kategori | Teknologi | Kegunaan |
|----------|-----------|----------|
| **Framework** | Next.js 14 (React) | SSR & Routing untuk SEO dan performa cepat. |
| **Styling** | Tailwind CSS & shadcn/ui | Membangun komponen UI modern, responsif, dan mudah dikustomisasi. |
| **Web3 Core** | Viem & Wagmi v2 | Berkomunikasi dengan *smart contract*. Viem jauh lebih ringan dan cepat dibanding ethers.js. |
| **Wallet Connection** | ConnectKit / RainbowKit | UI *out-of-the-box* untuk menghubungkan berbagai jenis wallet (Metamask, Rabby, dll). |

---

## 4.3 Struktur Folder Frontend (Next.js App Router)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout & Providers (Wagmi, QueryClient)
│   │   ├── page.tsx                # Landing Page (Daftar Event/Tiket via Ponder GraphQL)
│   │   └── marketplace/            # Halaman Secondary Market (Resale)
│   │
│   ├── components/
│   │   ├── ui/                     # Komponen dasar (Button, Card, Toast dari shadcn/ui)
│   │   └── web3/                   # Komponen khusus Web3 (ConnectButton)
│   │
│   ├── hooks/
│   │   ├── useBuyTicket.ts         # Hook transaksi dengan Multi-step otomatis
│   │   └── useHandleError.ts       # Hook Error Decoding Viem
│   │
│   └── config/
│       ├── wagmi.ts                # Konfigurasi chain (Base L2)
│       └── contracts.ts            # Alamat kontrak hasil deploy & ABI
```

---

## 4.4 Konfigurasi Web3 (Wagmi & Viem)

File `src/config/wagmi.ts`:

```typescript
import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID! }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})
```

---

## 4.5 Arsitektur Pengambilan Data (Web3 Indexer: Ponder)

**Masalah:** 
*Smart contract* menyimpan data tiket dalam struktur `mapping(uint256 => Listing)`. Melakukan *looping* pemanggilan RPC langsung dari Next.js akan menghabiskan kuota API RPC (Alchemy/Infura) dan menyebabkan isu *Out-of-Gas* atau membuat *website* sangat lambat.

**Solusi Arsitektur (Sang Juara): Ponder**
Menggunakan **Ponder** sebagai lapisan *Indexer Web3* yang berjalan berdampingan dengan Next.js. Ponder adalah *indexer* modern yang dibangun spesifik untuk ekosistem Viem/Wagmi dan menggunakan 100% murni TypeScript.

**Keunggulan Menggunakan Ponder:**
1. **Smart Contract Tetap Bersih:** Tidak perlu memaksakan pembuatan fungsi *Array View* yang rentan terkena batas *Out-of-Gas*. Ponder secara otomatis mendengarkan *events* yang sudah dipancarkan oleh *smart contract* (`TicketListed`, `TicketSold`, `ListingCancelled`).
2. **GraphQL API Instan:** Ponder mengekspos *database* indeks dalam bentuk GraphQL API. *Frontend* Next.js bisa dengan mudah melakukan *query* kompleks seperti: *"Tampilkan tiket VIP yang harganya di bawah Rp150.000, urutkan dari yang termurah"*. (Fitur penyaringan/pencarian yang mustahil dilakukan jika hanya membaca langsung dari RPC *smart contract*).
3. **UX Sempurna (Cepat):** Waktu tunggu (loading) halaman "Daftar Tiket" akan secepat kilat layaknya Web2 konvensional, karena Next.js hanya perlu membaca data dari GraphQL Ponder, bukan melakukan iterasi panggilan RPC ke *blockchain*.
4. **Alur Kerja TypeScript Mulus:** *File* ABI `.json` hasil kompilasi Foundry dapat langsung digunakan di dalam konfigurasi Ponder tanpa konversi bahasa yang membingungkan seperti AssemblyScript (pada The Graph).

---

## 4.6 UX Transaksi: Multi-step Loader Otomatis

**Masalah UX ("Approve-Drop-off"):** 
Di Web3, pembeli sering bingung ketika diminta menandatangani persetujuan (*Approve*) token, lalu harus menunggu, dan mengklik tombol lagi untuk (*Buy*). Banyak yang mengira transaksi sudah selesai setelah "Approve".

**Solusi:**
Otomatisasi 2 langkah menggunakan `useWaitForTransactionReceipt`. Saat "Beli" diklik, tombol berubah dari **"Beli"** menjadi **"1/2: Menyetujui IDRX..."**, dan setelah selesai akan otomatis men-trigger langkah kedua **"2/2: Membeli Tiket..."** tanpa menyuruh pengguna mengklik ulang.

```typescript
// src/hooks/useBuyTicket.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { IDRX_ABI, IDRX_ADDRESS, MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from '@/config/contracts'
import { parseEther } from 'viem'
import { useState, useEffect } from 'react'

export function useBuyTicket() {
  // State untuk Multi-step Loader di UI
  const [txState, setTxState] = useState<'idle' | 'approving' | 'buying' | 'success'>('idle')
  
  const { data: approveHash, writeContractAsync: writeApprove } = useWriteContract()
  const { writeContractAsync: writeBuy } = useWriteContract()

  // Wagmi Hook: Memantau status transaksi Approve di blockchain
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  // Data sementara untuk lanjut ke langkah 2
  const [pendingPurchase, setPendingPurchase] = useState<{
    listingId: bigint,
    amount: number,
    niks: string[],
    names: string[]
  } | null>(null)

  const executePurchase = async (
    listingId: bigint,
    amount: number,
    totalPrice: string,
    niks: string[],
    names: string[]
  ) => {
    try {
      setTxState('approving')
      setPendingPurchase({ listingId, amount, niks, names })
      
      // 1. Trigger Approve IDRX
      await writeApprove({
        address: IDRX_ADDRESS,
        abi: IDRX_ABI,
        functionName: 'approve',
        args: [MARKETPLACE_ADDRESS, parseEther(totalPrice)],
      })
      // NOTE: Setelah ini sukses, useEffect akan otomatis berjalan ke langkah 2.
    } catch (error) {
      setTxState('idle')
      throw error;
    }
  }

  // Trigger otomatis transaksi Buy (Langkah 2) setelah Approve selesai
  useEffect(() => {
    if (isApproveSuccess && txState === 'approving' && pendingPurchase) {
      setTxState('buying')
      
      // Eksekusi fungsi Smart Contract tanpa interaksi klik dari user
      writeBuy({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'buyTicket',
        args: [
          pendingPurchase.listingId,
          BigInt(pendingPurchase.amount),
          pendingPurchase.niks,
          pendingPurchase.names
        ],
      })
      .then(() => setTxState('success'))
      .catch(() => setTxState('idle'))
    }
  }, [isApproveSuccess, txState, pendingPurchase, writeBuy])

  return { executePurchase, txState }
}
```

---

## 4.7 Penanganan Error Custom (Error Decoding)

**Masalah UX (Error Kriptik):** 
Jika terjadi kegagalan (misalnya karena *Price Ceiling*), Wagmi secara *default* akan melempar pesan *error* mentah yang menakutkan seperti `"Execution Reverted: 0x8a92b1..."`.

**Solusi:**
Menggunakan utilitas `decodeErrorResult` dari Viem. Tangkap *error* di blok `catch`, terjemahkan berdasarkan ABI, lalu tampilkan sebagai notifikasi (Toast dari shadcn/ui) yang mudah dipahami manusia.

```typescript
// src/hooks/useHandleError.ts
import { decodeErrorResult } from 'viem'
import { MARKETPLACE_ABI } from '@/config/contracts'
import { useToast } from "@/components/ui/use-toast"

export function useHandleContractError() {
  const { toast } = useToast()

  const handleError = (error: any) => {
    try {
      // 1. Cari data error dari object revert RPC
      const errorData = error.data || error.cause?.data || error.cause?.cause?.data;
      
      if (!errorData) throw new Error("No error data");

      // 2. Decode custom error berdasarkan ABI Kontrak
      const decodedError = decodeErrorResult({
        abi: MARKETPLACE_ABI,
        data: errorData,
      })

      // 3. Mapping error kontrak ke bahasa manusia
      if (decodedError.errorName === 'PriceCeilingExceeded') {
        toast({ title: "Gagal", description: "Harga jual yang dimasukkan melebihi batas maksimal regulasi.", variant: "destructive" })
      } else if (decodedError.errorName === 'SaleNotStarted') {
        toast({ title: "Peringatan", description: "Waktu penjualan tiket belum dimulai." })
      } else if (decodedError.errorName === 'InsufficientPayment') {
        toast({ title: "Saldo Kurang", description: "Saldo IDRX Anda tidak mencukupi untuk transaksi ini." })
      } else if (decodedError.errorName === 'InsufficientAllowance') {
        toast({ title: "Persetujuan Gagal", description: "Anda belum menyetujui (Approve) penggunaan IDRX yang cukup." })
      } else {
        toast({ title: "Transaksi Gagal", description: "Cek kembali ketentuan transaksi Anda." })
      }
    } catch (e) {
      // Fallback untuk error standar wallet (User rejected tx)
      if (error?.message?.includes('User rejected')) {
        toast({ title: "Dibatalkan", description: "Anda membatalkan transaksi di wallet." })
      } else {
        toast({ title: "Error", description: "Terjadi kesalahan yang tidak diketahui." })
      }
    }
  }

  return { handleError }
}
```

---

## 4.8 Panel Gatekeeper (Verifikasi Identitas & Check-In On-Chain)

**Masalah Check-In Tradisional:** 
Proses check-in Web3 biasanya lambat dan berisiko karena mengharuskan pengguna menghubungkan *wallet* aktif di pintu masuk dan membayar biaya gas.

**Solusi Billet (Ticket-on-Device):** 
Pengunjung hanya perlu menunjukkan **QR Code alamat wallet publik** mereka. Tablet panitia (yang bertindak sebagai `GateKeeper` resmi) akan memindai alamat tersebut, mengambil data Nama dan NIK terdaftar secara langsung dari blockchain secara instan, mencocokkannya dengan KTP fisik pengunjung, dan mengeksekusi transaksi check-in penandaan tiket terpakai (*used*) menggunakan *private key* lokal panitia (panitia yang menanggung gas fee super murah Base L2).

### 4.8.1 Kueri Data Identitas On-Chain (Read-Only RPC)

Tablet panitia memanggil fungsi `getTicketHolders` dari blockchain menggunakan RPC Client Viem secara gratis, instan, dan tanpa memotong saldo gas.

```typescript
// src/services/gatekeeper.ts
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { NFT_ABI, NFT_ADDRESS } from '@/config/contracts'

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})

export interface TicketHolder {
  name: string;
  nik: string;
  registered: boolean;
  used: boolean;
}

/// @notice Mengambil data identitas (Nama & NIK) pengunjung dari blockchain
export async function getHoldersFromBlockchain(
  walletAddress: string,
  tokenId: number
): Promise<TicketHolder[]> {
  try {
    const data = await publicClient.readContract({
      address: NFT_ADDRESS,
      abi: NFT_ABI,
      functionName: 'getTicketHolders',
      args: [walletAddress as `0x${string}`, BigInt(tokenId)],
    }) as any[]

    return data.map((item) => ({
      name: item.name,
      nik: item.nik,
      registered: item.registered,
      used: item.used,
    }))
  } catch (error) {
    console.error("Gagal kueri data blockchain:", error)
    throw error
  }
}
```

### 4.8.2 Eksekusi Check-In On-Chain (Gas Ditanggung Panitia)

Tablet panitia menanam *private key* Gatekeeper (yang telah diotorisasi di smart contract) ke dalam sistem untuk memicu transaksi pembakaran tiket penonton secara otomatis tanpa memerlukan interaksi dompet dari penonton.

```typescript
// src/services/checkInTransaction.ts
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { NFT_ABI, NFT_ADDRESS } from '@/config/contracts'

// Ambil Private Key Gatekeeper dari environment variable (.env) tablet panitia
const gatekeeperPrivateKey = process.env.NEXT_PUBLIC_GATEKEEPER_PRIVATE_KEY as `0x${string}`
const gatekeeperAccount = privateKeyToAccount(gatekeeperPrivateKey)

const walletClient = createWalletClient({
  account: gatekeeperAccount,
  chain: baseSepolia,
  transport: http(),
})

/// @notice Melakukan check-in tiket pengunjung secara on-chain saat verifikasi KTP berhasil
export async function executeOnChainCheckIn(
  userWallet: string,
  tokenId: number,
  index: number
): Promise<`0x${string}`> {
  try {
    // Panggil fungsi checkInFromGate pada smart contract
    const txHash = await walletClient.writeContract({
      address: NFT_ADDRESS,
      abi: NFT_ABI,
      functionName: 'checkInFromGate',
      args: [
        userWallet as `0x${string}`,
        BigInt(tokenId),
        BigInt(index) // Index posisi data identitas yang dicocokkan
      ],
    })
    
    return txHash;
  } catch (error) {
    console.error("Transaksi pembakaran gagal:", error)
    throw error
  }
}
```

---

## 4.9 Panduan Menjalankan Frontend Lokal

```bash
# Inisialisasi Next.js app
npx create-next-app@latest frontend --typescript --tailwind --eslint --app

# Masuk ke direktori
cd frontend

# Install dependensi Web3 & state management
npm install wagmi viem @tanstack/react-query connectkit

# Install UI components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog toast

# Jalankan server
npm run dev
```
