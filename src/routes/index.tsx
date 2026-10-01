import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nokia Task Tracker — Live Dev Status" },
      {
        name: "description",
        content:
          "A retro Nokia-style task tracker showing which task is being worked on right now, with a live timer and per-task status.",
      },
      { property: "og:title", content: "Nokia Task Tracker — Live Dev Status" },
      {
        property: "og:description",
        content:
          "One active task, a live since-when timer, and a status per task — on a classic Nokia screen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type TaskStatus = "todo" | "active" | "done";

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
}

const INITIAL_TASKS: Task[] = [
  { id: 1, title: "Ship onboarding flow", status: "active" },
  { id: 2, title: "Draft Q3 roadmap", status: "todo" },
  { id: 3, title: "Review PR #248", status: "todo" },
  { id: 4, title: "Fix login bug", status: "done" },
  { id: 5, title: "Update docs", status: "done" },
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatClock(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Index() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [since, setSince] = useState(() => Date.now() - 14 * 60 * 1000 - 32 * 1000);
  const [now, setNow] = useState(() => Date.now());
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load saved tasks once, then persist on every change
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("nokia-tasks");
      if (raw) {
        const parsed = JSON.parse(raw) as Task[];
        if (Array.isArray(parsed) && parsed.length > 0) setTasks(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem("nokia-tasks", JSON.stringify(tasks));
    } catch {
      /* storage unavailable */
    }
  }, [tasks, loaded]);

  const activeTask = tasks.find((t) => t.status === "active");
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const activateTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        status:
          t.id === id ? "active" : t.status === "active" ? "todo" : t.status,
      })),
    );
    setSince(Date.now());
  };

  const markDone = () => {
    if (!activeTask) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === activeTask.id ? { ...t, status: "done" } : t)),
    );
  };

  const addTask = () => {
    const title = draft.trim().slice(0, 40);
    if (!title) return;
    setTasks((prev) => {
      if (prev.length >= 9) {
        setNotice("MEMORY FULL");
        setAdding(false);
        setDraft("");
        return prev;
      }
      const id = Math.max(0, ...prev.map((t) => t.id)) + 1;
      return [...prev, { id, title, status: "todo" as TaskStatus }];
    });
    setDraft("");
    setAdding(false);
  };

  const clearDone = () => {
    setTasks((prev) => prev.filter((t) => t.status !== "done"));
  };

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const cycleTask = (dir: 1 | -1) => {
    const candidates = tasks.filter((t) => t.status !== "done");
    if (candidates.length === 0) return;
    const idx = candidates.findIndex((t) => t.status === "active");
    const next = candidates[(idx + dir + candidates.length) % candidates.length];
    if (next) activateTask(next.id);
  };

  const orderedTasks = useMemo(
    () => tasks.filter((t) => t.status !== "active"),
    [tasks],
  );

  const keyClass =
    "rounded-xl bg-gradient-to-b from-nokia-key to-nokia-key-dark text-nokia-key-ink font-semibold text-sm py-2.5 ring-1 ring-black/10 active:translate-y-[1px] active:from-nokia-key-dark active:to-nokia-key shadow-[0_2px_0_rgba(0,0,0,0.15)] transition-transform";

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#eef1f6] px-4 py-10 font-ui text-[#2b3038]">
      <div className="absolute -top-24 -left-24 size-[420px] rounded-full bg-nokia-accent/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-16 size-[460px] rounded-full bg-nokia-lcd/25 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 size-[300px] rounded-full bg-white/40 blur-3xl" />

      <div className="relative flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
        {/* Caption */}
        <div className="rise max-w-[26ch] text-center lg:text-left" style={{ animationDelay: "60ms" }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-nokia-accent">
            Now working on
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            A phone that tells your PM where your head is.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-pretty text-[#6b7280]">
            One active task, a live since-when timer, and a status per task.
            Keypad-driven, manager-readable, and quietly delightful.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/50 px-3 py-1.5 text-xs text-[#6b7280] ring-1 ring-black/5 backdrop-blur-md">
            <span className="lcd-blink size-2 rounded-full bg-nokia-accent" />
            Live · {doneCount} of {tasks.length} tasks done
          </div>
        </div>

        {/* Phone */}
        <div className="rise relative" style={{ animationDelay: "160ms" }}>
          <div className="phone-glow absolute -inset-6 rounded-[3rem] bg-nokia-accent/15 blur-2xl" />
          <div className="relative w-[300px] rounded-[2.6rem] bg-gradient-to-b from-nokia-body to-nokia-body-edge p-3 ring-1 ring-black/20 shadow-[0_30px_60px_-20px_rgba(28,39,51,0.6)] sm:w-[320px]">
            {/* earpiece */}
            <div className="mx-auto mb-2 flex items-center justify-center gap-1.5">
              <span className="h-1 w-8 rounded-full bg-black/25" />
            </div>
            <div className="mb-2 text-center text-[10px] font-semibold tracking-[0.35em] text-white/70">
              NOKIA
            </div>

            {/* Screen */}
            <div className="rounded-[1.4rem] bg-nokia-body-dark p-2.5 ring-1 ring-black/30">
              <div className="relative overflow-hidden rounded-[0.9rem] bg-nokia-lcd p-3 ring-1 ring-nokia-lcd-deep/40">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(255,255,255,0.35),transparent_60%)]" />

                {/* status bar */}
                <div className="relative flex items-center justify-between font-pixel text-[7px] text-nokia-lcd-deep">
                  <div className="flex items-end gap-[3px]">
                    <span className="h-1.5 w-[3px] bg-nokia-lcd-deep" />
                    <span className="h-2.5 w-[3px] bg-nokia-lcd-deep" />
                    <span className="h-3.5 w-[3px] bg-nokia-lcd-deep" />
                    <span className="h-4.5 w-[3px] bg-nokia-lcd-deep" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="relative h-2.5 w-5 rounded-[2px] border border-nokia-lcd-deep">
                      <span className="absolute inset-[2px] right-1.5 bg-nokia-lcd-deep" />
                    </span>
                    <span className="h-1.5 w-1 rounded-[1px] bg-nokia-lcd-deep" />
                  </div>
                </div>

                {/* header */}
                <div className="relative mt-3 flex items-center justify-between border-b-2 border-nokia-lcd-deep/50 pb-1.5">
                  <span className="font-pixel text-[9px] text-nokia-lcd-deep">TASKS</span>
                  <span className="font-lcd text-base leading-none text-nokia-lcd-deep">
                    {formatClock(new Date(now))}
                  </span>
                </div>

                {/* active task */}
                {activeTask ? (
                  <div className="relative mt-2.5 rounded-md bg-nokia-lcd-deep/15 p-2 ring-1 ring-nokia-lcd-deep/40">
                    <div className="flex items-center justify-between">
                      <span className="lcd-blink font-pixel text-[7px] text-nokia-lcd-deep">
                        ► ACTIVE
                      </span>
                      <span className="font-lcd text-lg leading-none text-nokia-lcd-deep tabular-nums">
                        {formatElapsed(now - since)}
                      </span>
                    </div>
                    <div className="mt-1.5 font-lcd text-xl leading-none text-nokia-lcd-deep">
                      {activeTask.title}
                    </div>
                    <div className="mt-1 font-lcd text-sm leading-none text-nokia-lcd-deep/80">
                      since {formatClock(new Date(since))} · in progress
                    </div>
                  </div>
                ) : (
                  <div className="relative mt-2.5 rounded-md bg-nokia-lcd-deep/15 p-2 ring-1 ring-nokia-lcd-deep/40">
                    <div className="font-lcd text-xl leading-none text-nokia-lcd-deep">
                      All tasks done!
                    </div>
                    <div className="mt-1 font-lcd text-sm leading-none text-nokia-lcd-deep/80">
                      nothing in progress
                    </div>
                  </div>
                )}

                {/* list / add-task input */}
                {adding ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addTask();
                    }}
                    className="relative mt-2.5 border-b-2 border-nokia-lcd-deep/40 pb-1.5"
                  >
                    <div className="font-pixel text-[7px] text-nokia-lcd-deep">
                      NEW TASK
                    </div>
                    <input
                      autoFocus
                      value={draft}
                      maxLength={40}
                      placeholder="type, then press ↵"
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => {
                        setAdding(false);
                        setDraft("");
                      }}
                      className="mt-1 w-full bg-transparent font-lcd text-lg leading-none text-nokia-lcd-deep placeholder:text-nokia-lcd-deep/40 focus:outline-none"
                    />
                  </form>
                ) : (
                  <div className="relative mt-2.5 space-y-1.5">
                    {orderedTasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => t.status !== "done" && activateTask(t.id)}
                        className="flex w-full items-center gap-2 text-left font-lcd text-lg leading-none text-nokia-lcd-deep/85 disabled:cursor-default"
                        disabled={t.status === "done"}
                      >
                        <span className="font-pixel text-[7px] text-nokia-lcd-deep/70">
                          {t.id}
                        </span>
                        <span
                          className={
                            t.status === "done"
                              ? "truncate text-nokia-lcd-deep/55 line-through decoration-1"
                              : "truncate"
                          }
                        >
                          {t.title}
                        </span>
                        <span
                          className={`ml-auto font-pixel text-[6px] ${
                            t.status === "done"
                              ? "text-nokia-lcd-deep/55"
                              : "text-nokia-lcd-deep/70"
                          }`}
                        >
                          {t.status === "done" ? "DONE" : "TODO"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* footer hint */}
                <div className="relative mt-2.5 flex items-center justify-between font-pixel text-[6px] text-nokia-lcd-deep/70">
                  <span>{notice ?? "◄ ► SET"}</span>
                  <span># NEW · OK DONE</span>
                </div>
              </div>
            </div>

            {/* Keypad — number keys activate the matching task */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
                (k) => {
                  const n = parseInt(k, 10);
                  const task = Number.isNaN(n)
                    ? undefined
                    : tasks.find((t) => t.id === (n === 0 ? 10 : n));
                  const onClick =
                    k === "#"
                      ? () => setAdding(true)
                      : k === "*"
                        ? clearDone
                        : () =>
                            task &&
                            task.status !== "done" &&
                            activateTask(task.id);
                  return (
                    <button key={k} className={keyClass} onClick={onClick}>
                      {k}
                    </button>
                  );
                },
              )}
            </div>

            {/* nav row */}
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              <button className={keyClass} onClick={() => cycleTask(-1)} aria-label="Previous task">
                ◄
              </button>
              <button
                className="rounded-lg bg-gradient-to-b from-nokia-accent to-nokia-accent/80 py-2 text-xs font-semibold text-white ring-1 ring-black/10 shadow-[0_2px_0_rgba(0,0,0,0.2)] active:translate-y-[1px]"
                onClick={markDone}
              >
                OK
              </button>
              <button className={keyClass} onClick={() => cycleTask(1)} aria-label="Next task">
                ►
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
