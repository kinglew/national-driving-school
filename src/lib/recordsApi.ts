export type Role = "office" | "instructor" | "student";

export type Me = {
  ok: boolean;
  role: Role;
  principalId: string;
  error?: string;
};

export type LessonRecord = {
  id: string;
  enrolmentId: string;
  kind: "theory" | "in_car";
  instructorPrincipalId: string | null;
  vehicleLabel: string | null;
  durationMinutes: number;
  location: string | null;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled";
  startsAt: string;
  studentSignedAt: string | null;
  instructorSignedAt: string | null;
  attendance: { present: boolean; theoryMinutes: number; roadMinutes: number } | null;
};

export type EnrolmentRecord = {
  id: string;
  programCode: string;
  status: string;
  startedOn: string;
  phases: Array<{
    id: string;
    sequence: number;
    plannedDays: number;
    startedOn: string | null;
    completedOn: string | null;
  }>;
  milestone: { learnerLicenceOn: string | null; attestationOn: string | null } | null;
  lessons: LessonRecord[];
  progress: { theoryMinutes: number; roadMinutes: number };
};

export type StudentRecord = {
  id: string;
  givenName: string | null;
  familyName: string | null;
  email: string | null;
  phone: string | null;
  deletionRequestedAt: string | null;
  enrolments: EnrolmentRecord[];
};

export type StaffMember = { principalId: string; role: Role; displayName: string };

const KEY = "nds.session";

export function getToken() {
  return sessionStorage.getItem(KEY) ?? "";
}

export function setToken(token: string) {
  sessionStorage.setItem(KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(KEY);
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }) {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init?.body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(path, {
    method: init?.method ?? "GET",
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const body = (await response.json()) as T;
  return { status: response.status, body };
}
