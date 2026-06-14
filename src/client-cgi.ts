/**
 * TunnelCGIClient — CGI 接口（通过 fnOS 网关代理，无需认证）。
 *
 * ```
 * const client = new TunnelCGIClient("http://192.168.1.100");
 * const status = await client.status();
 * ```
 */

import type { TunnelStatus, CGIRegisterResult, DomainStatusResult } from "./types";
import { APIError } from "./types";

const CGI_PATH = "/cgi/ThirdParty/com.dustinky.tunnel/api.cgi";

export class TunnelCGIClient {
  private base: string;
  private timeout: number;

  /**
   * @param baseUrl - fnOS 设备地址，如 `http://192.168.1.100`
   * @param timeout - 请求超时毫秒数，默认 10000
   */
  constructor(baseUrl: string, timeout = 10000) {
    this.base = baseUrl.replace(/\/$/, "");
    this.timeout = timeout;
  }

  // -----------------------------------------------------------------
  // 1. 查询 Tunnel 运行状态
  // -----------------------------------------------------------------

  /** 查询 Tunnel 运行状态。 */
  async status(): Promise<TunnelStatus> {
    const data = await this.get("status");
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
  // 2. 注册/更新域名
  // -----------------------------------------------------------------

  /**
   * 注册或更新应用的域名转发规则。
   *
   * @param appName - 应用唯一标识（如 `com.dustinky.qwenpaw`）
   * @param domain - 完整域名（如 `qwenpaw.example.com`）
   * @param service - 本地服务地址（如 `http://localhost:19091`）
   */
  async registerAppDomain(
    appName: string,
    domain: string,
    service: string,
  ): Promise<CGIRegisterResult> {
    const data = await this.post("register_app_domain", { appName, domain, service });
    return {
      success: data.success ?? false,
      tunnelId: data.result?.tunnel_id,
      errors: data.errors ?? [],
      messages: data.messages ?? [],
      rawConfig: data.result?.config,
    };
  }

  // -----------------------------------------------------------------
  // 3. 查询应用域名注册状态
  // -----------------------------------------------------------------

  /**
   * 查询应用的域名注册状态。
   *
   * @param appName - 应用唯一标识
   */
  async getAppDomainStatus(appName: string): Promise<DomainStatusResult> {
    const data = await this.get("get_app_domain_status", { appName });
    return {
      registered: data.registered ?? false,
      appName: data.appName ?? appName,
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

  private async get(action: string, params?: Record<string, string>): Promise<Record<string, any>> {
    const p = new URLSearchParams({ action, ...(params ?? {}) });
    const url = `${this.base}${CGI_PATH}?${p}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(this.timeout) });
    return this.handle(resp);
  }

  private async post(action: string, body: Record<string, unknown>): Promise<Record<string, any>> {
    const url = `${this.base}${CGI_PATH}?${new URLSearchParams({ action })}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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