import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { recordsCopy, recordsError } from "../data/recordsCopy";
import { SessionGate } from "../components/SessionGate";
import { Button, Field, When, inputClass } from "../components/ui";
import { useI18n } from "../hooks/useI18n";
import { useDesk } from "../lib/store";
import {
  api,
  type LessonRecord,
  type Me,
  type StaffMember,
  type StudentRecord,
} from "../lib/recordsApi";

function LessonTools({
  lesson,
  onChange,
}: {
  lesson: LessonRecord;
  onChange: () => void;
}) {
  const { lang } = useI18n();
  const copy = recordsCopy[lang];
  const [notes, setNotes] = useState(lesson.notes ?? "");
  const [theory, setTheory] = useState(String(lesson.attendance?.theoryMinutes ?? 0));
  const [road, setRoad] = useState(String(lesson.attendance?.roadMinutes ?? (lesson.kind === "in_car" ? lesson.durationMinutes : 0)));
  const [present, setPresent] = useState(lesson.attendance?.present ?? true);

  async function patch(status: LessonRecord["status"]) {
    await api("/api/lessons", { method: "PATCH", body: { id: lesson.id, status, notes } });
    onChange();
  }

  async function saveAttendance() {
    await api("/api/attendance", {
      method: "POST",
      body: {
        lessonId: lesson.id,
        present,
        theoryMinutes: Number(theory),
        roadMinutes: Number(road),
      },
    });
    onChange();
  }

  return (
    <div className="space-y-3 border border-line bg-paper px-3 py-3">
      <div className="text-sm">
        <When iso={lesson.startsAt} /> · {lesson.kind} · {lesson.location} · {lesson.status}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="line" onClick={() => void patch("completed")}>{copy.markDone}</Button>
        <Button type="button" variant="ghost" onClick={() => void patch("cancelled")}>{copy.cancel}</Button>
      </div>
      <Field label={copy.notes}>
        <textarea className={inputClass} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Field>
      <Button type="button" variant="line" onClick={() => void patch(lesson.status)}>{copy.saveNotes}</Button>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={present} onChange={(event) => setPresent(event.target.checked)} />
          {copy.present}
        </label>
        <Field label={copy.theoryMin}>
          <input className={inputClass} value={theory} onChange={(event) => setTheory(event.target.value)} />
        </Field>
        <Field label={copy.roadMin}>
          <input className={inputClass} value={road} onChange={(event) => setRoad(event.target.value)} />
        </Field>
      </div>
      <Button type="button" onClick={() => void saveAttendance()}>{copy.saveAttendance}</Button>
    </div>
  );
}

