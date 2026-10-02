import { copy, type Lang } from "../data/copy";
import { useDesk } from "../lib/store";

export function useI18n() {
  const lang = useDesk((s) => s.lang) as Lang;
  const setLang = useDesk((s) => s.setLang);
  return { lang, setLang, t: copy[lang] };
}
