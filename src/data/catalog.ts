export type CourseId = "pesr" | "eval" | "pass" | "hours12" | "rental" | "hourly";

export type Course = {
  id: CourseId;
  price: number;
  deposit: number | null;
  promo: boolean;
  theoryModules: number;
  practicalSessions: number;
  photo: "lesson" | "hero" | "sedan" | "street";
  en: { name: string; short: string; detail: string; includes: string[] };
  fr: { name: string; short: string; detail: string; includes: string[] };
};

export const school = {
  name: "National Driving School",
  legal: "École de conduite National",
  phone: "514-937-2888",
  phoneHref: "tel:+15149372888",
  email: "info@nationaldrivingschool.ca",
  street: "1851 Sainte-Catherine Ouest, suite 100",
  city: "Montréal, QC H3H 1M2",
  since: 1994,
  mapSrc:
    "https://maps.google.com/maps?q=1851%20Sainte-Catherine%20St%20West%20suite%20100%20Montreal%20QC%20H3H%201M2&z=16&output=embed",
} as const;

export const courses: Course[] = [
  {
    id: "pesr",
    price: 109500,
    deposit: 25000,
    promo: true,
    theoryModules: 12,
    practicalSessions: 15,
    photo: "lesson",
    en: {
      name: "Road Safety Education Program",
      short: "Mandatory 39-hour Class 5 course. 24 hours of theory, 15 hours on the road.",
      detail:
        "This is the SAAQ program every new Quebec driver needs. Twelve theory modules, then fifteen 55-minute lessons with an instructor. Phase 1 takes a minimum of 28 days. After you pass it, the school attests you for a learner’s licence — that is the “on the road in about six weeks” promise. The full course cannot be shorter than about six months.",
      includes: [
        "12 theory modules, 2 hours each",
        "15 on-road sessions of 55 minutes",
        "Attestation after phase 1 for the learner’s licence",
        "Practical evaluations on outings 5, 10 and 15",
      ],
    },
    fr: {
      name: "Programme d’éducation à la sécurité routière",
      short: "Cours obligatoire de 39 heures, classe 5. 24 h de théorie, 15 h sur la route.",
      detail:
        "C’est le programme de la SAAQ exigé des nouveaux conducteurs au Québec. Douze modules théoriques, puis quinze sorties de 55 minutes avec un formateur. La phase 1 dure au minimum 28 jours. Une fois réussie, l’école atteste votre admissibilité au permis d’apprenti conducteur — c’est la promesse « sur la route en environ six semaines ». Le cours complet ne peut pas durer moins d’environ six mois.",
      includes: [
        "12 modules théoriques de 2 heures",
        "15 sorties sur la route de 55 minutes",
        "Attestation de la phase 1 pour le permis d’apprenti",
        "Évaluations pratiques aux sorties 5, 10 et 15",
      ],
    },
  },
  {
    id: "eval",
    price: 7500,
    deposit: null,
    promo: false,
    theoryModules: 0,
    practicalSessions: 1,
    photo: "hero",
    en: {
      name: "Evaluation session",
      short: "One hour on the road. Know if you are ready for the SAAQ road test.",
      detail:
        "A single on-road hour with an instructor. Useful if you already drive and want an honest read before you book the exam, or before you buy a longer package.",
      includes: [
        "55 minutes on the road",
        "Written notes in your file",
        "A clear yes, not yet, or book more hours",
      ],
    },
    fr: {
      name: "Séance d’évaluation",
      short: "Une heure sur la route. Savoir si vous êtes prêt pour l’examen de la SAAQ.",
      detail:
        "Une sortie d’une heure avec un formateur. Utile si vous conduisez déjà et voulez un avis franc avant l’examen, ou avant d’acheter un forfait plus long.",
      includes: [
        "55 minutes sur la route",
        "Notes au dossier",
        "Un verdict clair : prêt, pas encore, ou heures supplémentaires",
      ],
    },
  },
  {
    id: "pass",
    price: 16000,
    deposit: null,
    promo: false,
    theoryModules: 0,
    practicalSessions: 2,
    photo: "sedan",
    en: {
      name: "Pass+",
      short: "Two hours in the SAAQ exam area. Same day, the day before, or the week of.",
      detail:
        "Practice the neighbourhood where you will actually be tested: Henri-Bourassa, Dorval, Longueuil or Laval. Two hours with an instructor who knows the circuit.",
      includes: [
        "2 hours in the exam area you choose",
        "Instructor in the passenger seat",
        "Booked around your road-test date",
      ],
    },
    fr: {
      name: "Pass+",
      short: "Deux heures dans la zone d’examen de la SAAQ. Le jour même, la veille ou la semaine.",
      detail:
        "Pratiquez le quartier où vous serez vraiment évalué : Henri-Bourassa, Dorval, Longueuil ou Laval. Deux heures avec un formateur qui connaît le circuit.",
      includes: [
        "2 heures dans la zone choisie",
        "Formateur côté passager",
        "Autour de la date de votre examen",
      ],
    },
  },
  {
    id: "hours12",
    price: 78000,
    deposit: 20000,
    promo: false,
    theoryModules: 0,
    practicalSessions: 12,
    photo: "sedan",
    en: {
      name: "12-hour brush-up",
      short: "Twelve hours back behind the wheel, including time near an exam centre.",
      detail:
        "For drivers who already hold a learner’s licence, a full licence, or an international licence and want confidence back. Includes time around an SAAQ evaluation centre. If you have no car to practice in between lessons, ask us about a longer intensive.",
      includes: [
        "12 hours with an instructor",
        "Time near an exam centre",
        "Theory refresher at the office if you need it",
      ],
    },
    fr: {
      name: "Remise à niveau 12 heures",
      short: "Douze heures au volant, dont du temps près d’un centre d’examen.",
      detail:
        "Pour qui a déjà un permis d’apprenti, un permis complet ou un permis international et veut reprendre confiance. Comprend du temps autour d’un centre d’évaluation de la SAAQ. Sans voiture pour pratiquer entre les leçons, demandez un intensif plus long.",
      includes: [
        "12 heures avec un formateur",
        "Temps près d’un centre d’examen",
        "Rappel théorique au bureau au besoin",
      ],
    },
  },
  {
    id: "rental",
    price: 13900,
    deposit: null,
    promo: false,
    theoryModules: 0,
    practicalSessions: 0,
    photo: "sedan",
    en: {
      name: "Road-test car",
      short: "A car waiting at the SAAQ centre on exam day. Not every centre — call first.",
      detail:
        "Pick up your coupon at the office on Sainte-Catherine. The car is at the examination centre the morning of your test. Confirm the centre with us before you pay. Henri-Bourassa is the usual one.",
      includes: [
        "Car for the road test",
        "Coupon from the office",
        "Confirmation of the centre before the day",
      ],
    },
    fr: {
      name: "Voiture pour l’examen",
      short: "Une voiture qui vous attend au centre de la SAAQ. Pas tous les centres — appelez.",
      detail:
        "Vous prenez le coupon au bureau, rue Sainte-Catherine. La voiture est au centre d’examen le matin du test. Confirmez le centre avec nous avant de payer. Henri-Bourassa est le plus courant.",
      includes: [
        "Voiture pour l’examen pratique",
        "Coupon au bureau",
        "Confirmation du centre avant le jour J",
      ],
    },
  },
  {
    id: "hourly",
    price: 6500,
    deposit: null,
    promo: false,
    theoryModules: 0,
    practicalSessions: 1,
    photo: "hero",
    en: {
      name: "Hourly lesson",
      short: "One hour for a Quebec learner, a full licence, or an international licence.",
      detail:
        "A single 55-minute lesson. Buy as many as you want from your file after the first one. Not a substitute for the mandatory 39-hour program if you still need it.",
      includes: [
        "55 minutes on the road",
        "Instructor of the day",
        "Add more hours from your file",
      ],
    },
    fr: {
      name: "Leçon à l’heure",
      short: "Une heure pour un permis d’apprenti, un permis complet ou un permis international.",
      detail:
        "Une sortie de 55 minutes. Vous pouvez en ajouter d’autres depuis votre dossier. Ce n’est pas un remplacement du cours obligatoire de 39 heures si vous en avez encore besoin.",
      includes: [
        "55 minutes sur la route",
        "Formateur du jour",
        "Heures supplémentaires depuis le dossier",
      ],
    },
  },
];

