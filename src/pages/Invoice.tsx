import { Link, useParams } from "react-router-dom";
import { getCourse, placeLabel, school } from "../data/catalog";
import { useDesk } from "../lib/store";
import { useI18n } from "../hooks/useI18n";
import { Button, Money, When } from "../components/ui";

export function Invoice() {
  const { id = "" } = useParams();
  const { t, lang } = useI18n();
  const enrollments = useDesk((s) => s.enrollments);
  const enrollment = enrollments.find((e) =>
    e.payments.some((p) => p.id === id),
  );
  const payment = enrollment?.payments.find((p) => p.id === id);

  if (!enrollment || !payment) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p>{t.invoice.missing}</p>
        <Link to="/desk" className="mt-4 inline-block font-semibold text-red">
          {t.nav.desk}
        </Link>
      </div>
    );
  }

  const course = getCourse(enrollment.courseId);
  const courseName = course
    ? lang === "fr"
      ? course.fr.name
      : course.en.name
    : enrollment.courseId;
  const methodLabel =
    payment.method === "card"
      ? t.labels.card
      : payment.method === "etransfer"
        ? t.labels.etransfer
        : t.labels.desk;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="no-print mb-4">
        <Button type="button" variant="line" onClick={() => window.print()}>
          {t.invoice.print}
        </Button>
      </div>
      <div className="border border-line bg-paper p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-3xl font-bold uppercase text-navy">
              {school.name}
            </p>
            <p className="text-sm">{school.legal}</p>
            <p className="text-sm text-muted">
              {school.street}, {school.city}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{t.invoice.receipt}</p>
            <p>{payment.id}</p>
            <p>
              <When iso={payment.at} />
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm font-semibold">{t.invoice.billTo}</p>
        <p>
          {enrollment.student.firstName} {enrollment.student.lastName}
        </p>
        <p className="text-sm">{enrollment.student.email}</p>
        <p className="text-sm">{enrollment.student.phone}</p>

        <div className="mt-8 border-t border-line pt-4">
          <div className="flex justify-between text-sm font-semibold">
            <span>{t.invoice.item}</span>
            <span>{t.invoice.total}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4 text-sm">
            <div>
              {courseName}
              <div className="text-muted">
                {payment.label}
                {payment.last4 ? ` · •••• ${payment.last4}` : ""}
                {enrollment.promoApplied ? ` · ${t.enroll.promoLine}` : ""}
              </div>
            </div>
            <Money cents={payment.subtotalCents} />
          </div>
        </div>

        <div className="mt-6 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>{t.invoice.subtotal}</span>
            <Money cents={payment.subtotalCents} />
          </div>
          <div className="flex justify-between">
            <span>{t.invoice.gst}</span>
            <Money cents={payment.gstCents} />
          </div>
          <div className="flex justify-between">
            <span>{t.invoice.qst}</span>
            <Money cents={payment.qstCents} />
          </div>
          <div className="flex justify-between font-semibold">
            <span>{t.invoice.total}</span>
            <Money cents={payment.totalCents} />
          </div>
          <div className="flex justify-between">
            <span>{t.invoice.method}</span>
            <span>{methodLabel}</span>
          </div>
        </div>

        {enrollment.lessons[0] ? (
          <p className="mt-6 text-sm text-muted">
            {enrollment.lessons[0].instructor} ·{" "}
            {placeLabel(enrollment.lessons[0].placeId, lang)}
          </p>
        ) : null}

        <p className="mt-8 text-xs text-muted">{t.invoice.specimen}</p>
      </div>
    </div>
  );
}
