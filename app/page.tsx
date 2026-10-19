import { existsSync } from "node:fs";
import path from "node:path";
import { Suspense } from "react";
import Booking from "@/components/Booking";
import Greeting from "@/components/Greeting";
import { MAPS_URL } from "@/lib/links";

function Hero() {
  const hasPhoto = existsSync(path.join(process.cwd(), "public", "manolo.jpg"));
  if (hasPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/manolo.jpg" alt="Manolo Bakes" className="h-28 w-full object-cover object-[center_35%] sm:h-48 sm:rounded-3xl" />
    );
  }
  return (
    <div
      aria-hidden
      className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-[#f6e7d4] via-[#efd3b5] to-[#d9a77c] sm:h-48 sm:rounded-3xl"
    >
      <div className="absolute -left-10 -top-12 h-48 w-48 rounded-full bg-white/30 blur-2xl" />
      <div className="absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-[#b9784a]/30 blur-3xl" />
      <svg viewBox="0 0 120 100" className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-[#7a4a2a]/80">
        <path d="M44 14c-4 6 4 9 0 16M60 10c-4 7 4 10 0 18M76 14c-4 6 4 9 0 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M24 40h68v12c0 18-15 32-34 32S24 70 24 52V40z" fill="currentColor" />
        <path d="M92 46h6a10 10 0 010 20h-8" fill="none" stroke="currentColor" strokeWidth="5" />
        <rect x="16" y="88" width="88" height="5" rx="2.5" fill="currentColor" />
      </svg>
    </div>
  );
}

const LINES = [
  "Ponemos en contacto a estudiantes y gente de alquiler con profesionales de confianza para arreglos pequeños.",
  "Tú decides qué trabajos coges y pones tu precio. Sin cuotas ni porcentajes: solo 3 € por trabajo hecho y cobrado.",
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-2xl pb-10 sm:px-6 sm:pt-6">
      <Hero />
      <div className="px-5 sm:px-0">
        {existsSync(path.join(process.cwd(), "public", "nosotros.jpg")) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/nosotros.jpg"
            alt="Tono y Jo"
            className="relative -mt-10 h-20 w-20 rounded-2xl object-cover shadow-md ring-4 ring-white sm:h-24 sm:w-24"
          />
        )}
        <h1 className="mt-3 font-serif text-[1.6rem] font-semibold leading-tight tracking-tight text-stone-900 sm:text-3xl">
          Tómate un café con Tono y Jo
        </h1>
        <Suspense fallback={null}>
          <Greeting />
        </Suspense>
        <p className="mt-2 text-[13px] leading-snug text-stone-600">
          Si estás viendo esto es porque eres uno de los profesionales de confianza que más nos han gustado. Queremos
          conocerte, saber cómo trabajas y qué te complica el día a día, para hacértelo más fácil. Y aprender de ti, para
          que nos ayudemos todos.
        </p>
        <ul className="mt-3 space-y-1.5">
          {LINES.map((line) => (
            <li key={line} className="flex gap-2.5 text-[13px] leading-snug text-stone-600">
              <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-accent" />
              <span>{line}</span>
            </li>
          ))}
          <li className="flex gap-2.5 text-[13px] leading-snug text-stone-600">
            <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-accent" />
            <span>
              La reunión dura entre 40 min y 1 h en Manolo Bakes, Avenida de América, y te pagamos 20 € por Bizum por tu tiempo.{" "}
              <a href={MAPS_URL} target="_blank" rel="noopener" className="font-medium text-accent underline underline-offset-4">
                Cómo llegar
              </a>
            </span>
          </li>
        </ul>

        <Suspense fallback={<div className="mt-10 h-96 animate-pulse rounded-3xl bg-stone-100" />}>
          <Booking />
        </Suspense>

        <footer className="mt-12 border-t border-stone-100 pt-6 text-center text-sm text-stone-500">
          Usamos tu nombre y móvil solo para organizar esta reunión.
        </footer>
      </div>
    </main>
  );
}
