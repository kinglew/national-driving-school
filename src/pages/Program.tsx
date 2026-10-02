import { phases, theoryModules } from "../data/catalog";
import { useI18n } from "../hooks/useI18n";
import { ButtonLink } from "../components/ui";

export function Program() {
  const { t, lang } = useI18n();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-5xl font-bold uppercase text-navy">
            {t.program.title}
          </h1>
          <p className="mt-4 text-base text-ink">{t.program.lead}</p>
          <p className="mt-3 text-sm text-muted">{t.program.note}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/enroll?course=pesr">{t.nav.book}</ButtonLink>
            <a
              className="inline-flex h-12 items-center justify-center rounded-md border border-line px-5 text-sm font-semibold text-navy"
              href="https://saaq.gouv.qc.ca/en/drivers-licences/obtaining-licence/passenger-vehicle-class-5"
              target="_blank"
              rel="noreferrer"
            >
              {t.program.official}
            </a>
          </div>
        </div>
        <img
          src="/photos/lesson.jpg"
          alt="An instructor and a student during an on-road lesson."
          className="h-80 w-full object-cover"
        />
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-4">
        {phases.map((p) => (
          <div key={p.id} className="border border-line bg-paper p-4">
            <p className="text-sm font-semibold tracking-widest text-red">
              Phase {p.id}
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-navy">
              {p.days} {t.days}
            </p>
            <p className="mt-2 text-sm text-muted">{lang === "fr" ? p.fr : p.en}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 font-display text-4xl font-bold uppercase text-navy">
        {t.program.modules}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {theoryModules.map((m, i) => (
          <div key={m.en} className="flex items-center gap-3 border border-line bg-paper p-3">
            <span className="flex h-10 w-10 items-center justify-center bg-navy font-display text-xl font-bold text-on-navy">
              {i + 1}
            </span>
            <span className="text-sm font-semibold text-ink">
              {lang === "fr" ? m.fr : m.en}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
