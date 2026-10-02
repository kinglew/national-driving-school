import { Gauge, FileText, Users } from "lucide-react";
import { courses, phases } from "../data/catalog";
import { useDesk } from "../lib/store";
import { useI18n } from "../hooks/useI18n";
import { CourseTile } from "../components/CourseTile";
import { ButtonLink } from "../components/ui";

const icons = [Gauge, Users, FileText];

export function Home() {
  const { t, lang } = useI18n();
  const spots = useDesk((s) => s.spotsLeft());

  return (
    <>
      <section className="mx-auto grid max-w-6xl lg:grid-cols-2">
        <div className="relative min-h-96">
          <img
            src="/photos/hero.jpg"
            alt="A new driver smiling from the driver's seat, downtown Montreal behind her."
            className="h-full min-h-96 w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center gap-6 bg-cream px-5 py-10 lg:px-10">
          <p className="text-sm font-semibold tracking-widest text-red">
            {t.hero.kicker}
          </p>
          <h1 className="font-display text-6xl font-bold uppercase leading-none text-navy md:text-7xl">
            {t.hero.title}
          </h1>
          <p className="max-w-xl text-base text-ink">{t.hero.body}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/enroll?course=pesr">{t.hero.primary}</ButtonLink>
            <ButtonLink to="/courses/pesr" variant="line">
              {t.hero.secondary}
            </ButtonLink>
          </div>
          <p className="text-sm text-muted">{t.hero.fine}</p>
        </div>
      </section>

      <section className="bg-red text-on-red">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold tracking-widest">{t.promo.kicker}</p>
            <p className="font-display text-4xl font-bold uppercase leading-none">
              {t.promo.title}
            </p>
          </div>
          <div className="bg-gold px-5 py-3 text-on-gold">
            <p className="font-display text-5xl font-bold leading-none">{spots}</p>
            <p className="text-sm font-semibold">{t.promo.left}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3">
        {t.points.map((point, i) => {
          const Icon = icons[i] ?? Gauge;
          return (
            <div key={point.title} className="border border-line bg-paper p-6">
              <Icon className="h-6 w-6 text-red" />
              <h2 className="mt-4 font-display text-3xl font-bold uppercase text-navy">
                {point.title}
              </h2>
              <p className="mt-2 text-sm text-muted">{point.body}</p>
            </div>
          );
        })}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-5xl font-bold uppercase text-navy">
              {t.homeCourses}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">{t.homeCoursesLead}</p>
          </div>
          <ButtonLink to="/courses" variant="ghost" className="hidden text-sm font-semibold text-red sm:inline">
            {t.allCourses}
          </ButtonLink>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {courses.slice(0, 4).map((c) => (
            <CourseTile key={c.id} course={c} />
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          {lang === "fr" ? "Rabais d’aperçu" : "Preview discount"} : 300 $
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-5xl font-bold uppercase text-navy">
          {t.phasesTitle}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t.phasesLead}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {phases.map((p) => (
            <div key={p.id} className="border-t-4 border-navy bg-paper p-4">
              <p className="font-display text-4xl font-bold text-red">{p.id}</p>
              <p className="text-sm font-semibold text-navy">
                {p.days} {t.days}
              </p>
              <p className="mt-2 text-sm text-muted">{lang === "fr" ? p.fr : p.en}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy text-on-navy">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-12 md:grid-cols-2">
          <img
            src="/photos/street.jpg"
            alt="A summer street in downtown Montreal."
            className="h-72 w-full object-cover"
          />
          <div>
            <h2 className="font-display text-5xl font-bold uppercase">
              {t.visitBand.title}
            </h2>
            <p className="mt-3 text-sm leading-6">{t.visitBand.body}</p>
            <div className="mt-6">
              <ButtonLink to="/visit" variant="gold">
                {t.visitBand.cta}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
