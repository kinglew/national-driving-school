import { useMemo, useState } from "react";
import { theoryModules } from "../data/catalog";
import { balanceCents, useDesk } from "../lib/store";
import { useI18n } from "../hooks/useI18n";
import { Button, Field, Money, When, inputClass } from "../components/ui";

export function Office() {
  const { t } = useI18n();
  const enrollments = useDesk((s) => s.enrollments);
  const enquiries = useDesk((s) => s.enquiries);
  const spots = useDesk((s) => s.spotsLeft());
  const setActive = useDesk((s) => s.setActive);
  const setLessonStatus = useDesk((s) => s.setLessonStatus);
  const addPayment = useDesk((s) => s.addPayment);
  const toggleModule = useDesk((s) => s.toggleModule);
  const resetDemo = useDesk((s) => s.resetDemo);
  const [selectedId, setSelectedId] = useState(enrollments[0]?.id ?? "");
  const selected =
    enrollments.find((e) => e.id === selectedId) ?? enrollments[0];
  const [amount, setAmount] = useState("100");
  const [method, setMethod] = useState<"desk" | "etransfer" | "card">("desk");

  const openBalances = useMemo(
    () => enrollments.reduce((s, e) => s + balanceCents(e), 0),
    [enrollments],
  );
  const upcoming = enrollments.reduce(
    (n, e) => n + e.lessons.filter((l) => l.status === "booked").length,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div>
        <h1 className="font-display text-5xl font-bold uppercase text-navy">
          {t.office.title}
        </h1>
        <p className="mt-2 text-sm text-muted">{t.office.lead}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border border-line bg-paper p-4">
          <p className="text-sm text-muted">{t.office.spots}</p>
          <p className="font-display text-5xl font-bold text-navy">{spots}</p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-sm text-muted">{t.office.openBalance}</p>
          <p className="font-display text-5xl font-bold text-navy">
            <Money cents={openBalances} />
          </p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-sm text-muted">{t.office.upcoming}</p>
          <p className="font-display text-5xl font-bold text-navy">{upcoming}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-3xl font-bold uppercase text-navy">
            {t.office.students}
          </h2>
          <div className="mt-3 space-y-2">
            {enrollments.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  setSelectedId(e.id);
                  setActive(e.id);
                }}
                className={`flex w-full items-center justify-between border px-4 py-3 text-left ${
                  selected?.id === e.id
                    ? "border-navy bg-paper"
                    : "border-line bg-cream"
                }`}
              >
                <span className="font-semibold">
                  {e.student.firstName} {e.student.lastName}
                </span>
                <Money cents={balanceCents(e)} />
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl font-bold uppercase text-navy">
            {t.office.inbox}
          </h2>
          <div className="mt-3 space-y-3">
            {enquiries.length === 0 ? (
              <p className="text-sm text-muted">{t.office.noInbox}</p>
            ) : null}
            {enquiries.map((q) => (
              <div key={q.id} className="border border-line bg-paper p-4 text-sm">
                <p className="font-semibold">
                  {q.name} · {t.visit.topics[q.topic as "information" | "registration"] ?? q.topic}
                </p>
                <p className="text-muted">
                  <When iso={q.at} />
                </p>
                <p className="mt-2">{q.message}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {selected ? (
        <section className="space-y-4 border border-line bg-cream p-5">
          <div>
            <p className="font-display text-3xl font-bold uppercase text-navy">
              {selected.student.firstName} {selected.student.lastName}
            </p>
            <p className="text-sm">
              {selected.student.email} · {selected.student.phone}
            </p>
            <p className="text-sm text-muted">
              {selected.courseId}
              {selected.promoApplied ? " · −$300" : ""}
            </p>
          </div>

          <div className="space-y-2">
            {selected.lessons.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 bg-paper px-3 py-2"
              >
                <div className="text-sm">
                  <When iso={l.at} /> · {l.instructor}
                  <br />
                  {l.placeId} · {t.desk.status[l.status]}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="line"
                    type="button"
                    onClick={() => setLessonStatus(selected.id, l.id, "done")}
                  >
                    {t.office.markDone}
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() =>
                      setLessonStatus(selected.id, l.id, "cancelled")
                    }
                  >
                    {t.office.cancel}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-semibold">{t.office.record}</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <Field label={t.office.amount}>
                <input
                  className={inputClass}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <Field label={t.office.method}>
                <select
                  className={inputClass}
                  value={method}
                  onChange={(e) =>
                    setMethod(e.target.value as "desk" | "etransfer" | "card")
                  }
                >
                  <option value="desk">{t.office.methods.desk}</option>
                  <option value="etransfer">{t.office.methods.etransfer}</option>
                  <option value="card">{t.office.methods.card}</option>
                </select>
              </Field>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => {
                    const dollars = Number(amount.replace(",", "."));
                    if (!Number.isFinite(dollars) || dollars <= 0) return;
                    addPayment(selected.id, {
                      subtotalCents: Math.round(dollars * 100),
                      method,
                      label: t.labels.balance,
                    });
                  }}
                >
                  {t.office.savePay}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">{t.office.modules}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {theoryModules.map((m, i) => {
                const n = i + 1;
                const on = selected.modulesDone.includes(n);
                return (
                  <button
                    key={m.en}
                    type="button"
                    onClick={() => toggleModule(selected.id, n)}
                    className={`h-10 w-10 rounded-md text-sm font-semibold ${
                      on
                        ? "bg-navy text-on-navy"
                        : "border border-line bg-cream text-ink"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <Button variant="line" type="button" onClick={() => resetDemo()}>
        {t.office.reset}
      </Button>
    </div>
  );
}
