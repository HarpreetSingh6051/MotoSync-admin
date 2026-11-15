import { useState, useEffect } from "react";
import type { Row } from "@/lib/adminClient";
export function AdminAccountsPanel({
  kind,
  items,
  roles,
  busy,
  save,
  notice,
}: {
  kind: "accounts" | "roles";
  items: Row[];
  roles: Row[];
  busy: boolean;
  notice?: string;
  save: (path: string, body: Row, method?: string) => Promise<boolean>;
}) {
  const [failed, setFailed] = useState(false);
  const [editor, setEditor] = useState<Row | null>(null),
    [creating, setCreating] = useState(false);
  useEffect(() => {
    if (!editor) return;
    const previous = document.activeElement as HTMLElement;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditor(null);
      if (e.key !== "Tab") return;
      const fields = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".console-dialog input,.console-dialog select,.console-dialog button:not(:disabled)",
        ),
      );
      const first = fields[0],
        last = fields[fields.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [!!editor]);
  function open(row?: Row) {
    setFailed(false);
    setCreating(!row);
    setEditor(
      row
        ? { ...row }
        : kind === "accounts"
          ? {
              full_name: "",
              email: "",
              password: "",
              role_id: "viewer",
              status: "active",
            }
          : { id: "", name: "", permissions: ["read"] },
    );
  }
  return (
    <>
      <div className="console-module-intro">
        <p>
          {kind === "accounts"
            ? "Staff accounts and access, separate from registered riders."
            : "Administrative permissions. Rider and club roles are managed separately."}
        </p>
        <button onClick={() => open()}>
          Create {kind === "accounts" ? "admin account" : "role"}
        </button>
      </div>
      <div className="console-table">
        <table>
          <thead>
            <tr>
              {(kind === "accounts"
                ? ["Administrator", "Admin role", "Status", "Actions"]
                : ["Role", "Permissions", "Actions"]
              ).map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                {kind === "accounts" ? (
                  <>
                    <td>
                      <strong>{row.full_name}</strong>
                      <small>{row.email}</small>
                    </td>
                    <td>{row.admin_roles?.name || row.role_id}</td>
                    <td>
                      <span className="console-status">{row.status}</span>
                    </td>
                    <td>
                      <button className="secondary" onClick={() => open(row)}>
                        Edit access
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>
                      <strong>{row.name}</strong>
                      <small>{row.id}</small>
                    </td>
                    <td>{row.permissions.join(", ")}</td>
                    <td>
                      {row.id === "super_admin" ? (
                        <span className="console-status">Protected role</span>
                      ) : (
                        <button className="secondary" onClick={() => open(row)}>
                          Edit role
                        </button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <p className="console-empty">No records yet.</p>}
      </div>
      {editor && (
        <div className="console-overlay">
          <form
            className="console-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-editor-title"
            onSubmit={async (e) => {
              e.preventDefault();
              const values =
                kind === "accounts"
                  ? {
                      full_name: editor.full_name,
                      role_id: editor.role_id,
                      status: editor.status,
                      ...(creating
                        ? { email: editor.email, password: editor.password }
                        : {}),
                    }
                  : { name: editor.name, permissions: editor.permissions };
              if (
                await save(
                  kind === "accounts"
                    ? creating
                      ? "/admin/accounts"
                      : `/admin/accounts/${editor.id}`
                    : `/admin/roles/${editor.id}`,
                  values,
                  kind === "accounts" && creating ? "POST" : "PUT",
                )
              )
                setEditor(null);
              else setFailed(true);
            }}
          >
            <h2 id="admin-editor-title">
              {creating ? "Create" : "Edit"}{" "}
              {kind === "accounts" ? "administrator" : "role"}
            </h2>
            {kind === "accounts" ? (
              <>
                <label>
                  Full name
                  <input
                    autoFocus
                    required
                    maxLength={100}
                    value={editor.full_name}
                    onChange={(e) =>
                      setEditor({ ...editor, full_name: e.target.value })
                    }
                  />
                </label>
                {creating && (
                  <>
                    <label>
                      Login email
                      <input
                        type="email"
                        required
                        autoComplete="off"
                        value={editor.email}
                        onChange={(e) =>
                          setEditor({ ...editor, email: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Initial password
                      <input
                        type="password"
                        required
                        minLength={12}
                        maxLength={128}
                        autoComplete="new-password"
                        value={editor.password}
                        onChange={(e) =>
                          setEditor({ ...editor, password: e.target.value })
                        }
                      />
                    </label>
                    <span className="console-field-hint">
                      At least 12 characters. Passwords are stored by Supabase
                      Auth.
                    </span>
                  </>
                )}
                <label>
                  Admin role
                  <select
                    required
                    value={editor.role_id}
                    onChange={(e) =>
                      setEditor({ ...editor, role_id: e.target.value })
                    }
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={editor.status}
                    onChange={(e) =>
                      setEditor({ ...editor, status: e.target.value })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <label>
                  Identifier
                  <input
                    autoFocus
                    required
                    readOnly={!creating}
                    pattern="[a-z0-9_]{3,40}"
                    value={editor.id}
                    onChange={(e) =>
                      setEditor({ ...editor, id: e.target.value })
                    }
                  />
                </label>
                <label>
                  Role name
                  <input
                    required
                    maxLength={80}
                    value={editor.name}
                    onChange={(e) =>
                      setEditor({ ...editor, name: e.target.value })
                    }
                  />
                </label>
                <fieldset className="console-choice-list">
                  <legend>Permissions</legend>
                  <label>
                    <input type="checkbox" checked disabled /> Read
                    administrative records
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={editor.permissions.includes("write")}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          permissions: e.target.checked
                            ? ["read", "write"]
                            : ["read"],
                        })
                      }
                    />{" "}
                    Edit platform records
                  </label>
                </fieldset>
                <p>
                  Only the protected super administrator role manages staff
                  accounts and roles.
                </p>
              </>
            )}
            {failed && (
              <p role="alert" className="console-form-error">
                {notice || "Unable to save. Check your entries and try again."}
              </p>
            )}
            <div className="console-actions">
              <button disabled={busy}>
                Save {kind === "accounts" ? "account" : "role"}
              </button>
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
