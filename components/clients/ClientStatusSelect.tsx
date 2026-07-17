"use client";

import { useTransition } from "react";
import { updateClientStatus } from "@/lib/actions/clients";
import { CLIENT_STATUSES, CLIENT_STATUS_KEYS } from "@/lib/status";

export function ClientStatusSelect({
  clientId,
  status,
}: {
  clientId: number;
  status: string;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      className="input"
      style={{ width: "auto", opacity: pending ? 0.6 : 1 }}
      value={status}
      onChange={(e) =>
        start(() => {
          updateClientStatus(clientId, e.target.value);
        })
      }
    >
      {CLIENT_STATUS_KEYS.map((k) => (
        <option key={k} value={k}>
          {CLIENT_STATUSES[k].label}
        </option>
      ))}
    </select>
  );
}
