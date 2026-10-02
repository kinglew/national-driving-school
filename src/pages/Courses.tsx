import { courses } from "../data/catalog";
import { useI18n } from "../hooks/useI18n";
import { CourseTile } from "../components/CourseTile";

export function Courses() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-5xl font-bold uppercase text-navy">
        {t.coursesPage.title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t.coursesPage.lead}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {courses.map((c) => (
          <CourseTile key={c.id} course={c} />
        ))}
      </div>
    </div>
  );
}
