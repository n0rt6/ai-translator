# AI 翻译 (Raycast 扩展)

粘贴外语自动识别并翻译成中文，中文自动译成英文（中英互译，目标语言可配置）。
通过 OpenAI 兼容 API 调用任意指定模型，附本地翻译历史。

> 开源协议：[MIT](./LICENSE)。欢迎使用、修改与分发。

## 使用

1. **粘贴翻译**：呼出 Raycast（默认 `⌥ Space`）→ 输入 `翻译` → 按空格 → 粘贴文本 → 回车
2. **剪贴板翻译**：输入 `翻译` 直接回车，自动翻译剪贴板中的文本
3. **翻译历史**：输入 `翻译历史` 回车，可搜索 / 复制 / 删除

## 配置（首次使用必填）

Raycast 设置 → 扩展 → AI 翻译：

| 配置项 | 填写内容 |
|--------|----------|
| API 服务 | OpenAI 兼容接口地址（含 `/v1` 层级） |
| API Key | 对应服务的密钥 |
| 模型 | 模型名称，以服务商文档为准 |

### 常见服务商填法

| 服务商 | API 服务 | 模型示例 |
|--------|----------|----------|
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | `glm-4.7` |
| Kimi (月之暗面) | `https://api.moonshot.cn/v1` | `kimi-k2` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| OpenRouter | `https://openrouter.ai/api/v1` | `openai/gpt-4o-mini` |
| Ollama (本地) | `http://localhost:11434/v1` | `qwen3` 等 |

Ollama 本地部署可零成本测试（API Key 随便填一个非空值即可）。

## 开发

```bash
npm install
npm run dev      # 热更新开发模式，扩展出现在 Raycast 根搜索
npx tsc --noEmit # 类型检查
npm run build    # 构建产物
node scripts/gen-icon.mjs  # 重新生成图标
```

修改代码保存后，在 Raycast 中重新打开命令即可看到变化。
