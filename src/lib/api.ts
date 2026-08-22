import { getPreferenceValues } from "@raycast/api";
import { DEFAULT_TARGET_LANGUAGE } from "./languages";

export interface TranslatorPreferences {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  targetLanguage: string;
  autoClipboard: boolean;
  saveHistory: boolean;
  temperature: string;
}

export function getPreferences(): TranslatorPreferences {
  return getPreferenceValues<TranslatorPreferences>();
}

export interface TranslateResult {
  /** 译文 */
  text: string;
  /** 检测到的原文语言(英文名);解析失败时为 undefined */
  sourceLang?: string;
}

interface TranslateOptions {
  /** 目标语言(英文名)。缺省用首选语言 */
  targetLang?: string;
  /** 已知的原文语言(英文名)。传入时跳过检测,直接按指定方向翻译 */
  sourceLang?: string;
}

/** 语言英文名映射表,便于模型输出规范的名字 */
const LANG_HINTS =
  "简体中文=Chinese (Simplified), 繁體中文=Chinese (Traditional), 英语=English, 日语=Japanese, 韩语=Korean, 法语=French, 德语=German, 西班牙语=Spanish, 葡萄牙语=Portuguese, 俄语=Russian, 意大利语=Italian, 阿拉伯语=Arabic, 泰语=Thai, 越南语=Vietnamese, 印尼语=Indonesian, 土耳其语=Turkish, 荷兰语=Dutch, 波兰语=Polish, 乌克兰语=Ukrainian, 希腊语=Greek, 希伯来语=Hebrew, 印地语=Hindi, 马来语=Malay, 捷克语=Czech, 瑞典语=Swedish, 挪威语=Norwegian, 丹麦语=Danish, 芬兰语=Finnish, 匈牙利语=Hungarian, 罗马尼亚语=Romanian";

function buildSystemPrompt(options: TranslateOptions): string {
  const { targetLang, sourceLang } = options;
  const target = targetLang ?? DEFAULT_TARGET_LANGUAGE;

  if (sourceLang) {
    // 指定方向:直接翻译,不做语言检测
    return [
      "你是一个专业翻译引擎，负责在 Raycast 中为用户翻译文本。",
      `将${sourceLang}文本翻译成${target}。`,
      "只输出译文本身，不要输出任何解释、注释、原文、引号或前缀。",
      "保留原文的换行、列表等排版格式；专业术语翻译准确，行文自然流畅。",
    ].join("\n");
  }

  // 自动模式:检测原文语言 + 翻译成首选语言;若已是首选语言则直接返回原文
  return [
    "你是一个专业翻译引擎，负责在 Raycast 中为用户翻译文本。",
    `规则：自动检测输入文本的语言；若输入不是${target}，将其翻译成${target}；若输入已经是${target}，无需翻译，直接返回原文。`,
    "重要：译文必须使用上述指定的目标语言撰写，不要使用其他语言。",
    `语言名称请使用以下标准英文名之一：${LANG_HINTS}。`,
    "输出格式要求（严格遵循）：",
    "第一行输出：LANG: <检测到的原文语言的英文名>",
    "第二行输出：---",
    "第三行起输出译文本身（用目标语言）。除上述三部分外，不要输出任何解释、注释、原文、引号或前缀。",
    "保留原文的换行、列表等排版格式；专业术语翻译准确，行文自然流畅。",
  ].join("\n");
}

/** 解析自动模式的响应:提取 LANG 行 + 译文 */
function parseResponse(raw: string): { text: string; sourceLang?: string } {
  const cleaned = cleanOutput(raw);
  const lines = cleaned.split("\n");
  const firstLine = lines[0].trim();
  const langMatch = firstLine.match(/^LANG:\s*(.+)$/i);
  if (langMatch && lines.length >= 2 && lines[1].trim() === "---") {
    return { sourceLang: langMatch[1].trim(), text: lines.slice(2).join("\n").trim() };
  }
  if (langMatch && lines.length >= 1) {
    // 缺少 --- 分隔行时,把整段都当译文
    return { sourceLang: langMatch[1].trim(), text: lines.slice(1).join("\n").trim() };
  }
  // 格式不符,退化为整段为译文
  return { text: cleaned };
}

