import { Skeleton } from "@/components/Skeleton";
import { lazy, Suspense } from "react";
const AnalyticsPanel = lazy(() =>
  import("./AnalyticsPanel").then((module) => ({
    default: module.AnalyticsPanel,
  })),
);
import { OperationComposer } from "./OperationComposer";
import { ExportReports } from "./ExportReports";
import { AdminAccountsPanel } from "./AdminAccountsPanel";
import { navigationGroups, modules } from "./adminNavigation";
import { identityChanged } from "@/lib/queryPolicy";
import { Bell, Settings, UserRound, ChevronRight } from "lucide-react";
import { ConfigPanel } from "./ConfigPanel";
import { environment } from "@/lib/environment";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Shield,
  Layers,
  ScrollText,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { adminRequest, type Row } from "@/lib/adminClient";
import "./console.css";
const blankPlan = () => ({
  id: `plan_${crypto.randomUUID()}`,
  name: "",
  tagline: "",
  audience: "rider",
  billing_interval: "monthly",
  price_inr: 0,
  price_usd: 0,
  is_active: false,
  is_popular: false,
  sort_order: 0,
  features: [] as string[],
});
export function AdminConsole() {
  const [authenticated, setAuthenticated] = useState(false),
    [checking, setChecking] = useState(true);
  const [module, setModule] = useState("dashboard"),
    [collapsed, setCollapsed] = useState(false),
    [page, setPage] = useState(1),
    [search, setSearch] = useState("");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [rider, setRider] = useState<Row | null>(null);
  const [club, setClub] = useState<Row | null>(null),
    [plan, setPlan] = useState<ReturnType<typeof blankPlan> | null>(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("motosync-admin-theme") || "system",
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.adminTheme =
        theme === "system" ? (media.matches ? "night" : "day") : theme;
    };
    apply();
    localStorage.setItem("motosync-admin-theme", theme);
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  const [account, setAccount] = useState<{ email?: string; name?: string }>({});
  const identity = useRef<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [country, setCountry] = useState(""),
    [city, setCity] = useState("");
  const [countryInput, setCountryInput] = useState(""),
    [cityInput, setCityInput] = useState("");
  const [popover, setPopover] = useState<"notifications" | "profile" | null>(
    null,
  );
  useEffect(() => {
    if (!popover) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPopover(null);
    };
    const outside = (event: PointerEvent) => {
      if (!(event.target as Element)?.closest(".console-topbar"))
        setPopover(null);
    };
    document.addEventListener("keydown", keydown);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("pointerdown", outside);
    };
  }, [popover]);
  const cache = useQueryClient();
  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      identity.current = data.session?.user.id ?? null;
      setAccount({
        email: data.session?.user.email,
        name: data.session?.user.user_metadata?.full_name,
      });
      setAuthenticated(!!data.session);
      setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user.id ?? null;
      if (identityChanged(identity.current, next)) {
        identity.current = next;
        cache.clear();
      }
      setAccount({
        email: session?.user.email,
        name: session?.user.user_metadata?.full_name,
      });
      setAuthenticated(!!session);
    });
    return () => data.subscription.unsubscribe();
  }, [cache]);
  useEffect(() => {
    if (!club && !plan && !rider) return;
    const previous = document.activeElement as HTMLElement;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setClub(null);
        setPlan(null);
        setRider(null);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".console-dialog button:not(:disabled),.console-dialog input,.console-dialog select,.console-dialog textarea",
        ),
      );
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [!!club, !!plan, !!rider]);
  const endpoint =
    module === "exports"
      ? "/health"
      : module === "admin_accounts"
        ? "/admin/accounts"
        : module === "admin_roles"
          ? "/admin/roles"
          : ["flags", "sounds", "campaigns"].includes(module)
            ? "/admin/config/" + module
            : module === "reports"
              ? "/reports/purchases"
              : module === "settings"
                ? "/health"
                : module === "plans"
                  ? "/plans/admin"
                  : `/admin/${module}${["users", "clubs", "rides", "announcements", "alerts"].includes(module) ? `?page=${page}&search=${encodeURIComponent(search)}&country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}` : ""}`;
  const query = useQuery({
    queryKey: ["console", endpoint],
    queryFn: () => adminRequest(endpoint),
    enabled: authenticated && module !== "notifications",
    retry: false,
  });
  const plans = useQuery<Row[]>({
    queryKey: ["console", "/plans/admin"],
    queryFn: () => adminRequest("/plans/admin"),
    enabled: authenticated && module === "users",
    retry: false,
  });
  const adminRoles = useQuery<Row[]>({
    queryKey: ["console", "/admin/roles"],
    queryFn: () => adminRequest("/admin/roles"),
    enabled: authenticated && module === "admin_accounts",
    retry: false,
  });
  const groups = useQuery<Row[]>({
    queryKey: ["console", "groups", rider?.id],
    queryFn: () => adminRequest(`/admin/users/${rider!.id}/groups`),
    enabled: authenticated && !!rider,
    retry: false,
  });
  const members = useQuery<Row[]>({
    queryKey: ["console", "members", club?.id],
    queryFn: () => adminRequest(`/admin/clubs/${club!.id}/members`),
    enabled: authenticated && !!club,
    retry: false,
  });
  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (!supabase)
        throw Error(
          "Configure VITE_API_BASE_URL, VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first",
        );
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setPassword("");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function mutate(path: string, body: Row, method = "PUT") {
    setBusy(true);
    setMessage("");
    try {
      await adminRequest(path, { method, body: JSON.stringify(body) });
      await cache.invalidateQueries({
        queryKey: ["console"],
        refetchType: "none",
      });
      setMessage(
        "Changes saved. Refresh this view to load the latest records.",
      );
      return true;
    } catch (error) {
      setMessage((error as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (checking)
    return (
      <div className="console-login">
        <Skeleton kind="form" />
      </div>
    );
  if (!authenticated)
    return (
      <div className="console-login">
        <form onSubmit={login}>
          <span className="console-eyebrow">MOTOSYNC / ADMIN</span>
          <h1>
            Your community.
            <br />
            <em>In good hands.</em>
          </h1>
          <p>Sign in with your administrator account.</p>
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button disabled={busy || !supabase}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          {!supabase && (
            <p role="alert">
              Configure VITE_API_BASE_URL, VITE_SUPABASE_URL and
              VITE_SUPABASE_ANON_KEY.
            </p>
          )}
          {message && <p role="alert">{message}</p>}
        </form>
      </div>
    );
  const data = query.data,
    items: Row[] = Array.isArray(data) ? data : data?.items || [];
  return (
    <div className={`console-shell ${collapsed ? "is-collapsed" : ""}`}>
      <aside>
        <a
          className="console-brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setModule("dashboard");
            setPopover(null);
          }}
        >
          <span className="console-logo-mark">M</span>
          <span className="console-nav-label">
            MOTOSYNC <small>SUPER ADMIN PANEL</small>
          </span>
        </a>
        <button
          className="console-collapse"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>
        <nav aria-label="Administration">
          {navigationGroups.map((group) => (
            <details className="console-nav-group" key={group.name} open>
              <summary title={group.name} aria-label={group.name}>
                <span className="console-nav-label">{group.name}</span>
              </summary>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  title={item.name}
                  aria-current={module === item.id ? "page" : undefined}
                  onClick={() => {
                    setModule(item.id);
                    setPage(1);
                    setSearch("");
                    setSearchInput("");
                    setMessage("");
                    setClub(null);
                    setRider(null);
                    setPopover(null);
                  }}
                >
                  <item.icon size={17} />
                  <span className="console-nav-label">{item.name}</span>
                </button>
              ))}
            </details>
          ))}
        </nav>
        <div className="console-side-bottom">
          <span className="console-nav-label">
            FREE LAUNCH
            <br />
            <small>Community comes first.</small>
          </span>
          <button
            onClick={async () => {
              await supabase?.auth.signOut();
              cache.clear();
            }}
            title="Sign out"
          >
            <LogOut size={18} />
            <span className="console-nav-label">Sign out</span>
          </button>
        </div>
      </aside>
      <main>
        <div className="console-topbar">
          <div className="console-breadcrumb">
            <span>MotoSync ERP</span>
            <ChevronRight size={15} />
            <strong>{modules.find((item) => item.id === module)?.name}</strong>
          </div>
          <div className="console-top-actions">
            <fieldset className="console-theme-options">
              <legend className="sr-only">Appearance</legend>
              {["day", "night", "system"].map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="admin-theme"
                    checked={theme === value}
                    onChange={() => setTheme(value)}
                  />
                  <span>{value}</span>
                </label>
              ))}
            </fieldset>
            <button
              className="secondary console-icon-button"
              aria-label="Settings"
              onClick={() => {
                setModule("settings");
                setPopover(null);
              }}
            >
              <Settings size={18} />
            </button>
            <button
              className="secondary console-icon-button"
              aria-label="Operational alerts"
              aria-expanded={popover === "notifications"}
              onClick={() => {
                setModule("alerts");
                setPage(1);
                setPopover(null);
              }}
            >
              <Bell size={18} />
            </button>
            <button
              className="secondary console-account"
              aria-label="Your account"
              aria-expanded={popover === "profile"}
              onClick={() =>
                setPopover(popover === "profile" ? null : "profile")
              }
            >
              <span className="console-avatar">
                <UserRound size={18} />
              </span>
              <span>
                {account.name || "Administrator"}
                <small>{account.email}</small>
              </span>
            </button>
          </div>
          {popover && (
            <section
              className="console-popover"
              aria-label={
                popover === "notifications" ? "Notifications" : "Your account"
              }
            >
              <button className="secondary" onClick={() => setPopover(null)}>
                Close
              </button>
              <h2>
                {popover === "notifications" ? "Notifications" : "Your account"}
              </h2>
              <p>
                {popover === "notifications"
                  ? "Feature not available. Notifications have not been connected yet."
                  : account.email || "Administrator session"}
              </p>
            </section>
          )}
        </div>
        <header className="console-page-heading">
          <div>
            <span className="console-eyebrow">WORKSPACE / {module}</span>
            <h1>{modules.find((item) => item.id === module)?.name}</h1>
            <p>Manage your community and platform from one place.</p>
          </div>
          <div className="console-refresh-group">
            <small>
              {query.dataUpdatedAt
                ? "Updated " +
                  new Date(query.dataUpdatedAt).toLocaleTimeString()
                : "Fetch records when needed"}
            </small>
            <button
              className="secondary"
              disabled={query.isFetching || module === "notifications"}
              onClick={() => {
                void query.refetch();
                if (module === "users") void plans.refetch();
                if (module === "admin_accounts") void adminRoles.refetch();
              }}
              aria-label="Refresh module"
            >
              <RefreshCw
                size={15}
                className={query.isFetching ? "console-spinning" : ""}
              />
              {query.isFetching ? "Refreshing?" : "Refresh"}
            </button>
          </div>
        </header>
        {message && (
          <div className="console-notice" role="status">
            {message}
          </div>
        )}
        {module === "notifications" ? (
          <section className="console-card">
            <h2>Feature not available</h2>
            <p>
              Notifications have not been connected yet. This module will remain
              in the navigation.
            </p>
          </section>
        ) : query.isPending ||
          query.isFetching ||
          (module === "admin_accounts" && adminRoles.isFetching) ? (
          <Skeleton
            kind={
              module === "dashboard" || module === "analytics"
                ? "dashboard"
                : "table"
            }
          />
        ) : query.isError ||
          (module === "admin_accounts" && adminRoles.isError) ? (
          <section className="console-card" role="alert">
            <h2>Unable to load this module</h2>
            <p>{query.error?.message || adminRoles.error?.message}</p>
            <button
              onClick={() => {
                void query.refetch();
                if (module === "admin_accounts") void adminRoles.refetch();
              }}
            >
              Retry
            </button>
          </section>
        ) : (
          <>
            {["admin_accounts", "admin_roles"].includes(module) && (
              <AdminAccountsPanel
                key={module}
                kind={module === "admin_accounts" ? "accounts" : "roles"}
                items={items}
                roles={adminRoles.data || []}
                busy={busy}
                save={mutate}
                notice={message}
              />
            )}
            {["flags", "sounds", "campaigns"].includes(module) && (
              <ConfigPanel
                key={module}
                resource={module}
                items={items}
                busy={busy}
                save={mutate}
              />
            )}
            {module === "settings" && (
              <section className="console-card">
                <h2>Environment & appearance</h2>
                <p>API: {environment.apiBase}</p>
                <p>
                  Service availability is managed in Feature controls. All plans
                  remain free during launch.
                </p>
              </section>
            )}
            {["rides", "reports"].includes(module) && (
              <div className="console-table">
                <table>
                  <thead>
                    <tr>
                      {(module === "rides"
                        ? ["Ride", "Status", "Start time"]
                        : ["Subscription", "Rider", "Status"]
                      ).map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id}>
                        <td>{row.title || row.id}</td>
                        <td>{module === "rides" ? row.status : row.user_id}</td>
                        <td>
                          {module === "rides"
                            ? new Date(row.start_time).toLocaleString()
                            : row.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!items.length && (
                  <p className="console-empty">No records yet.</p>
                )}
                {module === "rides" && (
                  <div className="console-pagination">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      Page {page} / {data.total} records
                    </span>
                    <button
                      disabled={page * 25 >= data.total}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
            {module === "dashboard" && data && (
              <>
                <div className="console-stats">
                  {Object.entries(data.counts).map(([name, count]) => (
                    <section className="console-card" key={name}>
                      <span>
                        {
                          (
                            {
                              profiles: "Registered riders",
                              clubs: "Groups",
                              club_members: "Memberships",
                              rides: "Rides",
                            } as Row
                          )[name]
                        }
                      </span>
                      <strong>{Number(count).toLocaleString()}</strong>
                      <small>Current platform total</small>
                    </section>
                  ))}
                </div>
                <Suspense fallback={<Skeleton kind="dashboard" />}>
                  <AnalyticsPanel
                    analytics={data.analytics || {}}
                    trend={data.trend}
                    distribution={data.distribution}
                    onCountry={(value, selectedCity = "") => {
                      setCountry(value);
                      setCountryInput(value);
                      setCity(selectedCity);
                      setCityInput(selectedCity);
                      setSearch("");
                      setSearchInput("");
                      setModule("users");
                      setPage(1);
                    }}
                  />
                </Suspense>
              </>
            )}
            {module === "analytics" && data && (
              <Suspense fallback={<Skeleton kind="dashboard" />}>
                <AnalyticsPanel
                  analytics={data}
                  onCountry={(value, selectedCity = "") => {
                    setCountry(value);
                    setCountryInput(value);
                    setCity(selectedCity);
                    setCityInput(selectedCity);
                    setSearch("");
                    setSearchInput("");
                    setModule("users");
                    setPage(1);
                  }}
                />
              </Suspense>
            )}
            {module === "exports" && <ExportReports />}
            {["clubs", "rides", "announcements"].includes(module) && (
              <div className="console-module-intro">
                <p>
                  {module === "clubs"
                    ? "Create a group and assign its rider owner."
                    : module === "rides"
                      ? "Plan an upcoming ride with an active captain."
                      : "Publish announcements to riders or group members."}
                </p>
                <OperationComposer
                  key={module}
                  kind={
                    module === "clubs"
                      ? "club"
                      : module === "rides"
                        ? "ride"
                        : "announcement"
                  }
                  busy={busy}
                  notice={message}
                  save={mutate}
                />
              </div>
            )}
            {["announcements", "alerts"].includes(module) && (
              <>
                <div className="console-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>{module === "alerts" ? "Severity" : "Audience"}</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <strong>{row.title}</strong>
                            <details>
                              <summary>Read message</summary>
                              <p>{row.message || row.body}</p>
                            </details>
                            <small>
                              {new Date(row.created_at).toLocaleString()}
                            </small>
                          </td>
                          <td>{row.severity || row.audience}</td>
                          <td>
                            {module === "alerts"
                              ? row.acknowledged_at
                                ? "Acknowledged"
                                : "Open"
                              : row.status === "published" &&
                                  new Date(row.publish_at) > new Date()
                                ? "Scheduled"
                                : row.status}
                          </td>
                          <td>
                            {module === "alerts"
                              ? !row.acknowledged_at && (
                                  <button
                                    className="secondary"
                                    disabled={busy}
                                    onClick={() =>
                                      mutate(
                                        "/admin/alerts/" +
                                          row.id +
                                          "/acknowledge",
                                        {},
                                      )
                                    }
                                  >
                                    Acknowledge
                                  </button>
                                )
                              : row.status === "published" && (
                                  <button
                                    className="secondary"
                                    disabled={busy}
                                    onClick={() =>
                                      mutate(
                                        "/admin/announcements/" +
                                          row.id +
                                          "/archive",
                                        {},
                                      )
                                    }
                                  >
                                    Unpublish
                                  </button>
                                )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!items.length && (
                    <p className="console-empty">No {module} yet.</p>
                  )}
                </div>
                <div className="console-pagination">
                  <button
                    className="secondary"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {page} ? {data.total} records
                  </span>
                  <button
                    className="secondary"
                    disabled={page * 25 >= data.total}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
            {["users", "clubs"].includes(module) && (
              <>
                <form
                  className="console-search-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setSearch(searchInput);
                    setCountry(countryInput);
                    setCity(cityInput);
                    setPage(1);
                  }}
                >
                  <label className="console-search">
                    Search by {module === "users" ? "rider name" : "group name"}
                    <input
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                      }}
                      placeholder="Search records…"
                    />
                  </label>
                  <button className="secondary" type="submit">
                    Search
                  </button>
                  {module === "users" && (
                    <>
                      <label>
                        Country
                        <input
                          value={countryInput}
                          placeholder="Country code or saved name"
                          onChange={(e) => setCountryInput(e.target.value)}
                        />
                      </label>
                      <label>
                        City
                        <input
                          value={cityInput}
                          placeholder="Exact city name"
                          onChange={(e) => setCityInput(e.target.value)}
                        />
                      </label>
                    </>
                  )}
                </form>
                <div className="console-table">
                  <table>
                    <thead>
                      <tr>
                        {(module === "users"
                          ? ["Rider", "Status", "Subscription", "Actions"]
                          : ["Group", "City", "Verification", "Members"]
                        ).map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row) => (
                        <tr key={row.id}>
                          {module === "users" ? (
                            <>
                              <td>
                                <strong>{row.full_name || row.handle}</strong>
                                <small>
                                  @{row.handle} · {row.role}
                                </small>
                              </td>
                              <td>
                                <select
                                  disabled={busy}
                                  aria-label={`Status for ${row.full_name}`}
                                  value={row.status}
                                  onChange={(e) =>
                                    mutate(`/admin/users/${row.id}`, {
                                      status: e.target.value,
                                    })
                                  }
                                >
                                  {["active", "suspended", "banned"].map(
                                    (s) => (
                                      <option key={s}>{s}</option>
                                    ),
                                  )}
                                </select>
                              </td>
                              <td>
                                <select
                                  disabled={busy || plans.isError}
                                  aria-label={`Plan for ${row.full_name}`}
                                  value={row.subscription_plan_id || ""}
                                  onChange={(e) =>
                                    mutate(`/admin/users/${row.id}`, {
                                      subscription_plan_id: e.target.value,
                                    })
                                  }
                                >
                                  <option value="" disabled>
                                    Unassigned
                                  </option>
                                  {plans.data
                                    ?.filter(
                                      (p) =>
                                        p.is_active ||
                                        p.id === row.subscription_plan_id,
                                    )
                                    .map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                        {!p.is_active ? " (archived)" : ""}
                                      </option>
                                    ))}
                                </select>
                              </td>
                              <td>
                                <button
                                  className="secondary"
                                  onClick={() => {
                                    setRider(row);
                                  }}
                                >
                                  View rider
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td>
                                <strong>{row.name}</strong>
                                <small>{row.privacy}</small>
                              </td>
                              <td>{row.city || "—"}</td>
                              <td>
                                <button
                                  disabled={busy}
                                  className="secondary"
                                  onClick={() =>
                                    mutate(`/admin/clubs/${row.id}`, {
                                      verified: !row.verified,
                                    })
                                  }
                                >
                                  {row.verified
                                    ? "Verified · revoke"
                                    : "Verify group"}
                                </button>
                              </td>
                              <td>
                                <button
                                  className="secondary"
                                  onClick={() => setClub(row)}
                                >
                                  View members
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!items.length && (
                    <p className="console-empty">No matching records.</p>
                  )}
                </div>
                <div className="console-pagination">
                  <button
                    className="secondary"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {page} · {data.total} records
                  </span>
                  <button
                    className="secondary"
                    disabled={page * 25 >= data.total}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
            {module === "plans" && (
              <>
                <div className="console-module-intro">
                  <p>
                    Publish feature lists to the shared catalogue. All plans are
                    free during launch.
                  </p>
                  <button onClick={() => setPlan(blankPlan())}>
                    Create plan
                  </button>
                </div>
                <div className="console-plan-grid">
                  {items.map((row) => (
                    <section className="console-card" key={row.id}>
                      <span className="console-eyebrow">
                        {row.is_active ? "PUBLISHED" : "DRAFT / ARCHIVED"} ·{" "}
                        {row.audience}
                      </span>
                      <h2>{row.name}</h2>
                      <strong className="console-price">
                        Free <small>during launch</small>
                      </strong>
                      <p>{row.tagline}</p>
                      <ul>
                        {row.features.map((f: string) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                      <button
                        className="secondary"
                        onClick={() =>
                          setPlan({
                            ...blankPlan(),
                            ...row,
                            price_inr: 0,
                            price_usd: 0,
                          })
                        }
                      >
                        Edit plan
                      </button>
                    </section>
                  ))}
                </div>
                {!items.length && (
                  <p>No plans yet. Create your first free plan.</p>
                )}
              </>
            )}
            {module === "audit" && (
              <div className="console-table">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Actor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id}>
                        <td>{new Date(row.created_at).toLocaleString()}</td>
                        <td>{row.action}</td>
                        <td>
                          {row.entity} / {row.entity_id}
                        </td>
                        <td>{row.actor_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!items.length && <p>No admin activity recorded.</p>}
              </div>
            )}
          </>
        )}
        {rider && (
          <div className="console-overlay">
            <section
              className="console-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Rider details"
            >
              <button
                autoFocus
                className="secondary"
                onClick={() => setRider(null)}
              >
                Close
              </button>
              <h2>{rider.full_name}</h2>
              <p>
                @{rider.handle} / {rider.status}
              </p>
              <p>
                Registered {new Date(rider.created_at).toLocaleDateString()} /{" "}
                {rider.city || "No city"}
              </p>
              <h2>Group memberships</h2>
              <button
                className="secondary"
                disabled={groups.isFetching}
                onClick={() => groups.refetch()}
              >
                Refresh memberships
              </button>
              {groups.isPending ? (
                <Skeleton kind="detail" />
              ) : groups.isError ? (
                <div role="alert">
                  {groups.error.message}
                  <button onClick={() => groups.refetch()}>Retry</button>
                </div>
              ) : groups.data?.length ? (
                groups.data.map((g: Row) => (
                  <div className="console-member" key={g.clubs?.id}>
                    <strong>{g.clubs?.name}</strong>
                    <span>
                      {g.role} / {g.clubs?.privacy}
                    </span>
                  </div>
                ))
              ) : (
                <p>No group memberships.</p>
              )}
            </section>
          </div>
        )}
        {club && (
          <div className="console-overlay">
            <section
              className="console-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={`${club.name} members`}
            >
              <button
                className="secondary"
                autoFocus
                onClick={() => setClub(null)}
              >
                Close
              </button>
              <h2>{club.name}</h2>
              <p>Group members (up to 1,000)</p>
              <button
                className="secondary"
                disabled={members.isFetching}
                onClick={() => members.refetch()}
              >
                Refresh members
              </button>
              {members.isPending ? (
                <Skeleton kind="detail" />
              ) : members.isError ? (
                <div role="alert">
                  {members.error.message}
                  <button onClick={() => members.refetch()}>Retry</button>
                </div>
              ) : members.data?.length ? (
                members.data.map((row) => (
                  <div className="console-member" key={row.profiles?.id}>
                    <strong>
                      {row.profiles?.full_name || "Unavailable profile"}
                    </strong>
                    <span>
                      {row.role} · {row.profiles?.status}
                    </span>
                    <small>
                      Joined {new Date(row.joined_at).toLocaleDateString()}
                    </small>
                  </div>
                ))
              ) : (
                <p>No members found.</p>
              )}
            </section>
          </div>
        )}
        {plan && (
          <div className="console-overlay">
            <form
              className="console-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Plan editor"
              onSubmit={async (e) => {
                e.preventDefault();
                const exists = items.some((p) => p.id === plan.id);
                if (
                  await mutate(
                    exists ? `/plans/${plan.id}` : "/plans",
                    Object.fromEntries(
                      Object.keys(blankPlan()).map((key) => [
                        key,
                        plan[key as keyof typeof plan],
                      ]),
                    ),
                    exists ? "PUT" : "POST",
                  )
                )
                  setPlan(null);
              }}
            >
              <h2>
                {items.some((p) => p.id === plan.id)
                  ? "Edit plan"
                  : "Create plan"}
              </h2>
              <label>
                Name
                <input
                  autoFocus
                  required
                  maxLength={100}
                  value={plan.name}
                  onChange={(e) => setPlan({ ...plan, name: e.target.value })}
                />
              </label>
              <label>
                Short description
                <input
                  maxLength={240}
                  value={plan.tagline}
                  onChange={(e) =>
                    setPlan({ ...plan, tagline: e.target.value })
                  }
                />
              </label>
              <label>
                Audience
                <select
                  value={plan.audience}
                  onChange={(e) =>
                    setPlan({ ...plan, audience: e.target.value })
                  }
                >
                  <option value="rider">Riders</option>
                  <option value="club">Clubs</option>
                </select>
              </label>
              <label>
                Features (one per line)
                <textarea
                  required
                  value={plan.features.join("\n")}
                  onChange={(e) =>
                    setPlan({ ...plan, features: e.target.value.split("\n") })
                  }
                />
              </label>
              <label>
                Display order
                <input
                  type="number"
                  min={0}
                  value={plan.sort_order}
                  onChange={(e) =>
                    setPlan({ ...plan, sort_order: Number(e.target.value) })
                  }
                />
              </label>
              <label className="console-checkbox">
                <input
                  type="checkbox"
                  checked={plan.is_active}
                  onChange={(e) =>
                    setPlan({ ...plan, is_active: e.target.checked })
                  }
                />{" "}
                Publish to public catalogue
              </label>
              <p>Free launch · pricing is held at zero by the backend.</p>
              <div className="console-actions">
                <button disabled={busy}>Save plan</button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setPlan(null)}
                >
                  Cancel
                </button>
              </div>
              {message && <p role="status">{message}</p>}
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
