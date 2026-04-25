#!/bin/bash

echo "🧪 本地测试 Cloudflare Workers"
echo "================================"

# 启动本地开发服务器
echo "🚀 启动本地 Workers 开发服务器..."
echo "   API 将在 http://localhost:8787 运行"
echo ""
echo "   测试端点:"
echo "   - GET  http://localhost:8787/"
echo "   - GET  http://localhost:8787/health"
echo "   - POST http://localhost:8787/api/auth/register"
echo "   - POST http://localhost:8787/api/auth/login"
echo "   - GET  http://localhost:8787/api/subscription/plans"
echo ""
echo "   按 Ctrl+C 停止服务器"
echo ""

wrangler dev
