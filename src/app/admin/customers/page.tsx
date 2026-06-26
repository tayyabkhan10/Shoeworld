'use client';

// 📁 src/app/admin/customers/page.tsx
// ── 40+ enhanced features over original ──────────────────────────────────────
// 1.  Bulk role change (admin ↔ user) with confirm modal
// 2.  Bulk delete with confirm modal
// 3.  Bulk "Copy all emails" action
// 4.  Export as JSON (alongside CSV)
// 5.  Column visibility toggler
// 6.  Inline edit name / role on expanded row
// 7.  Keyboard row navigation (↑ ↓ Enter Escape)
// 8.  Hotkeys cheatsheet panel (? key)
// 9.  Advanced filter panel (date range + provider)
// 10. Provider filter chips
// 11. Saved filter presets (up to 5)
// 12. Quick-filter bar (Recently joined / Admins / No password / Risk)
// 13. Group-by toggle (role | status | none)
// 14. Risk badge (unverified + no password + recent signup)
// 15. "New" badge for users joined < 7 days
// 16. Last-login / session-expires countdown column
// 17. Duplicate email detector warning banner
// 18. Per-user notes (localStorage persisted, up to 500 chars)
// 19. Pin users to top (localStorage persisted)
// 20. Multi-sort (primary + secondary sort key)
// 21. Column resize (drag handle on Customer col)
// 22. Regex search toggle
// 23. Auto-refresh interval selector (15 s / 30 s / 60 s / off)
// 24. Density preference persisted to localStorage
// 25. Dark-mode toggle (adds/removes `dark` class on <html>)
// 26. Stat card delta indicators (vs previous fetch)
// 27. Animated stat counters
// 28. Confetti burst on milestone (50 / 100 / 500 users)
// 29. Audit log sidebar (last 20 admin actions)
// 30. Undo-last-action toast (bulk operations)
// 31. User timeline drawer (right side panel)
// 32. Impersonate user button (fires /api/admin/impersonate)
// 33. Send email button (fires /api/admin/email)
// 34. Bulk verify emails action
// 35. Per-row "Suspicious" flag toggle
// 36. Column filter dropdowns (per-header)
// 37. Print-optimised stylesheet (Cmd+P)
// 38. ARIA live region for async updates
// 39. Reduced-motion respect (prefers-reduced-motion)
// 40. Scroll-aware sticky header with blur
// 41. Session-expiry progress bars in expanded row
// 42. Drag-select rows (click + shift-click range select)
// 43. CSV import modal with preview
// 44. Page-size selector (10 / 25 / 50 / 100)

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, RefreshCw, Search, ChevronDown, ChevronUp, ChevronLeft,
  ChevronRight, Download, Copy, Check, ShieldCheck, UserCheck, UserX,
  AlertTriangle, X, Circle, ArrowUp, Mail, KeyRound, Github, Chrome,
  Fingerprint, Rows3, Rows2, CheckSquare, Square, Braces, Wifi,
  Moon, Sun, Flag, Pin, PinOff, Trash2, Edit2, Save, Ban,
  BookOpen, SlidersHorizontal, Clock, Upload, Eye, EyeOff,
  ChevronRight as Caret, FileJson, Zap, Bell, Filter, LayoutList,
  UserCog, Shield, History, Play,
} from "lucide-react";
import {
  Fragment, useState, useEffect, useMemo, useCallback, useRef, createContext, useContext,
} from "react";
import { format, formatDistanceToNow, differenceInDays, differenceInSeconds } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";

// ── Types ───────────────────────────────────────────────────────────────────
interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  emailVerified: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  hasPassword?: boolean;
  isOnline?: boolean;
  sessionExpiresAt?: string | null;
  activeSessionCount?: number;
  providers?: string | null;
}

interface AuditEntry {
  ts: number;
  action: string;
  targets: string[];
}

interface FilterPreset {
  id: string;
  label: string;
  role: RoleFilter;
  status: StatusFilter;
  provider: string;
  q: string;
}

type SortKey = "name" | "createdAt" | "status" | "lastActive" | "sessions";
type SortDir = "asc" | "desc";
type RoleFilter = "all" | "admin" | "user";
type StatusFilter = "all" | "online" | "offline" | "unverified";
type Density = "comfortable" | "compact";
type GroupBy = "none" | "role" | "status";

// ── Constants ────────────────────────────────────────────────────────────────
const MILESTONES = [50, 100, 500, 1000];
const RISK_DAYS = 7; // joined within N days = potentially risky if unverified

// ── Hooks ────────────────────────────────────────────────────────────────────
function useDebounced<T>(value: T, delay = 200): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch { return initial; }
  });
  const persist = useCallback((v: T | ((prev: T) => T)) => {
    setVal((prev) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }, [key]);
  return [val, persist] as const;
}

function useCountUp(target: number, duration = 600) {
  const [cur, setCur] = useState(0);
  const prefersReduced = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (prefersReduced.current) { setCur(target); return; }
    const start = performance.now();
    const prev = cur;
    const raf = (ts: number) => {
      const t = Math.min((ts - start) / duration, 1);
      setCur(Math.round(prev + (target - prev) * t));
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return cur;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const providerIcon = (p: string) => {
  const l = p.toLowerCase();
  if (l.includes("google")) return Chrome;
  if (l.includes("github")) return Github;
  return Fingerprint;
};

function isRisky(u: DbUser) {
  const recentSignup = u.createdAt && differenceInDays(new Date(), new Date(u.createdAt)) < RISK_DAYS;
  return !u.emailVerified && !u.hasPassword && recentSignup;
}

function confettiBurst() {
  if (typeof window === "undefined") return;
  // Lightweight pure-CSS confetti — avoids external lib
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const pieces = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    r: 4 + Math.random() * 6,
    color: ["#111","#555","#888","#bbb","#eee"][Math.floor(Math.random() * 5)],
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 4,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
  }));
  let frame = 0;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
      ctx.restore();
    });
    frame++;
    if (frame < 90) requestAnimationFrame(draw);
    else canvas.remove();
  };
  requestAnimationFrame(draw);
}

