"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed
    const p = detectPlatform();
    if (p === "other") return; // desktop — do nothing
    setPlatform(p);

    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!platform || dismissed) return null;

  async function handleInstall() {
    if (deferredPrompt) {
      (deferredPrompt as BeforeInstallPromptEvent).prompt();
      const { outcome } = await (deferredPrompt as BeforeInstallPromptEvent).userChoice;
      if (outcome === "accepted") setDismissed(true);
      setDeferredPrompt(null);
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-4 pb-4">
        {platform === "ios" ? (
          <p className="text-sm">
            <strong>Install PharmaTrack</strong> for background location tracking:{" "}
            tap <strong>Share</strong> → <strong>Add to Home Screen</strong>.
          </p>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm">
              <strong>Install PharmaTrack</strong> for background location tracking.
            </p>
            <Button size="sm" onClick={handleInstall}>Install</Button>
          </div>
        )}
        <button
          className="text-xs text-muted-foreground mt-2 underline"
          onClick={() => setDismissed(true)}
        >
          Dismiss
        </button>
      </CardContent>
    </Card>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
