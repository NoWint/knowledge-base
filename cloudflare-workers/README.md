# Cloudflare Workers API

基于 Cloudflare Workers 的后端 API 服务，支持用户认证、增量同步和订阅管理。

## 快速开始

### 1. 安装依赖

```bash
cd cloudflare-workers
npm install
```

### 2. 配置

复制环境变量配置：

```bash
cp .env.example .dev.vars
```

编辑 `.dev.vars`：

```
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 3. 创建 KV Namespace

在 Cloudflare Dashboard 创建三个 KV Namespace：
- USERS_KV
- SYNC_KV
- SUBSCRIPTIONS_KV

然后更新 `wrangler.toml` 中的 `id` 和 `preview_id`。

### 4. 本地开发

```bash
npm run dev
```

### 5. 部署

```bash
npm run deploy
```

## API 端点

### 认证

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |
| GET | `/api/auth/me` | 获取当前用户 |
| POST | `/api/auth/refresh` | 刷新 Token |

### 同步

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/sync/push` | 上传本地变更 |
| GET | `/api/sync/pull` | 拉取服务器变更 |
| GET | `/api/sync/status` | 获取同步状态 |
| POST | `/api/sync/resolve-conflict` | 解决冲突 |

### 订阅

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/subscription/plans` | 获取套餐列表 |
| POST | `/api/subscription/create` | 创建订阅 |
| GET | `/api/subscription/status` | 查询订阅状态 |
| POST | `/api/subscription/cancel` | 取消订阅 |

## 技术栈

- **运行时**: Cloudflare Workers
- **框架**: Hono
- **认证**: JWT (jsonwebtoken)
- **密码**: bcryptjs
- **存储**: Cloudflare KV
