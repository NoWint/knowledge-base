# 第二轮 6 窗口并行任务

## 任务分配

| 窗口 | 文件 | 专攻方向 | 核心任务 |
|-----|------|---------|---------|
| **1** | `window-1-sm2.md` | SM-2 复习闭环 | Practice + Review 完整闭环 |
| **2** | `window-2-stats.md` | 数据可视化 | Stats 页面集成新组件 |
| **3** | `window-3-goals.md` | 学习目标 | Goals 页面 + 首页集成 |
| **4** | `window-4-cards.md` | 闪卡生态 | 知识点/错题联动 + SM-2 |
| **5** | `window-5-responsive.md` | 响应式布局 | 移动端适配（正确实现） |
| **6** | `window-6-cleanup.md` | 清理集成 | 类型检查 + 构建 + 路由 |

---

## 快速开始

### 窗口 1: SM-2 复习闭环 🔴 最关键
打开 `.trae/documents/prompts/batch/window-1-sm2.md` 查看详细提示词

### 窗口 2: 数据可视化
打开 `.trae/documents/prompts/batch/window-2-stats.md` 查看详细提示词

### 窗口 3: 学习目标
打开 `.trae/documents/prompts/batch/window-3-goals.md` 查看详细提示词

### 窗口 4: 闪卡生态
打开 `.trae/documents/prompts/batch/window-4-cards.md` 查看详细提示词

### 窗口 5: 响应式布局
打开 `.trae/documents/prompts/batch/window-5-responsive.md` 查看详细提示词

### 窗口 6: 清理与集成
打开 `.trae/documents/prompts/batch/window-6-cleanup.md` 查看详细提示词

---

## 执行顺序建议

**第一波（可完全并行）：**
```
窗口 1: SM-2 复习闭环 ← 最重要！
窗口 2: 数据可视化
窗口 3: 学习目标
窗口 4: 闪卡生态
窗口 5: 响应式布局
窗口 6: 清理与集成（先做类型检查部分）
```

**第二波（等第一波完成后）：**
```
窗口 6: 运行构建测试
窗口 6: 更新文档
```

---

## 重要提示

1. **窗口 1 最关键** - 这是核心功能，SM-2 算法从未被调用
2. **先做 Task 6.6 类型检查** - 提前发现问题
3. **所有窗口完成后** - 运行 `npm run build` 验证

---

## 文件清单

```
.trae/documents/prompts/batch/
├── README.md          # 本文件
├── window-1-sm2.md    # 窗口 1: SM-2 复习闭环
├── window-2-stats.md  # 窗口 2: 数据可视化
├── window-3-goals.md   # 窗口 3: 学习目标
├── window-4-cards.md  # 窗口 4: 闪卡生态
├── window-5-responsive.md  # 窗口 5: 响应式布局
└── window-6-cleanup.md    # 窗口 6: 清理与集成
```
