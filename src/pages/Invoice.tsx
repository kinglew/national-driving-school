import { Link } from "react-router-dom";
import { recordsCopy } from "../data/recordsCopy";
import { useI18n } from "../hooks/useI18n";

export function Invoice() {
  const { t, lang } = useI18n();
  const copy = recordsCopy[lang];
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="font-display text-5xl font-bold uppercase text-navy">{t.invoice.title}</h1>
      <p>{copy.invoicesLater}</p>
      <p className="text-sm text-muted">{t.invoice.specimen}</p>
      <Link to="/desk" className="inline-block font-semibold text-red">{t.nav.desk}</Link>
    </div>
  );
}
