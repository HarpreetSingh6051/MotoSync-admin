import { useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { scaleLinear } from "d3-scale";
import { line, curveMonotoneX, pie, arc } from "d3-shape";
import type { FeatureCollection } from "geojson";
import worldJson from "@/assets/countries.json";
import type { Row } from "@/lib/adminClient";
const world = worldJson as unknown as FeatureCollection;
function Trend({
  rows,
  field,
  title,
}: {
  rows: Row[];
  field: string;
  title: string;
}) {
  const width = 680,
    height = 220,
    pad = 36;
  const max = Math.max(1, ...rows.map((row) => Number(row[field])));
  const x = scaleLinear()
    .domain([0, Math.max(1, rows.length - 1)])
    .range([pad, width - 14]);
  const y = scaleLinear()
    .domain([0, max])
    .nice()
    .range([height - pad, 18]);
  const path =
    line<Row>()
      .x((_row, i) => x(i))
      .y((row) => y(Number(row[field])))
      .curve(curveMonotoneX)(rows) || "";
  return (
    <section className="console-card">
      <h2>{title}</h2>
      <p>Last 30 days · daily totals</p>
      <svg
        className="analytics-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title}. ${rows.reduce((sum, row) => sum + Number(row[field]), 0)} total.`}
      >
        {y
          .ticks(4)
          .filter(Number.isInteger)
          .map((tick) => (
            <g key={tick}>
              <line
                className="chart-grid"
                x1={pad}
                x2={width - 14}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text
                className="chart-label"
                x={pad - 7}
                y={y(tick) + 4}
                textAnchor="end"
              >
                {tick}
              </text>
            </g>
          ))}
        <path d={path} fill="none" className="chart-line" />
        {rows.map((row, i) => (
          <circle
            key={row.day}
            cx={x(i)}
            cy={y(Number(row[field]))}
            r={3}
            className="chart-point"
          >
            <title>
              {row.day}: {row[field]}
            </title>
          </circle>
        ))}
        {[0, Math.floor((rows.length - 1) / 2), rows.length - 1]
          .filter((i) => i >= 0 && rows[i])
          .map((i) => (
            <text
              className="chart-label"
              key={i}
              x={x(i)}
              y={height - 10}
              textAnchor={i === 0 ? "start" : "end"}
            >
              {rows[i].day.slice(5)}
            </text>
          ))}
      </svg>
      {!rows.some((row) => Number(row[field]) > 0) && (
        <p className="chart-empty">No activity recorded in this period.</p>
      )}
      <details>
        <summary>View accessible data table</summary>
        <div className="console-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.day}>
                  <td>{row.day}</td>
                  <td>{row[field]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
export function AnalyticsPanel({
  analytics,
  trend = [],
  distribution,
  onCountry,
}: {
  analytics: Row;
  trend?: Row[];
  distribution?: Row[];
  onCountry?: (country: string, city?: string) => void;
}) {
  const [selected, setSelected] = useState("");
  const countries: Row[] = analytics.countries || [];
  const map = useMemo(
    () =>
      geoPath(
        geoNaturalEarth1().fitExtent(
          [
            [8, 8],
            [712, 346],
          ],
          world,
        ),
      ),
    [],
  );
  const byCode = useMemo(() => {
    const result: Record<string, number> = {};
    for (const row of countries) {
      const value = String(row.country).toLowerCase();
      const match = world.features.find(
        (feature) =>
          feature.properties?.code?.toLowerCase() === value ||
          feature.properties?.name?.toLowerCase() === value ||
          (value === "usa" && feature.properties?.code === "US") ||
          (value === "uk" && feature.properties?.code === "GB"),
      );
      if (match) {
        const code = String(match.properties?.code);
        result[code] = (result[code] || 0) + Number(row.riders);
      }
    }
    return result;
  }, [countries]);
  const max = Math.max(1, ...Object.values(byCode));
  const intensity = scaleLinear().domain([0, max]).range([0, 1]);
  const segments = pie<Row>()
    .value((row) => Number(row.rides))
    .sort(null)(analytics.ride_status || []);
  const donut = arc<(typeof segments)[number]>()
    .innerRadius(48)
    .outerRadius(70);
  return (
    <div className="analytics-workspace">
      <div className="console-charts">
        <Trend
          rows={trend.length ? trend : analytics.registrations || []}
          field="registrations"
          title="Rider registration growth"
        />
        <Trend
          rows={analytics.ride_trend || []}
          field="rides"
          title="Ride creation trend"
        />
      </div>
      <div className="console-charts">
        <section className="console-card">
          <h2>Where your riders are</h2>
          <p>Country heat map · profile-provided locations, not live GPS</p>
          <svg
            className="analytics-svg country-map"
            viewBox="0 0 720 360"
            role="img"
            aria-label="Rider counts by country; equivalent data is listed in the country table"
          >
            {world.features.map((feature) => {
              const code = String(feature.properties?.code);
              const count = byCode[code] || 0;
              return (
                <path
                  key={feature.properties?.name}
                  d={map(feature) || ""}
                  style={{
                    fill: count
                      ? `color-mix(in srgb,var(--admin-cyan) ${20 + intensity(count) * 80}%,var(--admin-soft))`
                      : "var(--admin-soft)",
                  }}
                >
                  <title>
                    {feature.properties?.name}: {count} riders
                  </title>
                </path>
              );
            })}
          </svg>
          <div className="map-legend">
            <span>No recorded riders</span>
            <i />
            <span>{max} riders</span>
          </div>
          <label>
            Inspect a country
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">All countries</option>
              {countries.map((row) => (
                <option key={row.country} value={row.country}>
                  {row.country} · {row.riders} riders
                </option>
              ))}
            </select>
          </label>
          {selected && onCountry && (
            <button className="secondary" onClick={() => onCountry(selected)}>
              View riders in {selected}
            </button>
          )}
          <p className="chart-source">
            Map boundaries: Natural Earth. Unmatched or unknown country values
            remain in the table below.
          </p>
        </section>
        <section className="console-card">
          <h2>Ride status breakdown</h2>
          <div className="donut-layout">
            <svg
              viewBox="0 0 180 180"
              role="img"
              aria-label="Ride status totals"
            >
              <g transform="translate(90,90)">
                {segments.map((segment, i) => (
                  <path
                    key={segment.data.status}
                    d={donut(segment) || ""}
                    className={`donut-segment segment-${i % 3}`}
                  >
                    <title>
                      {segment.data.status}: {segment.data.rides}
                    </title>
                  </path>
                ))}
              </g>
              <text className="donut-number" x="90" y="90" textAnchor="middle">
                {(analytics.ride_status || []).reduce(
                  (sum: number, row: Row) => sum + Number(row.rides),
                  0,
                )}
              </text>
              <text className="chart-label" x="90" y="108" textAnchor="middle">
                rides
              </text>
            </svg>
            <div>
              {(analytics.ride_status || []).map((row: Row) => (
                <p key={row.status}>
                  {row.status} <strong>{row.rides}</strong>
                </p>
              ))}
              {!segments.length && <p>No rides recorded.</p>}
            </div>
          </div>
          {distribution && (
            <>
              <h2>Plan distribution</h2>
              {distribution.length ? (
                distribution.map((row) => (
                  <div className="console-distribution" key={row.name}>
                    <span>{row.name}</span>
                    <strong>{row.subscribers}</strong>
                    <meter
                      aria-label={row.name}
                      min={0}
                      max={Math.max(1, Number(analytics.totals?.riders))}
                      value={Number(row.subscribers)}
                    />
                  </div>
                ))
              ) : (
                <p>No plan assignments recorded.</p>
              )}
            </>
          )}
        </section>
      </div>
      <section className="console-card">
        <h2>Regional directory</h2>
        <div className="console-table">
          <table>
            <thead>
              <tr>
                <th>Country</th>
                <th>Riders</th>
                <th>Explore</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((row) => (
                <tr key={row.country}>
                  <td>{row.country}</td>
                  <td>{row.riders}</td>
                  <td>
                    <button
                      className="secondary"
                      onClick={() => onCountry?.(row.country)}
                    >
                      View riders
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!countries.length && (
            <p className="console-empty">No geographic data yet.</p>
          )}
        </div>
      </section>
      <section className="console-card">
        <h2>Leading cities</h2>
        <div className="console-table">
          <table>
            <thead>
              <tr>
                <th>City</th>
                <th>Country</th>
                <th>Riders</th>
              </tr>
            </thead>
            <tbody>
              {(analytics.cities || []).map((row: Row) => (
                <tr key={`${row.country}:${row.city}`}>
                  <td>
                    <button
                      className="secondary"
                      onClick={() => onCountry?.(row.country, row.city)}
                    >
                      {row.city}
                    </button>
                  </td>
                  <td>{row.country}</td>
                  <td>{row.riders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
