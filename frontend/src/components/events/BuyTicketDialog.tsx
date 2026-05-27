"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useBuyTicket } from "@/hooks/useBuyTicket";
import { useHandleContractError } from "@/hooks/useHandleError";
import { formatIDRX, getCategoryName } from "@/lib/format";
import type { ListingWithId } from "@/hooks/useListings";
import { formatUnits, keccak256, toBytes } from "viem";

interface BuyTicketDialogProps {
  listing: ListingWithId | null;
  onClose: () => void;
  onSuccess: () => void;
}

const steps = [
  { id: "form", label: "Detail" },
  { id: "approving", label: "Approve" },
  { id: "buying", label: "Beli" },
  { id: "success", label: "Selesai" },
];

export function BuyTicketDialog({ listing, onClose, onSuccess }: BuyTicketDialogProps) {
  const { isConnected } = useAccount();
  const { executePurchase, txState } = useBuyTicket();
  const { handleError } = useHandleContractError();

  const [amount, setAmount] = useState(1);
  const [holderData, setHolderData] = useState<{ name: string; nik: string }[]>([
    { name: "", nik: "" },
  ]);
  const [errorMsg, setErrorMsg] = useState("");

  if (!listing) return null;

  const maxAmount = Number(listing.amount);
  const totalPriceWei = listing.pricePerUnit * BigInt(amount);
  const totalPriceFormatted = formatIDRX(totalPriceWei);
  const categoryName = getCategoryName(listing.tokenId);

  // Determine current step index
  const currentStepIndex =
    txState === "idle" ? 0 :
    txState === "approving" ? 1 :
    txState === "buying" ? 2 :
    txState === "success" ? 3 : 0;

  // Update holder count when amount changes
  const handleAmountChange = (newAmount: number) => {
    const clamped = Math.max(1, Math.min(newAmount, maxAmount));
    setAmount(clamped);
    setHolderData((prev) => {
      if (clamped > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: clamped - prev.length }, () => ({ name: "", nik: "" })),
        ];
      }
      return prev.slice(0, clamped);
    });
  };

  const handleHolderChange = (index: number, field: "name" | "nik", value: string) => {
    setHolderData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async () => {
    setErrorMsg("");

    // Validate all fields
    for (let i = 0; i < holderData.length; i++) {
      if (!holderData[i].name.trim() || !holderData[i].nik.trim()) {
        setErrorMsg(`Lengkapi semua data pemegang tiket #${i + 1}`);
        return;
      }
    }

    try {
      const names = holderData.map((h) => h.name.trim());
      // Hash NIK client-side using Keccak-256 before transmitting, protecting PII privacy on-chain.
      // NOTE (Trade-off): The marketplace smart contract ABI expects string[] for niks, not bytes32[].
      // We store the hash hex string representation ('0x...') on-chain. This successfully mitigates PII exposure
      // without requiring a smart contract redeployment, although a native bytes32[] is more gas-optimal for storage.
      const niks = holderData.map((h) => keccak256(toBytes(h.nik.trim())));

      // Calculate total in ether format for the hook
      // pricePerUnit is already in wei, we need to convert to string
      const totalInWei = listing.pricePerUnit * BigInt(amount);
      // formatUnits with 18 decimals to get the ether string
      const totalEther = formatUnits(totalInWei, 18);

      await executePurchase(
        BigInt(listing.listingId),
        amount,
        totalEther,
        niks,
        names
      );

      onSuccess();
    } catch (err) {
      handleError(err);
      setErrorMsg("Transaksi gagal. Silakan coba lagi.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      id="buy-ticket-dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bark/40 backdrop-blur-sm animate-fade-in"
        onClick={txState === "idle" ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white/90 backdrop-blur-xl shadow-warm-lg animate-fade-in-up overflow-hidden border border-white/60">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="font-heading font-bold text-xl text-bark">
              Beli Tiket
            </h2>
            <p className="text-sm text-stone mt-0.5">
              {categoryName} — Listing #{listing.listingId}
            </p>
          </div>
          {txState === "idle" && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-sand/60 text-stone transition-colors"
              id="dialog-close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ─── Progress Steps ─────────────────────────────── */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-1">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                    ${i < currentStepIndex
                      ? "bg-green-500 text-white"
                      : i === currentStepIndex
                        ? "bg-warm-500 text-white shadow-warm"
                        : "bg-sand/80 text-stone/40"
                    }
                  `}
                >
                  {i < currentStepIndex ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded transition-colors ${
                      i < currentStepIndex ? "bg-green-400" : "bg-sand/80"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step, i) => (
              <span
                key={step.id}
                className={`text-[10px] font-medium flex-1 text-center ${
                  i <= currentStepIndex ? "text-bark" : "text-stone/30"
                }`}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>

        <hr className="section-divider" />

        {/* ─── Body ───────────────────────────────────────── */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {txState === "success" ? (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-heading font-bold text-2xl text-bark mb-2">
                Pembelian Berhasil!
              </h3>
              <p className="text-stone text-sm mb-6 max-w-xs mx-auto">
                {amount} tiket {categoryName} berhasil dibeli.
                Cek di halaman "Tiket Saya" untuk detailnya.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-linear-to-r from-warm-500 to-warm-600 text-white font-heading font-semibold text-sm shadow-warm hover:shadow-warm-lg transition-all"
                id="dialog-done"
              >
                Selesai
              </button>
            </div>
          ) : txState !== "idle" ? (
            /* Processing State */
            <div className="text-center py-10">
              <Loader2 className="w-10 h-10 text-warm-500 animate-spin mx-auto mb-5" />
              <h3 className="font-heading font-bold text-xl text-bark mb-2">
                {txState === "approving"
                  ? "Menunggu Approval IDRX..."
                  : "Memproses Pembelian..."}
              </h3>
              <p className="text-stone text-sm max-w-xs mx-auto">
                {txState === "approving"
                  ? "Konfirmasi transaksi approve di wallet Anda."
                  : "Konfirmasi transaksi pembelian di wallet Anda."}
              </p>
            </div>
          ) : (
            /* Form State */
            <>
              {!isConnected ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-10 h-10 text-warm-500 mx-auto mb-3" />
                  <p className="text-stone font-medium">
                    Hubungkan wallet Anda terlebih dahulu.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Amount selector */}
                  <div>
                    <label className="text-sm font-semibold text-bark mb-2.5 block">
                      Jumlah Tiket
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleAmountChange(amount - 1)}
                        disabled={amount <= 1}
                        className="w-10 h-10 rounded-xl bg-sand/50 border border-bark/6 flex items-center justify-center text-bark font-bold text-lg hover:bg-sand/80 disabled:opacity-30 transition-all"
                      >
                        −
                      </button>
                      <span className="font-heading font-bold text-2xl text-bark w-12 text-center">
                        {amount}
                      </span>
                      <button
                        onClick={() => handleAmountChange(amount + 1)}
                        disabled={amount >= maxAmount}
                        className="w-10 h-10 rounded-xl bg-sand/50 border border-bark/6 flex items-center justify-center text-bark font-bold text-lg hover:bg-sand/80 disabled:opacity-30 transition-all"
                      >
                        +
                      </button>
                      <span className="text-xs text-stone/50 ml-1">
                        maks. {maxAmount}
                      </span>
                    </div>
                  </div>

                  {/* Holder data inputs */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-bark block">
                      Data Pemegang Tiket
                    </label>
                    {holderData.map((holder, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-sand/25 border border-bark/4 p-4 space-y-2.5"
                      >
                        <p className="text-[10px] font-semibold text-stone/50 uppercase tracking-wider">
                          Pemegang #{i + 1}
                        </p>
                        <input
                          type="text"
                          placeholder="Nama Lengkap"
                          value={holder.name}
                          onChange={(e) =>
                            handleHolderChange(i, "name", e.target.value)
                          }
                          className="input-field"
                          id={`holder-name-${i}`}
                        />
                        <input
                          type="text"
                          placeholder="NIK (16 digit)"
                          value={holder.nik}
                          onChange={(e) =>
                            handleHolderChange(i, "nik", e.target.value)
                          }
                          className="input-field font-mono"
                          id={`holder-nik-${i}`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Error */}
                  {errorMsg && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50/60 border border-red-100 rounded-xl p-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  {/* Summary */}
                  <div className="rounded-xl bg-warm-50/50 border border-warm-100/50 p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-stone">Harga per tiket</span>
                      <span className="text-sm text-bark font-medium">
                        {formatIDRX(listing.pricePerUnit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-stone">Jumlah</span>
                      <span className="text-sm text-bark font-medium">
                        × {amount}
                      </span>
                    </div>
                    <div className="border-t border-warm-200/40 my-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-bark">Total</span>
                      <span className="font-heading font-bold text-xl text-warm-700">
                        {totalPriceFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    className="w-full py-3.5 rounded-xl bg-linear-to-r from-warm-500 to-warm-600 text-white font-heading font-semibold text-base shadow-warm hover:shadow-warm-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                    id="buy-submit"
                  >
                    Beli Sekarang
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
