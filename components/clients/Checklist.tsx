"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { toggleTask, addTask, deleteTask } from "@/lib/actions/clients";
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
        {optimistic.map((task) => (
          <li
            key={task.id}
            className="group flex items-center gap-3 py-2 border-b border-line last:border-0"
          >
            <button
              onClick={() => toggle(task)}
              className="flex items-center gap-3 text-left flex-1 min-w-0"
            >
              <span
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
              </span>
              <span
                className={`text-sm truncate ${task.done ? "text-muted line-through" : "text-ink"}`}
              >
                {task.titel}
              </span>
            </button>
            <button
              onClick={() => remove(task.id)}
              aria-label="Verwijderen"
              className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-opacity shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
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
    </div>
  );
}
