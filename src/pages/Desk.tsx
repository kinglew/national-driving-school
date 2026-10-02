import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getCourse,
  instructors,
  lessonSlots,
  luhnOk,
  newId,
  phaseProgress,
  places,
  placeLabel,
  theoryModules,
} from "../data/catalog";
import { balanceCents, useDesk } from "../lib/store";
import { useI18n } from "../hooks/useI18n";
import { Button, Field, Money, When, inputClass } from "../components/ui";

export function Desk() {
  const { t, lang } = useI18n();
  const enrollments = useDesk((s) => s.enrollments);
  const activeId = useDesk((s) => s.activeId);
  const setActive = useDesk((s) => s.setActive);
  const addPayment = useDesk((s) => s.addPayment);
  const bookLesson = useDesk((s) => s.bookLesson);
  const active = enrollments.find((e) => e.id === activeId) ?? enrollments[0];

  const [payOpen, setPayOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [card, setCard] = useState("");
  const [err, setErr] = useState("");
  const [slot, setSlot] = useState(lessonSlots()[0] ?? "");
  const [instructor, setInstructor] = useState<string>(instructors[0]);
  const [placeId, setPlaceId] = useState<string>(places[0].id);

  if (!active) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-5xl font-bold uppercase text-navy">
          {t.desk.title}
        </h1>
        <p className="mt-3 text-sm text-muted">{t.desk.empty}</p>
        <Link
          to="/enroll?course=pesr"
          className="mt-6 inline-flex h-12 items-center rounded-md bg-red px-5 text-sm font-semibold text-on-red"
        >
          {t.desk.emptyCta}
        </Link>
      </div>
    );
  }

  const course = getCourse(active.courseId);
  const name = course
    ? lang === "fr"
      ? course.fr.name
      : course.en.name
    : active.courseId;
  const bal = balanceCents(active);
  const phase = phaseProgress(active.modulesDone, active.practicalDone);
  const theoryMax = course?.theoryModules ?? 0;
  const practicalMax = course?.practicalSessions ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div>
        <h1 className="font-display text-5xl font-bold uppercase text-navy">
          {t.desk.title}
        </h1>
        <p className="mt-2 text-xl font-semibold">
          {active.student.firstName} {active.student.lastName}
        </p>
        <p className="text-sm text-muted">{name}</p>
        {enrollments.length > 1 ? (
          <label className="mt-3 block text-sm">
            {t.desk.switch}
            <select
              className={`${inputClass} mt-1 max-w-sm`}
              value={active.id}
              onChange={(e) => setActive(e.target.value)}
            >
              {enrollments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.student.firstName} {e.student.lastName} · {e.courseId}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border border-line bg-paper p-4">
          <p className="text-sm text-muted">{t.desk.progress}</p>
          <p className="font-display text-4xl font-bold text-navy">
            {phase} / 4
          </p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-sm text-muted">{t.desk.theory}</p>
          <p className="font-display text-4xl font-bold text-navy">
            {active.modulesDone.length}
            {theoryMax ? ` / ${theoryMax}` : ""}
          </p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-sm text-muted">{t.desk.balance}</p>
          <p className="font-display text-4xl font-bold text-navy">
            {bal === 0 ? t.desk.paidUp : <Money cents={bal} />}
          </p>
          {bal > 0 ? (
            <Button className="mt-3" onClick={() => setPayOpen(true)}>
              {t.desk.payBalance}
            </Button>
          ) : null}
        </div>
      </div>

      {payOpen && bal > 0 ? (
        <form
          className="space-y-3 border border-line bg-cream p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!luhnOk(card.replace(/\D/g, ""))) {
              setErr(t.enroll.errors.card);
              return;
            }
            addPayment(active.id, {
              subtotalCents: bal,
              method: "card",
              label: t.labels.balance,
              last4: card.replace(/\D/g, "").slice(-4),
            });
            setPayOpen(false);
            setErr("");
          }}
        >
          <p className="text-sm text-muted">{t.enroll.cardHint}</p>
          <Field label={t.enroll.number}>
            <input
              className={inputClass}
              value={card}
              onChange={(e) => setCard(e.target.value)}
            />
          </Field>
          {err ? <p className="text-sm text-red">{err}</p> : null}
          <Button type="submit">
            {t.desk.payBalance} · <Money cents={bal} />
          </Button>
        </form>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-3xl font-bold uppercase text-navy">
            {t.desk.lessons}
          </h2>
          <Button variant="line" type="button" onClick={() => setBookOpen((v) => !v)}>
            {t.desk.book}
          </Button>
        </div>
        {bookOpen ? (
          <div className="mb-4 grid gap-3 border border-line bg-cream p-4 sm:grid-cols-3">
            <select
              className={inputClass}
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
            >
              {lessonSlots().map((iso) => (
                <option key={iso} value={iso}>
                  {iso.slice(0, 16).replace("T", " ")}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
            >
              {instructors.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <select
              className={inputClass}
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
            >
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {lang === "fr" ? p.fr : p.en}
                </option>
              ))}
            </select>
            <Button
              type="button"
              onClick={() => {
                bookLesson(active.id, {
                  id: newId("les"),
                  at: slot,
                  minutes: 55,
                  instructor,
                  placeId,
                  status: "booked",
                });
                setBookOpen(false);
              }}
            >
              {t.desk.book}
            </Button>
          </div>
        ) : null}
        <div className="space-y-2">
          {active.lessons.length === 0 ? (
            <p className="text-sm text-muted">{t.desk.none}</p>
          ) : null}
          {active.lessons.map((l) => (
            <div
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-2 border border-line bg-paper px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">
                  <When iso={l.at} />
                </p>
                <p className="text-sm text-muted">
                  {l.instructor} · {placeLabel(l.placeId, lang)} · {l.minutes} min
                </p>
              </div>
              <span className="text-sm font-semibold">
                {t.desk.status[l.status]}
              </span>
            </div>
          ))}
        </div>
        {practicalMax > 0 ? (
          <p className="mt-3 text-sm text-muted">
            {t.desk.road} : {active.practicalDone} / {practicalMax}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="font-display text-3xl font-bold uppercase text-navy">
          {t.desk.invoices}
        </h2>
        <div className="mt-3 space-y-2">
          {active.payments.length === 0 ? (
            <p className="text-sm text-muted">{t.desk.noPay}</p>
          ) : null}
          {active.payments.map((p) => (
            <Link
              key={p.id}
              to={`/invoice/${p.id}`}
              className="flex items-center justify-between border border-line bg-paper px-4 py-3 hover:border-navy"
            >
              <div>
                <p className="font-semibold">{p.label}</p>
                <p className="text-sm text-muted">
                  <When iso={p.at} />
                </p>
              </div>
              <Money cents={p.totalCents} />
            </Link>
          ))}
        </div>
      </section>

      {theoryMax > 0 ? (
        <section>
          <h2 className="font-display text-3xl font-bold uppercase text-navy">
            {t.desk.theory}
          </h2>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {theoryModules.map((m, i) => {
              const n = i + 1;
              const done = active.modulesDone.includes(n);
              return (
                <li
                  key={m.en}
                  className={`border px-3 py-2 text-sm ${
                    done
                      ? "border-ok bg-paper text-ok"
                      : "border-line text-muted"
                  }`}
                >
                  {n}. {lang === "fr" ? m.fr : m.en}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
