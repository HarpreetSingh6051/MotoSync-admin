export function Skeleton({
  kind = "table",
}: {
  kind?: "table" | "dashboard" | "detail" | "form";
}) {
  return (
    <div
      className={`console-loading console-loading-${kind}`}
      role="status"
      aria-label="Loading content"
      aria-busy="true"
    >
      <span className="sr-only">Loading content</span>
      {kind === "dashboard" ? (
        <>
          <div className="console-stats">
            {Array.from({ length: 4 }, (_, i) => (
              <div className="console-card" key={i}>
                <i className="skeleton-line short" />
                <i className="skeleton-line metric" />
                <i className="skeleton-line" />
              </div>
            ))}
          </div>
          <div className="console-charts">
            {[0, 1].map((i) => (
              <div className="console-card" key={i}>
                <i className="skeleton-line short" />
                <i className="skeleton-chart" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="console-card">
          {Array.from({ length: kind === "detail" ? 4 : 7 }, (_, i) => (
            <div className="skeleton-row" key={i}>
              {[0, 1, 2].map((j) => (
                <i key={j} className="skeleton-line" />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
