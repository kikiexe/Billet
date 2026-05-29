"use client";

import { CheckCircle2, Clock, User } from "lucide-react";
import { getCategoryName } from "@/lib/format";
import type { TicketHolder } from "@/hooks/useMyTickets";

interface TicketCardProps {
  tokenId: number;
  holder: TicketHolder;
  index: number;
}

export function TicketCard({ tokenId, holder, index }: TicketCardProps) {
  const categoryName = getCategoryName(tokenId);
  const isUsed = holder.used;

  // Mask NIK for privacy: show first 4 and last 4 digits
  const maskedNik =
    holder.nik.length > 8
      ? `${holder.nik.slice(0, 4)}••••••${holder.nik.slice(-4)}`
      : holder.nik;

  return (
    <div
      className={`
        group relative border overflow-hidden transition-all duration-300 rounded-none
        ${isUsed
          ? "border-hairline bg-canvas-elevated/40 opacity-60"
          : "border-hairline bg-canvas-elevated hover:border-primary"
        }
      `}
      id={`ticket-card-${tokenId}-${index}`}
    >
      <div className="p-6 space-y-5">
        {/* ─── Top Row: Category + Status ────────────────── */}
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold text-lg uppercase tracking-tight text-white">
            {categoryName}
          </span>
          {isUsed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-[#03904a]/20 bg-[#03904a]/10 text-[#03904a] font-caption-uppercase text-[9px] tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              TERPAKAI
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-primary/20 bg-primary/10 text-primary font-caption-uppercase text-[9px] tracking-wider animate-pulse-corsa">
              <Clock className="w-3.5 h-3.5" />
              AKTIF
            </span>
          )}
        </div>

        {/* ─── Holder Info ───────────────────────────────── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 px-4 py-3 border border-hairline bg-canvas">
            <User className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-caption-uppercase text-[8px] text-body tracking-wider">PEMEGANG</p>
              <p className="font-display font-bold text-sm text-white truncate">
                {holder.name || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border border-hairline bg-canvas">
            <div className="w-4 h-4 flex items-center justify-center text-primary shrink-0 text-[10px] font-bold">
              ID
            </div>
            <div className="min-w-0">
              <p className="font-caption-uppercase text-[8px] text-body tracking-wider">NOMOR INDUK KEPENDUDUKAN</p>
              <p className="text-sm font-mono text-white">
                {maskedNik || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Token Footer ─────────────────────────────── */}
        <div className="mt-4 pt-4 border-t border-hairline flex items-center justify-between font-mono text-[10px] text-muted">
          <span>
            TOKEN ID: {tokenId}
          </span>
          <span>
            #{index + 1}
          </span>
        </div>
      </div>
    </div>
  );
}