export class TranslateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranslateError";
  }
}

function parseTemperature(raw: string): number {
  const t = parseFloat(raw);
  if (Number.isNaN(t)) return 0.1;
  return Math.min(Math.max(t, 0), 2);
}

/** 清理模型输出:剥离思考模型可能混入 content 的 <think>…</think> 推理块,以及首尾空白 */
function cleanOutput(raw: string): string {
  let out = raw.trim();
  // 完整剥离闭合的 think 块(部分兼容网关会把它拼进 content)
  out = out.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // 删掉残余的 think 标签标记,保留中间内容,避免把标签直接展示给用户
  out = out.replace(/<\/?think>/gi, "").trim();
  return out;
}

export async function translate(text: string, options: TranslateOptions = {}): Promise<TranslateResult> {
  const prefs = getPreferences();

  if (!prefs.apiBaseUrl?.trim() || !prefs.apiKey?.trim() || !prefs.model?.trim()) {
    throw new TranslateError("尚未完成配置：请在 Raycast 设置 → 扩展 → AI 翻译 中填写 API 服务地址、API Key 和模型名称。");
  }

  const targetLang = options.targetLang ?? prefs.targetLanguage ?? DEFAULT_TARGET_LANGUAGE;
  // 已知原文语言且与目标语言相同(如原文中文、切到中文):无需翻译,直接返回原文
  if (options.sourceLang && options.sourceLang === targetLang) {
    return { text: text.trim(), sourceLang: options.sourceLang };
  }
  const effectiveOptions: TranslateOptions = options;

  const base = prefs.apiBaseUrl.trim().replace(/\/+$/, "");
  // 兼容用户直接粘贴完整端点(如 …/v1/chat/completions)的情况,避免双重拼接
  const url = base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${prefs.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: prefs.model.trim(),
        messages: [
          { role: "system", content: buildSystemPrompt(effectiveOptions) },
          { role: "user", content: text },
        ],
        temperature: parseTemperature(prefs.temperature),
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new TranslateError("请求超时（30 秒）：请检查网络或接口地址是否正确。");
    }
    throw new TranslateError(
      `无法连接到 API 服务：${err instanceof Error ? err.message : String(err)}。请检查 API 服务地址是否正确、网络是否可用。`
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { error?: { message?: string }; message?: string };
      detail = body?.error?.message ?? body?.message ?? "";
    } catch {
      // 忽略非 JSON 响应体
    }
    if (res.status === 401 || res.status === 403) {
      throw new TranslateError(`API Key 无效或未授权（${res.status}）：请检查密钥是否正确、是否有余额。${detail}`);
    }
    if (res.status === 404) {
      throw new TranslateError(`接口不存在（404）：请确认 API 服务地址填写到含 /v1 的层级。${detail}`);
    }
    throw new TranslateError(`API 请求失败（${res.status}）${detail ? `：${detail}` : ""}`);
  }

  let data: {
    choices?: { message?: { content?: string } }[];
  };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    throw new TranslateError("API 返回了无法解析的内容，请确认接口为 OpenAI 兼容格式。");
  }

  const out = data?.choices?.[0]?.message?.content;
  if (typeof out !== "string" || !out.trim()) {
    throw new TranslateError("模型未返回有效译文,请检查模型名称是否正确。");
  }
  const parsed = options.sourceLang ? { text: cleanOutput(out) } : parseResponse(out);
  if (!parsed.text) {
    throw new TranslateError("模型输出仅包含推理过程,未产生译文,请更换模型重试。");
  }
  return parsed;
}
