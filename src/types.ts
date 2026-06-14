/**
 * Shared type definitions for the fnOS Cloudflare Tunnel SDK.
 */

/** Tunnel 运行状态 */
export interface TunnelStatus {
  /** Tunnel 进程是否正在运行 */
  running: boolean;
  /** 健康状态: `healthy` / `down` */
  status: string;
  /** 进程 PID */
  pid?: string;
  /** 设备架构: `amd64` / `arm64` */
  arch?: string;
  /** 启动时间戳（秒） */
  startAt?: number;
  /** 当前运行的 Tunnel ID */
  tunnelId?: string;
}

/** 域名注册信息 */
export interface DomainRegistration {
  /** 应用唯一标识 */
  appName: string;
  /** 完整域名 */
  domain: string;
  /** 本地服务地址 */
  service: string;
}

/** CGI 域名注册结果 */
export interface CGIRegisterResult {
  /** 是否成功 */
  success: boolean;
  /** Tunnel ID */
  tunnelId?: string;
  /** 错误列表 */
  errors: string[];
  /** 消息列表 */
  messages: string[];
  /** Cloudflare 返回的原始 ingress 配置 */
  rawConfig?: Record<string, unknown>;
}

/** 域名注册状态查询结果 */
export interface DomainStatusResult {
  /** 是否已注册 */
  registered: boolean;
  /** 应用名称 */
  appName: string;
  /** 注册的域名 */
  domain?: string;
  /** 注册的本地服务地址 */
  service?: string;
  /** DNS CNAME 记录是否有效 */
  dnsValid?: boolean;
  /** ingress 规则是否仍在配置中 */
  ingressValid?: boolean;
  /** Tunnel 进程是否运行中 */
  tunnelRunning: boolean;
  /** Cloudflare 账号是否已配置 */
  cfConfigured: boolean;
  /** 附加消息 */
  message?: string;
}

/** API 客户端配置 */
export interface APIClientOptions {
  /** API 凭证的 appId */
  appId: string;
  /** API 凭证的 appKey */
  appKey: string;
  /** 应用名称（如 `com.dustinky.qwenpaw`），注册域名时使用 */
  appName?: string;
  /** 请求超时毫秒数，默认 10000 */
  timeout?: number;
}

/** API 错误 */
export class APIError extends Error {
  success: boolean;
  raw?: Record<string, unknown>;

  constructor(message: string, raw?: Record<string, unknown>) {
    super(message);
    this.name = "APIError";
    this.success = false;
    this.raw = raw;
  }
}