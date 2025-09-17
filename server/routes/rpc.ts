import { RequestHandler } from "express";

const DEFAULT_RPCS = [
  "https://testnet.somnia.network/",
  "https://devnet.somnia.network/",
  "https://dream-rpc.somnia.network/",
  "https://www.ankr.com/rpc/somnia/",
];

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000,
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(id);
  }
}

export const handleRpcProxy: RequestHandler = async (req, res) => {
  // Support GET for simple health checks
  if (req.method === "GET") {
    return res.json({
      ok: true,
      rpc: process.env.SOMNIA_RPC_URL || DEFAULT_RPCS[0],
    });
  }

  const payload = req.body;
  if (!payload) return res.status(400).json({ error: "Missing JSON-RPC body" });

  const rpcs = [process.env.SOMNIA_RPC_URL, ...DEFAULT_RPCS].filter(
    Boolean,
  ) as string[];
  const errors: { url: string; error: string }[] = [];

  for (const url of rpcs) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        10000,
      );

      if (!response) {
        errors.push({ url, error: "No response" });
        continue;
      }

      const text = await response.text();
      const contentType =
        response.headers.get("content-type") || "application/json";
      // return the first successful response
      return res
        .status(response.status)
        .setHeader("content-type", contentType)
        .send(text);
    } catch (err: any) {
      const msg =
        err?.name === "AbortError" ? "Timeout" : (err?.message ?? String(err));
      errors.push({ url, error: msg });
      // try next RPC
    }
  }

  console.error("RPC proxy: all upstreams failed", errors);
  return res
    .status(502)
    .json({
      error: "Bad Gateway",
      message: "All upstream RPCs failed",
      details: errors,
    });
};
