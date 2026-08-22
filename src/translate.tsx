import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  Icon,
  LaunchType,
  List,
  launchCommand,
  useNavigation,
} from "@raycast/api";
import type { LaunchProps } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { getPreferences, translate, TranslateError } from "./lib/api";
import { addHistory } from "./lib/history";
import { DEFAULT_TARGET_LANGUAGE, LANGUAGES, languageTitle } from "./lib/languages";

type State =
  | { kind: "empty" }
  | { kind: "loading"; source: string; sourceLang?: string; targetLang?: string }
  | { kind: "done"; source: string; sourceLang?: string; targetLang: string; result: string; isNoop: boolean }
  | { kind: "error"; source: string; message: string };

export default function Command(props: LaunchProps<{ arguments: { text?: string } }>) {
  const prefs = getPreferences();
  const [state, setState] = useState<State>({ kind: "empty" });
  const { push, pop } = useNavigation();

  const doTranslate = useCallback(
    async (text: string, opts?: { sourceLang?: string; targetLang?: string }) => {
      const source = text.trim();
      if (!source) {
        setState({ kind: "empty" });
        return;
      }
      setState({ kind: "loading", source, sourceLang: opts?.sourceLang, targetLang: opts?.targetLang });
      try {
        const result = await translate(source, {
          sourceLang: opts?.sourceLang,
          targetLang: opts?.targetLang,
        });
        // 目标语言:切换翻译时用指定的;首次翻译用首选语言(api.ts 内部已做"同语言→英文"兜底)
        const targetLang = opts?.targetLang ?? prefs.targetLanguage ?? DEFAULT_TARGET_LANGUAGE;
        // 原文语言:切换翻译时保留已知的 sourceLang;首次翻译用模型检测结果
        const sourceLang = opts?.sourceLang ?? result.sourceLang;
        // 是否"无需翻译":原文语言与目标语言相同(此时 result 就是原文)
        const isNoop = !!sourceLang && sourceLang === targetLang;
        setState({ kind: "done", source, sourceLang, targetLang, result: result.text, isNoop });
        if (prefs.saveHistory) {
          await addHistory(source, result.text, targetLang);
        }
      } catch (err) {
        const message = err instanceof TranslateError ? err.message : `翻译失败：${String(err)}`;
        setState({ kind: "error", source, message });
      }
    },
    [prefs.saveHistory, prefs.targetLanguage]
  );

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

  const openLanguagePicker = useCallback(
    (currentLang: string) => {
      push(
        <LanguagePicker
          currentLang={currentLang}
          onSelect={(lang) => {
            pop();
            if (state.kind === "done" || state.kind === "loading") {
              doTranslate(state.source, { sourceLang: state.sourceLang, targetLang: lang });
            }
          }}
        />
      );
    },
    [push, pop, state, doTranslate]
  );

  const markdown = renderMarkdown(state);
  const isLoading = state.kind === "loading";

  return (
    <Detail
      markdown={markdown}
      isLoading={isLoading}
      navigationTitle={isLoading ? "正在翻译…" : "AI 翻译"}
      metadata={
        state.kind === "done" ? (
          <Detail.Metadata>
            <Detail.Metadata.Label title="原文语言" text={state.sourceLang ? languageTitle(state.sourceLang) : "未识别"} />
            <Detail.Metadata.Label
              title="译文语言"
              text={state.isNoop ? `${languageTitle(state.targetLang)}(无需翻译)` : languageTitle(state.targetLang)}
            />
            <Detail.Metadata.Label title="模型" text={prefs.model} />
          </Detail.Metadata>
        ) : undefined
      }
      actions={
        <ActionPanel>
          {state.kind === "done" && (
            <>
              <Action.CopyToClipboard title="复制译文" content={state.result} />
              <Action.CopyToClipboard
                title="复制原文"
                content={state.source}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
              <Action
                icon={Icon.Globe}
                title="切换译文语言…"
                shortcut={{ modifiers: ["cmd"], key: "l" }}
                onAction={() => openLanguagePicker(state.targetLang)}
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

function LanguagePicker({ currentLang, onSelect }: { currentLang: string; onSelect: (lang: string) => void }) {
  return (
    <List searchBarPlaceholder="搜索语言…" navigationTitle="切换译文语言">
      {LANGUAGES.map((lang) => (
        <List.Item
          key={lang.name}
          title={lang.title}
          subtitle={lang.name}
          icon={lang.name === currentLang ? Icon.CheckCircle : Icon.Circle}
          actions={
            <ActionPanel>
              <Action title="选择此语言" onAction={() => onSelect(lang.name)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
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
        "自动识别原文语言，翻译成你的首选语言（支持 30 种常用语言）；翻译完成后可用 `⌘L` 切换译文语言。",
        "",
        "首次使用请先在 **设置 → 扩展 → AI 翻译** 中配置 API 服务地址、API Key 和模型。",
      ].join("\n");
    case "loading":
      return `> ${state.source.replace(/\n/g, "\n> ")}\n\n---\n\n*正在翻译…*`;
    case "done":
      return state.isNoop
        ? `> ${state.result.replace(/\n/g, "\n> ")}\n\n---\n\n*原文已是${languageTitle(state.targetLang)},无需翻译。*`
        : `${state.result}\n\n---\n\n> ${state.source.replace(/\n/g, "\n> ")}`;
    case "error":
      return `## ❌ 翻译失败\n\n${state.message}\n\n---\n\n> ${state.source.replace(/\n/g, "\n> ")}`;
  }
}