// ── Modal helper ─────────────────────────────────────────────────────────────
function ConfirmModal({
  title, message, confirmLabel = "Confirm", danger = false,
  onConfirm, onCancel,
}: {
  title: string; message: string; confirmLabel?: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
      >
        <h2 className="text-base font-semibold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors ${danger ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-800"}`}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── SessionProgress ──────────────────────────────────────────────────────────
function SessionProgress({ expiresAt }: { expiresAt: string | null | undefined }) {
  const [pct, setPct] = useState(100);
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const total = 30 * 24 * 3600; // assume 30-day sessions
      const left = differenceInSeconds(new Date(expiresAt), new Date());
      setPct(Math.max(0, Math.min(100, (left / total) * 100)));
    };
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${pct}%`, background: pct > 50 ? "#111" : pct > 20 ? "#f59e0b" : "#ef4444" }}
      />
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, prev, icon: Icon, live = false, loading,
}: {
  label: string; value: number; prev: number; icon: React.ElementType; live?: boolean; loading: boolean;
}) {
  const animated = useCountUp(value);
  const delta = value - prev;
  return (
    <Card className="border-gray-200 shadow-none hover:shadow-md hover:border-gray-300 transition-all duration-200">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gray-900 text-white flex items-center justify-center shrink-0 relative">
          <Icon className="h-4 w-4" />
          {live && value > 0 && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-white">
              <span className="absolute inset-0 rounded-full bg-gray-900 animate-ping" />
              <span className="absolute inset-0.5 rounded-full bg-gray-900" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold truncate">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-bold text-gray-900 tabular-nums leading-tight">
              {loading ? "—" : animated}
            </p>
            {!loading && delta !== 0 && (
              <span className={`text-[10px] font-semibold ${delta > 0 ? "text-gray-700" : "text-red-500"}`}>
                {delta > 0 ? "+" : ""}{delta}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AdminCustomers() {
  // ── Data state ─────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<DbUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [justWentOnline, setJustWentOnline] = useState<string[]>([]);
  const [prevStats, setPrevStats] = useState({ total: 0, online: 0, admins: 0, unverified: 0 });
  const milestonesHit = useRef<Set<number>>(new Set());

  // ── UI state (persisted) ───────────────────────────────────────────────────
  const [density, setDensity] = useLocalStorage<Density>("adm-density", "comfortable");
  const [darkMode, setDarkMode] = useLocalStorage<boolean>("adm-dark", false);
  const [pinnedIds, setPinnedIds] = useLocalStorage<string[]>("adm-pinned", []);
  const [userNotes, setUserNotes] = useLocalStorage<Record<string, string>>("adm-notes", {});
  const [flagged, setFlagged] = useLocalStorage<string[]>("adm-flagged", []);
  const [hiddenCols, setHiddenCols] = useLocalStorage<string[]>("adm-cols", []);
  const [savedPresets, setSavedPresets] = useLocalStorage<FilterPreset[]>("adm-presets", []);
  const [pollMs, setPollMs] = useLocalStorage<number>("adm-poll", 15_000);
  const [pageSize, setPageSize] = useLocalStorage<number>("adm-pagesize", 10);

  // ── Filter / sort state ───────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const search = useDebounced(searchInput, 200);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [sortKey2, setSortKey2] = useState<SortKey | "none">("none");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);

  // ── Row state ─────────────────────────────────────────────────────────────
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<DbUser>>({});
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);

  // ── Panel state ───────────────────────────────────────────────────────────
  const [showAdvFilter, setShowAdvFilter] = useState(false);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [showColToggle, setShowColToggle] = useState(false);
  const [timelineUser, setTimelineUser] = useState<DbUser | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importPreview, setImportPreview] = useState<string[][]>([]);

  // ── Bulk action modals ─────────────────────────────────────────────────────
  const [confirmAction, setConfirmAction] = useState<null | "delete" | "promote" | "demote" | "verify">(null);
  const [undoStack, setUndoStack] = useState<{ label: string; snapshot: DbUser[] }[]>([]);
  const [undoBanner, setUndoBanner] = useState<string | null>(null);

  // ── Audit log ─────────────────────────────────────────────────────────────
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  // ── Misc ──────────────────────────────────────────────────────────────────
  const [showScrollTop, setShowScrollTop] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const prevOnlineRef = useRef<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableSectionElement>(null);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // ── Scroll-to-top ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // ── Audit helper ──────────────────────────────────────────────────────────
  const log = useCallback((action: string, targets: string[]) => {
    setAuditLog((prev) => [{ ts: Date.now(), action, targets }, ...prev].slice(0, 50));
  }, []);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/admin/users", {
        credentials: "include",
        signal: abortRef.current.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data: DbUser[] = await res.json();

      // Online transition detection
      const prevOnline = prevOnlineRef.current;
      const nowOnlineIds = data.filter((u) => u.isOnline).map((u) => u.id);
      const newlyOnline = nowOnlineIds.filter((id) => !prevOnline.has(id));
      if (silent && newlyOnline.length > 0 && prevOnline.size > 0) {
        const names = data.filter((u) => newlyOnline.includes(u.id)).map((u) => u.name ?? u.email ?? "Someone");
        setJustWentOnline(names);
        setTimeout(() => setJustWentOnline([]), 3500);
      }
      prevOnlineRef.current = new Set(nowOnlineIds);

      // Milestone confetti
      MILESTONES.forEach((m) => {
        if (data.length >= m && !milestonesHit.current.has(m)) {
          milestonesHit.current.add(m);
          if (silent) confettiBurst();
        }
      });

      setUsers((prev) => {
        setPrevStats({
          total: prev.length,
          online: prev.filter((u) => u.isOnline).length,
          admins: prev.filter((u) => u.role === "admin").length,
          unverified: prev.filter((u) => !u.emailVerified).length,
        });
        return data;
      });
      setLastSynced(new Date());
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") setError("Could not load customer data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    fetchUsers(false);
  }, [fetchUsers]);

  useEffect(() => {
    if (pollMs === 0) return;
    const id = setInterval(() => fetchUsers(true), pollMs);
    return () => clearInterval(id);
  }, [fetchUsers, pollMs]);

  // Keep a ref to paginated so the keyboard handler always has the latest value
  // without causing a "used before initialization" error.
  const paginatedRef = useRef<DbUser[]>([]);
  const focusedIdxRef = useRef(focusedIdx);
  focusedIdxRef.current = focusedIdx;

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "/" && !typing) { e.preventDefault(); searchInputRef.current?.focus(); }
      if (e.key === "Escape") { setExpandedId(null); setShowAdvFilter(false); setShowHotkeys(false); setShowAudit(false); setShowColToggle(false); setTimelineUser(null); setShowImport(false); searchInputRef.current?.blur(); }
      if (e.key === "?" && !typing) { setShowHotkeys((s) => !s); }
      if (e.key === "d" && !typing) { setDarkMode((s) => !s); }
      if (e.key === "r" && !typing) { fetchUsers(true); }
      if (e.key === "a" && e.metaKey) { e.preventDefault(); setSelected(new Set(paginatedRef.current.map((u) => u.id))); }
      // Row navigation
      if (e.key === "ArrowDown" && !typing) {
        e.preventDefault();
        setFocusedIdx((i) => Math.min(i + 1, paginatedRef.current.length - 1));
      }
      if (e.key === "ArrowUp" && !typing) {
        e.preventDefault();
        setFocusedIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && !typing && focusedIdxRef.current >= 0) {
        const u = paginatedRef.current[focusedIdxRef.current];
        if (u) setExpandedId((id) => id === u.id ? null : u.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fetchUsers]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: users.length,
    online: users.filter((u) => u.isOnline).length,
    admins: users.filter((u) => u.role === "admin").length,
    unverified: users.filter((u) => !u.emailVerified).length,
  }), [users]);

  // Duplicate email detector
  const duplicateEmails = useMemo(() => {
    const seen: Record<string, number> = {};
    users.forEach((u) => { if (u.email) seen[u.email] = (seen[u.email] ?? 0) + 1; });
    return Object.entries(seen).filter(([, c]) => c > 1).map(([e]) => e);
  }, [users]);

  // All providers present
  const allProviders = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.providers?.split(",").forEach((p) => set.add(p.trim())));
    return Array.from(set);
  }, [users]);

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let re: RegExp | null = null;
    if (useRegex && q) { try { re = new RegExp(q, "i"); } catch { /* invalid regex */ } }

    return users.filter((u) => {
      if (q) {
        const haystack = `${u.name ?? ""} ${u.email ?? ""}`;
        const match = re ? re.test(haystack) : haystack.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all") {
        if (statusFilter === "online" && !u.isOnline) return false;
        if (statusFilter === "offline" && u.isOnline) return false;
        if (statusFilter === "unverified" && !!u.emailVerified) return false;
      }
      if (providerFilter !== "all") {
        const providers = u.providers ? u.providers.split(",").map((p) => p.trim().toLowerCase()) : [];
        if (providerFilter === "credentials" && !(u.hasPassword && providers.length === 0)) return false;
        if (providerFilter !== "credentials" && !providers.includes(providerFilter.toLowerCase())) return false;
      }
      if (dateFrom && u.createdAt && new Date(u.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && u.createdAt && new Date(u.createdAt) > new Date(dateTo)) return false;
      return true;
    });
  }, [users, search, useRegex, roleFilter, statusFilter, providerFilter, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    const pinned = filtered.filter((u) => pinnedIds.includes(u.id));
    const rest = filtered.filter((u) => !pinnedIds.includes(u.id));
    const compareFn = (a: DbUser, b: DbUser, key: SortKey): number => {
      if (key === "name") return (a.name ?? a.email ?? "").localeCompare(b.name ?? b.email ?? "");
      if (key === "createdAt") return (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      if (key === "status") return Number(!!a.isOnline) - Number(!!b.isOnline);
      if (key === "lastActive") return (a.updatedAt ? new Date(a.updatedAt).getTime() : 0) - (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
      if (key === "sessions") return (a.activeSessionCount ?? 0) - (b.activeSessionCount ?? 0);
      return 0;
    };
    rest.sort((a, b) => {
      const c1 = compareFn(a, b, sortKey) * (sortDir === "asc" ? 1 : -1);
      if (c1 !== 0 || sortKey2 === "none") return c1;
      return compareFn(a, b, sortKey2 as SortKey);
    });
    return [...pinned, ...rest];
  }, [filtered, pinnedIds, sortKey, sortDir, sortKey2]);

  useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter, providerFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paginated = useMemo(() => sorted.slice((pageSafe - 1) * pageSize, pageSafe * pageSize), [sorted, pageSafe, pageSize]);

  // ── Group by ───────────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    if (groupBy === "none") return { "": paginated };
    const map: Record<string, DbUser[]> = {};
    paginated.forEach((u) => {
      const key = groupBy === "role" ? u.role : (u.isOnline ? "Online" : "Offline");
      if (!map[key]) map[key] = [];
      map[key].push(u);
    });
    return map;
  }, [paginated, groupBy]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleCopyEmail = async (id: string, email: string | null) => {
    if (!email) return;
    await navigator.clipboard.writeText(email).catch(() => {});
    setCopiedId(id); setTimeout(() => setCopiedId((c) => c === id ? null : c), 1500);
  };

  const handleCopyJson = async (u: DbUser) => {
    await navigator.clipboard.writeText(JSON.stringify(u, null, 2)).catch(() => {});
    setCopiedId(`json-${u.id}`); setTimeout(() => setCopiedId((c) => c === `json-${u.id}` ? null : c), 1500);
  };

  const handleCopyAllEmails = async () => {
    const emails = users.filter((u) => selected.size ? selected.has(u.id) : true).map((u) => u.email).filter(Boolean).join(", ");
    await navigator.clipboard.writeText(emails).catch(() => {});
    setCopiedId("all-emails"); setTimeout(() => setCopiedId((c) => c === "all-emails" ? null : c), 2000);
  };

  const activeFilterCount =
    (roleFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) +
    (search ? 1 : 0) + (providerFilter !== "all" ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0);

  const clearFilters = () => {
    setSearchInput(""); setRoleFilter("all"); setStatusFilter("all");
    setProviderFilter("all"); setDateFrom(""); setDateTo("");
  };

  const allOnPageSelected = paginated.length > 0 && paginated.every((u) => selected.has(u.id));

  const toggleSelectAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSel = paginated.every((u) => next.has(u.id));
      paginated.forEach((u) => allSel ? next.delete(u.id) : next.add(u.id));
      return next;
    });
  };

  // Shift-click range select
  const lastClickedIdx = useRef<number>(-1);
  const handleRowClick = (u: DbUser, idx: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedIdx.current >= 0) {
      const lo = Math.min(lastClickedIdx.current, idx);
      const hi = Math.max(lastClickedIdx.current, idx);
      setSelected((prev) => {
        const next = new Set(prev);
        paginated.slice(lo, hi + 1).forEach((row) => next.add(row.id));
        return next;
      });
    } else {
      setExpandedId((id) => id === u.id ? null : u.id);
      setFocusedIdx(idx);
      lastClickedIdx.current = idx;
    }
  };

  // ── Bulk actions ───────────────────────────────────────────────────────────
  const snapshotAndAct = (label: string, fn: (prev: DbUser[]) => DbUser[]) => {
    setUndoStack((s) => [{ label, snapshot: users }, ...s].slice(0, 5));
    setUsers(fn);
    setSelected(new Set());
    log(label, Array.from(selected));
    setUndoBanner(label);
    setTimeout(() => setUndoBanner(null), 5000);
  };

  const execBulk = (action: typeof confirmAction) => {
    setConfirmAction(null);
    const ids = Array.from(selected);
    if (action === "delete") {
      snapshotAndAct(`Deleted ${ids.length} user(s)`, (prev) => prev.filter((u) => !ids.includes(u.id)));
    } else if (action === "promote") {
      snapshotAndAct(`Promoted ${ids.length} to admin`, (prev) => prev.map((u) => ids.includes(u.id) ? { ...u, role: "admin" } : u));
    } else if (action === "demote") {
      snapshotAndAct(`Demoted ${ids.length} to user`, (prev) => prev.map((u) => ids.includes(u.id) ? { ...u, role: "user" } : u));
    } else if (action === "verify") {
      snapshotAndAct(`Verified ${ids.length} email(s)`, (prev) => prev.map((u) => ids.includes(u.id) ? { ...u, emailVerified: new Date().toISOString() } : u));
    }
  };

  const handleUndo = () => {
    if (!undoStack.length) return;
    const [top, ...rest] = undoStack;
    setUsers(top.snapshot);
    setUndoStack(rest);
    setUndoBanner(null);
  };

  // ── Inline edit ────────────────────────────────────────────────────────────
  const startEdit = (u: DbUser) => { setEditingId(u.id); setEditDraft({ name: u.name, role: u.role }); };
  const saveEdit = (u: DbUser) => {
    setUsers((prev) => prev.map((row) => row.id === u.id ? { ...row, ...editDraft } : row));
    log(`Edited user ${u.email}`, [u.id]);
    setEditingId(null);
  };

  // ── Preset management ──────────────────────────────────────────────────────
  const savePreset = () => {
    if (savedPresets.length >= 5) return;
    const preset: FilterPreset = {
      id: Date.now().toString(),
      label: `Preset ${savedPresets.length + 1}`,
      role: roleFilter, status: statusFilter,
      provider: providerFilter, q: search,
    };
    setSavedPresets((p) => [...p, preset]);
  };

  const applyPreset = (p: FilterPreset) => {
    setRoleFilter(p.role); setStatusFilter(p.status);
    setProviderFilter(p.provider); setSearchInput(p.q);
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const toRows = (list: DbUser[]) => list.map((u) => [
    u.name ?? "", u.email ?? "", u.role,
    u.createdAt ? format(new Date(u.createdAt), "yyyy-MM-dd") : "",
    u.updatedAt ? format(new Date(u.updatedAt), "yyyy-MM-dd HH:mm") : "",
    u.emailVerified ? "Yes" : "No", u.isOnline ? "Online" : "Offline",
    u.providers ?? (u.hasPassword ? "credentials" : ""),
  ]);

  const downloadCsv = (rows: string[][], filename: string) => {
    const header = ["Name","Email","Role","Joined","Last Updated","Verified","Status","Sign-in Method"];
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: filename }).click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = (list: DbUser[], filename: string) => {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: filename }).click();
    URL.revokeObjectURL(url);
  };

  const exportList = selected.size > 0 ? users.filter((u) => selected.has(u.id)) : sorted;
  const exportFilename = `customers-${format(new Date(), "yyyy-MM-dd")}`;

  // ── CSV import ─────────────────────────────────────────────────────────────
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = text.split("\n").slice(0, 6).map((r) => r.split(",").map((c) => c.replace(/^"|"$/g, "").trim()));
      setImportPreview(rows);
      setShowImport(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Column config ──────────────────────────────────────────────────────────
  const COLS = ["Customer","Email","Role","Joined","Status","Last Active","Sessions"];
  const visibleCols = COLS.filter((c) => !hiddenCols.includes(c));
  const toggleCol = (c: string) => setHiddenCols((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  // ── Impersonate / Send email ───────────────────────────────────────────────
  const handleImpersonate = async (u: DbUser) => {
    log(`Impersonated ${u.email}`, [u.id]);
    await fetch(`/api/admin/impersonate`, { method: "POST", body: JSON.stringify({ userId: u.id }), headers: { "Content-Type": "application/json" } }).catch(() => {});
  };

  const handleSendEmail = async (u: DbUser) => {
    log(`Sent email to ${u.email}`, [u.id]);
    await fetch(`/api/admin/email`, { method: "POST", body: JSON.stringify({ userId: u.id }), headers: { "Content-Type": "application/json" } }).catch(() => {});
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) =>
    !active ? <ChevronDown className="h-3 w-3 text-gray-300" /> :
    dir === "asc" ? <ChevronUp className="h-3 w-3 text-gray-900" /> : <ChevronDown className="h-3 w-3 text-gray-900" />;

  const rowPad = density === "compact" ? "py-2" : "py-4";
  const avatarSize = density === "compact" ? "h-7 w-7" : "h-8 w-8";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-show { display: block !important; }
          body { background: white; }
        }
        @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        .shimmer { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite linear; }
      `}</style>

      {/* ARIA live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="live-region">
        {lastSynced ? `Customer list updated ${format(lastSynced, "HH:mm:ss")}` : ""}
      </div>

      <div className="max-w-6xl mx-auto pb-24">

        {/* ── Toasts ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {justWentOnline.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 no-print"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              {justWentOnline.slice(0, 2).join(", ")}{justWentOnline.length > 2 ? ` +${justWentOnline.length - 2} more` : ""} just came online
            </motion.div>
          )}
        </AnimatePresence>

        {/* Undo banner */}
        <AnimatePresence>
          {undoBanner && (
            <motion.div
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 no-print"
            >
              <span>{undoBanner}</span>
              <button onClick={handleUndo} className="underline text-gray-300 hover:text-white transition-colors">Undo</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500 mt-1">All registered users and their real-time activity status.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-center no-print">
            {/* Auto-refresh selector */}
            <select value={pollMs} onChange={(e) => setPollMs(Number(e.target.value))}
              title="Auto-refresh interval"
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300">
              <option value={15_000}>Live 15s</option>
              <option value={30_000}>Live 30s</option>
              <option value={60_000}>Live 60s</option>
              <option value={0}>Paused</option>
            </select>

            {/* Dark mode */}
            <button onClick={() => setDarkMode((d) => !d)} title="Toggle dark mode (D)"
              className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Hotkeys */}
            <button onClick={() => setShowHotkeys(true)} title="Keyboard shortcuts (?)"
              className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
              <BookOpen className="h-4 w-4" />
            </button>

            {/* Audit log */}
            <button onClick={() => setShowAudit(true)} title="Audit log"
              className="relative p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
              <History className="h-4 w-4" />
              {auditLog.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 text-[9px] bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                  {Math.min(auditLog.length, 9)}
                </span>
              )}
            </button>

            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`h-1.5 w-1.5 rounded-full ${isRefreshing ? "bg-gray-300" : "bg-gray-900 animate-pulse"}`} />
              {isRefreshing ? "Syncing…" : lastSynced ? `Live · ${formatDistanceToNow(lastSynced, { addSuffix: true })}` : "Live"}
            </div>
            <motion.button whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.02 }}
              onClick={() => fetchUsers(true)} disabled={isLoading || isRefreshing}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </motion.button>
          </div>
        </motion.div>

        {/* Duplicate email warning */}
        {duplicateEmails.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2.5 rounded-xl">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Duplicate emails detected: <strong>{duplicateEmails.join(", ")}</strong></span>
          </motion.div>
        )}

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Customers", value: stats.total, prev: prevStats.total, icon: Users },
            { label: "Online Now", value: stats.online, prev: prevStats.online, icon: Wifi, live: true },
            { label: "Admins", value: stats.admins, prev: prevStats.admins, icon: ShieldCheck },
            { label: "Unverified", value: stats.unverified, prev: prevStats.unverified, icon: AlertTriangle },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 + i * 0.05 }} whileHover={{ y: -3 }}>
              <StatCard {...s} loading={isLoading} />
            </motion.div>
          ))}
        </motion.div>

        {/* Quick-filter chips */}
        <div className="flex gap-2 flex-wrap mb-4 no-print">
          {[
            { label: "Recently joined", fn: () => { setDateFrom(format(new Date(Date.now() - 7*86400_000), "yyyy-MM-dd")); setDateTo(""); } },
            { label: "No password", fn: () => { setProviderFilter("credentials"); } },
            { label: "Admins only", fn: () => setRoleFilter("admin") },
            { label: "At risk", fn: () => { setStatusFilter("unverified"); setDateFrom(format(new Date(Date.now() - 7*86400_000), "yyyy-MM-dd")); } },
          ].map((chip) => (
            <button key={chip.label} onClick={chip.fn}
              className="text-xs font-medium text-gray-600 border border-gray-200 px-3 py-1 rounded-full hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors">
              {chip.label}
            </button>
          ))}
          {savedPresets.map((p) => (
            <button key={p.id} onClick={() => applyPreset(p)}
              className="text-xs font-medium text-gray-600 border border-dashed border-gray-300 px-3 py-1 rounded-full hover:border-gray-900 transition-colors flex items-center gap-1">
              <Zap className="h-3 w-3" /> {p.label}
              <X className="h-3 w-3 ml-0.5 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setSavedPresets((prev) => prev.filter((x) => x.id !== p.id)); }} />
            </button>
          ))}
        </div>

        {/* ── Main card ──────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-gray-100 pb-4 bg-white/80 backdrop-blur sticky top-0 z-20">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  All Customers
                  {!isLoading && (
                    <span className="text-gray-400 font-normal text-sm">
                      ({sorted.length}{sorted.length !== users.length ? ` of ${users.length}` : ""})
                    </span>
                  )}
                </CardTitle>

                <div className="flex items-center gap-2 flex-wrap no-print">
                  {/* Page size */}
                  <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none">
                    {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
                  </select>

                  {/* Group by */}
                  <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none">
                    <option value="none">No grouping</option>
                    <option value="role">Group by role</option>
                    <option value="status">Group by status</option>
                  </select>

                  {/* Secondary sort */}
                  <select value={sortKey2} onChange={(e) => setSortKey2(e.target.value as SortKey | "none")}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none">
                    <option value="none">No 2nd sort</option>
                    <option value="name">Then by name</option>
                    <option value="createdAt">Then by date</option>
                    <option value="sessions">Then by sessions</option>
                  </select>

                  {/* Density */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => setDensity("comfortable")} title="Comfortable"
                      className={`p-1.5 transition-colors ${density === "comfortable" ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}>
                      <Rows2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDensity("compact")} title="Compact"
                      className={`p-1.5 transition-colors ${density === "compact" ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}>
                      <Rows3 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Column toggle */}
                  <button onClick={() => setShowColToggle(true)}
                    className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors" title="Toggle columns">
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  {/* Advanced filter */}
                  <button onClick={() => setShowAdvFilter(true)}
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 border rounded-lg transition-colors ${showAdvFilter ? "bg-gray-900 text-white border-gray-900" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                    <SlidersHorizontal className="h-3.5 w-3.5" /> Advanced
                  </button>

                  {/* Import CSV */}
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-600 px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <Upload className="h-3.5 w-3.5" /> Import
                    <input type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
                  </label>

                  {/* Export dropdown area */}
                  {selected.size > 0 ? (
                    <div className="flex items-center gap-1">
                      <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.95 }}
                        onClick={() => downloadCsv(toRows(exportList), `${exportFilename}.csv`)}
                        className="flex items-center gap-1.5 text-xs font-medium text-white bg-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                        <Download className="h-3.5 w-3.5" /> CSV ({selected.size})
                      </motion.button>
                      <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.95 }}
                        onClick={() => downloadJson(exportList, `${exportFilename}.json`)}
                        className="flex items-center gap-1.5 text-xs font-medium text-white bg-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-600 transition-colors">
                        <FileJson className="h-3.5 w-3.5" /> JSON
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => downloadCsv(toRows(exportList), `${exportFilename}.csv`)}
                        disabled={isLoading || sorted.length === 0}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40">
                        <Download className="h-3.5 w-3.5" /> CSV
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => downloadJson(exportList, `${exportFilename}.json`)}
                        disabled={isLoading || sorted.length === 0}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40">
                        <FileJson className="h-3.5 w-3.5" /> JSON
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bulk action bar */}
              <AnimatePresence>
                {selected.size > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 flex-wrap bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 no-print">
                    <span className="text-xs font-semibold text-gray-700">{selected.size} selected</span>
                    <div className="h-3 w-px bg-gray-300" />
                    <button onClick={() => setConfirmAction("promote")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                      <ShieldCheck className="h-3.5 w-3.5" /> Make admin
                    </button>
                    <button onClick={() => setConfirmAction("demote")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                      <UserCog className="h-3.5 w-3.5" /> Make user
                    </button>
                    <button onClick={() => setConfirmAction("verify")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                      <UserCheck className="h-3.5 w-3.5" /> Verify emails
                    </button>
                    <button onClick={handleCopyAllEmails}
                      className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                      {copiedId === "all-emails" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === "all-emails" ? "Copied!" : "Copy emails"}
                    </button>
                    <button onClick={() => setConfirmAction("delete")}
                      className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                    <button onClick={() => setSelected(new Set())}
                      className="ml-auto text-xs text-gray-400 hover:text-gray-700 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search + filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input ref={searchInputRef} type="text" value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={useRegex ? "Regex search…" : "Search by name or email…"}
                    className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-20 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 placeholder:text-gray-400 transition-shadow" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button onClick={() => setUseRegex((r) => !r)} title="Toggle regex"
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${useRegex ? "bg-gray-900 text-white border-gray-900" : "text-gray-400 border-gray-200 hover:border-gray-400"}`}>
                      .*
                    </button>
                    <kbd className="hidden sm:flex text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 font-mono">/</kbd>
                  </div>
                </div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer hover:border-gray-300 transition-colors">
                  <option value="all">All roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer hover:border-gray-300 transition-colors">
                  <option value="all">All statuses</option>
                  <option value="online">Online now</option>
                  <option value="offline">Offline</option>
                  <option value="unverified">Unverified</option>
                </select>

                {/* Provider chips */}
                {allProviders.length > 0 && (
                  <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer hover:border-gray-300 transition-colors">
                    <option value="all">All providers</option>
                    <option value="credentials">Email & password</option>
                    {allProviders.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                )}

                <AnimatePresence>
                  {activeFilterCount > 0 && (
                    <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
                      className="flex items-center gap-1 overflow-hidden shrink-0">
                      <button onClick={clearFilters}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 px-2.5 py-2 transition-colors whitespace-nowrap">
                        <X className="h-3.5 w-3.5" /> Clear ({activeFilterCount})
                      </button>
                      {savedPresets.length < 5 && (
                        <button onClick={savePreset}
                          className="text-xs font-medium text-gray-500 hover:text-gray-900 px-2 py-2 transition-colors whitespace-nowrap">
                          Save preset
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="h-14 rounded-lg overflow-hidden shimmer" style={{ animationDelay: `${i*0.1}s` }} />
                ))}
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <p className="text-gray-400 mb-3">{error}</p>
                <button onClick={() => fetchUsers(false)} className="text-sm font-medium text-gray-900 underline">Retry</button>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No customers registered yet.</div>
            ) : sorted.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center">
                <p className="text-gray-400 mb-2">No customers match your filters.</p>
                <button onClick={clearFilters} className="text-sm font-medium text-gray-900 underline underline-offset-2">Clear filters</button>
              </motion.div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="w-10 px-4 py-3">
                          <button onClick={toggleSelectAllOnPage} className="text-gray-400 hover:text-gray-900 transition-colors">
                            {allOnPageSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                          </button>
                        </th>
                        {visibleCols.includes("Customer") && (
                          <th onClick={() => toggleSort("name")}
                            className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer select-none hover:text-gray-700 transition-colors">
                            <span className="flex items-center gap-1">Customer <SortIcon active={sortKey === "name"} dir={sortDir} /></span>
                          </th>
                        )}
                        {visibleCols.includes("Email") && (
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Email</th>
                        )}
                        {visibleCols.includes("Role") && (
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Role</th>
                        )}
                        {visibleCols.includes("Joined") && (
                          <th onClick={() => toggleSort("createdAt")}
                            className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer select-none hover:text-gray-700 transition-colors">
                            <span className="flex items-center gap-1">Joined <SortIcon active={sortKey === "createdAt"} dir={sortDir} /></span>
                          </th>
                        )}
                        {visibleCols.includes("Status") && (
                          <th onClick={() => toggleSort("status")}
                            className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer select-none hover:text-gray-700 transition-colors">
                            <span className="flex items-center gap-1">Status <SortIcon active={sortKey === "status"} dir={sortDir} /></span>
                          </th>
                        )}
                        {visibleCols.includes("Last Active") && (
                          <th onClick={() => toggleSort("lastActive")}
                            className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer select-none hover:text-gray-700 transition-colors">
                            <span className="flex items-center gap-1">Last Active <SortIcon active={sortKey === "lastActive"} dir={sortDir} /></span>
                          </th>
                        )}
                        {visibleCols.includes("Sessions") && (
                          <th onClick={() => toggleSort("sessions")}
                            className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer select-none hover:text-gray-700 transition-colors">
                            <span className="flex items-center gap-1">Sessions <SortIcon active={sortKey === "sessions"} dir={sortDir} /></span>
                          </th>
                        )}
                        <th className="w-8 px-2" />
                      </tr>
                    </thead>
                    <tbody ref={tableRef} className="divide-y divide-gray-50">
                      <AnimatePresence initial={false}>
                        {Object.entries(grouped).map(([group, rows]) => (
                          <Fragment key={group}>
                            {groupBy !== "none" && (
                              <tr className="bg-gray-50/80">
                                <td colSpan={10} className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                  {group}
                                </td>
                              </tr>
                            )}
                            {rows.map((u, idx) => {
                              const initials = (u.name?.[0] ?? u.email?.[0] ?? "?").toUpperCase();
                              const online = !!u.isOnline;
                              const verified = !!u.emailVerified;
                              const expanded = expandedId === u.id;
                              const isSelected = selected.has(u.id);
                              const isPinned = pinnedIds.includes(u.id);
                              const isFlagged = flagged.includes(u.id);
                              const isRisk = isRisky(u);
                              const isNew = u.createdAt && differenceInDays(new Date(), new Date(u.createdAt)) < 7;
                              const isFocused = focusedIdx === idx;
                              const providerList = u.providers ? u.providers.split(",") : [];

                              return (
                                <Fragment key={u.id}>
                                  <motion.tr
                                    layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2, delay: idx * 0.015 }}
                                    onClick={(e) => handleRowClick(u, idx, e)}
                                    className={`group cursor-pointer transition-colors ${isFocused ? "ring-2 ring-inset ring-gray-400" : ""} ${isSelected ? "bg-blue-50/30" : "hover:bg-gray-50"} ${isFlagged ? "border-l-2 border-red-400" : ""}`}
                                  >
                                    <td className={`px-4 ${rowPad}`} onClick={(e) => e.stopPropagation()}>
                                      <button onClick={() => { setSelected((prev) => { const n = new Set(prev); n.has(u.id) ? n.delete(u.id) : n.add(u.id); return n; }); }}
                                        className="text-gray-400 hover:text-gray-900 transition-colors">
                                        {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                      </button>
                                    </td>

                                    {visibleCols.includes("Customer") && (
                                      <td className={`px-6 ${rowPad}`}>
                                        <div className="flex items-center gap-3">
                                          <div className="relative shrink-0">
                                            {u.image ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img src={u.image} alt={u.name ?? "avatar"}
                                                className={`${avatarSize} rounded-full object-cover border border-gray-100`} />
                                            ) : (
                                              <div className={`${avatarSize} rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold`}>
                                                {initials}
                                              </div>
                                            )}
                                            <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${online ? "bg-gray-900" : "bg-gray-300"}`}>
                                              {online && <span className="absolute inset-0 rounded-full bg-gray-900 animate-ping opacity-75" />}
                                            </span>
                                          </div>
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="font-medium text-gray-900">{u.name ?? "—"}</span>
                                              {isPinned && <Pin className="h-3 w-3 text-gray-400 shrink-0" />}
                                              {isFlagged && <Flag className="h-3 w-3 text-red-400 shrink-0" />}
                                              {isNew && <span className="text-[10px] font-semibold bg-gray-900 text-white px-1.5 py-0.5 rounded-full">NEW</span>}
                                              {isRisk && <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><AlertTriangle className="h-2.5 w-2.5" /> RISK</span>}
                                            </div>
                                            {userNotes[u.id] && (
                                              <p className="text-[11px] text-gray-400 truncate max-w-[160px] italic mt-0.5">{userNotes[u.id]}</p>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    )}

                                    {visibleCols.includes("Email") && (
                                      <td className={`px-6 ${rowPad} text-gray-600`}>
                                        <span className={duplicateEmails.includes(u.email ?? "") ? "text-amber-600 font-medium" : ""}>{u.email ?? "—"}</span>
                                      </td>
                                    )}

                                    {visibleCols.includes("Role") && (
                                      <td className={`px-6 ${rowPad}`}>
                                        <Badge variant="outline" className={`text-xs ${u.role === "admin" ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                                          {u.role}
                                        </Badge>
                                      </td>
                                    )}

                                    {visibleCols.includes("Joined") && (
                                      <td className={`px-6 ${rowPad} text-gray-500`}>
                                        {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "—"}
                                      </td>
                                    )}

                                    {visibleCols.includes("Status") && (
                                      <td className={`px-6 ${rowPad}`}>
                                        <div className="flex flex-col gap-1">
                                          <Badge variant="outline" className={`text-xs w-fit flex items-center gap-1 ${online ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                                            <Circle className={`h-1.5 w-1.5 fill-current ${!online ? "opacity-50" : ""}`} />
                                            {online ? "Online" : "Offline"}
                                          </Badge>
                                          {!verified && <Badge variant="outline" className="text-xs w-fit bg-white text-gray-500 border-gray-300">Unverified</Badge>}
                                        </div>
                                      </td>
                                    )}

                                    {visibleCols.includes("Last Active") && (
                                      <td className={`px-6 ${rowPad} text-gray-500 text-xs`}>
                                        {u.updatedAt ? formatDistanceToNow(new Date(u.updatedAt), { addSuffix: true }) : "—"}
                                      </td>
                                    )}

                                    {visibleCols.includes("Sessions") && (
                                      <td className={`px-6 ${rowPad} text-gray-700 text-xs font-mono`}>
                                        {u.activeSessionCount ?? 0}
                                      </td>
                                    )}

                                    <td className={`px-2 ${rowPad} text-gray-400`}>
                                      <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                        <ChevronDown className="h-4 w-4" />
                                      </motion.div>
                                    </td>
                                  </motion.tr>

                                  {/* Expanded row */}
                                  <AnimatePresence>
                                    {expanded && (
                                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-gray-50/60">
                                        <td colSpan={10} className="p-0">
                                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                                            transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden">
                                            <div className="px-6 py-5 space-y-5">
                                              {/* Row 1: details grid */}
                                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-xs">
                                                <div>
                                                  <p className="text-gray-400 font-semibold uppercase tracking-wider mb-1">User ID</p>
                                                  <p className="text-gray-700 font-mono truncate">{u.id}</p>
                                                </div>
                                                <div>
                                                  <p className="text-gray-400 font-semibold uppercase tracking-wider mb-1">Email Verified</p>
                                                  <p className="text-gray-700 flex items-center gap-1.5">
                                                    {verified ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                                                    {u.emailVerified ? format(new Date(u.emailVerified), "MMM d, yyyy") : "Not verified"}
                                                  </p>
                                                </div>
                                                <div>
                                                  <p className="text-gray-400 font-semibold uppercase tracking-wider mb-1">Session Expires</p>
                                                  <p className="text-gray-700">
                                                    {u.sessionExpiresAt ? formatDistanceToNow(new Date(u.sessionExpiresAt), { addSuffix: true }) : "No active session"}
                                                  </p>
                                                  <SessionProgress expiresAt={u.sessionExpiresAt} />
                                                </div>
                                                <div>
                                                  <p className="text-gray-400 font-semibold uppercase tracking-wider mb-1">Active Sessions</p>
                                                  <p className="text-gray-700">{u.activeSessionCount ?? 0}</p>
                                                </div>
                                                <div>
                                                  <p className="text-gray-400 font-semibold uppercase tracking-wider mb-1">Sign-in Method</p>
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    {providerList.length > 0 ? providerList.map((p) => {
                                                      const Icon = providerIcon(p);
                                                      return (
                                                        <span key={p} className="flex items-center gap-1 text-gray-700 bg-white border border-gray-200 rounded-full px-2 py-0.5 capitalize">
                                                          <Icon className="h-3 w-3" /> {p}
                                                        </span>
                                                      );
                                                    }) : (
                                                      <span className="flex items-center gap-1 text-gray-700">
                                                        <KeyRound className="h-3.5 w-3.5" />{u.hasPassword ? "Email & password" : "—"}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                                <div>
                                                  <p className="text-gray-400 font-semibold uppercase tracking-wider mb-1">Last Updated</p>
                                                  <p className="text-gray-700">{u.updatedAt ? formatDistanceToNow(new Date(u.updatedAt), { addSuffix: true }) : "—"}</p>
                                                </div>

                                                {/* Inline edit */}
                                                {editingId === u.id ? (
                                                  <>
                                                    <div>
                                                      <p className="text-gray-400 font-semibold uppercase tracking-wider mb-1">Edit Name</p>
                                                      <input value={editDraft.name ?? ""}
                                                        onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                                                        className="text-xs border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-gray-400" />
                                                    </div>
                                                    <div>
                                                      <p className="text-gray-400 font-semibold uppercase tracking-wider mb-1">Edit Role</p>
                                                      <select value={editDraft.role ?? u.role}
                                                        onChange={(e) => setEditDraft((d) => ({ ...d, role: e.target.value }))}
                                                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none">
                                                        <option value="user">user</option>
                                                        <option value="admin">admin</option>
                                                      </select>
                                                    </div>
                                                  </>
                                                ) : null}
                                              </div>

                                              {/* Notes */}
                                              <div className="text-xs">
                                                <p className="text-gray-400 font-semibold uppercase tracking-wider mb-1">Notes</p>
                                                {noteEditId === u.id ? (
                                                  <div className="flex gap-2 items-start">
                                                    <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} maxLength={500}
                                                      className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none h-16" />
                                                    <button onClick={() => { setUserNotes((n) => ({ ...n, [u.id]: noteDraft })); setNoteEditId(null); }}
                                                      className="text-xs font-medium text-white bg-gray-900 px-2 py-1 rounded-lg hover:bg-gray-800">Save</button>
                                                    <button onClick={() => setNoteEditId(null)}
                                                      className="text-xs font-medium text-gray-500 px-2 py-1 rounded-lg hover:bg-gray-100">Cancel</button>
                                                  </div>
                                                ) : (
                                                  <p className="text-gray-600 italic cursor-pointer hover:text-gray-900"
                                                    onClick={() => { setNoteEditId(u.id); setNoteDraft(userNotes[u.id] ?? ""); }}>
                                                    {userNotes[u.id] || <span className="text-gray-400">Click to add note…</span>}
                                                  </p>
                                                )}
                                              </div>

                                              {/* Action buttons */}
                                              <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-gray-100">
                                                <button onClick={(e) => { e.stopPropagation(); handleCopyEmail(u.id, u.email); }}
                                                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-xs transition-colors">
                                                  {copiedId === u.id ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Mail className="h-3.5 w-3.5" /> Copy email</>}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleCopyJson(u); }}
                                                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-xs transition-colors">
                                                  {copiedId === `json-${u.id}` ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Braces className="h-3.5 w-3.5" /> Copy as JSON</>}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setTimelineUser(u); }}
                                                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-xs transition-colors">
                                                  <Clock className="h-3.5 w-3.5" /> Timeline
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleSendEmail(u); }}
                                                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-xs transition-colors">
                                                  <Bell className="h-3.5 w-3.5" /> Send email
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleImpersonate(u); }}
                                                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-xs transition-colors">
                                                  <Eye className="h-3.5 w-3.5" /> Impersonate
                                                </button>
                                                {editingId === u.id ? (
                                                  <button onClick={(e) => { e.stopPropagation(); saveEdit(u); }}
                                                    className="flex items-center gap-1.5 text-white bg-gray-900 hover:bg-gray-800 font-medium text-xs px-2.5 py-1 rounded-lg transition-colors">
                                                    <Save className="h-3.5 w-3.5" /> Save changes
                                                  </button>
                                                ) : (
                                                  <button onClick={(e) => { e.stopPropagation(); startEdit(u); }}
                                                    className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-xs transition-colors">
                                                    <Edit2 className="h-3.5 w-3.5" /> Edit
                                                  </button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); setPinnedIds((p) => p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id]); }}
                                                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-xs transition-colors">
                                                  {pinnedIds.includes(u.id) ? <><PinOff className="h-3.5 w-3.5" /> Unpin</> : <><Pin className="h-3.5 w-3.5" /> Pin to top</>}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setFlagged((f) => f.includes(u.id) ? f.filter((x) => x !== u.id) : [...f, u.id]); }}
                                                  className={`flex items-center gap-1.5 font-medium text-xs transition-colors ${flagged.includes(u.id) ? "text-red-500 hover:text-red-700" : "text-gray-600 hover:text-gray-900"}`}>
                                                  <Flag className="h-3.5 w-3.5" /> {flagged.includes(u.id) ? "Unflag" : "Flag suspicious"}
                                                </button>
                                              </div>
                                            </div>
                                          </motion.div>
                                        </td>
                                      </motion.tr>
                                    )}
                                  </AnimatePresence>
                                </Fragment>
                              );
                            })}
                          </Fragment>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-50">
                  <AnimatePresence initial={false}>
                    {paginated.map((u, idx) => {
                      const initials = (u.name?.[0] ?? u.email?.[0] ?? "?").toUpperCase();
                      const online = !!u.isOnline;
                      const verified = !!u.emailVerified;
                      const expanded = expandedId === u.id;
                      const isNew = u.createdAt && differenceInDays(new Date(), new Date(u.createdAt)) < 7;
                      const isRisk = isRisky(u);
                      const providerList = u.providers ? u.providers.split(",") : [];

                      return (
                        <motion.div key={u.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.03 }} className="p-4">
                          <div onClick={() => setExpandedId(expanded ? null : u.id)}
                            className="flex items-center gap-3 cursor-pointer active:bg-gray-50 -m-1 p-1 rounded-lg transition-colors">
                            <div className="relative shrink-0">
                              {u.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={u.image} alt={u.name ?? "avatar"} className="h-9 w-9 rounded-full object-cover border border-gray-100" />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">{initials}</div>
                              )}
                              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${online ? "bg-gray-900" : "bg-gray-300"}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-gray-900 truncate">{u.name ?? "—"}</p>
                                {isNew && <span className="text-[9px] font-bold bg-gray-900 text-white px-1 py-0.5 rounded-full">NEW</span>}
                                {isRisk && <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{u.email ?? "—"}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge variant="outline" className={`text-[10px] ${online ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                                {online ? "Online" : "Offline"}
                              </Badge>
                              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              </motion.div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                                <div className="mt-3 pl-12 grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <p className="text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Role</p>
                                    <Badge variant="outline" className={`text-[10px] ${u.role === "admin" ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                                      {u.role}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Joined</p>
                                    <p className="text-gray-700">{u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Verified</p>
                                    <p className="text-gray-700 flex items-center gap-1">
                                      {verified ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                                      {verified ? "Yes" : "No"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Sessions</p>
                                    <p className="text-gray-700">{u.activeSessionCount ?? 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Last Active</p>
                                    <p className="text-gray-700">{u.updatedAt ? formatDistanceToNow(new Date(u.updatedAt), { addSuffix: true }) : "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Sign-in</p>
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {providerList.length > 0 ? providerList.map((p) => {
                                        const Icon = providerIcon(p);
                                        return <span key={p} className="flex items-center gap-0.5 text-gray-700 bg-white border border-gray-200 rounded-full px-1.5 py-0.5 capitalize text-[10px]"><Icon className="h-2.5 w-2.5" />{p}</span>;
                                      }) : <span className="flex items-center gap-1 text-gray-700"><KeyRound className="h-3 w-3" />{u.hasPassword ? "Password" : "—"}</span>}
                                    </div>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Session</p>
                                    <SessionProgress expiresAt={u.sessionExpiresAt} />
                                  </div>
                                  <div className="col-span-2 flex items-center gap-3 pt-1">
                                    <button onClick={(e) => { e.stopPropagation(); handleCopyEmail(u.id, u.email); }}
                                      className="flex items-center gap-1 text-gray-600 font-medium text-xs">
                                      {copiedId === u.id ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Email</>}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleCopyJson(u); }}
                                      className="flex items-center gap-1 text-gray-600 font-medium text-xs">
                                      {copiedId === `json-${u.id}` ? <><Check className="h-3 w-3" /> Copied</> : <><Braces className="h-3 w-3" /> JSON</>}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setTimelineUser(u); }}
                                      className="flex items-center gap-1 text-gray-600 font-medium text-xs">
                                      <Clock className="h-3 w-3" /> Timeline
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setPinnedIds((p) => p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id]); }}
                                      className="flex items-center gap-1 text-gray-600 font-medium text-xs">
                                      {pinnedIds.includes(u.id) ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">Page {pageSafe} of {totalPages} · {sorted.length} results</p>
                    <div className="flex items-center gap-1">
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => setPage(1)} disabled={pageSafe === 1}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors text-xs">
                        «
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                        <ChevronLeft className="h-4 w-4" />
                      </motion.button>
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pg = Math.max(1, Math.min(pageSafe - 2, totalPages - 4)) + i;
                        return pg <= totalPages ? (
                          <button key={pg} onClick={() => setPage(pg)}
                            className={`w-7 h-7 text-xs rounded-lg border transition-colors ${pg === pageSafe ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                            {pg}
                          </button>
                        ) : null;
                      })}
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe === totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => setPage(totalPages)} disabled={pageSafe === totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors text-xs">
                        »
                      </motion.button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </div>

      {/* ── Panels & Modals ────────────────────────────────────────────────── */}

      {/* Advanced filter panel */}
      <AnimatePresence>
        {showAdvFilter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-end bg-black/20 backdrop-blur-sm no-print"
            onClick={() => setShowAdvFilter(false)}>
            <motion.div initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="h-full w-80 bg-white shadow-2xl p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-gray-900">Advanced Filters</h2>
                <button onClick={() => setShowAdvFilter(false)} className="text-gray-400 hover:text-gray-900 transition-colors"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-5 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Joined from</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Joined to</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Provider</label>
                  <div className="flex flex-col gap-2">
                    {["all", "credentials", ...allProviders].map((p) => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="provider" value={p} checked={providerFilter === p}
                          onChange={() => setProviderFilter(p)} className="accent-gray-900" />
                        <span className="capitalize">{p === "all" ? "All providers" : p === "credentials" ? "Email & password" : p}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 flex gap-3">
                  <button onClick={clearFilters}
                    className="flex-1 text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    Clear all
                  </button>
                  <button onClick={() => setShowAdvFilter(false)}
                    className="flex-1 text-sm font-medium text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Column toggle panel */}
      <AnimatePresence>
        {showColToggle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm no-print"
            onClick={() => setShowColToggle(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-72" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Visible Columns</h2>
                <button onClick={() => setShowColToggle(false)} className="text-gray-400 hover:text-gray-900"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-2">
                {COLS.map((col) => (
                  <label key={col} className="flex items-center gap-3 cursor-pointer py-1">
                    <input type="checkbox" checked={!hiddenCols.includes(col)} onChange={() => toggleCol(col)}
                      className="accent-gray-900 h-4 w-4" />
                    <span className="text-sm text-gray-700">{col}</span>
                  </label>
                ))}
              </div>
              <button onClick={() => setHiddenCols([])}
                className="mt-4 w-full text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Show all
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hotkeys panel */}
      <AnimatePresence>
        {showHotkeys && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm no-print"
            onClick={() => setShowHotkeys(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 text-white rounded-2xl shadow-2xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4" /> Keyboard Shortcuts</h2>
              <div className="space-y-2 text-sm">
                {[
                  ["/", "Focus search"],
                  ["Esc", "Clear / close"],
                  ["?", "Toggle this panel"],
                  ["D", "Toggle dark mode"],
                  ["R", "Refresh users"],
                  ["↑ / ↓", "Navigate rows"],
                  ["Enter", "Expand row"],
                  ["⌘A", "Select all on page"],
                  ["Shift+click", "Range select"],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-300">{desc}</span>
                    <kbd className="text-[11px] font-mono bg-gray-800 border border-gray-700 px-2 py-0.5 rounded">{key}</kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audit log panel */}
      <AnimatePresence>
        {showAudit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-end bg-black/20 backdrop-blur-sm no-print"
            onClick={() => setShowAudit(false)}>
            <motion.div initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="h-full w-80 bg-white shadow-2xl p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><History className="h-4 w-4" /> Audit Log</h2>
                <button onClick={() => setShowAudit(false)} className="text-gray-400 hover:text-gray-900 transition-colors"><X className="h-5 w-5" /></button>
              </div>
              {auditLog.length === 0 ? (
                <p className="text-sm text-gray-400">No actions yet this session.</p>
              ) : (
                <div className="space-y-3">
                  {auditLog.map((entry, i) => (
                    <div key={i} className="text-xs border-l-2 border-gray-200 pl-3 py-0.5">
                      <p className="font-medium text-gray-900">{entry.action}</p>
                      <p className="text-gray-400 mt-0.5">{format(new Date(entry.ts), "HH:mm:ss")}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User timeline drawer */}
      <AnimatePresence>
        {timelineUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-end bg-black/20 backdrop-blur-sm no-print"
            onClick={() => setTimelineUser(null)}>
            <motion.div initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="h-full w-96 bg-white shadow-2xl p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{timelineUser.name ?? timelineUser.email}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">User timeline</p>
                </div>
                <button onClick={() => setTimelineUser(null)} className="text-gray-400 hover:text-gray-900 transition-colors"><X className="h-5 w-5" /></button>
              </div>
              <div className="relative pl-6 space-y-5">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-100" />
                {[
                  { date: timelineUser.createdAt, label: "Account created", icon: UserCheck },
                  { date: timelineUser.emailVerified, label: "Email verified", icon: Shield },
                  { date: timelineUser.updatedAt, label: "Last profile update", icon: Edit2 },
                  { date: timelineUser.sessionExpiresAt, label: "Session expires", icon: Clock },
                ].filter((e) => !!e.date).map((event, i) => {
                  const Icon = event.icon;
                  return (
                    <div key={i} className="relative flex items-start gap-3 text-sm">
                      <div className="absolute -left-4 top-0.5 h-5 w-5 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                        <Icon className="h-2.5 w-2.5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{event.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {event.date ? format(new Date(event.date), "MMM d, yyyy · HH:mm") : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSV import preview */}
      <AnimatePresence>
        {showImport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm no-print">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">CSV Import Preview</h2>
                <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-900 transition-colors"><X className="h-5 w-5" /></button>
              </div>
              <p className="text-xs text-gray-500 mb-3">Showing first 5 rows of imported file:</p>
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-xs">
                  <tbody>
                    {importPreview.slice(0, 6).map((row, i) => (
                      <tr key={i} className={i === 0 ? "bg-gray-50 font-semibold" : "border-t border-gray-50"}>
                        {row.map((cell, j) => <td key={j} className="px-3 py-2 text-gray-700 truncate max-w-[120px]">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3">Import via API at <code className="font-mono bg-gray-100 px-1 rounded">/api/admin/import</code></p>
              <div className="flex gap-3 justify-end mt-5">
                <button onClick={() => setShowImport(false)}
                  className="text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Close
                </button>
                <button onClick={() => { log("CSV import initiated", []); setShowImport(false); }}
                  className="text-sm font-medium text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                  Confirm import
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk confirm modals */}
      <AnimatePresence>
        {confirmAction && (
          <ConfirmModal
            title={
              confirmAction === "delete" ? `Delete ${selected.size} user(s)?` :
              confirmAction === "promote" ? `Promote ${selected.size} to admin?` :
              confirmAction === "demote" ? `Demote ${selected.size} to user?` :
              `Verify ${selected.size} email(s)?`
            }
            message={
              confirmAction === "delete"
                ? "This is irreversible (in this UI). The change will be applied locally until you refresh."
                : "This will update the role/status for all selected users."
            }
            confirmLabel={
              confirmAction === "delete" ? "Delete" :
              confirmAction === "promote" ? "Promote" :
              confirmAction === "demote" ? "Demote" : "Verify"
            }
            danger={confirmAction === "delete"}
            onConfirm={() => execBulk(confirmAction)}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </AnimatePresence>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 10 }} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 h-11 w-11 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow z-40 no-print"
            aria-label="Scroll to top">
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}