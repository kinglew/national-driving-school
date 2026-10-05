import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { courses, isCourseId, places, type CourseId } from "../data/catalog";
import { recordsCopy, recordsError } from "../data/recordsCopy";
import { SessionGate } from "../components/SessionGate";
import { Button, Field, inputClass } from "../components/ui";
import { useI18n } from "../hooks/useI18n";
import { api } from "../lib/recordsApi";

function EnrolForm() {
  const { t, lang } = useI18n();
  const copy = recordsCopy[lang];
  const [courseId, setCourseId] = useState<CourseId>("pesr");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [licenceStatus, setLicenceStatus] = useState("none");
  const [startedOn, setStartedOn] = useState("2026-10-04");
  const [consent, setConsent] = useState(false);
  const [placeId, setPlaceId] = useState<string>(places[0].id);
  const [slot, setSlot] = useState("");
  const [wantLesson, setWantLesson] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const place = places.find((item) => item.id === placeId);
    const result = await api<{ error?: string; studentId?: string }>("/api/students", {
      method: "POST",
      body: {
        consent,
        givenName,
        familyName,
        email,
        phone,
        birthDate,
        guardianName,
        licenceStatus,
        preferredLanguage: lang,
        programCode: courseId,
        startedOn,
        lesson: wantLesson && slot
          ? {
              kind: "in_car",
              startsAt: new Date(slot).toISOString(),
              durationMinutes: 55,
              location: place ? place[lang] : placeId,
              vehicleLabel: null,
            }
          : undefined,
      },
    });
    if (result.status >= 400 || !result.body.studentId) {
      setError(recordsError(lang, result.body.error));
      return;
    }
    setDone(result.body.studentId);
  }

  if (done) {
    return (
      <div className="space-y-3">
        <p className="text-xl font-semibold">{copy.saved}</p>
        <Link to="/office" className="font-semibold text-red">{t.nav.office}</Link>
      </div>
    );
  }

  return (
    <form className="max-w-xl space-y-4" onSubmit={submit}>
      <Field label={t.enroll.summary}>
        <select
          className={inputClass}
          value={courseId}
          onChange={(event) => setCourseId(isCourseId(event.target.value) ? event.target.value : "pesr")}
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{lang === "fr" ? course.fr.name : course.en.name}</option>
          ))}
        </select>
      </Field>
      <Field label={t.enroll.first}>
        <input className={inputClass} value={givenName} onChange={(event) => setGivenName(event.target.value)} />
      </Field>
      <Field label={t.enroll.last}>
        <input className={inputClass} value={familyName} onChange={(event) => setFamilyName(event.target.value)} />
      </Field>
      <Field label={t.enroll.email}>
        <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </Field>
      <Field label={t.enroll.phone}>
        <input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} />
      </Field>
      <Field label={t.enroll.dob}>
        <input className={inputClass} type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
      </Field>
      <Field label={t.enroll.guardian}>
        <input className={inputClass} value={guardianName} onChange={(event) => setGuardianName(event.target.value)} />
      </Field>
      <Field label={t.enroll.licence}>
        <select className={inputClass} value={licenceStatus} onChange={(event) => setLicenceStatus(event.target.value)}>
          <option value="none">{t.enroll.licences.none}</option>
          <option value="learner">{t.enroll.licences.learner}</option>
          <option value="full">{t.enroll.licences.full}</option>
          <option value="international">{t.enroll.licences.international}</option>
        </select>
      </Field>
      <Field label={copy.when}>
        <input className={inputClass} type="date" value={startedOn} onChange={(event) => setStartedOn(event.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={wantLesson} onChange={(event) => setWantLesson(event.target.checked)} />
        {t.enroll.pickLesson}
      </label>
      {wantLesson ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={inputClass} type="datetime-local" value={slot} onChange={(event) => setSlot(event.target.value)} />
          <select className={inputClass} value={placeId} onChange={(event) => setPlaceId(event.target.value)}>
            {places.map((place) => (
              <option key={place.id} value={place.id}>{lang === "fr" ? place.fr : place.en}</option>
            ))}
          </select>
        </div>
      ) : null}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        {copy.consent}
      </label>
      {error ? <p className="text-sm text-red">{error}</p> : null}
      <Button type="submit" disabled={!consent}>{copy.saveStudent}</Button>
    </form>
  );
}

export function Enroll() {
  const { t, lang } = useI18n();
  const copy = recordsCopy[lang];
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <h1 className="font-display text-5xl font-bold uppercase text-navy">{t.enroll.title}</h1>
      <p className="max-w-xl text-sm text-muted">{copy.officeOnly}</p>
      <SessionGate>
        {(me) => (me.role === "office" ? <EnrolForm /> : <p className="text-sm text-muted">{copy.officeOnly}</p>)}
      </SessionGate>
    </div>
  );
}
