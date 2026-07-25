"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import {
  toggleTask,
  addTask,
  deleteTask,
  renameTask,
  moveTask,
} from "@/lib/actions/clients";
import type { Task } from "@/lib/db/schema";

export function Checklist({
  clientId,
  tasks,
}: {
  clientId: number;
  tasks: Task[];
}) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    tasks,
    (state: Task[], upd: { id: number; done: boolean }) =>
      state.map((t) => (t.id === upd.id ? { ...t, done: upd.done } : t))
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const done = optimistic.filter((t) => t.done).length;
  const total = optimistic.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function toggle(task: Task) {
    startTransition(async () => {
      setOptimistic({ id: task.id, done: !task.done });
      await toggleTask(task.id, clientId, !task.done);
    });
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const titel = inputRef.current?.value.trim();
    if (!titel) return;
    setAdding(true);
    startTransition(async () => {
      await addTask(clientId, titel);
      if (inputRef.current) inputRef.current.value = "";
      setAdding(false);
    });
  }

  function remove(id: number) {
    startTransition(async () => {
      await deleteTask(id, clientId);
    });
  }

  function move(id: number, richting: "up" | "down") {
    startTransition(async () => {
      await moveTask(id, clientId, richting);
    });
  }

  function saveRename(id: number, titel: string) {
    const clean = titel.trim();
    setEditingId(null);
    if (!clean) return;
    startTransition(async () => {
      await renameTask(id, clientId, clean);
    });
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold tracking-tight">Checklist</h2>
        <span className="text-sm text-muted">
          {done}/{total} ({pct}%)
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? "var(--success)" : "var(--accent)",
          }}
        />
      </div>

      <ul className="flex flex-col">
        {optimistic.map((task, i) => (
          <li
            key={task.id}
            className="group flex items-center gap-2 py-2 border-b border-line last:border-0"
          >
            <button
              onClick={() => toggle(task)}
              aria-label={task.done ? "Afvinken ongedaan maken" : "Afvinken"}
              className="grid place-items-center w-5 h-5 rounded-md border shrink-0 transition-colors"
              style={
                task.done
                  ? { background: "var(--success)", borderColor: "var(--success)" }
                  : { borderColor: "var(--line-strong)" }
              }
            >
              {task.done && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12l4 4 10-10"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {editingId === task.id ? (
              <input
                autoFocus
                defaultValue={task.titel}
                className="input flex-1 min-w-0 py-1 h-8"
                onBlur={(e) => saveRename(task.id, e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRename(task.id, e.currentTarget.value);
                  if (e.key === "Escape") setEditingId(null);
                }}
              />
            ) : (
              <button
                onClick={() => toggle(task)}
                onDoubleClick={() => setEditingId(task.id)}
                className="text-left flex-1 min-w-0"
              >
                <span
                  className={`text-sm truncate block ${task.done ? "text-muted line-through" : "text-ink"}`}
                >
                  {task.titel}
                </span>
              </button>
            )}

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <IconButton
                label="Omhoog"
                disabled={i === 0}
                onClick={() => move(task.id, "up")}
              >
                <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </IconButton>
              <IconButton
                label="Omlaag"
                disabled={i === optimistic.length - 1}
                onClick={() => move(task.id, "down")}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </IconButton>
              <IconButton label="Hernoemen" onClick={() => setEditingId(task.id)}>
                <path
                  d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </IconButton>
              <IconButton label="Verwijderen" danger onClick={() => remove(task.id)}>
                <path
                  d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={onAdd} className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          className="input"
          placeholder="Taak toevoegen…"
          disabled={adding}
        />
        <button type="submit" className="btn btn-secondary" disabled={isPending}>
          Toevoegen
        </button>
      </form>
      <p className="mt-2 text-xs text-muted">
        Tip: dubbelklik op een taak om te hernoemen. Beheer de standaardlijst voor nieuwe
        klanten via Instellingen.
      </p>
    </div>
  );
}

function IconButton({
  label,
  children,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid place-items-center w-7 h-7 rounded-md transition-colors disabled:opacity-30 ${
        danger ? "text-muted hover:text-danger" : "text-muted hover:text-ink"
      } hover:bg-surface-2`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        {children}
      </svg>
    </button>
  );
}
