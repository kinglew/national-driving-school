import { privacyCopy } from "../data/privacy";
import { useI18n } from "../hooks/useI18n";

export function Privacy() {
  const { lang } = useI18n();
  const p = privacyCopy[lang];
  const sections = [
    [p.whoTitle, p.who],
    [p.nowTitle, p.now],
    [p.laterTitle, p.later],
    [p.purposeTitle, p.purpose],
    [p.consentTitle, p.consent],
    [p.retentionTitle, p.retention],
    [p.rightsTitle, p.rights],
    [p.hostingTitle, p.hosting],
    [p.incidentTitle, p.incident],
  ] as const;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-red">{p.kicker}</p>
      <h1 className="mt-2 font-display text-5xl font-bold uppercase text-navy">{p.title}</h1>
      <p className="mt-4 rounded-md border border-gold bg-gold/30 px-4 py-3 text-sm leading-6 text-ink">
        {p.draft}
      </p>
      {sections.map(([title, body]) => (
        <section key={title} className="mt-8">
          <h2 className="font-display text-2xl font-bold uppercase text-navy">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-ink">{body}</p>
        </section>
      ))}
    </article>
  );
}