export const phases = [
  {
    id: 1,
    days: 28,
    modules: [1, 2, 3, 4, 5],
    en: "Vehicle, driver, environment, risk. Module 5 is review. Pass it and the school can attest you for a learner’s licence.",
    fr: "Véhicule, conducteur, environnement, risques. Le module 5 est la révision. Réussi, l’école peut vous attester pour le permis d’apprenti.",
  },
  {
    id: 2,
    days: 28,
    modules: [6, 7],
    en: "First guided in-car sessions. You need a learner’s licence in hand before these outings.",
    fr: "Premières sorties guidées. Le permis d’apprenti est exigé avant ces sorties.",
  },
  {
    id: 3,
    days: 56,
    modules: [8, 9, 10],
    en: "Semi-guided driving: speed, sharing the road, alcohol and drugs.",
    fr: "Conduite semi-guidée : vitesse, partage de la route, alcool et drogues.",
  },
  {
    id: 4,
    days: 56,
    modules: [11, 12],
    en: "Toward independent driving: fatigue, distraction, and the last synthesis outing.",
    fr: "Vers la conduite autonome : fatigue, distraction, et la sortie synthèse.",
  },
] as const;

export const theoryModules = [
  { en: "The driver", fr: "Le conducteur" },
  { en: "The vehicle", fr: "Le véhicule" },
  { en: "The road environment", fr: "L’environnement routier" },
  { en: "At-risk behaviour", fr: "Les comportements à risque" },
  { en: "Review and evaluation", fr: "Révision et évaluation" },
  { en: "Observation", fr: "L’observation" },
  { en: "First manoeuvres", fr: "Premières manœuvres" },
  { en: "Speed", fr: "La vitesse" },
  { en: "Sharing the road", fr: "Partager la route" },
  { en: "Alcohol and drugs", fr: "Alcool et drogues" },
  { en: "Fatigue and distraction", fr: "Fatigue et distraction" },
  { en: "Independent driving", fr: "Conduite autonome" },
] as const;

