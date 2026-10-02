import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getCourse,
  newId,
  priceAfterPromo,
  spotsLeft,
  taxBreakdown,
  type CourseId,
} from "../data/catalog";
import type { Lang } from "../data/copy";

export type PaymentMethod = "card" | "desk" | "etransfer";
export type LessonStatus = "booked" | "done" | "cancelled";

export type Student = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  licence: string;
  language: Lang;
  guardian: string;
};

export type Payment = {
  id: string;
  at: string;
  label: string;
  subtotalCents: number;
  gstCents: number;
  qstCents: number;
  totalCents: number;
  method: PaymentMethod;
  last4?: string;
};

export type Lesson = {
  id: string;
  at: string;
  minutes: number;
  instructor: string;
  placeId: string;
  status: LessonStatus;
};

export type Enrollment = {
  id: string;
  createdAt: string;
  courseId: CourseId;
  promoApplied: boolean;
  student: Student;
  payments: Payment[];
  lessons: Lesson[];
  modulesDone: number[];
  practicalDone: number;
};

export type Enquiry = {
  id: string;
  at: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
};

const demoEnrollments: Enrollment[] = [
  {
    id: "enr-maya",
    createdAt: "2026-09-12T15:00:00.000Z",
    courseId: "pesr",
    promoApplied: true,
    student: {
      firstName: "Maya",
      lastName: "Chen",
      email: "maya.chen@email.com",
      phone: "514-555-0142",
      dob: "2004-04-18",
      licence: "learner",
      language: "en",
      guardian: "",
    },
    payments: [
      {
        id: "pay-maya-1",
        at: "2026-09-12T15:05:00.000Z",
        label: "Deposit",
        subtotalCents: 25000,
        gstCents: 1250,
        qstCents: 2494,
        totalCents: 28744,
        method: "card",
        last4: "4242",
      },
    ],
    lessons: [
      {
        id: "les-maya-1",
        at: "2026-09-22T15:00:00.000Z",
        minutes: 55,
        instructor: "Nadia",
        placeId: "downtown",
        status: "done",
      },
      {
        id: "les-maya-2",
        at: "2026-10-06T17:30:00.000Z",
        minutes: 55,
        instructor: "Nadia",
        placeId: "downtown",
        status: "booked",
      },
    ],
    modulesDone: [1, 2, 3, 4, 5],
    practicalDone: 3,
  },
  {
    id: "enr-olivier",
    createdAt: "2026-09-28T18:00:00.000Z",
    courseId: "pass",
    promoApplied: false,
    student: {
      firstName: "Olivier",
      lastName: "Roy",
      email: "olivier.roy@email.com",
      phone: "438-555-0190",
      dob: "1998-11-02",
      licence: "learner",
      language: "fr",
      guardian: "",
    },
    payments: [
      {
        id: "pay-olivier-1",
        at: "2026-09-28T18:04:00.000Z",
        label: "Paid in full",
        subtotalCents: 16000,
        gstCents: 800,
        qstCents: 1596,
        totalCents: 18396,
        method: "etransfer",
      },
    ],
    lessons: [
      {
        id: "les-olivier-1",
        at: "2026-10-03T14:00:00.000Z",
        minutes: 120,
        instructor: "Marc",
        placeId: "bourassa",
        status: "booked",
      },
    ],
    modulesDone: [],
    practicalDone: 0,
  },
];

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

export function paidSubtotal(e: Enrollment) {
  return e.payments.reduce((s, p) => s + p.subtotalCents, 0);
}

export function balanceCents(e: Enrollment) {
  const course = getCourse(e.courseId);
  if (!course) return 0;
  return Math.max(
    0,
    priceAfterPromo(course.price, e.promoApplied) - paidSubtotal(e),
  );
}

