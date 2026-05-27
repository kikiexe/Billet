"use client";

import { Loader2, Wallet, Ticket, TicketCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TicketCard } from "@/components/tickets/TicketCard";
import { useMyTickets } from "@/hooks/useMyTickets";
import { getCategoryName } from "@/lib/format";
import { ConnectKitButton } from "connectkit";

export default function MyTicketsPage() {
  const { tickets, isLoading, isConnected } = useMyTickets();

  // Flatten all holder entries for total count
  const totalHolders = tickets.reduce(
    (acc, t) => acc + t.holders.filter((h) => h.registered).length,
    0
  );
  const usedCount = tickets.reduce(
    (acc, t) => acc + t.holders.filter((h) => h.registered && h.used).length,
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />

      <main className="flex-1">
        {/* ─── Page Header ──────────────────────────────────── */}
        <section className="relative overflow-hidden" id="my-tickets-header">
          <div
            className="absolute -top-28 -left-28 w-80 h-80 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, #FFCCA3 0%, transparent 60%)",
            }}
          />

          <div className="section-container pt-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
              <div>
                <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-bark mb-1.5">
                  Tiket Saya
                </h1>
                <p className="text-stone text-sm max-w-md leading-relaxed">
                  Kelola tiket acara yang Anda miliki. Lihat status check-in dan
                  data pemegang tiket.
                </p>
              </div>

              {isConnected && totalHolders > 0 && (
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/60 border border-bark/6 text-sm shadow-card">
                    <Ticket className="w-4 h-4 text-warm-500" />
                    <span className="text-bark font-medium">{totalHolders} tiket</span>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/60 border border-bark/6 text-sm shadow-card">
                    <TicketCheck className="w-4 h-4 text-green-500" />
                    <span className="text-bark font-medium">{usedCount} terpakai</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Content ──────────────────────────────────────── */}
        <section className="section-container pb-20" id="my-tickets-grid">
          {!isConnected ? (
            /* Not Connected */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-sand/50 flex items-center justify-center mb-5">
                <Wallet className="w-6 h-6 text-stone/30" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-bark mb-1.5">
                Hubungkan Wallet
              </h3>
              <p className="text-stone text-sm max-w-xs mb-6 leading-relaxed">
                Hubungkan wallet Anda untuk melihat tiket yang Anda miliki.
              </p>
              <ConnectKitButton />
            </div>
          ) : isLoading ? (
            /* Loading */
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-warm-500 animate-spin mb-4" />
              <p className="text-stone text-sm">Memuat tiket dari blockchain...</p>
            </div>
          ) : totalHolders === 0 ? (
            /* Empty State — More engaging */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-warm-50 border border-warm-100 flex items-center justify-center mb-5">
                <Ticket className="w-7 h-7 text-warm-400" />
              </div>
              <h3 className="font-heading font-semibold text-xl text-bark mb-2">
                Belum Punya Tiket
              </h3>
              <p className="text-stone text-sm max-w-xs mb-6 leading-relaxed">
                Anda belum memiliki tiket. Jelajahi event yang tersedia dan beli
                tiket pertama Anda!
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-warm-500 to-warm-600 text-white font-heading font-semibold text-sm shadow-warm hover:shadow-warm-lg transition-all"
              >
                Jelajahi Event
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Ticket Grid by Category */
            <div className="space-y-10">
              {tickets.map((ticket) => {
                const registeredHolders = ticket.holders.filter((h) => h.registered);
                if (registeredHolders.length === 0) return null;

                return (
                  <div key={ticket.tokenId}>
                    {/* Category header */}
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="font-heading font-bold text-xl text-bark">
                        {getCategoryName(ticket.tokenId)}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-lg bg-sand/60 text-[11px] font-semibold text-stone border border-bark/4">
                        {registeredHolders.length} tiket
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {registeredHolders.map((holder, idx) => (
                        <TicketCard
                          key={`${ticket.tokenId}-${idx}`}
                          tokenId={ticket.tokenId}
                          holder={holder}
                          index={idx}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
