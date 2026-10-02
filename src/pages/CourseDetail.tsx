import { Link, useParams } from "react-router-dom";
import { getCourse, photoSrc } from "../data/catalog";
import { useI18n } from "../hooks/useI18n";
import { ButtonLink, Money } from "../components/ui";

export function CourseDetail() {
  const { slug = "" } = useParams();
  const { t, lang } = useI18n();
  const course = getCourse(slug);

  if (!course) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-muted">{t.coursesPage.title}</p>
        <Link to="/courses" className="mt-4 inline-block font-semibold text-red">
          {t.backCourses}
        </Link>
      </div>
    );
  }

  const copy = lang === "fr" ? course.fr : course.en;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2">
      <img
        src={photoSrc(course.photo)}
        alt=""
        className="h-80 w-full object-cover lg:h-full"
      />
      <div>
        <Link to="/courses" className="text-sm font-semibold text-red">
          {t.backCourses}
        </Link>
        <h1 className="mt-3 font-display text-5xl font-bold uppercase text-navy">
          {copy.name}
        </h1>
        <p className="mt-4 text-base text-ink">{copy.detail}</p>
        <p className="mt-6 text-sm font-semibold text-muted">{t.from}</p>
        <p className="font-display text-5xl font-bold text-ink">
          <Money cents={course.price} />
        </p>
        <p className="mt-1 text-sm text-muted">
          {course.deposit ? t.deposit : t.payFull}
        </p>
        <h2 className="mt-8 font-display text-3xl font-bold uppercase text-navy">
          {t.includes}
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink">
          {copy.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="mt-8">
          <ButtonLink to={`/enroll?course=${course.id}`}>{t.bookThis}</ButtonLink>
        </div>
      </div>
    </div>
  );
}
