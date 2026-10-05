import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { recordsCopy } from "../data/recordsCopy";
import { useI18n } from "../hooks/useI18n";
import { api, clearToken, getToken, setToken, type Me } from "../lib/recordsApi";
import { Button, Field, inputClass } from "./ui";

export function SessionGate({ children }: { children: (me: Me) => ReactNode }) {
  const { lang } = useI18n();
  const copy = recordsCopy[lang];
  const [state, setState] = useState<"loading" | "in" | "out">("loading");
  const [me, setMe] = useState<Me | null>(null);
  const [email, setEmail] = useState("");
  const [token, setTokenValue] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!getToken()) {
        if (!cancel) {
          setMe(null);
          setState("out");
        }
        return;
      }
      const result = await api<Me>("/api/me");
      if (cancel) return;
      if (result.status === 200 && result.body.ok) {
        setMe(result.body);
        setState("in");
        return;
      }
      clearToken();
      setMe(null);
      setState("out");
    }
    void load();
    return () => {
      cancel = true;
    };
  }, []);

  async function requestLink(event: FormEvent) {
    event.preventDefault();
    setNote("");
    const result = await api<{ delivery?: string }>("/api/auth/magic-link", {
      method: "POST",
      body: { email },
    });
    setNote(result.body.delivery === "not_sent" ? copy.notSent : copy.unconfigured);
  }

  async function redeem(event: FormEvent) {
    event.preventDefault();
    setNote("");
    const result = await api<Me & { token?: string }>("/api/auth/redeem", {
      method: "POST",
      body: { token },
    });
    if (result.status === 200 && result.body.token && result.body.role) {
      setToken(result.body.token);
      setMe({ ok: true, role: result.body.role, principalId: result.body.principalId });
      setState("in");
      return;
    }
    setNote(copy.invalid);
  }

  async function signOut() {
    await api("/api/auth/logout", { method: "POST", body: {} });
    clearToken();
    setMe(null);
    setState("out");
  }

  if (state === "loading") {
    return <p className="text-sm text-muted">{copy.loading}</p>;
  }

  if (state === "out" || !me) {
    return (
      <div className="max-w-xl space-y-4 border border-line bg-paper p-4">
        <h2 className="font-display text-3xl font-bold uppercase text-navy">{copy.signIn}</h2>
        <p className="text-sm text-muted">{copy.signLead}</p>
        <form className="space-y-3" onSubmit={requestLink}>
          <Field label={copy.email}>
            <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Button type="submit">{copy.request}</Button>
        </form>
        <form className="space-y-3" onSubmit={redeem}>
          <Field label={copy.token}>
            <input className={inputClass} value={token} onChange={(event) => setTokenValue(event.target.value)} />
          </Field>
          <Button type="submit" variant="line">{copy.redeem}</Button>
        </form>
        {note ? <p className="text-sm">{note}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="ghost" onClick={() => void signOut()}>{copy.signOut}</Button>
      </div>
      {children(me)}
    </div>
  );
}
