import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  Icon,
  LaunchType,
  launchCommand,
  useNavigation,
} from "@raycast/api";
import type { LaunchProps } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { getPreferences, translate, TranslateError } from "./lib/api";
import { addHistory } from "./lib/history";

type State =
  | { kind: "empty" }
  | { kind: "loading"; source: string }
  | { kind: "done"; source: string; result: string }
  | { kind: "error"; source: string; message: string };

export default function Command(props: LaunchProps<{ arguments: { text?: string } }>) {
  const prefs = getPreferences();
  const [state, setState] = useState<State>({ kind: "empty" });
  const { pop } = useNavigation();

  const doTranslate = useCallback(async (text: string) => {
    const source = text.trim();
    if (!source) {
      setState({ kind: "empty" });
      return;
    }
    setState({ kind: "loading", source });
    try {
      const result = await translate(source);
      setState({ kind: "done", source, result });
      if (prefs.saveHistory) {
        await addHistory(source, result);
      }
    } catch (err) {
      const message = err instanceof TranslateError ? err.message : `翻译失败：${String(err)}`;
      setState({ kind: "error", source, message });
    }
  }, [prefs.saveHistory]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const argText = props.arguments?.text?.trim();
      if (argText) {
        await doTranslate(argText);
        return;
      }
      if (prefs.autoClipboard) {
        try {
          const { text } = await Clipboard.read();
          if (!cancelled && text.trim()) {
            await doTranslate(text);
            return;
          }
        } catch {
          // 剪贴板不可读时落到空态
        }
      }
      if (!cancelled) setState({ kind: "empty" });
    })();
    return () => {
      cancelled = true;
    };
    // 仅在启动时决定一次输入来源
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openHistory = useCallback(async () => {
    pop();
    await launchCommand({ name: "history", type: LaunchType.UserInitiated });
  }, [pop]);

  const markdown = renderMarkdown(state);
  const isLoading = state.kind === "loading";
  const result = state.kind === "done" ? state.result : "";

  return (
    <Detail
      markdown={markdown}
      isLoading={isLoading}
      navigationTitle={isLoading ? "正在翻译…" : "AI 翻译"}
      metadata={
        state.kind === "done" ? (
          <Detail.Metadata>
            <Detail.Metadata.Label title="模型" text={prefs.model} />
            <Detail.Metadata.Label title="目标语言" text={prefs.targetLanguage} />
          </Detail.Metadata>
        ) : undefined
      }
      actions={
        <ActionPanel>
          {state.kind === "done" && (
            <>
              <Action.CopyToClipboard title="复制译文" content={result} />
              <Action.CopyToClipboard
                title="复制原文"
                content={state.source}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
              <Action icon={Icon.ArrowClockwise} title="重新翻译" onAction={() => doTranslate(state.source)} />
            </>
          )}
          {state.kind === "error" && (
            <Action icon={Icon.ArrowClockwise} title="重试" onAction={() => doTranslate(state.source)} />
          )}
          <Action icon={Icon.Clock} title="打开翻译历史" onAction={openHistory} />
        </ActionPanel>
      }
    />
  );
}

function renderMarkdown(state: State): string {
  switch (state.kind) {
    case "empty":
      return [
        "## 开始翻译",
        "",
        "两种用法：",
        "",
        "1. **粘贴翻译**：呼出 Raycast → 输入 `翻译` → 空格 → 粘贴文本 → 回车",
        "2. **剪贴板翻译**：直接回车打开本命令，自动翻译剪贴板中的文本",
        "",
        "外语自动识别并翻译成中文；输入中文时自动翻译成英文。",
        "",
        "首次使用请先在 **设置 → 扩展 → AI 翻译** 中配置 API 服务地址、API Key 和模型。",
      ].join("\n");
    case "loading":
      return `> ${state.source.replace(/\n/g, "\n> ")}\n\n---\n\n*正在翻译…*`;
    case "done":
      return `${state.result}\n\n---\n\n> ${state.source.replace(/\n/g, "\n> ")}`;
    case "error":
      return `## ❌ 翻译失败\n\n${state.message}\n\n---\n\n> ${state.source.replace(/\n/g, "\n> ")}`;
  }
}