export const places = [
  { id: "downtown", en: "Downtown loop", fr: "Circuit centre-ville" },
  { id: "bourassa", en: "Henri-Bourassa exam area", fr: "Zone d’examen Henri-Bourassa" },
  { id: "longueuil", en: "Longueuil exam area", fr: "Zone d’examen Longueuil" },
  { id: "dorval", en: "Dorval exam area", fr: "Zone d’examen Dorval" },
  { id: "laval", en: "Laval exam area", fr: "Zone d’examen Laval" },
] as const;

export const instructors = ["Nadia", "Marc", "Étienne"] as const;

export const GST_RATE = 0.05;
export const QST_RATE = 0.09975;
export const PROMO_CENTS = 30000;
export const PROMO_CAP = 32;

export function getCourse(id: string) {
  return courses.find((c) => c.id === id);
}

export function isCourseId(id: string): id is CourseId {
  return courses.some((c) => c.id === id);
}

export function photoSrc(photo: string) {
  return `/photos/${photo}.jpg`;
}

export function placeLabel(id: string, lang: "en" | "fr") {
  const p = places.find((x) => x.id === id);
  return p ? p[lang] : id;
}

export function phaseProgress(modulesDone: number[], practicalDone: number) {
  const has = (n: number) => modulesDone.includes(n);
  if (has(11) && has(12) && practicalDone >= 12) return 4;
  if ([8, 9, 10].every(has)) return 3;
  if ((has(6) && has(7)) || practicalDone > 0) return 2;
  return 1;
}

export function taxBreakdown(subtotalCents: number) {
  const gstCents = Math.round(subtotalCents * GST_RATE);
  const qstCents = Math.round(subtotalCents * QST_RATE);
  return { gstCents, qstCents, totalCents: subtotalCents + gstCents + qstCents };
}

export function priceAfterPromo(price: number, promoApplied: boolean) {
  return Math.max(0, price - (promoApplied ? PROMO_CENTS : 0));
}

export function formatMoney(cents: number, lang: "en" | "fr") {
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export function spotsLeft(promoCount: number) {
  return Math.max(0, PROMO_CAP - promoCount);
}

export function luhnOk(digits: string) {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return digits.length >= 13 && sum % 10 === 0;
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function torontoParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: n("year"), m: n("month"), d: n("day") };
}

function addDays(y: number, m: number, d: number, add: number) {
  const dt = new Date(Date.UTC(y, m - 1, d + add));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function torontoDate(y: number, m: number, d: number, hour: number, minute: number) {
  const utcGuess = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(utcGuess);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  let h = n("hour");
  if (h === 24) h = 0;
  const asIf = Date.UTC(n("year"), n("month") - 1, n("day"), h, n("minute"), n("second"));
  return new Date(utcGuess.getTime() - (asIf - utcGuess.getTime()));
}

export function lessonSlots(from = new Date()) {
  const out: string[] = [];
  const base = torontoParts(from);
  for (let i = 1; i <= 18 && out.length < 12; i++) {
    const day = addDays(base.y, base.m, base.d, i);
    const dow = new Date(Date.UTC(day.y, day.m - 1, day.d)).getUTCDay();
    if (dow === 0) continue;
    const hours = dow === 6 ? [10, 13] : [9, 11, 14, 16];
    for (const h of hours) {
      const min = h === 14 ? 30 : 0;
      out.push(torontoDate(day.y, day.m, day.d, h, min).toISOString());
      if (out.length >= 12) break;
    }
  }
  return out;
}
