import { LocalStorage } from "@raycast/api";

export interface HistoryEntry {
  id: string;
  source: string;
  result: string;
  createdAt: number;
}

const STORAGE_KEY = "translation_history";
const MAX_ENTRIES = 100;

export async function loadHistory(): Promise<HistoryEntry[]> {
  const raw = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function save(list: HistoryEntry[]): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
}

/** 新增一条历史；若与最近一条原文相同则替换，避免重复堆积 */
export async function addHistory(source: string, result: string): Promise<void> {
  const list = await loadHistory();
  if (list.length > 0 && list[0].source === source) {
    list[0] = { id: list[0].id, source, result, createdAt: Date.now() };
  } else {
    // Raycast 运行时无全局 crypto，用时间戳+随机数生成 ID
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    list.unshift({ id, source, result, createdAt: Date.now() });
  }
  await save(list);
}

export async function removeHistory(id: string): Promise<HistoryEntry[]> {
  const list = (await loadHistory()).filter((e) => e.id !== id);
  await save(list);
  return list;
}

export async function clearHistory(): Promise<void> {
  await save([]);
}
