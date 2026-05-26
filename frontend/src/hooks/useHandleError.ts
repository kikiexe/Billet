import { decodeErrorResult } from 'viem'
import { MARKETPLACE_ABI } from '@/config/contracts'
import { toast } from "sonner"

export function useHandleContractError() {
  const handleError = (error: any) => {
    try {
      const errorData = error.data || error.cause?.data || error.cause?.cause?.data;
      
      if (!errorData) throw new Error("No error data");

      const decodedError = decodeErrorResult({
        abi: MARKETPLACE_ABI,
        data: errorData,
      })

      if (decodedError.errorName === 'PriceCeilingExceeded') {
        toast.error("Gagal", { description: "Harga jual yang dimasukkan melebihi batas maksimal regulasi." })
      } else if (decodedError.errorName === 'SaleNotStarted') {
        toast.warning("Peringatan", { description: "Waktu penjualan tiket belum dimulai." })
      } else if (decodedError.errorName === 'InsufficientPayment') {
        toast.error("Saldo Kurang", { description: "Saldo IDRX Anda tidak mencukupi untuk transaksi ini." })
      } else if (decodedError.errorName === 'InsufficientAllowance') {
        toast.error("Persetujuan Gagal", { description: "Anda belum menyetujui (Approve) penggunaan IDRX yang cukup." })
      } else {
        toast.error("Transaksi Gagal", { description: "Cek kembali ketentuan transaksi Anda." })
      }
    } catch (e) {
      if (error?.message?.includes('User rejected')) {
        toast.info("Dibatalkan", { description: "Anda membatalkan transaksi di wallet." })
      } else {
        toast.error("Error", { description: "Terjadi kesalahan yang tidak diketahui." })
      }
    }
  }

  return { handleError }
}