type State = {
  lang: Lang;
  enrollments: Enrollment[];
  enquiries: Enquiry[];
  activeId: string;
  setLang: (lang: Lang) => void;
  setActive: (id: string) => void;
  spotsLeft: () => number;
  enroll: (args: {
    courseId: CourseId;
    student: Student;
    lesson?: Lesson;
  }) => string;
  addPayment: (
    enrollmentId: string,
    args: {
      subtotalCents: number;
      method: PaymentMethod;
      label: string;
      last4?: string;
    },
  ) => string;
  bookLesson: (enrollmentId: string, lesson: Lesson) => void;
  setLessonStatus: (
    enrollmentId: string,
    lessonId: string,
    status: LessonStatus,
  ) => void;
  toggleModule: (enrollmentId: string, module: number) => void;
  addEnquiry: (args: Omit<Enquiry, "id" | "at">) => void;
  resetDemo: () => void;
};

export const useDesk = create<State>()(
  persist(
    (set, get) => ({
      lang: "en",
      enrollments: demoEnrollments,
      enquiries: demoEnquiries,
      activeId: "enr-maya",
      setLang: (lang) => set({ lang }),
      setActive: (activeId) => set({ activeId }),
      spotsLeft: () =>
        spotsLeft(get().enrollments.filter((e) => e.promoApplied).length),
      enroll: ({ courseId, student, lesson }) => {
        const course = getCourse(courseId);
        if (!course) return "";
        const promoApplied = !!(course.promo && get().spotsLeft() > 0);
        const id = newId("enr");
        set({
          enrollments: [
            {
              id,
              createdAt: new Date().toISOString(),
              courseId,
              student,
              promoApplied,
              payments: [],
              lessons: lesson ? [lesson] : [],
              modulesDone: [],
              practicalDone: 0,
            },
            ...get().enrollments,
          ],
          activeId: id,
        });
        return id;
      },
      addPayment: (enrollmentId, args) => {
        const tax = taxBreakdown(args.subtotalCents);
        const payment: Payment = {
          id: newId("pay"),
          at: new Date().toISOString(),
          label: args.label,
          subtotalCents: args.subtotalCents,
          gstCents: tax.gstCents,
          qstCents: tax.qstCents,
          totalCents: tax.totalCents,
          method: args.method,
          last4: args.last4,
        };
        set({
          enrollments: get().enrollments.map((e) =>
            e.id === enrollmentId
              ? { ...e, payments: [...e.payments, payment] }
              : e,
          ),
        });
        return payment.id;
      },
      bookLesson: (enrollmentId, lesson) => {
        set({
          enrollments: get().enrollments.map((e) =>
            e.id === enrollmentId
              ? { ...e, lessons: [...e.lessons, lesson] }
              : e,
          ),
        });
      },
      setLessonStatus: (enrollmentId, lessonId, status) => {
        set({
          enrollments: get().enrollments.map((e) => {
            if (e.id !== enrollmentId) return e;
            const lesson = e.lessons.find((l) => l.id === lessonId);
            let practicalDone = e.practicalDone;
            if (lesson && lesson.status !== "done" && status === "done")
              practicalDone += 1;
            if (lesson && lesson.status === "done" && status !== "done")
              practicalDone = Math.max(0, practicalDone - 1);
            return {
              ...e,
              practicalDone,
              lessons: e.lessons.map((l) =>
                l.id === lessonId ? { ...l, status } : l,
              ),
            };
          }),
        });
      },
      toggleModule: (enrollmentId, module) => {
        set({
          enrollments: get().enrollments.map((e) => {
            if (e.id !== enrollmentId) return e;
            const has = e.modulesDone.includes(module);
            return {
              ...e,
              modulesDone: has
                ? e.modulesDone.filter((m) => m !== module)
                : [...e.modulesDone, module].sort((a, b) => a - b),
            };
          }),
        });
      },
      addEnquiry: (args) => {
        set({
          enquiries: [
            { ...args, id: newId("enq"), at: new Date().toISOString() },
            ...get().enquiries,
          ],
        });
      },
      resetDemo: () =>
        set({
          enrollments: demoEnrollments,
          enquiries: demoEnquiries,
          activeId: "enr-maya",
        }),
    }),
    { name: "national-driving-desk" },
  ),
);
