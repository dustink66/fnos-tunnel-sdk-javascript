/**
 * TunnelAPIClient — 独立 HTTP API 客户端（端口 19092，需认证）。
 *
 * ```
 * const client = new TunnelAPIClient("http://192.168.1.100:19092", {
 *   appId: "app_xxx",
 *   appKey: "your_app_key",
 * });
 * await client.register("qwenpaw.example.com", "http://localhost:19091");
 * ```
 */

import type { TunnelStatus, CGIRegisterResult, DomainStatusResult, APIClientOptions } from "./types";
import { APIError } from "./types";

export class TunnelAPIClient {
  private base: string;
  private appId: string;
  private appKey: string;
  private appName: string;
  private timeout: number;

  /**
   * @param baseUrl - 完整地址，如 `http://192.168.1.100:19092`
   * @param options - 认证与超时配置，可包含 appName 用于注册域名
   */
  constructor(baseUrl: string, options: APIClientOptions) {
    this.base = baseUrl.replace(/\/$/, "");
    this.appId = options.appId;
    this.appKey = options.appKey;
    this.appName = options.appName ?? "";
    this.timeout = options.timeout ?? 10000;
  }

  private get headers(): Record<string, string> {
    return { "X-App-Id": this.appId, "X-App-Key": this.appKey };
  }

  // -----------------------------------------------------------------
  // 1. 健康检查
  // -----------------------------------------------------------------

  /** 健康检查（无需认证）。 */
  async health(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.base}/api/health`, {
        signal: AbortSignal.timeout(this.timeout),
      });
      const data = await resp.json();
      return data.success === true;
    } catch {
      return false;
    }
  }

  // -----------------------------------------------------------------
  // 2. 查询 Tunnel 运行状态
  // -----------------------------------------------------------------

  /** 查询 Tunnel 运行状态（需认证）。 */
  async status(): Promise<TunnelStatus> {
    const data = await this.get("/api/status");
    return {
      running: data.running ?? false,
      status: data.status ?? "down",
      pid: data.pid,
      arch: data.arch,
      startAt: data.startAt,
      tunnelId: data.tunnelId,
    };
  }

  // -----------------------------------------------------------------
  // 3. 注册/更新域名
  // -----------------------------------------------------------------

  /**
   * 注册或更新域名转发规则。
   *
   * @param domain - 完整域名
   * @param service - 本地服务地址
   * @param appName - 应用名称（可选），不传则使用客户端配置的 appName
   */
  async register(domain: string, service: string, appName?: string): Promise<CGIRegisterResult> {
    const data = await this.post("/api/register", {
      appName: appName ?? this.appName,
      domain,
      service,
    });
    return {
      success: data.success ?? false,
      tunnelId: data.result?.tunnel_id,
      errors: data.errors ?? [],
      messages: data.messages ?? [],
      rawConfig: data.result?.config,
    };
  }

  // -----------------------------------------------------------------
  // 4. 查询域名注册状态
  // -----------------------------------------------------------------

  /**
   * 查询域名注册状态。
   *
   * `appName` 不传时自动使用凭证绑定的 appName。
   *
   * @param appName - 应用唯一标识（可选）
   */
  async domainStatus(appName?: string): Promise<DomainStatusResult> {
    const params = new URLSearchParams();
    if (appName) params.set("appName", appName);
    const qs = params.toString();
    const data = await this.get(`/api/domain-status${qs ? `?${qs}` : ""}`);
    return {
      registered: data.registered ?? false,
      appName: data.appName ?? appName ?? "",
      domain: data.domain,
      service: data.service,
      dnsValid: data.dnsValid,
      ingressValid: data.ingressValid,
      tunnelRunning: data.tunnelRunning ?? false,
      cfConfigured: data.cfConfigured ?? false,
      message: data.message,
    };
  }

  // -----------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------

  private async get(path: string): Promise<Record<string, any>> {
    const resp = await fetch(`${this.base}${path}`, {
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout),
    });
    return this.handle(resp);
  }

  private async post(path: string, body: Record<string, unknown>): Promise<Record<string, any>> {
    const resp = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });
    return this.handle(resp);
  }

  private async handle(resp: Response): Promise<Record<string, any>> {
    let data: any;
    try {
      data = await resp.json();
    } catch {
      throw new APIError(`Invalid JSON response: ${(await resp.text()).slice(0, 200)}`);
    }
    if (typeof data !== "object" || data === null) {
      throw new APIError("Unexpected response format");
    }
    if (data.success === false) {
      throw new APIError(data.message ?? "Unknown error", data);
    }
    return data;
  }
}