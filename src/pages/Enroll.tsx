import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  courses,
  getCourse,
  instructors,
  isCourseId,
  lessonSlots,
  luhnOk,
  newId,
  places,
  priceAfterPromo,
  taxBreakdown,
  type CourseId,
} from "../data/catalog";
import { useDesk, type Student } from "../lib/store";
import { useI18n } from "../hooks/useI18n";
import { Button, Field, Money, inputClass } from "../components/ui";

function ageFromDob(dob: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [y, m, d] = dob.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - (y ?? 0);
  if (
    now.getMonth() + 1 < (m ?? 0) ||
    (now.getMonth() + 1 === m && now.getDate() < (d ?? 0))
  )
    age--;
  return age;
}

function expiryOk(value: string) {
  const m = value.replace(/\s/g, "").match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const exp = new Date(year, month);
  return exp > now;
}

export function Enroll() {
  const { t, lang } = useI18n();
  const [params] = useSearchParams();
  const initial = params.get("course") ?? "pesr";
  const [courseId, setCourseId] = useState<CourseId>(
    isCourseId(initial) ? initial : "pesr",
  );
  const [step, setStep] = useState(0);
  const [student, setStudent] = useState<Student>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    licence: "none",
    language: lang,
    guardian: "",
  });
  const [wantLesson, setWantLesson] = useState(true);
  const [slot, setSlot] = useState<string>("");
  const [instructor, setInstructor] = useState<string>(instructors[0]);
  const [placeId, setPlaceId] = useState<string>(places[0].id);
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ enrollmentId: string; paymentId: string } | null>(
    null,
  );
  const enroll = useDesk((s) => s.enroll);
  const addPayment = useDesk((s) => s.addPayment);
  const spots = useDesk((s) => s.spotsLeft());
  const slots = useMemo(() => lessonSlots(), []);

  const course = getCourse(courseId)!;
  const promoWouldApply = course.promo && spots > 0;
  const dueSubtotal = (() => {
    const after = priceAfterPromo(course.price, promoWouldApply);
    if (course.deposit != null && course.deposit < after) return course.deposit;
    return after;
  })();
  const dueTax = taxBreakdown(dueSubtotal);
  const balanceAfter =
    priceAfterPromo(course.price, promoWouldApply) - dueSubtotal;
  const age = ageFromDob(student.dob);

  function validateStudent() {
    if (student.firstName.trim().length < 1 || student.lastName.trim().length < 1)
      return t.enroll.errors.name;
    if (!student.email.includes("@") || student.email.length < 5)
      return t.enroll.errors.email;
    if (student.phone.replace(/\D/g, "").length < 10) return t.enroll.errors.phone;
    if (age == null || age < 14 || age > 90) return t.enroll.errors.dob;
    if (age < 18 && student.guardian.trim().length < 2)
      return t.enroll.errors.guardian;
    return "";
  }

  function validateCard() {
    const digits = card.number.replace(/\D/g, "");
    if (!luhnOk(digits)) return t.enroll.errors.card;
    if (!expiryOk(card.expiry)) return t.enroll.errors.expiry;
    if (!/^\d{3}$/.test(card.cvc)) return t.enroll.errors.cvc;
    return "";
  }

  function finish(method: "card" | "desk") {
    if (method === "card") {
      const err = validateCard();
      if (err) {
        setError(err);
        return;
      }
    }
    const lesson =
      wantLesson && slot
        ? {
            id: newId("les"),
            at: slot,
            minutes:
              course.practicalSessions >= 2 && course.id === "pass" ? 120 : 55,
            instructor,
            placeId,
            status: "booked" as const,
          }
        : undefined;
    const enrollmentId = enroll({ courseId, student, lesson });
    const state = useDesk.getState();
    const enr = state.enrollments.find((e) => e.id === enrollmentId);
    const applied = enr?.promoApplied ?? false;
    const priced = priceAfterPromo(course.price, applied);
    const sub =
      course.deposit != null && course.deposit < priced ? course.deposit : priced;
    const paymentId = addPayment(enrollmentId, {
      subtotalCents: sub,
      method,
      label: sub < priced ? t.labels.deposit : t.labels.full,
      last4:
        method === "card"
          ? card.number.replace(/\D/g, "").slice(-4)
          : undefined,
    });
    setDone({ enrollmentId, paymentId });
    setStep(4);
    setError("");
  }

  if (done && step === 4) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="font-display text-5xl font-bold uppercase text-navy">
          {t.enroll.doneTitle}
        </h1>
        <p className="mt-3 text-sm text-muted">{t.enroll.doneBody}</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/desk"
            className="inline-flex h-12 items-center rounded-md bg-red px-5 text-sm font-semibold text-on-red"
          >
            {t.enroll.seeFile}
          </Link>
          <Link
            to={`/invoice/${done.paymentId}`}
            className="inline-flex h-12 items-center rounded-md border border-line px-5 text-sm font-semibold"
          >
            {t.enroll.seeInvoice}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <h1 className="font-display text-5xl font-bold uppercase text-navy">
          {t.enroll.title}
        </h1>
        <ol className="mt-4 flex flex-wrap gap-2">
          {t.enroll.steps.map((label, i) => (
            <li
              key={label}
              className={`rounded-md px-3 py-1 text-sm font-semibold ${
                i === step ? "bg-navy text-on-navy" : "bg-paper text-muted"
              }`}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <div className="mt-6 space-y-3">
            {courses.map((c) => {
              const name = lang === "fr" ? c.fr.name : c.en.name;
              const on = c.id === courseId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCourseId(c.id)}
                  className={`flex w-full items-center justify-between border p-4 text-left ${
                    on ? "border-navy bg-paper" : "border-line bg-cream"
                  }`}
                >
                  <span className="font-display text-2xl font-bold uppercase text-navy">
                    {name}
                  </span>
                  <Money cents={c.price} />
                </button>
              );
            })}
            <Button className="mt-4" onClick={() => setStep(1)}>
              {t.enroll.next}
            </Button>
          </div>
        ) : null}

        {step === 1 ? (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const err = validateStudent();
              setError(err);
              if (!err) setStep(2);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.enroll.first}>
                <input
                  className={inputClass}
                  value={student.firstName}
                  onChange={(e) =>
                    setStudent({ ...student, firstName: e.target.value })
                  }
                />
              </Field>
              <Field label={t.enroll.last}>
                <input
                  className={inputClass}
                  value={student.lastName}
                  onChange={(e) =>
                    setStudent({ ...student, lastName: e.target.value })
                  }
                />
              </Field>
            </div>
            <Field label={t.enroll.email}>
              <input
                className={inputClass}
                type="email"
                value={student.email}
                onChange={(e) =>
                  setStudent({ ...student, email: e.target.value })
                }
              />
            </Field>
            <Field label={t.enroll.phone}>
              <input
                className={inputClass}
                value={student.phone}
                onChange={(e) =>
                  setStudent({ ...student, phone: e.target.value })
                }
              />
            </Field>
            <Field label={t.enroll.dob}>
              <input
                className={inputClass}
                type="date"
                value={student.dob}
                onChange={(e) => setStudent({ ...student, dob: e.target.value })}
              />
            </Field>
            {age != null && age < 16 ? (
              <p className="text-sm text-muted">{t.enroll.young}</p>
            ) : null}
            <Field label={t.enroll.licence}>
              <select
                className={inputClass}
                value={student.licence}
                onChange={(e) =>
                  setStudent({ ...student, licence: e.target.value })
                }
              >
                {Object.entries(t.enroll.licences).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`${t.enroll.guardian} (${t.enroll.guardianHint})`}>
              <input
                className={inputClass}
                value={student.guardian}
                onChange={(e) =>
                  setStudent({ ...student, guardian: e.target.value })
                }
              />
            </Field>
            {error ? <p className="text-sm text-red">{error}</p> : null}
            <div className="flex gap-3">
              <Button type="button" variant="line" onClick={() => setStep(0)}>
                {t.enroll.back}
              </Button>
              <Button type="submit">{t.enroll.next}</Button>
            </div>
          </form>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!wantLesson}
                onChange={(e) => setWantLesson(!e.target.checked)}
              />
              {t.enroll.skipLesson}
            </label>
            {wantLesson ? (
              <>
                <p className="text-sm font-semibold">{t.enroll.pickLesson}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {slots.map((iso) => (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSlot(iso)}
                      className={`border px-3 py-2 text-left text-sm ${
                        slot === iso
                          ? "border-navy bg-paper"
                          : "border-line bg-cream"
                      }`}
                    >
                      {new Intl.DateTimeFormat(
                        lang === "fr" ? "fr-CA" : "en-CA",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "America/Toronto",
                        },
                      ).format(new Date(iso))}
                    </button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t.enroll.instructor}>
                    <select
                      className={inputClass}
                      value={instructor}
                      onChange={(e) => setInstructor(e.target.value)}
                    >
                      {instructors.map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t.enroll.place}>
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
                  </Field>
                </div>
              </>
            ) : null}
            <div className="flex gap-3">
              <Button type="button" variant="line" onClick={() => setStep(1)}>
                {t.enroll.back}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (wantLesson && !slot) return;
                  setStep(3);
                }}
              >
                {t.enroll.next}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              finish("card");
            }}
          >
            <h2 className="font-display text-3xl font-bold uppercase text-navy">
              {t.enroll.payTitle}
            </h2>
            <p className="text-sm text-muted">{t.enroll.cardHint}</p>
            <Field label={t.enroll.nameOnCard}>
              <input
                className={inputClass}
                value={card.name}
                onChange={(e) => setCard({ ...card, name: e.target.value })}
                autoComplete="cc-name"
              />
            </Field>
            <Field label={t.enroll.number}>
              <input
                className={inputClass}
                inputMode="numeric"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: e.target.value })}
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.enroll.expiry}>
                <input
                  className={inputClass}
                  placeholder="12 / 28"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                  autoComplete="cc-exp"
                />
              </Field>
              <Field label={t.enroll.cvc}>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={card.cvc}
                  onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                  autoComplete="cc-csc"
                />
              </Field>
            </div>
            {error ? <p className="text-sm text-red">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="line" onClick={() => setStep(2)}>
                {t.enroll.back}
              </Button>
              <Button type="submit">{t.enroll.payCta}</Button>
              <Button type="button" variant="ghost" onClick={() => finish("desk")}>
                {t.enroll.deskInstead}
              </Button>
            </div>
          </form>
        ) : null}
      </div>

      <aside className="h-fit border border-line bg-cream p-5">
        <h2 className="font-display text-3xl font-bold uppercase text-navy">
          {t.enroll.summary}
        </h2>
        <p className="mt-3 font-semibold">
          {lang === "fr" ? course.fr.name : course.en.name}
        </p>
        {promoWouldApply ? (
          <p className="mt-2 text-sm text-ok">{t.enroll.promoLine}</p>
        ) : null}
        <p className="mt-4 text-sm text-muted">
          {t.from} <Money cents={course.price} />
        </p>
        <p className="mt-2 text-sm font-semibold">
          {t.enroll.dueNow} <Money cents={dueTax.totalCents} />
        </p>
        <p className="mt-1 text-sm">
          {t.enroll.balanceAfter} <Money cents={balanceAfter} />
        </p>
        <p className="mt-4 text-xs text-muted">TPS 5 % · TVQ 9,975 %</p>
      </aside>
    </div>
  );
}
