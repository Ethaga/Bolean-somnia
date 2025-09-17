import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BOLEAN_ADDRESSES, somniaTestnet } from "@/lib/somnia";
import { ERC20_ABI } from "@/lib/abi";
import { useEffect, useMemo, useState } from "react";
import {
  createPublicClient,
  formatUnits,
  getAddress,
  parseUnits,
  http,
  type Address,
} from "viem";

const publicClient = createPublicClient({ chain: somniaTestnet, transport: http({ url: '/api/rpc' }) });

function Section({ id, className, children }: React.PropsWithChildren<{ id: string; className?: string }>) {
  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      {children}
    </section>
  );
}

function Hero() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,theme(colors.cyan.500/.25),transparent_40%),radial-gradient(circle_at_bottom_right,theme(colors.fuchsia.500/.25),transparent_40%)]" />
      <div className="container mx-auto py-24 md:py-32 relative">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
            On Somnia Testnet • DeFi Protocol
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Bolean — build DeFi that runs entirely on the Somnia Network
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Turn concepts into fully on‑chain dApps. Create lending markets like JustLend, designed for Somnia. Creativity & Originality. On‑chain Impact. Technical Excellence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#markets"><Button className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white">Launch App</Button></a>
            <a href="#architecture"><Button variant="outline">See Architecture</Button></a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Stats() {
  return (
    <div className="container mx-auto -mt-10 md:-mt-16 relative grid grid-cols-2 md:grid-cols-4 gap-4">
      <Stat label="Network" value="Somnia Testnet" />
      <Stat label="Native Token" value="STT" />
      <Stat label="Protocol" value="Bolean Lending" />
      <Stat label="Open Source" value="Yes" />
    </div>
  );
}

