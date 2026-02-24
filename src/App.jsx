import React, { useEffect, useMemo, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { Analytics } from "@vercel/analytics/next"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Code2,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Moon,
  Sun,
  Terminal,
  X,
  Search,
  Sparkles,
  FileText,
  GraduationCap,
  Shield,
} from "lucide-react";

/**
 * Interactive Portfolio (single-file React component)
 * - Smooth section navigation
 * - Command palette (⌘K / Ctrl+K)
 * - Project search + tag filters
 * - Animated background + scroll progress
 * - Project quick-view modal
 * - “Now” status + timeline
 *
 * Drop into a Vite React project as src/App.jsx.
 * Tailwind recommended for styling; classNames assume Tailwind.
 */

const cx = (...a) => a.filter(Boolean).join(" ");

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

const PROFILE = {
  name: "Ishaa Jain",
  title: "Software Engineer • Security + AI",
  location: "Cincinnati, OH",
  email: "jainid@mail.uc.edu",
  links: {
    github: "https://github.com/ij5204",
    linkedin: "https://www.linkedin.com/in/ishitaajain1/",
    resume: "/Ishitaa_Jain_Resume.pdf",
  },
  quick: [
    { icon: Shield, label: "Security", value: "OSQuery • Detection Engineering" },
    { icon: Sparkles, label: "AI", value: "RAG • Eval • Tooling" },
    { icon: Code2, label: "Web", value: "React • TypeScript • APIs" },
  ],
};

const PROJECTS = [
  {
    id: "uc-doubtclear",
    title: "UC DoubtClear",
    blurb: "A Q&A platform for students with AI answer generation and realtime features.",
    tags: ["React", "Supabase", "Postgres", "AI"],
    links: {
      repo: "https://github.com/SamarthP7704/uc_doubtclear",
    },
    highlights: [
      "Secure auth + role-based access",
      "Realtime feeds and user profiles",
      "AI answer generation + caching",
    ],
    details:
      "Built a full-stack Q&A platform with authentication, user profiles, and a realtime question feed. Integrated an AI answer generation service and stored generated answers for fast reuse. Added observability hooks for prompt/eval workflows.",
  },
  {
    id: "adaptive-rag-reliability",
    title: "Adaptive RAG Reliability",
    blurb: "Evaluation-driven RAG experiments to reduce hallucinations and improve grounding.",
    tags: ["Python", "RAG", "Evaluation", "Research"],
    links: {
      repo: "https://github.com/ij5204/Adaptive-Rag-Reliability",
    },
    highlights: [
      "Configurable retrieval + reranking",
      "Hallucination / grounding metrics",
      "Run logs + reproducible experiments",
    ],
    details:
      "Designed experiments to test how retrieval quality and prompting affect grounding. Implemented metrics like EM/F1 and added a hallucination/attribution heuristic to flag ungrounded answers. Packaged runs into JSONL outputs for analysis.",
  },
  {
    id: "sentinel-lite",
    title: "Sentinel-Lite",
    blurb: "Lightweight log-analysis and intrusion-detection tool.",
    tags: ["OSQuery", "Security", "Linux"],
    links: {
      repo: "https://github.com/ij5204/sentinel-lite",
    },
    highlights: ["JSON", "Detection", "Local dashboards"],
    details:
      "Sentinel-Lite is a lightweight log-analysis and intrusion-detection tool designed for developers, sysadmins, and security students."
  },
];

const EXPERIENCE = [
  {
    role: "Research Intern",
    org: "TCAAI Lab (IIT Bombay)",
    when: "Jan 2025 - May 2025",
    icon: GraduationCap,
    bullets: [
      "Tested endpoint detection rules and verified triggers against expected telemetry.",
      "Documented regressions and collaborated on fixes to improve rule quality.",
    ],
  },
  {
    role: "Teaching Assistant",
    org: "University of Cincinnati",
    when: "Jan 2024 - April 2024",
    icon: Briefcase,
    bullets: [
      "Mentored first-year students in Python, MATLAB, and Excel automation.",
      "Guided students during labs and debugging sessions to strengthen foundational programming skills.",
    ],
  },
];

const SKILLS = [
  { group: "Frontend", items: ["React", "TypeScript", "Vite", "Tailwind", "Accessibility"] },
  { group: "Backend", items: ["Node.js", "Express", "FastAPI", "PostgreSQL", "Supabase"] },
  { group: "Security", items: ["OSQuery", "Detection Engineering", "MITRE ATT&CK", "Linux"] },
  { group: "AI/ML", items: ["RAG", "Evaluation", "Prompting", "Embeddings", "Experiment Tracking"] },
  { group: "DevOps", items: ["Docker", "CI/CD", "Git", "Observability"] },
];

