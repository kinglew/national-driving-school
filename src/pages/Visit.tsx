import { useState } from "react";
import { Bus, Car, TrainFront } from "lucide-react";
import { school } from "../data/catalog";
import { useDesk } from "../lib/store";
import { useI18n } from "../hooks/useI18n";
import { Button, Field, inputClass } from "../components/ui";

export function Visit() {
  const { t } = useI18n();
  const addEnquiry = useDesk((s) => s.addEnquiry);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "information",
    message: "",
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-2">
      <div>
        <h1 className="font-display text-5xl font-bold uppercase text-navy">
          {t.visit.title}
        </h1>
        <h2 className="mt-6 font-display text-3xl font-bold uppercase text-navy">
          {t.visit.aboutTitle}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink">{t.visit.about}</p>

        <h2 className="mt-8 font-display text-3xl font-bold uppercase text-navy">
          {t.visit.hours}
        </h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between border-b border-line py-2">
            <span>{t.visit.week}</span>
            <span className="font-semibold">{t.visit.weekHours}</span>
          </div>
          <div className="flex justify-between border-b border-line py-2">
            <span>{t.visit.sat}</span>
            <span className="font-semibold">{t.visit.satHours}</span>
          </div>
          <div className="flex justify-between border-b border-line py-2">
            <span>{t.visit.sun}</span>
            <span className="font-semibold">{t.visit.closed}</span>
          </div>
        </div>

        <h2 className="mt-8 font-display text-3xl font-bold uppercase text-navy">
          {t.visit.how}
        </h2>
        <ul className="mt-3 space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <TrainFront className="mt-0.5 h-4 w-4 text-red" />
            {t.visit.metro}
          </li>
          <li className="flex items-start gap-2">
            <Bus className="mt-0.5 h-4 w-4 text-red" />
            {t.visit.bus}
          </li>
          <li className="flex items-start gap-2">
            <Car className="mt-0.5 h-4 w-4 text-red" />
            {t.visit.car}
          </li>
        </ul>
        <p className="mt-4 text-sm font-semibold">
          {school.street}
          <br />
          {school.city}
        </p>
        <p className="mt-2 text-sm">
          <a href={school.phoneHref} className="font-semibold text-red">
            {school.phone}
          </a>
          <br />
          <a href={`mailto:${school.email}`}>{school.email}</a>
        </p>
      </div>

      <div className="space-y-6">
        <iframe
          title="map"
          src={school.mapSrc}
          className="h-64 w-full border border-line"
          loading="lazy"
        />
        <form
          className="space-y-4 border border-line bg-cream p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim() || !form.message.trim()) return;
            addEnquiry(form);
            setSent(true);
          }}
        >
          <h2 className="font-display text-3xl font-bold uppercase text-navy">
            {t.visit.ask}
          </h2>
          <p className="text-sm text-muted">{t.visit.askLead}</p>
          <Field label={t.enroll.first}>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <Field label={t.enroll.email}>
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label={t.enroll.phone}>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label={t.visit.topic}>
            <select
              className={inputClass}
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            >
              <option value="information">{t.visit.topics.information}</option>
              <option value="registration">{t.visit.topics.registration}</option>
            </select>
          </Field>
          <Field label={t.visit.message}>
            <textarea
              className={`${inputClass} h-28 py-2`}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </Field>
          <Button type="submit">{t.visit.send}</Button>
          {sent ? (
            <p className="text-sm font-semibold text-ok">{t.visit.sent}</p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
