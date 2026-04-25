#!/bin/bash

echo "🚀 Knowledge Base API - Cloudflare Workers 部署脚本"
echo "=================================================="

# 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI 未安装"
    echo "请运行: npm install -D wrangler"
    exit 1
fi

# 检查环境变量
if [ ! -f .dev.vars ]; then
    echo "⚠️  .dev.vars 文件不存在，创建示例..."
    cat > .dev.vars << 'EOF'
JWT_SECRET=your-super-secret-jwt-key-change-in-production
API_BASE_URL=https://api.knowledgestudy.com
EOF
    echo "✅ 已创建 .dev.vars，请编辑并填入真实密钥"
fi

echo ""
echo "📋 部署前检查清单:"
echo "   1. ✅ Cloudflare 账号已注册"
echo "   2. ⏳ 创建 KV Namespace (见下方说明)"
echo "   3. ⏳ 更新 wrangler.toml 中的 KV ID"
echo ""

echo "📝 KV Namespace 创建步骤:"
echo "   1. 登录 https://dash.cloudflare.com"
echo "   2. 进入 Workers & Pages"
echo "   3. 点击 'Create KV Namespace'"
echo "   4. 创建三个 Namespace:"
echo "      - USERS_KV"
echo "      - SYNC_KV"
echo "      - SUBSCRIPTIONS_KV"
echo "   5. 复制 ID 并更新 wrangler.toml"
echo ""

read -p "是否跳过 KV 配置直接部署到预览环境? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 部署到预览环境..."
    wrangler deploy --env preview
    echo "✅ 预览部署完成!"
    echo "测试命令: curl https://api.your-subdomain.workers.dev/health"
else
    echo "部署已取消。请先配置 KV Namespace。"
fi
