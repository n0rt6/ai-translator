<div align="center">

# AI 翻译 · Raycast 扩展

**粘贴任何文本,即可获得流利译文——语言和模型都由你决定。**

</div>

一款[开源](https://github.com/n0rt6/ai-translator)的 Raycast 扩展:自动识别输入语言并翻译为你的**首选语言**——支持 30 种常用语言,翻译完成后还可随时切换译文语言。支持**任意 OpenAI 兼容 API**,模型完全由你选择:DeepSeek、智谱 GLM、Kimi、OpenAI、OpenRouter、本地 Ollama 实例,或任何其他可通过兼容端点访问的模型。

> **[English](docs/README_EN.md)** · MIT License

---

## ✨ 功能特性

- [x] **自动语言检测**——无需手动选择源语言/目标语言;自动识别输入语言并翻译为你的首选语言
- [x] **30 种常用语言**——简体/繁體中文、英语、日语、韩语、法语、德语、西班牙语、葡萄牙语、俄语、意大利语、阿拉伯语、泰语、越南语、印尼语、土耳其语、荷兰语、波兰语、乌克兰语、希腊语、希伯来语、印地语、马来语、捷克语、瑞典语、挪威语、丹麦语、芬兰语、匈牙利语、罗马尼亚语
- [x] **首选翻译语言**——在设置中一次设定;若输入本身就是首选语言,则原样返回并提示"无需翻译"
- [x] **随时切换译文语言**——翻译完成后按 `⌘L`(或操作菜单)选择其他语言,基于已识别的原文语言重新翻译
- [x] **自带模型(BYOM)**——接入任意 OpenAI 兼容端点,用你喜欢的模型,从 `deepseek-chat` 到 `gpt-4o-mini` 再到本地 `qwen3`
- [x] **剪贴板优先的工作流**——呼出命令直接回车,剪贴板内容即刻翻译
- [x] **本地翻译历史**——最近 100 条,可搜索,仅存储在本机
- [x] **思考模型友好**——自动剥离推理块(`<think>…</think>`),兼容 MiniMax 等推理模型
- [x] **端点容错**——既接受 `/v1` 基础地址,也接受完整的 `/chat/completions` 端点
- [x] **隐私设计**——API Key 仅存于 Raycast 本地偏好;无广告、无遥测、无云端中转

## 与同类插件的区别

许多翻译扩展内置固定的一组服务商。本插件把翻译当作一个"模型问题":只要你能连通一个 OpenAI 兼容 API,就能用它翻译——包括通过 [Ollama](https://ollama.com) 实现完全离线的本地翻译。

| | AI 翻译 | 常见同类插件 |
|---|---|---|
| 服务商 | 任意 OpenAI 兼容 API | 固定服务商 |
| 模型选择 | 由你决定(随时更换) | 通常固定 |
| 支持语言 | 30 种常用语言 | 各不相同 |
| 目标语言 | 首选 + 随时切换 | 通常固定 |
| 本地 / 离线 | ✅ 支持(Ollama) | 少有 |
| 翻译历史 | ✅ 内置、本地存储 | 常缺失或云端存储 |
| API Key 存储 | 仅 Raycast 本地偏好 | 各不相同 |
| 端点格式 | 兼容 `/v1` 或完整端点 | 通常仅基础地址 |
| 语言方向 | 自动检测、双向互译 | 通常固定单向 |

## 安装

本插件处于活跃开发中,本地安装方式:

```bash
git clone https://github.com/n0rt6/ai-translator.git
cd ai-translator
npm install
npm run dev
```

完成后扩展出现在 Raycast 根搜索中(`ray develop` 提供热更新;按 `Ctrl+C` 停止后扩展仍可用)。

## 配置

打开 **Raycast 设置 → 扩展 → AI 翻译**,填写三项必填配置:

| 配置项 | 说明 |
|---|---|
| **API 服务** | OpenAI 兼容基础地址,如 `https://api.deepseek.com/v1`;完整的 `/chat/completions` 端点也可以 |
| **API Key** | 对应服务的密钥(仅本地存储,不传输到别处) |
| **模型** | 模型名称,如 `deepseek-chat` |
| **首选翻译语言** | 输入翻译成的语言(默认简体中文);若输入本身就是该语言,则原样返回并提示"无需翻译" |

### 常见服务商填法

| 服务商 | API 服务 | 模型示例 |
|---|---|---|
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | `glm-4.7` |
| Kimi(月之暗面) | `https://api.moonshot.cn/v1` | `kimi-k2` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| OpenRouter | `https://openrouter.ai/api/v1` | `openai/gpt-4o-mini` |
| Ollama(本地) | `http://localhost:11434/v1` | `qwen3` |

需要自备 API Key,各服务商普遍提供免费额度起步。Ollama 是零成本的全本地翻译方案(API Key 填任意非空值即可)。

## 使用方法

1. **粘贴翻译**——呼出 Raycast(默认 `⌥ Space`)→ 输入 `翻译` → 粘贴文本 → 回车
2. **剪贴板翻译**——直接回车打开命令,自动翻译剪贴板内容
3. **切换译文语言**——翻译完成后按 `⌘L`(或"切换译文语言…"操作)选择其他语言,即按已识别的原文语言重新翻译
4. **翻译历史**——输入 `翻译历史` 回车,可搜索、复制、删除历史记录

## 隐私说明

- API Key 仅存储在 Raycast 本地偏好中
- 翻译请求直接从你的 Mac 发往所配置的 API 端点,不经过任何第三方服务器
- 历史记录保存在 Raycast 本地存储;在设置中关闭"保存翻译历史"即完全停止记录

## 致谢

基于 [Raycast API](https://developers.raycast.com) 构建,灵感来自 [raycast/extensions](https://github.com/raycast/extensions) 社区的优秀翻译扩展。

## 许可

[MIT](./LICENSE) © n0rt6
