import { Modal, Notice } from "obsidian";
import type { ChatMessage, ChatSession } from "../types";
import { CHAT_HISTORY_LIMIT } from "../types";

export interface ChatHistoryStore {
  list(): ChatSession[];
  save(session: ChatSession): void;
  remove(id: string): void;
  clear(): void;
  get(id: string): ChatSession | undefined;
}

export function createHistoryStore(
  getHistory: () => ChatSession[],
  setHistory: (h: ChatSession[]) => void
): ChatHistoryStore {
  return {
    list() {
      return getHistory().slice(0, CHAT_HISTORY_LIMIT);
    },

    save(session) {
      const history = getHistory().filter((s) => s.id !== session.id);
      history.unshift(session);
      if (history.length > CHAT_HISTORY_LIMIT) {
        history.length = CHAT_HISTORY_LIMIT;
      }
      setHistory(history);
    },

    remove(id) {
      setHistory(getHistory().filter((s) => s.id !== id));
    },

    clear() {
      setHistory([]);
    },

    get(id) {
      return getHistory().find((s) => s.id === id);
    },
  };
}

export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSessionTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (!firstUserMsg) return "Chat sin mensajes";
  const text = firstUserMsg.content.trim();
  return text.length > 60 ? text.slice(0, 57) + "..." : text;
}

export function showHistoryModal(
  app: import("obsidian").App,
  store: ChatHistoryStore,
  onSelect: (session: ChatSession) => void
) {
  const sessions = store.list();
  if (sessions.length === 0) {
    new Notice("No hay chats anteriores");
    return;
  }
  const modal = new Modal(app);
  modal.titleEl.setText("Historial de chats");
  const { contentEl: body } = modal;
  for (const session of sessions) {
    const row = body.createDiv({ cls: "at-context-row" });
    const date = new Date(session.timestamp).toLocaleString("es", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
    row.createSpan({ text: `${session.mode === "flash" ? "⚡" : "🧠"} ${session.title}` });
    row.createSpan({ text: date, cls: "at-cost-info" });
    row.onclick = () => { modal.close(); onSelect(session); };
    const delBtn = row.createEl("button", { text: "✕", cls: "at-history-del" });
    delBtn.onclick = (e) => {
      e.stopPropagation();
      store.remove(session.id);
      row.remove();
      if (store.list().length === 0) { modal.close(); new Notice("Historial vacío"); }
    };
  }
  const clearBtn = body.createEl("button", {
    text: "Limpiar historial",
    cls: "at-history-clear",
  });
  clearBtn.onclick = () => { store.clear(); modal.close(); new Notice("Historial limpiado"); };
  modal.open();
}
