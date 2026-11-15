import { useState, useEffect } from "react";
import type { Row } from "@/lib/adminClient";
const schemas: Record<string, Record<string, unknown>> = {
  flags: {
    name: "",
    description: "",
    category: ["core", "ai", "monetization", "experimental", "safety"],
    service_status: ["enabled", "disabled", "maintenance"],
    maintenance_message: "",
    access_level: ["all", "pro_only", "club_admins", "beta_testers"],
    rollout_percentage: 100,
  },
  sounds: {
    name: "",
    brand: "",
    engine_configuration: "",
    decibels: 98,
    audio_url: "",
    synth_preset: [
      "harley_vtwin",
      "bullet_thump",
      "ninja_inline4",
      "ducati_v4",
      "triumph_triple",
    ],
    is_pro_only: false,
    is_active: true,
    sort_order: 0,
  },
  campaigns: {
    sponsor_name: "",
    title: "",
    perk_offer: "",
    region: ["All", "India", "Global"],
    cta_url: "",
    cpm_rate_usd: 0,
    is_active: false,
  },
};
export function ConfigPanel({
  resource,
  items,
  busy,
  save,
}: {
  resource: string;
  items: Row[];
  busy: boolean;
  save: (path: string, body: Row) => Promise<boolean>;
}) {
  const [editor, setEditor] = useState<Row | null>(null),
    [id, setId] = useState(""),
    [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editor) return;
    const previous = document.activeElement as HTMLElement;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditor(null);
      if (event.key !== "Tab") return;
      const items = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".console-dialog input:not(:disabled),.console-dialog select,.console-dialog button:not(:disabled)",
        ),
      );
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [!!editor]);
  const schema = schemas[resource];
  function edit(row?: Row) {
    setEditing(!!row);
    setId(row?.key || row?.id || "");
    setError("");
    setEditor(
      Object.fromEntries(
        Object.entries(schema).map(([key, value]) => [
          key,
          row?.[key] ?? (Array.isArray(value) ? value[0] : value),
        ]),
      ),
    );
  }
  return (
    <>
      <div className="console-module-intro">
        <p>
          {resource === "flags"
            ? "Enable, disable, or pause a feature with a service message."
            : "Manage the published catalogue. Disable a record to archive it."}
        </p>
        <button onClick={() => edit()}>
          Create{" "}
          {resource === "flags"
            ? "feature"
            : resource === "sounds"
              ? "sound"
              : "campaign"}
        </button>
      </div>
      <div className="console-plan-grid">
        {items.map((row) => (
          <section className="console-card" key={row.key || row.id}>
            <span className="console-eyebrow">
              {row.service_status || (row.is_active ? "ACTIVE" : "ARCHIVED")}
            </span>
            <h2>{row.name || row.title}</h2>
            <p>
              {row.maintenance_message ||
                row.description ||
                row.perk_offer ||
                row.brand ||
                "No description"}
            </p>
            <small>{row.key || row.id}</small>
            <div className="console-actions">
              <button className="secondary" onClick={() => edit(row)}>
                Edit
              </button>
            </div>
          </section>
        ))}
      </div>
      {!items.length && <p>No records yet.</p>}
      {editor && (
        <div className="console-overlay">
          <form
            className="console-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Configuration editor"
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditor(null);
            }}
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (
                await save(
                  `/admin/config/${resource}/${encodeURIComponent(id)}`,
                  { values: editor },
                )
              )
                setEditor(null);
              else
                setError(
                  "Save failed. Check the error message above and retry.",
                );
            }}
          >
            <h2>Edit {resource}</h2>
            <label>
              Identifier
              <input
                autoFocus
                readOnly={editing}
                required
                pattern="[a-zA-Z0-9_-]{1,100}"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
            </label>
            {Object.entries(schema).map(([key, type]) => (
              <label key={key}>
                {key.replaceAll("_", " ")}
                {Array.isArray(type) ? (
                  <select
                    value={editor[key]}
                    onChange={(e) =>
                      setEditor({ ...editor, [key]: e.target.value })
                    }
                  >
                    {type.map((v) => (
                      <option key={String(v)}>{String(v)}</option>
                    ))}
                  </select>
                ) : typeof type === "boolean" ? (
                  <input
                    type="checkbox"
                    checked={editor[key]}
                    onChange={(e) =>
                      setEditor({ ...editor, [key]: e.target.checked })
                    }
                  />
                ) : (
                  <input
                    required={["name", "title", "sponsor_name"].includes(key)}
                    maxLength={2000}
                    type={
                      typeof type === "number"
                        ? "number"
                        : key.endsWith("_url")
                          ? "url"
                          : "text"
                    }
                    min={0}
                    max={key === "rollout_percentage" ? 100 : undefined}
                    step={key === "cpm_rate_usd" ? "0.01" : "1"}
                    value={editor[key]}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        [key]:
                          typeof type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                  />
                )}
              </label>
            ))}
            <p role="alert">{error}</p>
            <div className="console-actions">
              <button disabled={busy}>Save configuration</button>
              <button
                type="button"
                className="secondary"
                onClick={() => setEditor(null)}
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
