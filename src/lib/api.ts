import { getPreferenceValues } from "@raycast/api";

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

/** 输入已是目标语言时的互译对象：目标为中文系 → 英文，否则 → 简体中文 */
function altLanguage(targetLanguage: string): string {
  return targetLanguage === "English" ? "简体中文" : "English";
}

export function buildSystemPrompt(targetLanguage: string): string {
  const alt = altLanguage(targetLanguage);
  return [
    "你是一个专业翻译引擎，负责在 Raycast 中为用户翻译文本。",
    `规则：自动检测输入文本的语言；若不是${targetLanguage}，将其翻译成${targetLanguage}；若已经是${targetLanguage}，将其翻译成${alt}。`,
    "只输出译文本身，不要输出任何解释、注释、原文、引号或前缀。",
    "保留原文的换行、列表等排版格式；专业术语翻译准确，行文自然流畅。",
  ].join("\n");
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

export async function translate(text: string): Promise<string> {
  const prefs = getPreferences();

  if (!prefs.apiBaseUrl?.trim() || !prefs.apiKey?.trim() || !prefs.model?.trim()) {
    throw new TranslateError("尚未完成配置：请在 Raycast 设置 → 扩展 → AI 翻译 中填写 API 服务地址、API Key 和模型名称。");
  }

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
          { role: "system", content: buildSystemPrompt(prefs.targetLanguage) },
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
  const cleaned = cleanOutput(out);
  if (!cleaned) {
    throw new TranslateError("模型输出仅包含推理过程,未产生译文,请更换模型重试。");
  }
  return cleaned;
}
