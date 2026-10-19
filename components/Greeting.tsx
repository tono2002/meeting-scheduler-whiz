"use client";

import { useSearchParams } from "next/navigation";

export default function Greeting() {
  const name = useSearchParams().get("n")?.trim().slice(0, 40);
  if (!name) return null;
  return <p className="mt-3 text-xl font-medium text-accent">Hola, {name}.</p>;
}
