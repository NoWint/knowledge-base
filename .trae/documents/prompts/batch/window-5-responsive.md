# 窗口 5: 响应式布局

## 任务概述
正确实现移动端适配，确保在窄屏和宽屏下都能正常显示。

## 完整任务列表

### Task 5.1: 修复侧边栏布局

**文件**: `src/components/layout/app-layout.tsx`

当前问题是宽屏/窄屏切换时显示不正常。需要：

```typescript
// 正确的逻辑：
// 1. 宽屏 (>= 768px): 侧边栏 relative，不位移，内容区 marginLeft
// 2. 窄屏 (< 768px): 侧边栏 fixed + x动画，内容区 marginLeft: 0

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

// 侧边栏
<motion.aside
  animate={{
    x: isMobile ? (isMobileMenuOpen ? 0 : -260) : 0,
  }}
  className={cn(
    "h-screen overflow-hidden border-r bg-white",
    !isMobile && "relative"  // 宽屏时 relative
  )}
/>

// 内容区
<motion.main
  animate={{ marginLeft: isMobile ? 0 : isCollapsed ? 64 : 240 }}
/>
```

### Task 5.2: 添加窗口宽度监听

```typescript
const [isMobile, setIsMobile] = useState(false)

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768)
  }

  checkMobile()
  window.addEventListener('resize', checkMobile)
  return () => window.removeEventListener('resize', checkMobile)
}, [])
```

### Task 5.3: 移动端菜单按钮

确保汉堡菜单按钮在窄屏时显示：

```typescript
// 汉堡菜单按钮 - 只在移动端显示
<button
  className={cn(
    "fixed top-4 left-4 z-50 p-2 rounded-md border bg-white shadow-sm md:hidden",
    isMobileMenuOpen && "hidden"  // 菜单打开时隐藏
  )}
  onClick={() => setIsMobileMenuOpen(true)}
>
  <Menu className="h-5 w-5" />
</button>
```

### Task 5.4: 移动端菜单遮罩

```typescript
<AnimatePresence>
  {isMobile && isMobileMenuOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 bg-black/50 md:hidden"
      onClick={() => setIsMobileMenuOpen(false)}
    />
  )}
</AnimatePresence>
```

### Task 5.5: 内容区 padding 调整

窄屏时内容区需要留出顶部空间给汉堡按钮：

```typescript
<motion.main
  animate={{ marginLeft: isMobile ? 0 : isCollapsed ? 64 : 240 }}
  className={cn("min-h-screen", isMobile && "pt-16")}  // 窄屏时添加顶部 padding
>
```

### Task 5.6: 测试验证

在不同窗口宽度下测试：
- < 768px: 侧边栏隐藏，汉堡按钮显示，点击可打开
- >= 768px: 侧边栏显示，内容区有左边距

## 验收标准
1. 窗口缩小时侧边栏消失，显示汉堡按钮
2. 点击汉堡按钮侧边栏从左侧滑入
3. 点击遮罩或关闭按钮侧边栏滑出
4. 窗口放大时侧边栏正常显示
5. 动画流畅无闪烁

## 注意事项
- 使用 Tailwind 的 `md:` 断点
- 动画使用 framer-motion
- 确保 z-index 层级正确
