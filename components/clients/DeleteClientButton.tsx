"use client";

import { useTransition } from "react";
import { deleteClient } from "@/lib/actions/clients";

export function DeleteClientButton({
  clientId,
  bedrijf,
}: {
  clientId: number;
  bedrijf: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn btn-danger"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            `Klant "${bedrijf}" verwijderen? De checklist wordt ook verwijderd. Facturen blijven bewaard (zonder klantkoppeling).`
          )
        ) {
          start(() => {
            deleteClient(clientId);
          });
        }
      }}
    >
      {pending ? "Verwijderen…" : "Verwijderen"}
    </button>
  );
}
