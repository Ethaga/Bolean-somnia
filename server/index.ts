import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleRpcProxy } from "./routes/rpc";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // JSON-RPC proxy to Somnia RPC to avoid CORS issues from the browser
  // Accepts any JSON-RPC payload and forwards to the configured Somnia RPC URL.
  // Set SOMNIA_RPC_URL in env to override the default endpoint.
  const { handleRpcProxy } = await import("./routes/rpc");
  app.post("/api/rpc", handleRpcProxy);

  return app;
}
