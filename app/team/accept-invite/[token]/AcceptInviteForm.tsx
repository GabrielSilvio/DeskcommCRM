"use client";
import { useActionState } from "react";
import { acceptInviteAction, type AcceptInviteResult } from "@/app/actions/team/acceptInvite";

export function AcceptInviteForm({ token, label, failureLabel, pendingLabel, planLimitLabel }: { token: string; label: string; failureLabel: string; pendingLabel: string; planLimitLabel: string }) {
  const [result, submit, pending] = useActionState<AcceptInviteResult | null, FormData>(
    async () => acceptInviteAction(token), null,
  );
  return <form action={submit} className="mt-6 space-y-3">
    {result && !result.ok && <p role="alert" className="rounded-md border border-error/30 bg-error-bg px-4 py-3 text-sm text-error-fg">{result.error === "limite_do_plano" ? planLimitLabel : failureLabel}</p>}
    <button type="submit" disabled={pending}
      className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-7 text-center font-display text-base font-semibold text-accent-foreground shadow-press transition-all duration-base ease-spring hover:-translate-y-0.5 hover:bg-accent-hover active:translate-y-0 disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 w-full">
      {pending ? pendingLabel : label}
    </button>
  </form>;
}
