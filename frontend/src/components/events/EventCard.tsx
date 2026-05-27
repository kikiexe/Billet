"use client";

import { Tag, Users, ArrowUpRight } from "lucide-react";
import { formatIDRX, getCategoryName, getCategoryGradient, truncateAddress } from "@/lib/format";
import type { ListingWithId } from "@/hooks/useListings";

interface EventCardProps {
  listing: ListingWithId;
  onBuy: (listing: ListingWithId) => void;
}

export function EventCard({ listing, onBuy }: EventCardProps) {
  const categoryName = getCategoryName(listing.tokenId);
  const gradient = getCategoryGradient(listing.tokenId);

  return (
    <div
      className="group relative rounded-2xl bg-white/60 border border-bark/6 overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
      onClick={() => listing.active && onBuy(listing)}
      id={`event-card-${listing.listingId}`}
    >
      {/* ─── Category Gradient Header ───────────────────── */}
      <div className={`h-28 bg-linear-to-br ${gradient} relative overflow-hidden shrink-0`}>
        {/* Subtle radial highlight */}
        <div
          className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-25 group-hover:scale-125 transition-transform duration-500"
          style={{
            background: "radial-gradient(circle, white 0%, transparent 70%)",
          }}
        />

        {/* Category badge */}
        <div className="absolute top-3.5 left-3.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/85 backdrop-blur-sm text-[11px] font-semibold text-bark shadow-sm">
            <Tag className="w-3 h-3" />
            {categoryName}
          </span>
        </div>

        {/* Resale badge */}
        {listing.isResale && (
          <div className="absolute top-3.5 right-3.5">
            <span className="px-2.5 py-1 rounded-lg bg-bark/60 backdrop-blur-sm text-[11px] font-semibold text-white">
              Resale
            </span>
          </div>
        )}
      </div>

      {/* ─── Content ────────────────────────────────────── */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        {/* Price — most important info, shown first */}
        <div className="mb-4">
          <p className="text-[10px] text-stone/60 font-medium uppercase tracking-wider mb-1">
            Harga per tiket
          </p>
          <p className="font-heading font-bold text-2xl text-bark leading-tight">
            {formatIDRX(listing.pricePerUnit)}
          </p>
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-stone">
            <Users className="w-3.5 h-3.5 text-stone/50" />
            <span>
              <strong className="text-bark">{listing.amount.toString()}</strong> tersisa
            </span>
          </div>
          <span className="text-[10px] text-stone/40 font-mono">
            #{listing.listingId}
          </span>
        </div>

        {/* Seller + CTA */}
        <div className="flex items-center justify-between pt-3.5 border-t border-bark/6">
          <div>
            <p className="text-[10px] text-stone/50 mb-0.5">
              {listing.isResale ? "Penjual" : "Organizer"}
            </p>
            <p className="text-xs font-mono text-stone">
              {truncateAddress(listing.seller)}
            </p>
          </div>

          {listing.active && (
            <div className="flex items-center gap-1 text-sm font-semibold text-warm-600 group-hover:text-warm-700 transition-colors">
              Beli
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          )}
        </div>
      </div>

      {/* Inactive overlay */}
      {!listing.active && (
        <div className="absolute inset-0 bg-cream/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <span className="px-4 py-2 rounded-xl bg-stone/10 text-stone font-medium text-sm">
            Listing Ditutup
          </span>
        </div>
      )}
    </div>
  );
}
