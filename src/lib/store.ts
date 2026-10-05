import { create } from "zustand";
import { persist } from "zustand/middleware";
import { newId, spotsLeft } from "../data/catalog";
import type { Lang } from "../data/copy";

export type Enquiry = {
  id: string;
  at: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
};

const demoEnquiries: Enquiry[] = [
  {
    id: "enq-1",
    at: "2026-09-30T14:12:00.000Z",
    name: "Sofia Alvarez",
    email: "sofia.alvarez@email.com",
    phone: "514-555-0177",
    topic: "information",
    message:
      "I have an international licence. Do I still need the 39-hour course?",
  },
];

type State = {
  lang: Lang;
  enquiries: Enquiry[];
  setLang: (lang: Lang) => void;
  spotsLeft: () => number;
  addEnquiry: (args: Omit<Enquiry, "id" | "at">) => void;
  resetEnquiries: () => void;
};

export const useDesk = create<State>()(
  persist(
    (set, get) => ({
      lang: "en",
      enquiries: demoEnquiries,
      setLang: (lang) => set({ lang }),
      spotsLeft: () => spotsLeft(0),
      addEnquiry: (args) => {
        set({
          enquiries: [
            { ...args, id: newId("enq"), at: new Date().toISOString() },
            ...get().enquiries,
          ],
        });
      },
      resetEnquiries: () => set({ enquiries: demoEnquiries }),
    }),
    {
      name: "national-driving-desk",
      partialize: (state) => ({ lang: state.lang, enquiries: state.enquiries }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<State> | undefined;
        return {
          ...current,
          lang: saved?.lang ?? current.lang,
          enquiries: saved?.enquiries ?? current.enquiries,
        };
      },
    },
  ),
);
