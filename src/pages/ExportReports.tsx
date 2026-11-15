import { useState } from "react";
import { adminRequest } from "@/lib/adminClient";
import { reportCsv } from "@/lib/reportCsv";
export function ExportReports() {
  const [dataset, setDataset] = useState("summary"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <section className="console-card">
      <h2>Platform reports</h2>
      <p>
        Export current platform totals, geographic distribution, and ride status
        as CSV. Reports contain aggregate counts.
      </p>
      <label>
        Report
        <select value={dataset} onChange={(e) => setDataset(e.target.value)}>
          <option value="summary">Complete platform totals</option>
          <option value="countries">Riders by country</option>
          <option value="cities">Riders by city</option>
          <option value="ride_status">Rides by status</option>
        </select>
      </label>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const data = await adminRequest(
              `/admin/reports?dataset=${dataset}`,
            );
            const url = URL.createObjectURL(
              new Blob(["\uFEFF" + reportCsv(data.rows)], {
                type: "text/csv;charset=utf-8",
              }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = `motosync-${dataset}-${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Preparing report…" : "Export CSV"}
      </button>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
