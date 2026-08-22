<div align="center">

# AI Translator for Raycast

**Paste any text. Get a fluent translation — in the language and model you choose.**

</div>

An [open-source](https://github.com/n0rt6/ai-translator) Raycast extension that detects the language of your input and translates it into your **preferred language** — with 30 common languages supported and the ability to switch the target language after translation. It works with **any OpenAI-compatible API**, so the model is entirely your choice — DeepSeek, Zhipu GLM, Kimi, OpenAI, OpenRouter, a local Ollama instance, or any other model you can reach through a compatible endpoint.

> **[中文](https://github.com/n0rt6/ai-translator/blob/main/README.md)** · MIT License

---

## ✨ Features

- [x] **Auto language detection** — no need to pick source/target languages; input is detected and translated into your preferred language
- [x] **30 common languages** — Simplified/Traditional Chinese, English, Japanese, Korean, French, German, Spanish, Portuguese, Russian, Italian, Arabic, Thai, Vietnamese, Indonesian, Turkish, Dutch, Polish, Ukrainian, Greek, Hebrew, Hindi, Malay, Czech, Swedish, Norwegian, Danish, Finnish, Hungarian, Romanian
- [x] **Preferred target language** — set it once in settings; if the input is already in your preferred language, it is returned as-is with a "no translation needed" notice
- [x] **Switch target language anytime** — after translation, press `⌘L` (or use the action menu) to retranslate into another language, keeping the detected source language
- [x] **Bring your own model** — plug in any OpenAI-compatible endpoint and use the model you prefer, from `deepseek-chat` to `gpt-4o-mini` to local `qwen3`
- [x] **Clipboard-first workflow** — invoke the command and press Enter; the clipboard content is translated instantly
- [x] **Local translation history** — the latest 100 entries, searchable, stored only on your machine
- [x] **Thinking-model friendly** — reasoning blocks (`<think>…</think>`) are stripped automatically for models like MiniMax
- [x] **Endpoint lenient** — accept both the `/v1` base URL and the full `/chat/completions` endpoint
- [x] **Private by design** — API key lives in Raycast's local preferences; no ads, no telemetry, no cloud

## How it differs

Many translation extensions ship with a fixed set of providers. This one treats translation as a model problem: if you can talk to an OpenAI-compatible API, you can translate with it — including fully offline models via [Ollama](https://ollama.com).

| | AI Translator | Typical alternatives |
|---|---|---|
| Provider | Any OpenAI-compatible API | Fixed providers |
| Model choice | Yours (change anytime) | Usually fixed per service |
| Languages | 30 common languages | Varies |
| Target language | Preferred + switchable anytime | Usually fixed |
| Local / offline | ✅ via Ollama | Rarely |
| Translation history | ✅ built-in, local | Often absent or cloud-based |
| API key storage | Raycast local preferences only | Varies |
| Endpoint format | `/v1` or full endpoint accepted | Base URL only |
| Language direction | Auto-detect, bi-directional | Usually fixed source → target |

## Installation

The extension is in active development. To install locally:

```bash
git clone https://github.com/n0rt6/ai-translator.git
cd ai-translator
npm install
npm run dev
```

The extension then appears in Raycast's root search. (`ray develop` keeps it hot-reloaded; stop it with `Ctrl+C` — the extension stays available.)

## Configuration

Open **Raycast Settings → Extensions → AI Translator** and fill in the three required fields:

| Setting | Description |
|---|---|
| **API Service** | OpenAI-compatible base URL, e.g. `https://api.deepseek.com/v1`. The full `/chat/completions` endpoint also works. |
| **API Key** | Your key for that service (stored locally, never transmitted anywhere else). |
| **Model** | Model name, e.g. `deepseek-chat`. |
| **Preferred language** | The language input is translated into (default: Simplified Chinese). If the input is already in this language, it is returned as-is with a "no translation needed" notice. |

### Provider examples

| Provider | Base URL | Model example |
|---|---|---|
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| Zhipu GLM | `https://open.bigmodel.cn/api/paas/v4` | `glm-4.7` |
| Kimi (Moonshot) | `https://api.moonshot.cn/v1` | `kimi-k2` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| OpenRouter | `https://openrouter.ai/api/v1` | `openai/gpt-4o-mini` |
| Ollama (local) | `http://localhost:11434/v1` | `qwen3` |

You'll need your own API key; most providers offer a free tier to start with. Ollama is a zero-cost option for fully local translation (any non-empty API key works).

## Usage

1. **Paste to translate** — open Raycast (`⌥ Space` by default), type `翻译` (or `Translate`), paste your text, press Enter
2. **Clipboard translate** — open the command and press Enter directly; the clipboard content is translated
3. **Switch target language** — after translation, press `⌘L` (or the "Switch target language…" action), pick a language; the text is retranslated into that language
4. **History** — open `翻译历史` (or `History`) to search, copy, or delete past translations

## Privacy

- The API key is stored only in Raycast's local preferences
- Translation requests go directly from your Mac to the API endpoint you configured — nothing passes through a third-party server
- History is kept in Raycast's local storage; disable "Save translation history" in settings to stop recording entirely

## Acknowledgements

Built with the [Raycast API](https://developers.raycast.com). Inspired by the great translation extensions in the [raycast/extensions](https://github.com/raycast/extensions) community.

## License

[MIT](./LICENSE) © n0rt6
