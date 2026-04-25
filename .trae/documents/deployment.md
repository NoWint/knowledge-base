# 知识库学习系统 - 部署指南 (Deployment Guide)

## 1. 本地开发

### 1.1 环境要求
- Node.js 18+ 
- npm 9+ 或 pnpm 8+
- 现代浏览器（Chrome 90+, Firefox 90+, Safari 14+）

### 1.2 安装依赖
```bash
npm install
```

### 1.3 启动开发服务器
```bash
npm run dev
```
访问 http://localhost:3000

### 1.4 开发命令
```bash
# 类型检查
npx tsc --noEmit

# 代码检查
npm run lint

# 代码格式化
npx prettier --write .
```

---

## 2. 生产构建

### 2.1 构建命令
```bash
# 构建
npm run build

# 静态导出
npm run export
```

### 2.2 输出目录
构建产物位于 `out/` 目录，结构如下：
```
out/
├── index.html
├── _next/
│   ├── static/
│   └── ...
├── subjects/
│   └── index.html
└── ...
```

### 2.3 本地预览
```bash
# 使用 serve 预览
npx serve out

# 或使用 python
cd out && python -m http.server 3000
```

---

## 3. GitHub Pages 部署

### 3.1 方式一：GitHub Actions（推荐）

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build && npm run export
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 3.2 方式二：手动部署

```bash
# 1. 构建
npm run build && npm run export

# 2. 创建 gh-pages 分支
cd out
git init
git add .
git commit -m "Deploy"
git push -f git@github.com:username/repository.git main:gh-pages
```

### 3.3 配置 GitHub Pages
1. 进入仓库 Settings → Pages
2. Source 选择 "GitHub Actions"
3. 保存后自动部署

### 3.4 自定义域名（可选）
1. 在 `public/` 目录创建 `CNAME` 文件
2. 内容写入你的域名，例如: `learn.example.com`
3. 在域名 DNS 设置 CNAME 指向 `username.github.io`

---

## 4. 其他部署方式

### 4.1 Vercel（全栈模式）
如果后续需要后端功能：
```bash
npm i -g vercel
vercel
```

### 4.2 Netlify
```bash
# 安装 CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod --dir=out
```

### 4.3 本地服务器
```bash
# 使用 nginx
server {
    listen 80;
    server_name localhost;
    root /path/to/out;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 5. 性能优化

### 5.1 构建优化
```javascript
// next.config.js
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  compress: true,
  poweredByHeader: false,
};
```

### 5.2 缓存策略
在 `public/sw.js` 配置 Service Worker：
```javascript
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/_next/static/',
      ]);
    })
  );
});
```

### 5.3 资源压缩
```bash
# 安装压缩插件
npm i -D compression-webpack-plugin

# 或使用 brotli
npm i -D brotli-webpack-plugin
```

---

## 6. 监控与维护

### 6.1 错误监控
```typescript
// 全局错误捕获
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // 可上报到监控服务
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});
```

### 6.2 存储监控
```typescript
// 检查 IndexedDB 使用情况
async function checkStorageUsage() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usage = (estimate.usage / 1024 / 1024).toFixed(2);
    const quota = (estimate.quota / 1024 / 1024).toFixed(2);
    console.log(`Storage: ${usage}MB / ${quota}MB`);
  }
}
```

### 6.3 数据备份提醒
```typescript
// 定期提醒用户备份
function checkBackupReminder() {
  const lastBackup = localStorage.getItem('lastBackupDate');
  if (!lastBackup) return;
  
  const daysSinceBackup = (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceBackup > 30) {
    // 提醒备份
    showBackupReminder();
  }
}
```

---

## 7. 故障排查

### 7.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 页面空白 | 构建失败 | 检查控制台错误 |
| 数据丢失 | 浏览器清除数据 | 从备份恢复 |
| 存储已满 | 文件过多 | 清理文件或导出后删除 |
| 页面 404 | 路由配置错误 | 检查 next.config.js |

### 7.2 数据恢复
```typescript
// 从 JSON 文件恢复
async function restoreFromBackup(file: File) {
  const content = await file.text();
  const data = JSON.parse(content);
  
  await db.transaction('rw', db.tables, async () => {
    // 清空现有数据
    await Promise.all(db.tables.map(t => t.clear()));
    
    // 导入备份数据
    for (const [tableName, records] of Object.entries(data)) {
      await db.table(tableName).bulkAdd(records);
    }
  });
}
```

---

## 8. 版本更新

### 8.1 数据库升级
```typescript
// 当需要修改数据结构时
db.version(2).stores({
  // 新增 stores
  achievements: 'id, userId, type',
}).upgrade(async (trans) => {
  // 数据迁移逻辑
  const users = await trans.table('users').toArray();
  // ...迁移逻辑
});
```

### 8.2 用户提示
```typescript
// 检测到新版本
function checkForUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }
}
```

---

## 9. 安全注意事项

### 9.1 数据保护
- 所有数据存储在本地浏览器
- 不向任何服务器发送数据
- 用户可完全控制数据

### 9.2 清除数据
```typescript
// 提供清除所有数据的功能
async function clearAllData() {
  if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
    await db.delete();
    localStorage.clear();
    window.location.reload();
  }
}
```

---

## 10. 部署检查清单

- [ ] 本地构建成功 (`npm run build && npm run export`)
- [ ] 本地预览正常 (`npx serve out`)
- [ ] 无控制台错误
- [ ] GitHub Actions 配置正确
- [ ] GitHub Pages 设置完成
- [ ] 自定义域名配置（如需要）
- [ ] HTTPS 启用
- [ ] 性能测试通过
- [ ] 移动端适配测试
