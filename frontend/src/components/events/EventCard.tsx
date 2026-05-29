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

  return (
    <div
      className="group relative border border-hairline bg-canvas-elevated overflow-hidden hover:border-primary transition-all duration-300 cursor-pointer flex flex-col justify-between"
      onClick={() => listing.active && onBuy(listing)}
      id={`event-card-${listing.listingId}`}
    >
      {/* ─── Category Gradient Header Representation ───────── */}
      <div className="h-28 bg-radial-[circle_at_center] from-primary/10 via-neutral-900 to-neutral-950 relative overflow-hidden shrink-0 border-b border-hairline">
        
        {/* Category tag */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-2.5 py-0.5 border border-primary/20 bg-primary/10 font-caption-uppercase text-[9px] tracking-wider text-primary">
            {categoryName}
          </span>
        </div>

        {/* Resale badge */}
        {listing.isResale && (
          <div className="absolute top-4 right-4">
            <span className="px-2 py-0.5 border border-hairline bg-canvas text-body font-caption-uppercase text-[9px] tracking-wider">
              RESALE
            </span>
          </div>
        )}
      </div>

      {/* ─── Content Section ───────────────────────────── */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
        
        {/* Price display */}
        <div className="space-y-1">
          <p className="font-caption-uppercase text-[9px] text-body tracking-wider">
            HARGA PER TIKET
          </p>
          <p className="font-title-md text-lg text-white">
            {formatIDRX(listing.pricePerUnit)}
          </p>
        </div>

        {/* Remaining amount details */}
        <div className="flex items-center justify-between gap-4 font-body-sm text-[13px] text-body">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>
              <strong className="text-white">{listing.amount.toString()}</strong> tersisa
            </span>
          </div>
          <span className="font-mono text-xs opacity-50">
            #{listing.listingId}
          </span>
        </div>

        {/* Seller Info + Buy Action CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-hairline">
          <div>
            <p className="font-caption-uppercase text-[8px] text-muted tracking-wider">
              {listing.isResale ? "PENJUAL SEC" : "ORGANIZER"}
            </p>
            <p className="font-mono text-xs text-body">
              {truncateAddress(listing.seller)}
            </p>
          </div>

          {listing.active && (
            <div className="flex items-center gap-1 font-caption-uppercase text-[11px] tracking-wider text-white group-hover:text-primary transition-colors">
              BELI
              <ArrowUpRight className="w-4 h-4 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          )}
        </div>
      </div>

      {/* Inactive state overlay */}
      {!listing.active && (
        <div className="absolute inset-0 bg-canvas/80 flex items-center justify-center">
          <span className="px-4 py-2 border border-hairline bg-canvas-elevated text-body font-caption-uppercase text-[11px] tracking-wider">
            LISTING DITUTUP
          </span>
        </div>
      )}
    </div>
  );
}