function useLocalStorageState(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function Pill({ children, className }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs",
        "border-white/10 bg-white/5 text-white/80",
        className
      )}
    >
      {children}
    </span>
  );
}

function Kbd({ children }) {
  return (
    <kbd className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/70">
      {children}
    </kbd>
  );
}

function Card({ children, className }) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-white/10 bg-white/[0.04] shadow-sm",
        "backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

function Section({ id, title, subtitle, children, right }) {
  return (
    <section id={id} className="relative scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {title}
            </h2>
            {subtitle ? <p className="mt-2 max-w-2xl text-white/60">{subtitle}</p> : null}
          </div>
          {right ? <div className="flex items-center gap-2">{right}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function GradientOrbs({ reducedMotion }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl"
        style={{ mixBlendMode: "screen" }}
      />
      <motion.div
        aria-hidden
        className="absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-white/10 blur-3xl"
        style={{ mixBlendMode: "screen" }}
        animate={
          reducedMotion
            ? { opacity: 0.6 }
            : {
                x: [0, 40, -20, 0],
                y: [0, -20, 30, 0],
                opacity: [0.55, 0.7, 0.6, 0.55],
              }
        }
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -right-56 top-24 h-[640px] w-[640px] rounded-full bg-white/10 blur-3xl"
        style={{ mixBlendMode: "screen" }}
        animate={
          reducedMotion
            ? { opacity: 0.55 }
            : {
                x: [0, -40, 20, 0],
                y: [0, 20, -30, 0],
                opacity: [0.55, 0.7, 0.6, 0.55],
              }
        }
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function ScrollProgress() {
  const y = useMotionValue(0);
  const spring = useSpring(y, { stiffness: 200, damping: 40 });

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max <= 0 ? 0 : window.scrollY / max;
      y.set(clamp(pct, 0, 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [y]);

  const width = useTransform(spring, (v) => `${Math.round(v * 100)}%`);

  return (
    <div className="fixed left-0 top-0 z-50 h-1 w-full bg-white/5">
      <motion.div className="h-full bg-white/60" style={{ width }} />
    </div>
  );
}

function Navbar({ activeId, onOpenCmd, theme, setTheme }) {
  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          onClick={() => scrollToId("home")}
          className="group inline-flex items-center gap-2 rounded-xl px-2 py-2 text-left"
        >
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5">
            <Terminal className="h-4 w-4 text-white/80" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">{PROFILE.name}</div>
            <div className="text-xs text-white/55">{PROFILE.title}</div>
          </div>
        </button>

        <div className="hidden items-center gap-2 md:flex">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollToId(s.id)}
              className={cx(
                "rounded-xl px-3 py-2 text-sm transition",
                activeId === s.id
                  ? "bg-white/10 text-white"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCmd}
            className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 hover:bg-white/10 sm:flex"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Command</span>
            <span className="mx-1 hidden text-white/25 md:inline">•</span>
            <span className="hidden md:inline">
              <Kbd>{navigator?.platform?.toLowerCase?.().includes("mac") ? "⌘" : "Ctrl"}K</Kbd>
            </span>
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommandPalette({ open, onClose, onAction }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  const actions = useMemo(
    () => [
      ...SECTIONS.map((s) => ({
        id: `nav:${s.id}`,
        label: `Go to ${s.label}`,
        hint: s.id,
        icon: ArrowRight,
        run: () => onAction({ type: "nav", id: s.id }),
      })),
      {
        id: "copy:email",
        label: "Copy email",
        hint: PROFILE.email,
        icon: Mail,
        run: async () => {
          try {
            await navigator.clipboard.writeText(PROFILE.email);
            onAction({ type: "toast", message: "Email copied." });
          } catch {
            onAction({ type: "toast", message: "Could not copy (clipboard blocked)." });
          }
        },
      },
      {
        id: "open:github",
        label: "Open GitHub",
        hint: "External",
        icon: Github,
        run: () => window.open(PROFILE.links.github, "_blank", "noopener,noreferrer"),
      },
      {
        id: "open:linkedin",
        label: "Open LinkedIn",
        hint: "External",
        icon: Linkedin,
        run: () => window.open(PROFILE.links.linkedin, "_blank", "noopener,noreferrer"),
      },
    ],
    [onAction]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return actions;
    return actions.filter((a) => (a.label + " " + (a.hint ?? "")).toLowerCase().includes(term));
  }, [actions, q]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") {
        e.preventDefault();
        filtered[0]?.run?.();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Search className="h-4 w-4 text-white/60" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type a command… (Enter to run)"
                className="w-full bg-transparent text-sm text-white/85 outline-none placeholder:text-white/35"
              />
              <Kbd>Esc</Kbd>
            </div>
            <div className="max-h-[340px] overflow-auto p-2">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-white/50">No matches.</div>
              ) : (
                filtered.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.id}
                      onClick={() => {
                        a.run?.();
                        onClose();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-white/5"
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5">
                        <Icon className="h-4 w-4 text-white/70" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white/85">{a.label}</div>
                        <div className="text-xs text-white/45">{a.hint}</div>
                      </div>
                      <div className="text-xs text-white/35">Enter</div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Toast({ toast, clear }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 1800);
    return () => clearTimeout(t);
  }, [toast, clear]);

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white/80 shadow-xl backdrop-blur-xl"
        >
          {toast}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ProjectModal({ project, onClose }) {
  return (
    <AnimatePresence>
      {project ? (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/85 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
              <div>
                <div className="text-lg font-semibold text-white">{project.title}</div>
                <div className="mt-1 text-sm text-white/55">{project.blurb}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.tags.map((t) => (
                    <Pill key={t}>{t}</Pill>
                  ))}
                </div>
              </div>
              <button
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm leading-relaxed text-white/70">{project.details}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Card className="p-4">
                  <div className="text-sm font-semibold text-white">Highlights</div>
                  <ul className="mt-2 space-y-2 text-sm text-white/65">
                    {project.highlights.map((h) => (
                      <li key={h} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/40" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-4">
                  <div className="text-sm font-semibold text-white">Links</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={project.links.repo}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 hover:bg-white/10"
                    >
                      <Github className="h-4 w-4" /> Repo
                    </a>
                    
                  </div>
                  <div className="mt-4 text-xs text-white/45">
                    Tip: Replace # links with your real URLs.
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Hero({ onOpenCmd }) {
  return (
    <section id="home" className="relative scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-semibold tracking-tight text-white sm:text-5xl"
            >
              Building reliable systems
              <span className="block text-white/70"></span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-4 max-w-2xl text-base leading-relaxed text-white/65"
            >
              I’m {PROFILE.name}. I am interested in full-stack development, AIML as well as security tooling, and I’m
              currently exploring RAG reliability and evaluation-driven development.
            </motion.p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => scrollToId("projects")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
              >
                See Projects <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={onOpenCmd}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Open Command <Kbd>{navigator?.platform?.toLowerCase?.().includes("mac") ? "⌘" : "Ctrl"}K</Kbd>
              </button>
              <a
                href={PROFILE.links.resume}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Resume <FileText className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              <Pill className="gap-2">
                <MapPin className="h-3.5 w-3.5" /> {PROFILE.location}
              </Pill>
              <Pill className="gap-2">
                <Mail className="h-3.5 w-3.5" /> {PROFILE.email}
              </Pill>
              <Pill className="gap-2">
                <Code2 className="h-3.5 w-3.5" /> React • TypeScript • Security
              </Pill>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">Now</div>
                <Pill className="border-white/15 bg-white/5">Available: Summer 2026</Pill>
              </div>
              <div className="mt-3 text-sm text-white/65">
                Currently focused on:
                <ul className="mt-2 space-y-2">
                  <li className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span>Designing evaluation frameworks for hallucination detection in RAG pipelines</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span>Building AI-integrated full-stack platforms</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span>Developing secure architectures</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 grid gap-3">
                {PROFILE.quick.map((q) => {
                  const Icon = q.icon;
                  return (
                    <div
                      key={q.label}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20">
                        <Icon className="h-4 w-4 text-white/75" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white/90">{q.label}</div>
                        <div className="mt-1 text-sm text-white/60">{q.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FloatingDock() {
  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/60 p-2 shadow-xl backdrop-blur-xl">
        <a
          href={PROFILE.links.resume}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          title="Open resume"
        >
          <FileText className="h-4 w-4" /> Resume
        </a>
        <a
          href={`mailto:${PROFILE.email}`}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          title="Email"
        >
          <Mail className="h-4 w-4" /> Email
        </a>
        <a
          href={PROFILE.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          title="GitHub"
        >
          <Github className="h-4 w-4" /> GitHub
        </a>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show ? (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={() => scrollToId("home")}
          className="fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-black/60 text-white/80 shadow-xl backdrop-blur-xl hover:bg-white/10"
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowRight className="h-4 w-4 -rotate-90" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}

function GitHubStats({ onToast }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("https://api.github.com/users/ij5204")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive) setData(j);
      })
      .catch(() => {
        if (alive) setData(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-white/45">Repos</div>
        <div className="mt-1 text-lg font-semibold text-white/90">{data?.public_repos ?? "—"}</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-white/45">Followers</div>
        <div className="mt-1 text-lg font-semibold text-white/90">{data?.followers ?? "—"}</div>
      </div>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(PROFILE.links.github);
            onToast?.("GitHub link copied.");
          } catch {
            onToast?.("Clipboard blocked.");
          }
        }}
        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
      >
        <div className="text-xs text-white/45">Quick action</div>
        <div className="mt-1 text-sm font-semibold text-white/85">Copy GitHub link</div>
      </button>
    </div>
  );
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion();
  const [theme, setTheme] = useLocalStorageState("portfolio_theme", "dark");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [activeId, setActiveId] = useState("home");
  const [selectedProject, setSelectedProject] = useState(null);

  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");

  const allTags = useMemo(() => {
    const s = new Set();
    PROJECTS.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return ["All", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, []);

  const filteredProjects = useMemo(() => {
    const term = query.trim().toLowerCase();
    return PROJECTS.filter((p) => {
      const tagOk = tag === "All" ? true : p.tags.includes(tag);
      const qOk =
        !term ||
        (p.title + " " + p.blurb + " " + p.tags.join(" ") + " " + p.details)
          .toLowerCase()
          .includes(term);
      return tagOk && qOk;
    });
  }, [query, tag]);

  // Theme class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Command palette hotkey
  useEffect(() => {
    const onKey = (e) => {
      const isK = e.key.toLowerCase() === "k";
      const mod = e.metaKey || e.ctrlKey;
      if (mod && isK) {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Active section tracking
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      { root: null, threshold: [0.2, 0.35, 0.5, 0.65] }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const onCommandAction = (a) => {
    if (a.type === "nav") scrollToId(a.id);
    if (a.type === "toast") setToast(a.message);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <ScrollProgress />
      <GradientOrbs reducedMotion={reducedMotion} />

      <Navbar
        activeId={activeId}
        onOpenCmd={() => setCmdOpen(true)}
        theme={theme}
        setTheme={setTheme}
      />

      <Hero onOpenCmd={() => setCmdOpen(true)} />

      <Section
        id="about"
        title="About"
        subtitle="A quick snapshot of what I do and how I like to work."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-sm font-semibold text-white">How I work</div>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              I like making fast, but not sloppy systems. I design systems so they’re easy to observe,
              test, and evolve. I care a lot about clarity, clean interfaces, and
              documentation that actually helps.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Reliable", "Fast", "Curious", "Low-ego", "Detail-oriented"].map((t) => (
                <Pill key={t}>{t}</Pill>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Quick links</div>
              <Pill className="gap-2">
                <Terminal className="h-3.5 w-3.5" /> Portfolio v1
              </Pill>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href={PROFILE.links.github}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20">
                  <Github className="h-4 w-4 text-white/75" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">GitHub</div>
                  <div className="text-xs text-white/45">Projects + code</div>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-white/40 transition group-hover:translate-x-0.5" />
              </a>

              <a
                href={PROFILE.links.linkedin}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20">
                  <Linkedin className="h-4 w-4 text-white/75" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">LinkedIn</div>
                  <div className="text-xs text-white/45">Experience</div>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-white/40 transition group-hover:translate-x-0.5" />
              </a>
            </div>

            <GitHubStats onToast={setToast} />

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Mail className="h-4 w-4 text-white/70" /> Contact
              </div>
              <div className="mt-1 text-sm text-white/60">{PROFILE.email}</div>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(PROFILE.email);
                    setToast("Email copied.");
                  } catch {
                    setToast("Clipboard blocked.");
                  }
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/75 hover:bg-white/10"
              >
                Copy email <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>
      </Section>

      <Section
        id="projects"
        title="Projects"
        subtitle="Search, filter, and open any project for a quick deep-dive."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects…"
                className="w-[240px] rounded-2xl border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-white/80 outline-none placeholder:text-white/35 focus:border-white/20"
              />
            </div>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none"
            >
              {allTags.map((t) => (
                <option key={t} value={t} className="bg-zinc-950">
                  {t}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          {filteredProjects.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 260, damping: 22, delay: Math.min(idx * 0.04, 0.18) }}
            >
              <Card className="group h-full p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-white/95">{p.title}</div>
                    <div className="mt-1 text-sm text-white/60">{p.blurb}</div>
                  </div>
                  <button
                    onClick={() => setSelectedProject(p)}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                    aria-label={`Open ${p.title}`}
                  >
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {p.tags.slice(0, 5).map((t) => (
                    <Pill key={t}>{t}</Pill>
                  ))}
                </div>

                <div className="mt-5 grid gap-2">
                  {p.highlights.slice(0, 3).map((h) => (
                    <div key={h} className="flex gap-2 text-sm text-white/65">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/40" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={p.links.repo}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 hover:bg-white/10"
                  >
                    <Github className="h-4 w-4" /> Repo
                  </a>
                  
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredProjects.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            No projects match. Try clearing search or switching tags.
          </div>
        ) : null}
      </Section>

      <Section
        id="experience"
        title="Experience"
        subtitle="A timeline."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {EXPERIENCE.map((e) => {
            const Icon = e.icon;
            return (
              <Card key={e.role + e.org} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
                    <Icon className="h-4 w-4 text-white/75" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-base font-semibold text-white/95">{e.role}</div>
                        <div className="text-sm text-white/55">{e.org}</div>
                      </div>
                      <Pill>{e.when}</Pill>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-white/65">
                      {e.bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/40" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            );
          })}

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
                <Briefcase className="h-4 w-4 text-white/75" />
              </div>
              <div>
                <div className="text-base font-semibold text-white/95">What I’m looking for</div>
                <div className="mt-1 text-sm text-white/60">
                  Summer 2026 internships/co-ops in security engineering, platform engineering, or
                  AI tooling.
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Security Ops", "Detection Eng", "Backend", "Full-stack", "AI Eval"].map((t) => (
                    <Pill key={t}>{t}</Pill>
                  ))}
                </div>
                <button
                  onClick={() => scrollToId("contact")}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
                >
                  Let’s talk <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section
        id="skills"
        title="Skills"
        subtitle="Grouped so it’s easy to scan. Swap items to match your strongest areas."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {SKILLS.map((g) => (
            <Card key={g.group} className="p-6">
              <div className="text-sm font-semibold text-white/90">{g.group}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {g.items.map((s) => (
                  <Pill key={s} className="hover:bg-white/10">
                    {s}
                  </Pill>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Kbd>{navigator?.platform?.toLowerCase?.().includes("mac") ? "⌘" : "Ctrl"}K</Kbd>
              <span>open command</span>
              <span className="mx-1 text-white/25">•</span>
              <Kbd>Esc</Kbd>
              <span>close</span>
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="contact"
        title="Contact"
        subtitle=""
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Mail className="h-4 w-4 text-white/70" /> Send a message
            </div>
            <form
              className="mt-4 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                emailjs
                .send(
                  "service_vokmli8",   // ← replace with your Service ID
                  "template_f7p61wb",  // ← replace with your Template ID
                  {
                    name: form[0].value,
                    email: form[1].value,
                    subject: form[2].value,
                    message: form[3].value,
                  },
                  "YR6IzWsPyS7Qv5FQVS"  // ← replace with your Public Key
                  )
                  .then(
                    () => {
                      setToast("Message sent successfully!");
                      form.reset();
                    },
                    () => {
                      setToast("Failed to send message.");
                    }
                  );
                }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  required
                  placeholder="Name"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/35 focus:border-white/20"
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/35 focus:border-white/20"
                />
              </div>
              <input
                required
                placeholder="Subject"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/35 focus:border-white/20"
              />
              <textarea
                required
                rows={5}
                placeholder="Message"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/35 focus:border-white/20"
              />
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90">
                Send <ArrowRight className="h-4 w-4" />
              </button>
              <div className="text-xs text-white/45">
                Also reachable at <span className="text-white/70">{PROFILE.email}</span>
              </div>
            </form>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold text-white/90">Social</div>
            <div className="mt-4 grid gap-3">
              <a
                href={PROFILE.links.github}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20">
                  <Github className="h-4 w-4 text-white/75" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">GitHub</div>
                  <div className="text-xs text-white/45">Repos + contributions</div>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-white/40" />
              </a>

              <a
                href={PROFILE.links.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20">
                  <Linkedin className="h-4 w-4 text-white/75" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">LinkedIn</div>
                  <div className="text-xs text-white/45">Professional profile</div>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-white/40" />
              </a>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            </div>
          </Card>
        </div>

        <footer className="mt-12 border-t border-white/10 pt-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <a className="hover:text-white/80" href="#" onClick={(e) => (e.preventDefault(), scrollToId("home"))}>
                Back to top
              </a>
              <span className="text-white/35">•</span>
              <a className="hover:text-white/80" href={PROFILE.links.resume}>
                Resume
              </a>
            </div>
          </div>
        </footer>
      </Section>

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onAction={onCommandAction}
      />
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      <Toast toast={toast} clear={() => setToast("")} />
      <FloatingDock />
      <ScrollToTop />
    </div>
  );
}
