"use client";

import { Ticket, ExternalLink } from "lucide-react";
import Link from "next/link";

const platformLinks = [
  { href: "/events", label: "Jelajahi Event" },
  { href: "/my-tickets", label: "Tiket Saya" },
  { href: "/creator", label: "Portal Kreator" },
];

const techLinks = [
  { href: "https://base.org", label: "Base L2", external: true },
  { href: "https://idrx.co", label: "IDRX Stablecoin", external: true },
  { href: "https://eips.ethereum.org/EIPS/eip-1155", label: "ERC-1155", external: true },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-sand/30">
      <div className="section-container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* ─── Branding Column ────────────────────────────── */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
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
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Built on Base
              </span>
            </div>
          </div>

          {/* ─── Links Columns ──────────────────────────────── */}
          <div className="md:col-span-3">
            <h4 className="font-heading font-semibold text-bark text-xs uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone hover:text-warm-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-heading font-semibold text-bark text-xs uppercase tracking-wider mb-4">
              Teknologi
            </h4>
            <ul className="space-y-2.5">
              {techLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-stone hover:text-warm-600 transition-colors group"
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-60 group-hover:translate-y-0 transition-all" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ─── Bottom Bar ──────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone/50">
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
