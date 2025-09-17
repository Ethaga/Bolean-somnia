import { RequestHandler } from "express";

export const handleRpcProxy: RequestHandler = async (req, res) => {
  const rpcUrl = process.env.SOMNIA_RPC_URL || "https://testnet.somnia.network/";
  try {
    // Forward the JSON-RPC request body to the Somnia RPC endpoint
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    // mirror status and content-type
    const contentType = response.headers.get("content-type") || "application/json";
    res.status(response.status).setHeader("content-type", contentType).send(text);
  } catch (err: any) {
    console.error("RPC proxy error:", err?.message ?? err);
    res.status(502).json({ error: "Bad Gateway", message: err?.message ?? String(err) });
  }
};
