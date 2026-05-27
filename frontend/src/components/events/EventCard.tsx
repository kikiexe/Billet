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
      className="group relative rounded-3xl glass overflow-hidden hover:shadow-warm-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={() => listing.active && onBuy(listing)}
      id={`event-card-${listing.listingId}`}
    >
      {/* Category gradient header */}
      <div className={`h-28 sm:h-32 bg-linear-to-br ${gradient} relative overflow-hidden`}>
        {/* Decorative circle */}
        <div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-30 group-hover:scale-125 transition-transform duration-500"
          style={{
            background: "radial-gradient(circle, white 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, white 0%, transparent 70%)",
          }}
        />

        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm text-xs font-semibold text-bark">
            <Tag className="w-3 h-3" />
            {categoryName}
          </span>
        </div>

        {/* Resale badge */}
        {listing.isResale && (
          <div className="absolute top-4 right-4">
            <span className="px-2.5 py-1 rounded-full bg-bark/70 backdrop-blur-sm text-xs font-medium text-white">
              Resale
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        {/* Price */}
        <div className="mb-4">
          <p className="text-xs text-stone mb-1">Harga per tiket</p>
          <p className="font-heading font-bold text-2xl text-bark">
            {formatIDRX(listing.pricePerUnit)}
          </p>
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-1.5 text-sm text-stone">
            <Users className="w-3.5 h-3.5" />
            <span>
              <strong className="text-bark">{listing.amount.toString()}</strong> tersisa
            </span>
          </div>
          <div className="text-xs text-stone/70 font-mono">
            #{listing.listingId}
          </div>
        </div>

        {/* Seller */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <div>
            <p className="text-xs text-stone/60 mb-0.5">
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
        <div className="absolute inset-0 bg-cream/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
          <span className="px-4 py-2 rounded-xl bg-stone/10 text-stone font-medium text-sm">
            Listing Ditutup
          </span>
        </div>
      )}
    </div>
  );
}
