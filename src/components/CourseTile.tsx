import { Link } from "react-router-dom";
import { photoSrc, type Course } from "../data/catalog";
import { useI18n } from "../hooks/useI18n";
import { Money } from "./ui";

export function CourseTile({ course }: { course: Course }) {
  const { lang } = useI18n();
  const copy = lang === "fr" ? course.fr : course.en;
  return (
    <Link
      to={`/courses/${course.id}`}
      className="group grid overflow-hidden border border-line bg-paper sm:grid-cols-5"
    >
      <img
        src={photoSrc(course.photo)}
        alt=""
        className="h-40 w-full object-cover sm:col-span-2 sm:h-full"
      />
      <div className="flex flex-col justify-between gap-3 p-4 sm:col-span-3">
        <div>
          <h3 className="font-display text-3xl font-bold uppercase leading-none text-navy group-hover:text-red">
            {copy.name}
          </h3>
          <p className="mt-2 text-sm text-muted">{copy.short}</p>
        </div>
        <p className="font-display text-3xl font-bold text-ink">
          <Money cents={course.price} />
        </p>
      </div>
    </Link>
  );
}
