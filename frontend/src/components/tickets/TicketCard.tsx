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
        group relative rounded-3xl overflow-hidden transition-all duration-300
        ${isUsed
          ? "glass opacity-75"
          : "glass hover:shadow-warm-lg hover:-translate-y-1"
        }
      `}
      id={`ticket-card-${tokenId}-${index}`}
    >
      {/* Category gradient strip */}
      <div className={`h-3 bg-linear-to-r ${gradient}`} />

      <div className="p-5 sm:p-6">
        {/* Top row: Category + Status */}
        <div className="flex items-center justify-between mb-5">
          <span className="font-heading font-bold text-lg text-bark">
            {categoryName}
          </span>
          {isUsed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              Terpakai
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warm-100 text-warm-700 text-xs font-semibold">
              <Clock className="w-3 h-3" />
              Aktif
            </span>
          )}
        </div>

        {/* Holder info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sand/40">
            <User className="w-4 h-4 text-stone/60 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-stone/60 mb-0.5">Nama Pemegang</p>
              <p className="text-sm font-medium text-bark truncate">
                {holder.name || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sand/40">
            <div className="w-4 h-4 flex items-center justify-center text-stone/60 shrink-0 text-xs font-bold">
              ID
            </div>
            <div className="min-w-0">
              <p className="text-xs text-stone/60 mb-0.5">NIK</p>
              <p className="text-sm font-mono text-bark">
                {maskedNik || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Token footer */}
        <div className="mt-5 pt-4 border-t border-border/30 flex items-center justify-between">
          <span className="text-xs text-stone/50 font-mono">
            Token ID: {tokenId}
          </span>
          <span className="text-xs text-stone/50">
            #{index + 1}
          </span>
        </div>
      </div>

      {/* Used overlay pattern */}
      {isUsed && (
        <div className="absolute top-3 right-0 w-32 h-full opacity-5 -z-10 pointer-events-none">
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
