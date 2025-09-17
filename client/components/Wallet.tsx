import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { somniaTestnet, SOMNIA_CHAIN_ID_HEX } from "@/lib/somnia";
import {
  createPublicClient,
  formatEther,
  http,
  isAddress,
  type Address,
} from "viem";

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http({ url: "/api/rpc" }),
});

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function WalletConnect() {
  const [account, setAccount] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const isOnSomnia =
    chainId?.toLowerCase() === SOMNIA_CHAIN_ID_HEX.toLowerCase();

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;

    eth.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts?.[0] && isAddress(accounts[0])) {
        setAccount(accounts[0] as Address);
        window.dispatchEvent(
          new CustomEvent("bolean:accountChanged", { detail: accounts[0] }),
        );
      }
    });
    eth
      .request({ method: "eth_chainId" })
      .then((cid: string) => setChainId(cid));

    const handleAccountsChanged = (accs: string[]) => {
      const acc = accs?.[0] && isAddress(accs[0]) ? (accs[0] as Address) : null;
      setAccount(acc);
      window.dispatchEvent(
        new CustomEvent("bolean:accountChanged", { detail: acc }),
      );
    };
    const handleChainChanged = (cid: string) => {
      setChainId(cid);
    };

    eth.on?.("accountsChanged", handleAccountsChanged);
    eth.on?.("chainChanged", handleChainChanged);

    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged);
      eth.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    async function loadBalance() {
      if (account && isOnSomnia) {
        const bal = await publicClient.getBalance({ address: account });
        setBalance(formatEther(bal));
      } else {
        setBalance(null);
      }
    }
    loadBalance();
  }, [account, isOnSomnia]);

  const label = useMemo(() => {
    if (!window.ethereum) return "Install Wallet";
    if (!account) return "Connect Wallet";
    const short = `${account.slice(0, 6)}…${account.slice(-4)}`;
    return short;
  }, [account]);

  async function connect() {
    const eth = window.ethereum;
    if (!eth) {
      window.open("https://metamask.io", "_blank");
      return;
    }
    const accs = await eth.request({ method: "eth_requestAccounts" });
    const acc = accs?.[0];
    setAccount(acc);
    window.dispatchEvent(
      new CustomEvent("bolean:accountChanged", { detail: acc }),
    );
  }

  function disconnect() {
    // No standard programmatic disconnect for injected wallets; clear local state
    setAccount(null);
    window.dispatchEvent(
      new CustomEvent("bolean:accountChanged", { detail: null }),
    );
  }

  async function switchToSomnia() {
    const eth = window.ethereum;
    if (!eth) return;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SOMNIA_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      // 4902 = chain not added
      if (
        switchError?.code === 4902 ||
        switchError?.message?.includes?.("Unrecognized chain ID")
      ) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SOMNIA_CHAIN_ID_HEX,
              chainName: somniaTestnet.name,
              nativeCurrency: somniaTestnet.nativeCurrency,
              rpcUrls: somniaTestnet.rpcUrls.default.http,
              blockExplorerUrls: [somniaTestnet.blockExplorers?.default.url!],
            },
          ],
        });
      } else {
        console.error(switchError);
      }
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={connect} variant="secondary" className="font-semibold">
        {label}
      </Button>
      {account && (
        <Button variant="ghost" onClick={disconnect} className="text-sm">
          Disconnect
        </Button>
      )}
      {!isOnSomnia && (
        <Button
          onClick={switchToSomnia}
          className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white"
        >
          Switch to Somnia
        </Button>
      )}
      {isOnSomnia && balance && (
        <div className="text-sm text-muted-foreground">
          Balance:{" "}
          <span className="font-mono font-semibold text-foreground">
            {Number(balance).toFixed(4)} STT
          </span>
        </div>
      )}
    </div>
  );
}
