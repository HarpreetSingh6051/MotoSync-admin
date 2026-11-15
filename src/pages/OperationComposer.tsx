import { useState, useEffect } from "react";
import { adminRequest, type Row } from "@/lib/adminClient";
import { Skeleton } from "@/components/Skeleton";
function Lookup({
  kind,
  value,
  onChange,
}: {
  kind: "users" | "clubs";
  value: string;
  onChange: (id: string) => void;
}) {
  const [term, setTerm] = useState(""),
    [items, setItems] = useState<Row[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="operation-lookup">
      <label>
        {kind === "users" ? "Find rider by name" : "Find group by name"}
        <input value={term} onChange={(e) => setTerm(e.target.value)} />
      </label>
      <button
        type="button"
        className="secondary"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError("");
          try {
            const data = await adminRequest(
              `/admin/${kind}?search=${encodeURIComponent(term)}`,
            );
            setItems(data.items);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setLoading(false);
          }
        }}
      >
        Search
      </button>
      {loading ? (
        <Skeleton kind="detail" />
      ) : (
        <label>
          {kind === "users" ? "Select rider" : "Select group"}
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">Select a record</option>
            {items.map((row) => (
              <option key={row.id} value={row.id}>
                {row.full_name || row.name}
                {row.status ? " / " + row.status : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      {error && <p role="alert">{error}</p>}
      <small>Search returns up to 25 matches. Refine the name if needed.</small>
    </div>
  );
}
export function OperationComposer({
  kind,
  busy,
  notice,
  save,
}: {
  kind: "club" | "ride" | "announcement";
  busy: boolean;
  notice: string;
  save: (path: string, body: Row, method?: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState(false);
  const defaults = () =>
    kind === "club"
      ? {
          name: "",
          handle: "",
          description: "",
          city: "",
          region: "India",
          privacy: "public",
          created_by: "",
        }
      : kind === "ride"
        ? {
            title: "",
            route_summary: "",
            description: "",
            captain_id: "",
            club_id: "",
            start_time: "",
            meetup_label: "",
            distance_km: 0,
            max_riders: 20,
            visibility: "public",
          }
        : {
            title: "",
            body: "",
            audience: "all_riders",
            club_id: "",
            status: "draft",
            publish_at: "",
            expires_at: "",
          };
  const [entry, setEntry] = useState<Row>(defaults);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab") return;
      const fields = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".console-dialog input,.console-dialog textarea,.console-dialog select,.console-dialog button:not(:disabled)",
        ),
      );
      if (e.shiftKey && document.activeElement === fields[0]) {
        e.preventDefault();
        fields.at(-1)?.focus();
      } else if (!e.shiftKey && document.activeElement === fields.at(-1)) {
        e.preventDefault();
        fields[0]?.focus();
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [open]);
  const label =
    kind === "club"
      ? "Create group"
      : kind === "ride"
        ? "Schedule ride"
        : "New announcement";
  const text = (
    name: string,
    title: string,
    required = true,
    type = "text",
  ) => (
    <label key={name}>
      {title}
      <input
        required={required}
        type={type}
        autoFocus={name === "name" || name === "title"}
        maxLength={name === "handle" ? 40 : 240}
        value={entry[name] || ""}
        onChange={(e) => setEntry({ ...entry, [name]: e.target.value })}
      />
    </label>
  );
  return (
    <>
      <button
        onClick={() => {
          setEntry(defaults());
          setError(false);
          setOpen(true);
        }}
      >
        {label}
      </button>
      {open && (
        <div className="console-overlay">
          <form
            className="console-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onSubmit={async (e) => {
              e.preventDefault();
              let data = { ...entry };
              if (kind === "ride")
                data.start_time = new Date(entry.start_time).toISOString();
              if (kind === "announcement") {
                data.publish_at = entry.publish_at
                  ? new Date(entry.publish_at).toISOString()
                  : new Date().toISOString();
                if (entry.expires_at)
                  data.expires_at = new Date(entry.expires_at).toISOString();
                else delete data.expires_at;
              }
              if (!data.club_id) delete data.club_id;
              const success = await save(
                kind === "club"
                  ? "/admin/clubs"
                  : kind === "ride"
                    ? "/admin/rides"
                    : "/admin/announcements",
                data,
                "POST",
              );
              if (success) setOpen(false);
              else setError(true);
            }}
          >
            <h2>{label}</h2>
            {kind === "club" ? (
              <>
                {text("name", "Group name")}
                {text(
                  "handle",
                  "Handle (lowercase letters, numbers, underscores)",
                )}
                <label>
                  Description
                  <textarea
                    value={entry.description}
                    maxLength={2000}
                    onChange={(e) =>
                      setEntry({ ...entry, description: e.target.value })
                    }
                  />
                </label>
                {text("city", "City")}
                <label>
                  Region
                  <select
                    value={entry.region}
                    onChange={(e) =>
                      setEntry({ ...entry, region: e.target.value })
                    }
                  >
                    <option>India</option>
                    <option>Global</option>
                  </select>
                </label>
                <label>
                  Privacy
                  <select
                    value={entry.privacy}
                    onChange={(e) =>
                      setEntry({ ...entry, privacy: e.target.value })
                    }
                  >
                    <option value="public">Public</option>
                    <option value="invite_only">Invite only</option>
                  </select>
                </label>
                <Lookup
                  kind="users"
                  value={entry.created_by}
                  onChange={(id) => setEntry({ ...entry, created_by: id })}
                />
                <p>
                  The selected active rider becomes the group owner and first
                  member.
                </p>
              </>
            ) : kind === "ride" ? (
              <>
                {text("title", "Ride title")}
                {text("route_summary", "Route summary")}
                {text("description", "Description", false)}
                {text("meetup_label", "Meeting point")}
                {text(
                  "start_time",
                  `Start time (${Intl.DateTimeFormat().resolvedOptions().timeZone})`,
                  true,
                  "datetime-local",
                )}
                <label>
                  Distance (km)
                  <input
                    type="number"
                    min={0}
                    max={20000}
                    step="0.1"
                    required
                    value={entry.distance_km}
                    onChange={(e) =>
                      setEntry({
                        ...entry,
                        distance_km: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Maximum riders
                  <input
                    type="number"
                    min={2}
                    max={200}
                    required
                    value={entry.max_riders}
                    onChange={(e) =>
                      setEntry({ ...entry, max_riders: Number(e.target.value) })
                    }
                  />
                </label>
                <Lookup
                  kind="users"
                  value={entry.captain_id}
                  onChange={(id) => setEntry({ ...entry, captain_id: id })}
                />
                <label>
                  Visibility
                  <select
                    value={entry.visibility}
                    onChange={(e) =>
                      setEntry({ ...entry, visibility: e.target.value })
                    }
                  >
                    <option value="public">Public ride</option>
                    <option value="group_only">Group only</option>
                  </select>
                </label>
                <Lookup
                  kind="clubs"
                  value={entry.club_id}
                  onChange={(id) => setEntry({ ...entry, club_id: id })}
                />
                <p>
                  A group ride requires a captain who belongs to that group.
                </p>
              </>
            ) : (
              <>
                {text("title", "Title")}
                <label>
                  Message
                  <textarea
                    required
                    maxLength={5000}
                    value={entry.body}
                    onChange={(e) =>
                      setEntry({ ...entry, body: e.target.value })
                    }
                  />
                </label>
                <label>
                  Audience
                  <select
                    value={entry.audience}
                    onChange={(e) =>
                      setEntry({
                        ...entry,
                        audience: e.target.value,
                        club_id: "",
                      })
                    }
                  >
                    <option value="all_riders">All riders</option>
                    <option value="all_groups">All group members</option>
                    <option value="club">One group</option>
                  </select>
                </label>
                {entry.audience === "club" && (
                  <Lookup
                    kind="clubs"
                    value={entry.club_id}
                    onChange={(id) => setEntry({ ...entry, club_id: id })}
                  />
                )}
                <label>
                  Publication
                  <select
                    value={entry.status}
                    onChange={(e) =>
                      setEntry({ ...entry, status: e.target.value })
                    }
                  >
                    <option value="draft">Save draft</option>
                    <option value="published">Publish to in-app feed</option>
                  </select>
                </label>
                {text(
                  "publish_at",
                  "Publish at (blank means now)",
                  false,
                  "datetime-local",
                )}
                {text(
                  "expires_at",
                  "Expires at (optional)",
                  false,
                  "datetime-local",
                )}
                <p>
                  Published messages appear in the rider feed when their
                  publication time arrives. No push or email is sent.
                </p>
              </>
            )}
            {error && <p role="alert">{notice}</p>}
            <div className="console-actions">
              <button disabled={busy}>{busy ? "Saving…" : "Save"}</button>
              <button
                className="secondary"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
