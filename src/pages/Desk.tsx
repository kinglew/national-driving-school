import { useEffect, useState } from "react";
import { recordsCopy } from "../data/recordsCopy";
import { SessionGate } from "../components/SessionGate";
import { Button, When } from "../components/ui";
import { useI18n } from "../hooks/useI18n";
import { api, type Me, type StudentRecord } from "../lib/recordsApi";

function hours(minutes: number) {
  return Math.round((minutes / 60) * 10) / 10;
}

function StudentFile({ student, onChange }: { student: StudentRecord; onChange: () => void }) {
  const { lang } = useI18n();
  const copy = recordsCopy[lang];
  const enrolment = student.enrolments[0];

  async function sign(lessonId: string) {
    await api("/api/lessons", { method: "PATCH", body: { id: lessonId, studentSigned: true } });
    onChange();
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xl font-semibold">
          {student.givenName} {student.familyName}
        </p>
        <p className="text-sm text-muted">{enrolment?.programCode}</p>
      </div>
      {enrolment ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-line bg-paper p-4">
              <p className="text-sm text-muted">{copy.phases}</p>
              <p className="font-display text-4xl font-bold text-navy">
                {enrolment.phases.filter((phase) => phase.completedOn).length} / 4
              </p>
            </div>
            <div className="border border-line bg-paper p-4">
              <p className="text-sm text-muted">{copy.theoryHours}</p>
              <p className="font-display text-4xl font-bold text-navy">
                {hours(enrolment.progress.theoryMinutes)} / 24 {copy.hourTarget}
              </p>
            </div>
            <div className="border border-line bg-paper p-4">
              <p className="text-sm text-muted">{copy.roadHours}</p>
              <p className="font-display text-4xl font-bold text-navy">
                {hours(enrolment.progress.roadMinutes)} / 15 {copy.hourTarget}
              </p>
            </div>
          </div>
          <section>
            <h2 className="font-display text-3xl font-bold uppercase text-navy">{copy.phases}</h2>
            <ol className="mt-3 space-y-2">
              {enrolment.phases.map((phase) => (
                <li key={phase.id} className="border border-line bg-paper px-4 py-3 text-sm">
                  {phase.sequence}. {phase.plannedDays} {copy.days}
                  {phase.completedOn ? ` · ${phase.completedOn}` : ""}
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h2 className="font-display text-3xl font-bold uppercase text-navy">{copy.milestone}</h2>
            <p className="mt-2 text-sm">
              {copy.learner}: {enrolment.milestone?.learnerLicenceOn ?? copy.notSet}
            </p>
            <p className="text-sm">
              {copy.attestation}: {enrolment.milestone?.attestationOn ?? copy.notSet}
            </p>
          </section>
          <section>
            <h2 className="font-display text-3xl font-bold uppercase text-navy">{copy.lessons}</h2>
            <div className="mt-3 space-y-2">
              {enrolment.lessons.length === 0 ? <p className="text-sm text-muted">{copy.none}</p> : null}
              {enrolment.lessons.map((lesson) => (
                <div key={lesson.id} className="flex flex-wrap items-center justify-between gap-2 border border-line bg-paper px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold"><When iso={lesson.startsAt} /></p>
                    <p className="text-sm text-muted">
                      {lesson.kind} · {lesson.location} · {lesson.durationMinutes} min · {lesson.status}
                    </p>
                  </div>
                  {lesson.studentSignedAt ? null : (
                    <Button type="button" variant="line" onClick={() => void sign(lesson.id)}>{copy.signLesson}</Button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <p className="text-sm text-muted">{copy.emptyFile}</p>
      )}
      <section>
        <h2 className="font-display text-3xl font-bold uppercase text-navy">{copy.invoices}</h2>
        <p className="mt-3 text-sm text-muted">{copy.invoicesLater}</p>
      </section>
    </div>
  );
}

function DeskBody({ me }: { me: Me }) {
  const { lang } = useI18n();
  const copy = recordsCopy[lang];
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (me.role !== "student") return;
    let cancel = false;
    void api<{ students: StudentRecord[] }>("/api/students").then((result) => {
      if (!cancel) setStudent(result.body.students?.[0] ?? null);
    });
    return () => {
      cancel = true;
    };
  }, [me.role, tick]);

  if (me.role !== "student") return <p className="text-sm text-muted">{copy.useOffice}</p>;
  if (!student) return <p className="text-sm text-muted">{copy.emptyFile}</p>;
  return <StudentFile student={student} onChange={() => setTick((value) => value + 1)} />;
}

export function Desk() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <h1 className="font-display text-5xl font-bold uppercase text-navy">{t.desk.title}</h1>
      <SessionGate>{(me) => <DeskBody me={me} />}</SessionGate>
    </div>
  );
}
