"use client";

import { Loader2, Wallet, Ticket, TicketCheck } from "lucide-react";
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
        {/* Page Header */}
        <section className="relative overflow-hidden" id="my-tickets-header">
          <div
            className="absolute -top-32 -left-32 w-100 h-100 rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle, #FFCCA3 0%, transparent 60%)",
            }}
          />

          <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <h1 className="font-heading font-bold text-3xl sm:text-4xl text-bark mb-2">
                  Tiket Saya
                </h1>
                <p className="text-stone text-base max-w-md">
                  Kelola tiket acara yang Anda miliki. Lihat status check-in dan
                  data pemegang tiket.
                </p>
              </div>

              {isConnected && totalHolders > 0 && (
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl glass text-sm">
                    <Ticket className="w-4 h-4 text-warm-500" />
                    <span className="text-bark font-medium">{totalHolders} tiket</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl glass text-sm">
                    <TicketCheck className="w-4 h-4 text-green-500" />
                    <span className="text-bark font-medium">{usedCount} terpakai</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-20" id="my-tickets-grid">
          {!isConnected ? (
            /* Not Connected */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-sand/60 flex items-center justify-center mb-5">
                <Wallet className="w-7 h-7 text-stone/40" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-bark mb-2">
                Hubungkan Wallet
              </h3>
              <p className="text-stone text-sm max-w-xs mb-6">
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
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-sand/60 flex items-center justify-center mb-5">
                <Ticket className="w-7 h-7 text-stone/40" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-bark mb-2">
                Belum Punya Tiket
              </h3>
              <p className="text-stone text-sm max-w-xs">
                Anda belum memiliki tiket. Jelajahi event yang tersedia dan beli
                tiket pertama Anda!
              </p>
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
                    <div className="flex items-center gap-3 mb-5">
                      <h2 className="font-heading font-bold text-xl text-bark">
                        {getCategoryName(ticket.tokenId)}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-sand text-xs font-medium text-stone">
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
