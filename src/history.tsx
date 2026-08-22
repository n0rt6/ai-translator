import { Action, ActionPanel, Alert, Icon, List, confirmAlert } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { clearHistory, loadHistory, removeHistory } from "./lib/history";
import type { HistoryEntry } from "./lib/history";

const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function truncate(text: string, max = 80): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

export default function Command() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadHistory().then((list) => {
      setEntries(list);
      setLoaded(true);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) => e.source.toLowerCase().includes(q) || e.result.toLowerCase().includes(q)
    );
  }, [entries, searchText]);

  async function handleRemove(entry: HistoryEntry) {
    setEntries(await removeHistory(entry.id));
  }

  async function handleClearAll() {
    if (
      await confirmAlert({
        title: "清空全部翻译历史？",
        message: "此操作不可恢复。",
        primaryAction: { title: "清空", style: Alert.ActionStyle.Destructive },
      })
    ) {
      await clearHistory();
      setEntries([]);
    }
  }

  return (
    <List
      searchBarPlaceholder="搜索原文或译文…"
      filtering={false}
      onSearchTextChange={setSearchText}
      navigationTitle="翻译历史"
      isShowingDetail={filtered.length > 0}
    >
      {loaded && filtered.length === 0 ? (
        <List.EmptyView
          icon={Icon.Clock}
          title={searchText ? "没有匹配的记录" : "暂无翻译历史"}
          description={searchText ? undefined : "翻译成功后会自动保存到本地（可在扩展设置中关闭）"}
        />
      ) : (
        filtered.map((entry) => (
          <List.Item
            key={entry.id}
            title={truncate(entry.source)}
            subtitle={truncate(entry.result)}
            accessories={[{ text: timeFormatter.format(new Date(entry.createdAt)) }]}
            detail={
              <List.Item.Detail
                markdown={`${entry.result}\n\n---\n\n> ${entry.source.replace(/\n/g, "\n> ")}`}
              />
            }
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title="复制译文" content={entry.result} />
                <Action.CopyToClipboard
                  title="复制原文"
                  content={entry.source}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                />
                <Action
                  icon={Icon.Trash}
                  title="删除本条"
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["ctrl"], key: "x" }}
                  onAction={() => handleRemove(entry)}
                />
                <Action
                  icon={Icon.Trash}
                  title="清空全部历史"
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["cmd", "ctrl"], key: "x" }}
                  onAction={handleClearAll}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
