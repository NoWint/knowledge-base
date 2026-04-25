# Cloudflare Workers 部署指南

## 快速开始

### 1. 安装 Wrangler CLI

```bash
npm install -D wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 创建 KV Namespace

登录 [Cloudflare Dashboard](https://dash.cloudflare.com):

1. 进入 **Workers & Pages**
2. 点击 **Create application**
3. 点击 **KV** 标签
4. 创建三个 Namespace:
   - `USERS_KV`
   - `SYNC_KV`
   - `SUBSCRIPTIONS_KV`

### 4. 配置 KV ID

编辑 `wrangler.toml`，将 `YOUR_XXX_KV_ID` 替换为实际的 ID:

```toml
[[kv_namespaces]]
binding = "USERS_KV"
id = "你的实际ID"  # ← 替换这里
preview_id = "preview_users_kv"
```

### 5. 本地开发测试

```bash
# 方式1: 使用脚本
./dev.sh

# 方式2: 直接运行
wrangler dev
```

访问 http://localhost:8787 测试 API。

### 6. 部署到 Cloudflare

```bash
# 部署到预览环境
wrangler deploy --env preview

# 部署到生产环境
wrangler deploy
```

### 7. 配置自定义域名 (可选)

1. 在 Cloudflare Dashboard 添加域名
2. 在 `wrangler.toml` 中配置:

```toml
[env.production]
routes = [
  { pattern = "api.yourdomain.com", zone_name = "yourdomain.com" }
]
```

## 环境变量

创建 `.dev.vars` 文件:

```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production
API_BASE_URL=https://api.yourdomain.com
```

## API 端点

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/` | API 信息 |
| GET | `/health` | 健康检查 |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |
| GET | `/api/auth/me` | 获取当前用户 |
| POST | `/api/sync/push` | 上传本地变更 |
| GET | `/api/sync/pull` | 拉取服务器变更 |
| GET | `/api/sync/status` | 同步状态 |
| GET | `/api/subscription/plans` | 套餐列表 |
| POST | `/api/subscription/create` | 创建订阅 |

## 免费额度

| 服务 | 免费额度 |
|------|----------|
| Workers | 100,000 请求/天 |
| KV 存储 | 1GB |
| D1 数据库 | 5GB |
| R2 存储 | 10GB |
