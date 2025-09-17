import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BOLEAN_ADDRESSES, somniaTestnet } from "@/lib/somnia";
import { ERC20_ABI } from "@/lib/abi";
import { createPublicClient, http, parseUnits } from "viem";
import { toast } from "@/hooks/use-toast";

const publicClient = createPublicClient({ chain: somniaTestnet, transport: http({ url: "/api/rpc" }) });

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function SendToken() {
  const tokenEntries = Object.entries(BOLEAN_ADDRESSES.tokens);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(tokenEntries[0]?.[1] ?? "");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token && tokenEntries[0]) setToken(tokenEntries[0][1]);
  }, [tokenEntries, token]);

  async function send() {
    if (!window.ethereum) return alert("No wallet detected");
    if (!token || !to || !amount) return alert("Please fill token, recipient and amount");
    try {
      setSending(true);
      const fromAccounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const from = fromAccounts?.[0];
      if (!from) throw new Error("No account available");

      // get decimals
      let decimals = 18;
      try {
        const dec = await publicClient.readContract({ address: token, abi: ERC20_ABI, functionName: "decimals" });
        decimals = Number(dec ?? 18);
      } catch (e) {
        // fallback
      }

      const value = parseUnits(amount, decimals);
      const { encodeFunctionData } = await import("viem");
      const data = encodeFunctionData({ abi: ERC20_ABI as any, functionName: "transfer", args: [to, value] });

      const params = [{ from, to: token, data }];
      const txHash = await window.ethereum.request({ method: "eth_sendTransaction", params });
      setOpen(false);

      const t = toast({ title: "Transaction submitted", description: txHash as string });

      // Poll for receipt
      (async () => {
        try {
          const max = 40; // ~2 minutes
          for (let i = 0; i < max; i++) {
            const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` }).catch(() => null);
            if (receipt) {
              if ((receipt as any).status === 1) {
                t.update({ title: "Transaction confirmed", description: txHash as string });
              } else {
                t.update({ title: "Transaction failed", description: txHash as string });
              }
              // notify app to refresh balances
              window.dispatchEvent(new Event("bolean:refreshBalances"));
              return;
            }
            await sleep(3000);
          }
          t.update({ title: "Transaction pending", description: "Still pending after timeout" });
        } catch (err) {
          t.update({ title: "Error checking tx", description: String(err) });
        }
      })();

    } catch (err: any) {
      console.error(err);
      alert(`Send failed: ${err?.message ?? String(err)}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center">
      <Button variant="ghost" onClick={() => setOpen(true)} className="hidden sm:inline-block">Send Token</Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-card/90 p-6">
            <h3 className="text-lg font-semibold">Send Token</h3>
            <div className="mt-4 grid gap-3">
              <label className="text-sm">Token</label>
              <select value={token} onChange={(e) => setToken(e.target.value)} className="w-full rounded-md border p-2">
                {tokenEntries.map(([key, addr]) => (
                  <option key={addr} value={addr}>{key} — {addr}</option>
                ))}
              </select>

              <label className="text-sm">Recipient address</label>
              <input value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-md border p-2" placeholder="0x..." />

              <label className="text-sm">Amount</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-md border p-2" placeholder="0.0" />

              <div className="flex gap-2 justify-end mt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={send} className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white" disabled={sending}>Confirm</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