function OfficeBody({ me }: { me: Me }) {
  const { lang, t } = useI18n();
  const copy = recordsCopy[lang];
  const enquiries = useDesk((s) => s.enquiries);
  const resetEnquiries = useDesk((s) => s.resetEnquiries);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [tick, setTick] = useState(0);
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<"theory" | "in_car">("in_car");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [learnerOn, setLearnerOn] = useState("");
  const [attestationOn, setAttestationOn] = useState("");

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (me.role === "office") {
        const [studentRes, staffRes] = await Promise.all([
          api<{ students: StudentRecord[] }>("/api/students"),
          api<{ staff: StaffMember[] }>("/api/staff"),
        ]);
        if (cancel) return;
        setStudents(studentRes.body.students ?? []);
        setStaff(staffRes.body.staff ?? []);
      } else if (me.role === "instructor") {
        const lessonRes = await api<{ lessons: LessonRecord[] }>("/api/lessons");
        if (!cancel) setLessons(lessonRes.body.lessons ?? []);
      }
    }
    void load();
    return () => {
      cancel = true;
    };
  }, [me.role, tick]);

  const selected = students.find((student) => student.id === selectedId) ?? students[0];
  const enrolment = selected?.enrolments[0];

  async function assignLesson() {
    if (!enrolment || !startsAt || !location) return;
    const result = await api<{ error?: string }>("/api/lessons", {
      method: "POST",
      body: {
        enrolmentId: enrolment.id,
        kind,
        startsAt: new Date(startsAt).toISOString(),
        durationMinutes: kind === "theory" ? 120 : 55,
        location,
        vehicleLabel: vehicle || null,
        instructorPrincipalId: instructorId || null,
      },
    });
    if (result.status >= 400) {
      setNote(recordsError(lang, result.body.error));
      return;
    }
    setNote("");
    setTick((value) => value + 1);
  }

  async function saveMilestone() {
    if (!enrolment) return;
    await api("/api/milestones", {
      method: "PATCH",
      body: {
        enrolmentId: enrolment.id,
        learnerLicenceOn: learnerOn || null,
        attestationOn: attestationOn || null,
      },
    });
    setTick((value) => value + 1);
  }

  async function downloadBackup() {
    const result = await api<{ export?: { id: string } }>("/api/exports/students?purpose=backup");
    if (result.status !== 200 || !result.body.export) {
      setNote(copy.unconfigured);
      return;
    }
    const blob = new Blob([JSON.stringify(result.body, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `student-export-${result.body.export.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function requestDeletion() {
    if (!selected) return;
    const result = await api<{ error?: string }>("/api/students/deletion-request", {
      method: "POST",
      body: { studentId: selected.id },
    });
    setNote(result.status === 200 ? copy.deletionDone : recordsError(lang, result.body.error));
    setTick((value) => value + 1);
  }

  if (me.role === "student") return <p className="text-sm text-muted">{copy.useDesk}</p>;

  if (me.role === "instructor") {
    return (
      <div className="space-y-3">
        {lessons.length === 0 ? <p className="text-sm text-muted">{copy.none}</p> : null}
        {lessons.map((lesson) => (
          <LessonTools key={lesson.id} lesson={lesson} onChange={() => setTick((value) => value + 1)} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link to="/enroll" className="inline-flex h-12 items-center rounded-md bg-red px-5 text-sm font-semibold text-on-red">
          {copy.register}
        </Link>
        <Button type="button" variant="line" onClick={() => void downloadBackup()}>{copy.exportBackup}</Button>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-3xl font-bold uppercase text-navy">{copy.students}</h2>
          <div className="mt-3 space-y-2">
            {students.length === 0 ? <p className="text-sm text-muted">{copy.noStudents}</p> : null}
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  setSelectedId(student.id);
                  const first = student.enrolments[0];
                  setLearnerOn(first?.milestone?.learnerLicenceOn ?? "");
                  setAttestationOn(first?.milestone?.attestationOn ?? "");
                }}
                className={`block w-full border px-4 py-3 text-left ${selected?.id === student.id ? "border-navy bg-paper" : "border-line bg-cream"}`}
              >
                <span className="font-semibold">{student.givenName} {student.familyName}</span>
                <span className="mt-1 block text-sm text-muted">{student.email}</span>
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-display text-3xl font-bold uppercase text-navy">{t.office.inbox}</h2>
          <p className="mt-2 text-sm text-muted">{copy.inboxNote}</p>
          <div className="mt-3 space-y-3">
            {enquiries.map((enquiry) => (
              <div key={enquiry.id} className="border border-line bg-paper p-4 text-sm">
                <p className="font-semibold">{enquiry.name}</p>
                <p className="mt-2">{enquiry.message}</p>
              </div>
            ))}
          </div>
          <Button className="mt-3" type="button" variant="line" onClick={() => resetEnquiries()}>{copy.resetInbox}</Button>
        </section>
      </div>
      {selected && enrolment ? (
        <section className="space-y-4 border border-line bg-cream p-5">
          <div>
            <p className="font-display text-3xl font-bold uppercase text-navy">{selected.givenName} {selected.familyName}</p>
            <p className="text-sm">{selected.email} · {selected.phone}</p>
            <p className="text-sm text-muted">{enrolment.programCode}</p>
          </div>
          {enrolment.lessons.map((lesson) => (
            <LessonTools key={lesson.id} lesson={lesson} onChange={() => setTick((value) => value + 1)} />
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={copy.learner}>
              <input className={inputClass} type="date" value={learnerOn} onChange={(event) => setLearnerOn(event.target.value)} />
            </Field>
            <Field label={copy.attestation}>
              <input className={inputClass} type="date" value={attestationOn} onChange={(event) => setAttestationOn(event.target.value)} />
            </Field>
          </div>
          <Button type="button" variant="line" onClick={() => void saveMilestone()}>{copy.saveNotes}</Button>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={copy.kind}>
              <select className={inputClass} value={kind} onChange={(event) => setKind(event.target.value as "theory" | "in_car")}>
                <option value="in_car">{copy.road}</option>
                <option value="theory">{copy.theory}</option>
              </select>
            </Field>
            <Field label={copy.when}>
              <input className={inputClass} type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
            </Field>
            <Field label={copy.where}>
              <input className={inputClass} value={location} onChange={(event) => setLocation(event.target.value)} />
            </Field>
            <Field label={copy.vehicle}>
              <input className={inputClass} value={vehicle} onChange={(event) => setVehicle(event.target.value)} />
            </Field>
            <Field label={copy.instructor}>
              <select className={inputClass} value={instructorId} onChange={(event) => setInstructorId(event.target.value)}>
                <option value="">{copy.noneInstructor}</option>
                {staff.filter((member) => member.role === "instructor").map((member) => (
                  <option key={member.principalId} value={member.principalId}>{member.displayName}</option>
                ))}
              </select>
            </Field>
          </div>
          <Button type="button" onClick={() => void assignLesson()}>{copy.saveLesson}</Button>
          <Button type="button" variant="ghost" onClick={() => void requestDeletion()}>{copy.deletion}</Button>
          {note ? <p className="text-sm">{note}</p> : null}
        </section>
      ) : null}
    </div>
  );
}

export function Office() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div>
        <h1 className="font-display text-5xl font-bold uppercase text-navy">{t.office.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.office.lead}</p>
      </div>
      <SessionGate>{(me) => <OfficeBody me={me} />}</SessionGate>
    </div>
  );
}
