import { useEffect, useState, type FormEvent } from "react";
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
const modules = [
  { id: "dashboard", name: "Overview", icon: LayoutDashboard },
  { id: "users", name: "Riders", icon: Users },
  { id: "clubs", name: "Groups & members", icon: Shield },
  { id: "plans", name: "Plans & features", icon: Layers },
  { id: "audit", name: "Audit history", icon: ScrollText },
];
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
  const cache = useQueryClient();
  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(!!data.session);
      setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      cache.clear();
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
    module === "plans"
      ? "/plans/admin"
      : `/admin/${module}${["users", "clubs"].includes(module) ? `?page=${page}&search=${encodeURIComponent(search)}` : ""}`;
  const query = useQuery({
    queryKey: ["console", endpoint],
    queryFn: () => adminRequest(endpoint),
    enabled: authenticated,
    retry: false,
  });
  const plans = useQuery<Row[]>({
    queryKey: ["console", "plans"],
    queryFn: () => adminRequest("/plans/admin"),
    enabled: authenticated,
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
        throw Error("Configure the Supabase public URL and key first");
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
      await cache.invalidateQueries({ queryKey: ["console"] });
      setMessage("Changes saved");
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
      <div className="console-login" role="status">
        Checking session…
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
              Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
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
        <a className="console-brand" href="#">
          M
          <span className="console-nav-label">
            otoSync <small>CONTROL ROOM</small>
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
          {modules.map((item) => (
            <button
              key={item.id}
              title={item.name}
              aria-current={module === item.id ? "page" : undefined}
              onClick={() => {
                setModule(item.id);
                setPage(1);
                setSearch("");
                setMessage("");
                setClub(null);
              }}
            >
              <item.icon size={20} />
              <span className="console-nav-label">{item.name}</span>
            </button>
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
        <header>
          <div>
            <span className="console-eyebrow">MOTOSYNC / ADMINISTRATION</span>
            <h1>{modules.find((item) => item.id === module)?.name}</h1>
          </div>
          <button
            className="secondary"
            onClick={() => {
              void query.refetch();
              void plans.refetch();
            }}
            aria-label="Refresh module"
          >
            <RefreshCw size={17} /> Refresh
          </button>
        </header>
        {message && (
          <div className="console-notice" role="status">
            {message}
          </div>
        )}
        {query.isPending ? (
          <div className="console-skeleton" role="status">
            Loading live records…
          </div>
        ) : query.isError ? (
          <section className="console-card" role="alert">
            <h2>Unable to load this module</h2>
            <p>{query.error.message}</p>
            <button onClick={() => query.refetch()}>Retry</button>
          </section>
        ) : (
          <>
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
                      <small>From your database</small>
                    </section>
                  ))}
                </div>
                <div className="console-charts">
                  <section className="console-card">
                    <h2>New riders</h2>
                    <p>Registrations over the last 30 days</p>
                    <div
                      className="console-bars"
                      role="img"
                      aria-label="Daily registration totals; exact values listed below"
                    >
                      {data.trend.map((day: Row) => (
                        <div
                          key={day.day}
                          title={`${day.day}: ${day.registrations}`}
                        >
                          <i
                            style={{
                              height: `${Math.max(2, (Number(day.registrations) / Math.max(1, ...data.trend.map((d: Row) => Number(d.registrations)))) * 100)}%`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <details>
                      <summary>View daily totals</summary>
                      {data.trend.map((d: Row) => (
                        <p key={d.day}>
                          {d.day}: {d.registrations}
                        </p>
                      ))}
                    </details>
                  </section>
                  <section className="console-card">
                    <h2>Plan distribution</h2>
                    <p>Current rider assignments</p>
                    {data.distribution.length ? (
                      data.distribution.map((d: Row) => (
                        <div className="console-distribution" key={d.name}>
                          <span>{d.name}</span>
                          <strong>{d.subscribers}</strong>
                          <meter
                            min={0}
                            max={Math.max(1, data.counts.profiles)}
                            value={Number(d.subscribers)}
                            aria-label={`${d.name} subscribers`}
                          />
                        </div>
                      ))
                    ) : (
                      <p>No registrations yet.</p>
                    )}
                  </section>
                </div>
              </>
            )}
            {["users", "clubs"].includes(module) && (
              <>
                <label className="console-search">
                  Search by {module === "users" ? "rider name" : "group name"}
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search records…"
                  />
                </label>
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
              {groups.isPending ? (
                <p>Loading groups?</p>
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
              {members.isPending ? (
                <p role="status">Loading members…</p>
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
