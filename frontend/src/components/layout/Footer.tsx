"use client";

import { Ticket } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-sand/40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Branding */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-warm-500 to-warm-700 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
                <Ticket className="w-4 h-4 text-white -rotate-45" />
              </div>
              <span className="font-heading font-bold text-lg tracking-tight text-bark">
                Billet
              </span>
            </Link>
            <p className="text-sm text-stone max-w-xs leading-relaxed">
              Platform tiket acara terdesentralisasi. Aman, adil, dan transparan
              di jaringan Base L2.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12 text-sm">
            <div className="flex flex-col gap-2.5">
              <span className="font-heading font-semibold text-bark text-xs uppercase tracking-wider">
                Platform
              </span>
              <Link href="/events" className="text-stone hover:text-warm-600 transition-colors">
                Jelajahi Event
              </Link>
              <Link href="/my-tickets" className="text-stone hover:text-warm-600 transition-colors">
                Tiket Saya
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="font-heading font-semibold text-bark text-xs uppercase tracking-wider">
                Teknologi
              </span>
              <a
                href="https://base.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone hover:text-warm-600 transition-colors"
              >
                Base L2
              </a>
              <a
                href="https://idrx.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone hover:text-warm-600 transition-colors"
              >
                IDRX Stablecoin
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone/60">
            © {new Date().getFullYear()} Billet. Dibangun di atas Base L2.
          </p>
          <p className="text-xs text-stone/40">
            Smart Contracts terverifikasi di BaseScan Sepolia
          </p>
        </div>
      </div>
    </footer>
  );
}
