import { Link, type LinkProps } from "react-router-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { formatMoney } from "../data/catalog";
import { useI18n } from "../hooks/useI18n";

const variants = {
  red: "bg-red text-on-red hover:bg-red-deep",
  navy: "bg-navy text-on-navy hover:bg-navy-2",
  gold: "bg-gold text-on-gold",
  ghost: "bg-transparent text-navy hover:bg-cream",
  line: "border border-line bg-paper text-ink hover:border-navy",
} as const;

type Variant = keyof typeof variants;

export function Button({
  variant = "red",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "red",
  className = "",
  children,
  ...props
}: LinkProps & { variant?: Variant; children: ReactNode }) {
  return (
    <Link
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputClass =
  "h-12 w-full rounded-md border border-line bg-paper px-3 text-base text-ink outline-none focus:border-navy";

export function Money({ cents }: { cents: number }) {
  const { lang } = useI18n();
  return <>{formatMoney(cents, lang)}</>;
}

export function When({ iso }: { iso: string }) {
  const { lang } = useI18n();
  const text = new Intl.DateTimeFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(new Date(iso));
  return <>{text}</>;
}

export function Logo({ light = false }: { light?: boolean }) {
  // logo fill via classes
  const wheel = light ? "var(--color-navy)" : "var(--color-navy)";
  return (
    <span className="flex items-center gap-3">
      <svg viewBox="0 0 48 48" className="h-11 w-11 shrink-0" aria-hidden>
        <rect width="48" height="48" rx="8" fill="var(--color-navy)" />
        <path
          d="M8 30h32l-3.2-9.2a3 3 0 0 0-2.8-2H14a3 3 0 0 0-2.8 2L8 30z"
          fill="var(--color-gold)"
        />
        <path
          d="M16 18.5 19.2 13h9.6L32 18.5"
          fill="none"
          stroke={light ? "var(--color-on-navy)" : "var(--color-cream)"}
          strokeWidth="2"
        />
        <circle cx="16" cy="31.5" r="2.6" fill={wheel} />
        <circle cx="32" cy="31.5" r="2.6" fill={wheel} />
      </svg>
      <span className="leading-none">
        <span
          className={`block font-display text-2xl font-bold tracking-wide ${light ? "text-on-navy" : "text-navy"}`}
        >
          NATIONAL
        </span>
        <span
          className={`block text-xs font-semibold tracking-widest ${light ? "text-gold" : "text-red"}`}
        >
          DRIVING SCHOOL
        </span>
      </span>
    </span>
  );
}
