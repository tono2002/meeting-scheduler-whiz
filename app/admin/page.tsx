"use client";

import { useCallback, useEffect, useState } from "react";
import { longDayCap } from "@/lib/format";

type Row = { id: string; date: string; time: string; end: string; name: string; phone: string };

export default function AdminPage() {
  const [state, setState] = useState<"loading" | "login" | "ready">("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/bookings", { cache: "no-store" });
    if (res.status === 401) return setState("login");
    const data = (await res.json()) as { bookings: Row[] };
    setRows(data.bookings);
    setState("ready");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch, state set after await
    load();
  }, [load]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setError(!res.ok);
    if (res.ok) load();
  };

  const cancel = async (id: string) => {
    setCancelling(id);
    await fetch("/api/admin/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCancelling(null);
     
    load();
  };

  if (state === "loading") return <main className="p-6 text-stone-400">Cargando…</main>;

  if (state === "login") {
    return (
      <main className="mx-auto max-w-sm px-5 pt-20">
        <h1 className="font-serif text-3xl font-semibold">Admin</h1>
        <form onSubmit={login} className="mt-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoFocus
            className="h-14 w-full rounded-2xl border border-stone-200 px-4 text-lg outline-none focus:border-accent"
          />
          {error && <p className="mt-2 text-sm text-red-600">Contraseña incorrecta.</p>}
          <button className="mt-4 h-14 w-full rounded-2xl bg-accent text-lg font-semibold text-white">Entrar</button>
        </form>
      </main>
    );
  }

  const byDay = rows.reduce<Record<string, Row[]>>((acc, r) => ((acc[r.date] ??= []).push(r), acc), {});

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16 pt-10">
      <h1 className="font-serif text-3xl font-semibold">Reservas</h1>
      {rows.length === 0 && <p className="mt-6 text-stone-500">No hay reservas confirmadas.</p>}
      {Object.entries(byDay).map(([date, list]) => (
        <section key={date} className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">{longDayCap(date)}</h2>
          <ul className="mt-3 space-y-3">
            {list.map((r) => (
              <li key={r.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">
                      {r.time} – {r.end}
                    </p>
                    <p className="mt-0.5 text-stone-800">{r.name}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-accent">
                      <a href={`tel:+34${r.phone}`} className="underline underline-offset-4">
                        {r.phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}
                      </a>
                      <a href={`https://wa.me/34${r.phone}`} target="_blank" rel="noopener" className="underline underline-offset-4">
                        WhatsApp
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => cancel(r.id)}
                    disabled={cancelling === r.id}
                    className="h-11 shrink-0 rounded-xl border border-red-200 px-4 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
