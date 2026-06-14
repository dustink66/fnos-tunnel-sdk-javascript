/**
 * fnOS Cloudflare Tunnel SDK for JavaScript / TypeScript.
 *
 * Supports both the CGI interface (fnOS gateway proxy, no auth) and the
 * independent HTTP API (port 19092, requires credentials).
 *
 * @example CGI (no auth)
 * ```ts
 * import { TunnelCGIClient } from "fnos-tunnel";
 *
 * const client = new TunnelCGIClient("http://192.168.1.100");
 * const status = await client.status();
 * console.log(status.running);
 * ```
 *
 * @example HTTP API (with auth)
 * ```ts
 * import { TunnelAPIClient } from "fnos-tunnel";
 *
 * const client = new TunnelAPIClient("http://192.168.1.100:19092", {
 *   appId: "app_xxx",
 *   appKey: "your_app_key",
 * });
 * const healthy = await client.health();
 * ```
 */

export { TunnelCGIClient } from "./client-cgi";
export { TunnelAPIClient } from "./client-api";
export type {
  TunnelStatus,
  DomainRegistration,
  CGIRegisterResult,
  DomainStatusResult,
  APIClientOptions,
} from "./types";
export { APIError } from "./types";