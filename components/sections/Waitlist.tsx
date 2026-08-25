"use client";

import { useState } from "react";
import { Button8D } from "@/components/ui/Button8D";

type State = "idle" | "sending" | "done" | "error";

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Could not save that address.");
      setState("done");
      setMessage("On the list. We will send the build, not a newsletter.");
      setEmail("");
    } catch (cause) {
      setState("error");
      setMessage(cause instanceof Error ? cause.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <label htmlFor="waitlist-email" className="eyebrow">
        Get the build
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          id="waitlist-email"
          type="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state !== "idle") setState("idle");
          }}
          placeholder="you@company.com"
          autoComplete="email"
          className="hairline min-w-0 flex-1 rounded-lg border bg-[rgb(var(--line)/0.04)] px-4 py-3 text-body focus-visible:border-[rgb(var(--accent)/0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]"
        />
        <Button8D variant="ice" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Join"}
        </Button8D>
      </div>
      <p
        role="status"
        className={`mt-3 min-h-[1.25rem] font-mono text-[11px] tracking-[0.05em] ${
          state === "error" ? "text-[rgb(var(--accent))]" : "text-dim"
        }`}
      >
        {message}
      </p>
    </form>
  );
}
