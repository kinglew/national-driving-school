import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Menu, Phone, X } from "lucide-react";
import { school } from "../data/catalog";
import { privacyCopy } from "../data/privacy";
import { useI18n } from "../hooks/useI18n";
import { Logo } from "./ui";

export function Layout() {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const nav = [
    { to: "/courses", label: t.nav.courses },
    { to: "/program", label: t.nav.program },
    { to: "/enroll?course=pesr", label: t.nav.book },
    { to: "/desk", label: t.nav.desk },
    { to: "/visit", label: t.nav.visit },
  ];

  return (
    <div className="min-h-screen">
      <div className="no-print bg-navy text-on-navy">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-sm">
          <a
            href={school.phoneHref}
            className="inline-flex items-center gap-2 font-semibold"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {school.phone}
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={lang === "en"}
              onClick={() => setLang("en")}
              className={`h-9 rounded-md px-3 ${lang === "en" ? "bg-paper text-navy" : "text-on-navy"}`}
            >
              EN
            </button>
            <button
              type="button"
              aria-pressed={lang === "fr"}
              onClick={() => setLang("fr")}
              className={`h-9 rounded-md px-3 ${lang === "fr" ? "bg-paper text-navy" : "text-on-navy"}`}
            >
              FR
            </button>
          </div>
        </div>
      </div>

      <header className="no-print sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="shrink-0" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-semibold text-navy hover:text-red"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden lg:block">
            <Link
              to="/enroll?course=pesr"
              className="inline-flex h-12 items-center rounded-md bg-red px-5 text-sm font-semibold text-on-red"
            >
              {t.nav.book}
            </Link>
          </div>
          <button
            type="button"
            className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-line lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close" : "Menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open ? (
          <nav className="border-t border-line bg-paper px-4 py-3 lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex h-12 items-center border-b border-line text-base font-semibold text-navy"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <div className="no-print border-b border-gold bg-gold px-4 py-2 text-center text-sm font-medium text-on-gold">
        {t.preview}
      </div>

      <main>
        <Outlet />
      </main>

      <footer className="no-print mt-16 bg-navy text-on-navy">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
          <Logo light />
          <div className="text-sm leading-6">
            <p className="font-semibold">{school.legal}</p>
            <p>{school.street}</p>
            <p>{school.city}</p>
            <p className="mt-2">{school.phone}</p>
            <p>
              <a href={`mailto:${school.email}`} className="underline-offset-2 hover:underline">
                {school.email}
              </a>
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/office" className="font-semibold text-gold">
              {t.nav.office}
            </Link>
            <Link to="/desk">{t.nav.desk}</Link>
            <Link to="/visit">{t.nav.visit}</Link>
            <Link to="/privacy">{privacyCopy[lang].linkLabel}</Link>
            <a href="https://saaq.gouv.qc.ca/en/drivers-licences/obtaining-licence/passenger-vehicle-class-5">
              SAAQ · Class 5
            </a>
          </div>
        </div>
        <div className="border-t border-navy-2 px-4 py-4 text-center text-xs text-on-navy/80">
          <p>
            © {school.since}–2026 {school.legal}. {t.footer.rights}
          </p>
          <p className="mt-1">{t.footer.sampleTax}</p>
        </div>
      </footer>
    </div>
  );
}
