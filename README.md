# fnos-tunnel (JavaScript / TypeScript)

fnOS Cloudflare Tunnel SDK for JavaScript and TypeScript.

## 安装

```bash
npm install fnos-tunnel
```

## 快速开始

```typescript
import { TunnelAPIClient } from "fnos-tunnel";

const client = new TunnelAPIClient("http://<your-fnos-ip>:19092", {
  appId: "<your_app_id>",
  appKey: "<your_app_key>",
  appName: "com.example.myapp",
});

// 健康检查
console.log(await client.health());

// 查询 Tunnel 状态
const status = await client.status();
console.log(`Running: ${status.running}`);

// 查询域名状态
const ds = await client.domainStatus();
console.log(`Registered: ${ds.registered}`);

// 注册域名
const result = await client.register("myapp.example.com", "http://localhost:8080");
```

## 构建

```bash
npm run build
```

## 发布到 npm

```bash
npm login
npm publish --access public
```