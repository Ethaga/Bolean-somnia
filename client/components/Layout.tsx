import { ReactNode } from "react";
import { WalletConnect } from "@/components/Wallet";
import SendToken from "@/components/SendToken";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-500 shadow-lg" />
      <span className="text-xl font-extrabold tracking-tight">Bolean</span>
    </div>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border/60">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <a href="#home" className="flex items-center gap-3">
          <Logo />
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#markets" className="text-muted-foreground hover:text-foreground">Markets</a>
          <a href="#architecture" className="text-muted-foreground hover:text-foreground">Architecture</a>
          <a href="#contracts" className="text-muted-foreground hover:text-foreground">Contracts</a>
          <a href="#docs" className="text-muted-foreground hover:text-foreground">Docs</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="#deploy" className="hidden sm:block">
            <Button variant="ghost" className="hover:bg-accent/50">Deploy</Button>
          </a>
          <SendToken />
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="container mx-auto py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo />
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Bolean on Somnia. All rights reserved.
        </div>
        <div className="flex gap-4 text-sm">
          <a className="hover:text-foreground text-muted-foreground" href="#privacy">Privacy</a>
          <a className="hover:text-foreground text-muted-foreground" href="#terms">Terms</a>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
