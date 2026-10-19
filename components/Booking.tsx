"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PublicDay, PublicSlot } from "@/lib/slots";
import { longDay, longDayCap, shortDay } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";
import { MAPS_URL } from "@/lib/links";

type Selected = { date: string; slot: PublicSlot };
type Done = { name: string; date: string; time: string };

export default function Booking() {
  const params = useSearchParams();
  const [days, setDays] = useState<PublicDay[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/slots", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { days: PublicDay[] };
      setDays(data.days);
      setLoadError(false);
      setActiveDate((cur) => (cur && data.days.some((d) => d.date === cur) ? cur : (data.days[0]?.date ?? null)));
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch, state set after await
    load();
    const id = setInterval(load, 60_000);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  if (done) return <Confirmation done={done} />;

  const day = days?.find((d) => d.date === activeDate);
  const morning = day?.slots.filter((s) => s.time < "14:00") ?? [];
  const afternoon = day?.slots.filter((s) => s.time >= "14:00") ?? [];

  const pick = (slot: PublicSlot) => {
    if (!day) return;
    setNotice(null);
    setSelected({ date: day.date, slot });
    setSheetOpen(true);
  };

  return (
    <section id="reserva" className="mt-6">
      <h2 className="font-serif text-xl font-semibold text-stone-900">Elige tu hora</h2>

      {notice && (
        <p role="alert" className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">
          {notice}
        </p>
      )}

      {loadError && !days && (
        <p className="mt-4 text-stone-600">
          No hemos podido cargar las horas.{" "}
          <button onClick={load} className="font-medium text-accent underline underline-offset-4">
            Reintentar
          </button>
        </p>
      )}

      {days && days.length === 0 && <p className="mt-4 text-stone-600">Ya no quedan horas disponibles.</p>}

      {days && days.length > 0 && (
        <>
          <div role="tablist" className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-stone-100 p-1.5">
            {days.map((d) => {
              const active = d.date === activeDate;
              return (
                <button
                  key={d.date}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveDate(d.date)}
                  className={`h-12 rounded-xl text-base font-semibold transition ${
                    active ? "bg-white text-accent shadow-sm" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {shortDay(d.date)}
                </button>
              );
            })}
          </div>

          {[
            { label: "Mañana", slots: morning },
            { label: "Tarde", slots: afternoon },
          ].map(
            (group) =>
              group.slots.length > 0 && (
                <div key={group.label} className="mt-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">{group.label}</h3>
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                    {group.slots.map((slot) => {
                      const isSel = selected?.date === day?.date && selected?.slot.time === slot.time;
                      if (!slot.free) {
                        return (
                          <div
                            key={slot.time}
                            aria-disabled
                            className="flex h-16 flex-col items-center justify-center rounded-2xl bg-stone-50 text-stone-300"
                          >
                            <span className="text-lg font-semibold line-through decoration-1">{slot.time}</span>
                            <span className="text-xs font-medium">Ocupado</span>
                          </div>
                        );
                      }
                      return (
                        <button
                          key={slot.time}
                          onClick={() => pick(slot)}
                          className={`flex h-16 flex-col items-center justify-center rounded-2xl border text-lg font-semibold transition active:scale-[0.97] ${
                            isSel
                              ? "border-accent bg-accent text-white"
                              : "border-stone-200 bg-white text-stone-900 hover:border-accent hover:text-accent"
                          }`}
                        >
                          {slot.time}
                          {isSel && <span className="text-xs font-medium text-white/85">{`${slot.time} – ${slot.end}`}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ),
          )}
        </>
      )}

      {sheetOpen && selected && (
        <Sheet
          selected={selected}
          defaultName={params.get("n")?.trim().slice(0, 80) ?? ""}
          onClose={() => setSheetOpen(false)}
          onTaken={() => {
            setSheetOpen(false);
            setSelected(null);
            setNotice("Esa hora se acaba de ocupar, elige otra");
            load();
          }}
          onDone={(d) => {
            setSheetOpen(false);
            setDone(d);
          }}
        />
      )}
    </section>
  );
}

function Sheet({
  selected,
  defaultName,
  onClose,
  onTaken,
  onDone,
}: {
  selected: Selected;
  defaultName: string;
  onClose: () => void;
  onTaken: () => void;
  onDone: (d: Done) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Escribe tu nombre.");
    if (!normalizePhone(phone)) return setError("Escribe un móvil español de 9 cifras (empieza por 6 o 7).");
    setBusy(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selected.date,
          time: selected.slot.time,
          name,
          phone,
          website: honeypot.current?.value ?? "",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (data.ok) return onDone({ name: name.trim(), date: selected.date, time: selected.slot.time });
      if (data.error === "taken") return onTaken();
      if (data.error === "phone_has_booking")
        return setError("Ya tienes una reunión reservada con este móvil. Si necesitas cambiarla, escríbenos por WhatsApp.");
      if (data.error === "phone") return setError("Escribe un móvil español de 9 cifras (empieza por 6 o 7).");
      if (data.error === "name") return setError("Escribe tu nombre.");
      setError("Algo ha fallado. Inténtalo otra vez.");
    } catch {
      setError("Algo ha fallado. Revisa tu conexión e inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="animate-fade absolute inset-0 bg-stone-900/40" onClick={onClose} />
      <form
        onSubmit={submit}
        className="animate-sheet relative w-full max-w-md rounded-t-3xl bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-3xl sm:pt-6"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-stone-200 sm:hidden" />
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-serif text-2xl font-semibold text-stone-900">
            {`${longDayCap(selected.date)}, ${selected.slot.time} – ${selected.slot.end}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl text-stone-400 hover:bg-stone-100"
          >
            ×
          </button>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-stone-600">Nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={80}
            className="mt-1.5 h-14 w-full rounded-2xl border border-stone-200 px-4 text-lg outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-stone-600">Móvil</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="612 345 678"
            className="mt-1.5 h-14 w-full rounded-2xl border border-stone-200 px-4 text-lg outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        {/* Honeypot: hidden from people, bots fill it */}
        <input
          ref={honeypot}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          disabled={busy}
          className="mt-6 h-14 w-full rounded-2xl bg-accent text-lg font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
        >
          {busy ? "Confirmando…" : "Confirmar"}
        </button>
      </form>
    </div>
  );
}

function Confirmation({ done }: { done: Done }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }), []);
  return (
    <section ref={ref} className="animate-fade mt-6 rounded-3xl bg-[#f3f2fd] px-6 py-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-white">✓</div>
      <h2 className="mt-5 font-serif text-2xl font-semibold leading-snug text-stone-900">
        ¡Hecho, {done.name}! Nos vemos el {longDay(done.date)} a las {done.time} en Manolo Bakes.
      </h2>
      <a
        href={MAPS_URL}
        target="_blank"
        rel="noopener"
        className="mt-6 inline-flex h-14 w-full max-w-xs items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-white"
      >
        Cómo llegar
      </a>
      <p className="mt-5 text-stone-600">Si necesitas cambiar la hora, escríbenos por WhatsApp.</p>
    </section>
  );
}