function Markets({ account }: { account: Address | null }) {
  const tokenAddresses = useMemo(() => Object.values(BOLEAN_ADDRESSES.tokens) as Address[], []);
  const [symbols, setSymbols] = useState<Record<string, string>>({});
  const [decimals, setDecimals] = useState<Record<string, number>>({});
  const [balances, setBalances] = useState<Record<string, string>>({});

  // Send token modal state
  const [sendOpen, setSendOpen] = useState(false);
  const [sendTokenAddr, setSendTokenAddr] = useState<Address | null>(null);
  const [sendAmount, setSendAmount] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadTokenMeta() {
      for (const addr of tokenAddresses) {
        try {
          const [sym, dec] = await Promise.all([
            publicClient.readContract({ address: addr, abi: ERC20_ABI, functionName: "symbol" }) as Promise<string>,
            publicClient.readContract({ address: addr, abi: ERC20_ABI, functionName: "decimals" }) as Promise<number>,
          ]);
          setSymbols((s) => ({ ...s, [addr]: sym }));
          setDecimals((d) => ({ ...d, [addr]: dec }));
        } catch (e) {
          // ignore if token not available yet
        }
      }
    }
    loadTokenMeta();
  }, [tokenAddresses]);

  useEffect(() => {
    async function loadBalances() {
      if (!account) return setBalances({});
      for (const addr of tokenAddresses) {
        try {
          const dec = decimals[addr] ?? 18;
          const bal = (await publicClient.readContract({
            address: addr,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [getAddress(account)],
          })) as bigint;
          setBalances((b) => ({ ...b, [addr]: formatUnits(bal, dec) }));
        } catch (e) {
          // ignore per-token errors
        }
      }
    }
    loadBalances();
  }, [account, tokenAddresses, decimals]);

  async function openSend(addr: Address) {
    setSendTokenAddr(addr);
    setSendAmount("");
    setSendTo("");
    setSendOpen(true);
  }

  async function sendToken() {
    if (!sendTokenAddr || !sendTo || !sendAmount) return alert("Please provide recipient and amount");
    const eth = (window as any).ethereum;
    if (!eth) return alert("No wallet detected");
    try {
      setSending(true);
      const fromAccounts = await eth.request({ method: "eth_requestAccounts" });
      const from = fromAccounts?.[0];
      if (!from) throw new Error("No account available");

      const dec = decimals[sendTokenAddr] ?? 18;
      const value = parseUnits(sendAmount, dec);
      // encode calldata for transfer
      const { encodeFunctionData } = await import("viem");
      const data = encodeFunctionData({ abi: ERC20_ABI as any, functionName: "transfer", args: [sendTo, value] });

      const params = [{ from, to: sendTokenAddr, data }];
      const txHash = await eth.request({ method: "eth_sendTransaction", params });
      alert(`Transaction submitted: ${txHash}`);
      setSendOpen(false);
      // refresh balances after a short delay
      setTimeout(() => {
        // re-run balances load by toggling account state (simpler: reload page)
        window.location.reload();
      }, 3000);
    } catch (err: any) {
      console.error(err);
      alert(`Send failed: ${err?.message ?? String(err)}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Markets</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Supply and borrow assets on Somnia. Connect your wallet to see balances. Actions are read‑only in this demo until contracts are fully deployed for Bolean.
          </p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
        {tokenAddresses.map((addr) => {
          const sym = symbols[addr] ?? "Token";
          const bal = balances[addr];
          return (
            <div key={addr} className="rounded-xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">{sym}</div>
                <a className="text-xs text-primary hover:underline" href={`https://shannon-explorer.somnia.network/address/${addr}`} target="_blank" rel="noreferrer">
                  View on Explorer
                </a>
              </div>
              <div className="mt-4 text-sm text-muted-foreground break-all">{addr}</div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Your balance</div>
                <div className="font-mono font-semibold">{bal ? Number(bal).toFixed(4) : "–"} {sym}</div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Button disabled className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white">Supply</Button>
                <Button variant="outline" disabled>Borrow</Button>
                <Button onClick={() => openSend(addr)} className="bg-white/6">Send</Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Send modal */}
      {sendOpen && sendTokenAddr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-card/90 p-6">
            <h3 className="text-lg font-semibold">Send {symbols[sendTokenAddr] ?? 'Token'}</h3>
            <div className="mt-4 grid gap-3">
              <label className="text-sm">Recipient address</label>
              <input value={sendTo} onChange={(e) => setSendTo(e.target.value)} className="w-full rounded-md border p-2" placeholder="0x..." />
              <label className="text-sm">Amount</label>
              <input value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} className="w-full rounded-md border p-2" placeholder="0.0" />
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
                <Button onClick={sendToken} className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white" disabled={sending}>Confirm</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Architecture() {
  return (
    <div className="container mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold">Architecture</h2>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        Modular, on‑chain lending protocol built for Somnia. Frontend reads/writes via wallet. Contracts composed of LendingPool, InterestRateModel, RiskEngine, and Token adapters.
      </p>
      <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm">
        <svg className="w-full" viewBox="0 0 1200 520" role="img" aria-label="Bolean Architecture Diagram">
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="1200" height="520" fill="transparent" />
          <g>
            <rect x="60" y="40" width="340" height="110" rx="16" fill="#0ea5e9" opacity="0.12" stroke="url(#g1)" />
            <text x="80" y="90" fontSize="24" fontWeight="700" fill="currentColor">Frontend (Bolean dApp)</text>
            <text x="80" y="120" fontSize="16" fill="currentColor">React + Viem + Wallet (EIP‑1193)</text>
          </g>
          <g>
            <rect x="430" y="40" width="340" height="110" rx="16" fill="#a855f7" opacity="0.12" stroke="url(#g1)" />
            <text x="450" y="90" fontSize="24" fontWeight="700" fill="currentColor">Somnia RPC</text>
            <text x="450" y="120" fontSize="16" fill="currentColor">JSON‑RPC via wallet / public RPC</text>
          </g>
          <g>
            <rect x="800" y="40" width="340" height="110" rx="16" fill="#22d3ee" opacity="0.12" stroke="url(#g1)" />
            <text x="820" y="90" fontSize="24" fontWeight="700" fill="currentColor">Block Explorer</text>
            <text x="820" y="120" fontSize="16" fill="currentColor">Shannon Explorer</text>
          </g>

          <g>
            <rect x="60" y="200" width="340" height="280" rx="16" fill="#0284c7" opacity="0.08" stroke="url(#g1)" />
            <text x="80" y="240" fontSize="22" fontWeight="700" fill="currentColor">Core Contracts</text>
            <text x="80" y="270" fontSize="16" fill="currentColor">LendingPool, Risk, Interest</text>
            <rect x="80" y="290" width="300" height="60" rx="12" fill="transparent" stroke="#06b6d4" />
            <text x="95" y="325" fontSize="16" fill="currentColor">LendingPool: {BOLEAN_ADDRESSES.lendingPool}</text>
            <rect x="80" y="360" width="300" height="40" rx="12" fill="transparent" stroke="#d946ef" />
            <text x="95" y="385" fontSize="16" fill="currentColor">Rates + Risk (modular)</text>
          </g>

          <g>
            <rect x="430" y="200" width="340" height="280" rx="16" fill="#d946ef" opacity="0.08" stroke="url(#g1)" />
            <text x="450" y="240" fontSize="22" fontWeight="700" fill="currentColor">Asset Adapters</text>
            <text x="450" y="270" fontSize="16" fill="currentColor">ERC‑20 tokens</text>
            <rect x="450" y="290" width="300" height="50" rx="12" stroke="#06b6d4" fill="transparent" />
            <text x="465" y="320" fontSize="16" fill="currentColor">Token A: {BOLEAN_ADDRESSES.tokens.tokenA}</text>
            <rect x="450" y="350" width="300" height="50" rx="12" stroke="#06b6d4" fill="transparent" />
            <text x="465" y="380" fontSize="16" fill="currentColor">Token B: {BOLEAN_ADDRESSES.tokens.tokenB}</text>
            <rect x="450" y="410" width="300" height="50" rx="12" stroke="#06b6d4" fill="transparent" />
            <text x="465" y="440" fontSize="16" fill="currentColor">Token C: {BOLEAN_ADDRESSES.tokens.tokenC}</text>
          </g>

          <g>
            <rect x="800" y="200" width="340" height="280" rx="16" fill="#0ea5e9" opacity="0.08" stroke="url(#g1)" />
            <text x="820" y="240" fontSize="22" fontWeight="700" fill="currentColor">Wallets</text>
            <text x="820" y="270" fontSize="16" fill="currentColor">MetaMask & EIP‑1193 compatible</text>
            <text x="820" y="310" fontSize="16" fill="currentColor">- Connect, Switch network</text>
            <text x="820" y="340" fontSize="16" fill="currentColor">- Sign transactions</text>
            <text x="820" y="370" fontSize="16" fill="currentColor">- Read balances</text>
          </g>

          <path d="M230 150 C 230 180, 600 180, 600 150" stroke="url(#g1)" strokeWidth="3" fill="none" />
          <path d="M600 150 C 600 180, 970 180, 970 150" stroke="url(#g1)" strokeWidth="3" fill="none" />
          <path d="M230 200 C 230 180, 230 160, 230 150" stroke="#06b6d4" strokeWidth="2" fill="none" />
          <path d="M600 200 C 600 180, 600 160, 600 150" stroke="#06b6d4" strokeWidth="2" fill="none" />
        </svg>
      </div>
    </div>
  );
}

function Contracts() {
  const entries: { label: string; addr: Address }[] = [
    { label: "LendingPool", addr: BOLEAN_ADDRESSES.lendingPool as Address },
    { label: "Token A", addr: BOLEAN_ADDRESSES.tokens.tokenA as Address },
    { label: "Token B", addr: BOLEAN_ADDRESSES.tokens.tokenB as Address },
    { label: "Token C", addr: BOLEAN_ADDRESSES.tokens.tokenC as Address },
  ];
  return (
    <div className="container mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold">Contract Addresses</h2>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        Deployed on Somnia Testnet. Use the explorer links to verify source and activity.
      </p>
      <div className="mt-6 grid gap-4 md:max-w-3xl">
        {entries.map((e) => (
          <div key={e.addr} className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm">
            <div className="min-w-24 font-medium">{e.label}</div>
            <code className="flex-1 break-all text-sm">{e.addr}</code>
            <a className="text-primary text-sm hover:underline" target="_blank" rel="noreferrer" href={`https://shannon-explorer.somnia.network/address/${e.addr}`}>Explorer</a>
          </div>
        ))}
      </div>
    </div>
  );
}

function Docs() {
  return (
    <div className="container mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold">Documentation & Resources</h2>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        Learn how to build and deploy on Somnia. Follow network info and developer guides.
      </p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <a className="group rounded-xl border border-border/60 bg-card/60 p-6 shadow-sm hover:border-primary/60" href="https://docs.somnia.network/" target="_blank" rel="noreferrer">
          <div className="text-lg font-semibold group-hover:text-primary">Somnia Docs</div>
          <div className="mt-2 text-muted-foreground">Core documentation, guides and concepts.</div>
        </a>
        <a className="group rounded-xl border border-border/60 bg-card/60 p-6 shadow-sm hover:border-primary/60" href="https://docs.somnia.network/developer/network-info" target="_blank" rel="noreferrer">
          <div className="text-lg font-semibold group-hover:text-primary">Network Info</div>
          <div className="mt-2 text-muted-foreground">RPC endpoints, chain ID and explorer links.</div>
        </a>
      </div>
    </div>
  );
}

export default function Index() {
  const [account, setAccount] = useState<Address | null>(null);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((accs: string[]) => {
      if (accs?.[0]) setAccount(accs[0] as Address);
    });
    const onAcc = (accs: string[]) => setAccount((accs?.[0] as Address) ?? null);
    eth.on?.("accountsChanged", onAcc);
    return () => eth.removeListener?.("accountsChanged", onAcc);
  }, []);

  return (
    <Layout>
      <Section id="home" className="bg-gradient-to-b from-background to-transparent">
        <Hero />
        <Stats />
      </Section>

      <Section id="markets" className="py-16 md:py-24">
        <Markets account={account} />
      </Section>

      <Section id="architecture" className="py-16 md:py-24">
        <Architecture />
      </Section>

      <Section id="contracts" className="py-16 md:py-24">
        <Contracts />
      </Section>

      <Section id="docs" className="py-16 md:py-24">
        <Docs />
      </Section>

      <Section id="tokens" className="py-16 md:py-24">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold">Tokens on Somnia Testnet</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">Notable tokens deployed on Somnia Testnet and explorer links.</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <a className="group rounded-xl border border-border/60 bg-card/60 p-6 shadow-sm hover:border-primary/60" href="https://shannon-explorer.somnia.network/token/0x65296738D4E5edB1515e40287B6FDf8320E6eE04" target="_blank" rel="noreferrer">
              <div className="text-lg font-semibold">0x6529...EE04</div>
              <div className="mt-2 text-muted-foreground">View token on Shannon Explorer</div>
              <div className="mt-4 text-sm text-muted-foreground break-all">https://shannon-explorer.somnia.network/token/0x65296738D4E5edB1515e40287B6FDf8320E6eE04</div>
            </a>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
