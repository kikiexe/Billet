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
  { id: "form", label: "Detail Tiket" },
  { id: "approving", label: "Approve IDRX" },
  { id: "buying", label: "Pembelian" },
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
      <div className="relative w-full max-w-lg rounded-3xl glass-strong shadow-warm-lg animate-fade-in-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/30">
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
              className="p-2 rounded-xl hover:bg-warm-50/60 text-stone transition-colors"
              id="dialog-close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-1">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                    ${i < currentStepIndex
                      ? "bg-green-500 text-white"
                      : i === currentStepIndex
                        ? "bg-warm-500 text-white shadow-warm"
                        : "bg-sand text-stone/50"
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
                    className={`flex-1 h-0.5 mx-1.5 rounded transition-colors ${
                      i < currentStepIndex ? "bg-green-400" : "bg-sand"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5 mb-4">
            {steps.map((step, i) => (
              <span
                key={step.id}
                className={`text-[10px] font-medium flex-1 text-center ${
                  i <= currentStepIndex ? "text-bark" : "text-stone/40"
                }`}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
          {txState === "success" ? (
            /* Success State */
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-heading font-bold text-2xl text-bark mb-2">
                Pembelian Berhasil!
              </h3>
              <p className="text-stone text-sm mb-6">
                {amount} tiket {categoryName} berhasil dibeli.
                <br />
                Cek di halaman &ldquo;Tiket Saya&rdquo; untuk detailnya.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl bg-linear-to-r from-warm-500 to-warm-600 text-white font-heading font-semibold text-sm shadow-warm hover:shadow-warm-lg transition-all"
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
              <p className="text-stone text-sm">
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
                <>
                  {/* Amount selector */}
                  <div className="mb-5">
                    <label className="text-sm font-medium text-bark mb-2 block">
                      Jumlah Tiket
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleAmountChange(amount - 1)}
                        disabled={amount <= 1}
                        className="w-10 h-10 rounded-xl glass flex items-center justify-center text-bark font-bold text-lg hover:bg-white/70 disabled:opacity-30 transition-all"
                      >
                        −
                      </button>
                      <span className="font-heading font-bold text-2xl text-bark w-12 text-center">
                        {amount}
                      </span>
                      <button
                        onClick={() => handleAmountChange(amount + 1)}
                        disabled={amount >= maxAmount}
                        className="w-10 h-10 rounded-xl glass flex items-center justify-center text-bark font-bold text-lg hover:bg-white/70 disabled:opacity-30 transition-all"
                      >
                        +
                      </button>
                      <span className="text-xs text-stone ml-2">
                        maks. {maxAmount}
                      </span>
                    </div>
                  </div>

                  {/* Holder data inputs */}
                  <div className="mb-5 space-y-4">
                    <label className="text-sm font-medium text-bark block">
                      Data Pemegang Tiket
                    </label>
                    {holderData.map((holder, i) => (
                      <div
                        key={i}
                        className="rounded-2xl bg-sand/40 p-4 space-y-3"
                      >
                        <p className="text-xs font-semibold text-stone uppercase tracking-wider">
                          Pemegang #{i + 1}
                        </p>
                        <input
                          type="text"
                          placeholder="Nama Lengkap"
                          value={holder.name}
                          onChange={(e) =>
                            handleHolderChange(i, "name", e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-xl glass border-0 text-sm text-bark placeholder:text-stone/40 focus:ring-2 focus:ring-warm-400 outline-none transition-all"
                          id={`holder-name-${i}`}
                        />
                        <input
                          type="text"
                          placeholder="NIK (16 digit)"
                          value={holder.nik}
                          onChange={(e) =>
                            handleHolderChange(i, "nik", e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-xl glass border-0 text-sm text-bark placeholder:text-stone/40 focus:ring-2 focus:ring-warm-400 outline-none transition-all"
                          id={`holder-nik-${i}`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Error */}
                  {errorMsg && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50/60 rounded-xl p-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  {/* Summary & Submit */}
                  <div className="rounded-2xl bg-linear-to-br from-warm-50 to-warm-100/60 p-5 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-stone">Harga per tiket</span>
                      <span className="text-sm text-bark font-medium">
                        {formatIDRX(listing.pricePerUnit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-stone">Jumlah</span>
                      <span className="text-sm text-bark font-medium">
                        × {amount}
                      </span>
                    </div>
                    <div className="border-t border-warm-200/40 my-3" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-bark">Total</span>
                      <span className="font-heading font-bold text-xl text-warm-700">
                        {totalPriceFormatted}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    className="w-full py-3.5 rounded-2xl bg-linear-to-r from-warm-500 to-warm-600 text-white font-heading font-semibold text-base shadow-warm hover:shadow-warm-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                    id="buy-submit"
                  >
                    Beli Sekarang
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
