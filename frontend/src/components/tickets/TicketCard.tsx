"use client";

import { CheckCircle2, Clock, User } from "lucide-react";
import { getCategoryName, getCategoryGradient } from "@/lib/format";
import type { TicketHolder } from "@/hooks/useMyTickets";

interface TicketCardProps {
  tokenId: number;
  holder: TicketHolder;
  index: number;
}

export function TicketCard({ tokenId, holder, index }: TicketCardProps) {
  const categoryName = getCategoryName(tokenId);
  const gradient = getCategoryGradient(tokenId);
  const isUsed = holder.used;

  // Mask NIK for privacy: show first 4 and last 4 digits
  const maskedNik =
    holder.nik.length > 8
      ? `${holder.nik.slice(0, 4)}••••••${holder.nik.slice(-4)}`
      : holder.nik;

  return (
    <div
      className={`
        group relative rounded-2xl overflow-hidden transition-all duration-300
        ${isUsed
          ? "bg-white/40 border border-bark/4 opacity-70"
          : "bg-white/60 border border-bark/6 hover:shadow-card-hover hover:-translate-y-1"
        }
      `}
      id={`ticket-card-${tokenId}-${index}`}
    >
      {/* ─── Category Gradient Strip ──────────────────── */}
      <div className={`h-2 bg-linear-to-r ${gradient}`} />

      <div className="p-5">
        {/* ─── Top Row: Category + Status ────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <span className="font-heading font-bold text-lg text-bark">
            {categoryName}
          </span>
          {isUsed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-[11px] font-semibold border border-green-100">
              <CheckCircle2 className="w-3 h-3" />
              Terpakai
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warm-50 text-warm-700 text-[11px] font-semibold border border-warm-100">
              <Clock className="w-3 h-3" />
              Aktif
            </span>
          )}
        </div>

        {/* ─── Holder Info ───────────────────────────────── */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-sand/30 border border-bark/4">
            <User className="w-4 h-4 text-stone/50 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-stone/50 font-medium uppercase tracking-wider mb-0.5">Pemegang</p>
              <p className="text-sm font-medium text-bark truncate">
                {holder.name || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-sand/30 border border-bark/4">
            <div className="w-4 h-4 flex items-center justify-center text-stone/50 shrink-0 text-[10px] font-bold">
              ID
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-stone/50 font-medium uppercase tracking-wider mb-0.5">NIK</p>
              <p className="text-sm font-mono text-bark">
                {maskedNik || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Token Footer ─────────────────────────────── */}
        <div className="mt-4 pt-3.5 border-t border-bark/6 flex items-center justify-between">
          <span className="text-[10px] text-stone/40 font-mono">
            Token ID: {tokenId}
          </span>
          <span className="text-[10px] text-stone/40 font-mono">
            #{index + 1}
          </span>
        </div>
      </div>

      {/* Used overlay pattern */}
      {isUsed && (
        <div className="absolute top-2 right-0 w-28 h-full opacity-[0.03] -z-10 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, currentColor, currentColor 1px, transparent 1px, transparent 8px)",
            }}
          />
        </div>
      )}
    </div>
  );
}
