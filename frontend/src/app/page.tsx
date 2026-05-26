"use client";

import { ConnectKitButton } from "connectkit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-purple-500/30">
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center font-bold text-lg">
              B
            </div>
            <span className="font-bold text-xl tracking-tight">Billet.</span>
          </div>
          <ConnectKitButton />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 text-transparent bg-clip-text">
            The Future of Ticketing.
          </h1>
          <p className="text-xl text-neutral-400">
            Beli, jual, dan kelola tiket acara Anda dengan aman di ekosistem terdesentralisasi tanpa calo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Anti-Calo", desc: "Sistem Price Ceiling melindungi pembeli dari harga tidak wajar di pasar sekunder." },
            { title: "Desentralisasi", desc: "Kepemilikan sejati atas tiket Anda di jaringan Base L2 yang cepat dan murah." },
            { title: "Check-in Instan", desc: "Pindai dompet Anda di pintu masuk untuk verifikasi instan tanpa gas fee." }
          ].map((feature, i) => (
            <div key={i} className="h-full">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors h-full">
                <CardHeader>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-400 text-base">
                    {feature.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
