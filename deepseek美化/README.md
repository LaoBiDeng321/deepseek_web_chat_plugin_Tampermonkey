# DeepSeek 气泡美化

适用于 [DeepSeek Chat](https://chat.deepseek.com/) 的 Tampermonkey 油猴脚本，为对话界面添加气泡样式、头像和 HR 分块分割。

## 许可证

MIT 许可证开源。

## 功能特性

- **气泡分割** — 检测 AI 回复中的 `<hr>` 分隔符，将单条消息拆分为多个独立气泡
- **气泡着色** — AI 消息蓝色气泡，用户消息绿色气泡（微信风格）
- **自定义颜色** — 右下角设置按钮，实时调整 AI / 用户气泡颜色
- **头像注入** — AI 消息旁显示 DeepSeek 图标，用户消息旁显示用户图标
- **思维链适配** — 自动识别思考块，头像定位到"已思考"行，思维链内容不染色
- **预加载渲染** — CSS 预加载机制，DOM 出现瞬间即着色+定位+分割，滚动无闪烁无跳动
- **亮暗模式** — 气泡文字固定白色（饱和色底配白字），思维链文字使用 DeepSeek 官方 CSS 变量 `--dsw-alias-label-secondary` 自动适配

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 打开 `deepseek_enhanced_v5.user.js` 文件
3. 按照 Tampermonkey 提示安装脚本

## 使用

访问 [DeepSeek Chat](https://chat.deepseek.com/) 后脚本自动生效。点击页面右下角的调色板按钮可调整气泡颜色。

## 设计思路

### 预加载双层 CSS

脚本采用两层 CSS 确保视觉一致性：

| 层级 | 作用 | 生效时机 |
|------|------|---------|
| 预加载层 | `div.ds-markdown` / `.fbb737a4` 选择器直接着色 | DOM 出现瞬间 |
| JS 精确层 | `.ds-ai-styled` / `.ds-user-styled` 注入类名 | JS 处理后 |

两层 CSS 的颜色和布局属性完全一致，用户滚动时看不到任何跳动。

### HR 分割高度匹配

预加载层通过 HR 的 `margin:19px 0`（共 38px）精确模拟分割后的气泡内边距（28px）+ 间距（10px），确保 JS 分割前后总高度零差异。

### 头像绝对定位

头像以 `position:absolute` 插入目标元素内部，不移动任何 DOM 节点，避免破坏 DeepSeek 原始结构导致思维链收起时崩溃。

- 有思维链：头像插入"已思考"行，绝对定位 `left:-46px;top:0`
- 无思维链：头像插入第一个气泡，绝对定位 `left:-46px;top:0`
- 用户头像：插入气泡内部，绝对定位 `right:-46px;top:0`

### 思维链识别

通过多重匹配识别思考块，防止其内容被染色：

- 哈希类名 `e1675d8b`
- 自定义类名 `ds-thinking`
- 部分匹配 `think-block` / `thought`
- 文本内容"已思考"

识别后重置为透明背景 + DeepSeek 官方 CSS 变量颜色。

### 颜色策略

| 场景 | 颜色 | 原因 |
|------|------|------|
| AI 气泡文字 | `#fff` 固定白色 | 饱和色背景必须白字，对比度最高 |
| 用户气泡文字 | `#fff` 固定白色 | 同上 |
| 思维链文字 | `var(--dsw-alias-label-secondary)` | 透明背景跟随 DS 官方变量，自动适配主题 |

### DOM 监听

- `MutationObserver` 监听 `document.body` 子树变化
- 防抖 200ms 避免频繁触发
- `WeakSet` 跟踪已处理节点，避免重复处理
- 流式输出中即时着色+头像注入，稳定后再做 HR 分割
