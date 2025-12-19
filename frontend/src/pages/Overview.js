import React, { useMemo } from "react";

function Kebab() {
  return (
    <button className="tm-kebab" aria-label="More">
      ⋯
    </button>
  );
}

function Card({ title, children }) {
  return (
    <section className="tm-card">
      <div className="tm-card-head">
        <h3 className="tm-card-title">{title}</h3>
        <button className="tm-kebab tm-kebab--static" aria-label="More">⋯</button>
      </div>
      {children}
    </section>
  );
}

/** ---------- Charts (no libraries) ---------- **/

function PieDistribution({ active, suspended }) {
  const total = active + suspended;
  const pctSusp = total ? suspended / total : 0;

  const r = 68;
  const c = 2 * Math.PI * r;
  const suspendedLen = c * pctSusp;
  const activeLen = c - suspendedLen;

  const activePctLabel = total ? `${((active / total) * 100).toFixed(2)}%` : "0%";
  const suspPctLabel = total ? `${((suspended / total) * 100).toFixed(2)}%` : "0%";

  return (
    <div className="tm-pie-wrap">
      <div className="tm-pie-side tm-pie-side--left">
        <div className="tm-pie-label tm-pie-label--green">
          Active Users: {active} ({activePctLabel})
        </div>
      </div>

      <svg className="tm-pie" viewBox="0 0 200 200" role="img" aria-label="User distribution">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#EAF3F2" strokeWidth="28" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="#14B87A"
          strokeWidth="28"
          strokeDasharray={`${activeLen} ${c}`}
          strokeDashoffset="0"
          transform="rotate(-90 100 100)"
        />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="#EF4B4B"
          strokeWidth="28"
          strokeDasharray={`${suspendedLen} ${c}`}
          strokeDashoffset={-activeLen}
          transform="rotate(-90 100 100)"
        />
      </svg>

      <div className="tm-pie-side tm-pie-side--right">
        <div className="tm-pie-label tm-pie-label--red">
          Suspended Users: {suspended} ({suspPctLabel})
        </div>
      </div>

      <div className="tm-legend">
        <div className="tm-legend-item">
          <span className="tm-legend-swatch" style={{ background: "#14B87A" }} />
          <span>Active Users</span>
        </div>
        <div className="tm-legend-item">
          <span className="tm-legend-swatch" style={{ background: "#EF4B4B" }} />
          <span>Suspended Users</span>
        </div>
      </div>
    </div>
  );
}

function BarPostsPerMonth({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="tm-bar">
      <svg viewBox="0 0 560 240" className="tm-svg" role="img" aria-label="Posts per month">
        {[0, 1, 2, 3].map(i => (
          <line
            key={i}
            x1="40"
            y1={30 + i * 50}
            x2="540"
            y2={30 + i * 50}
            stroke="#EEF2F6"
          />
        ))}

        {data.map((d, i) => {
          const x = 60 + i * 78;
          const w = 44;
          const h = (d.value / max) * 160;
          const y = 190 - h;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={w} height={h} rx="6" ry="6" fill="#0D6E8B" />
              <text x={x + w / 2} y="220" textAnchor="middle" fontSize="11" fill="#8B97A6">
                {d.label}
              </text>
            </g>
          );
        })}

        <line x1="40" y1="190" x2="540" y2="190" stroke="#EEF2F6" />
      </svg>
    </div>
  );
}

function LineFlaggedPosts({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);

  const W = 560, H = 240;
  const padL = 44, padR = 18, padT = 24, padB = 44;

  const xStep = (W - padL - padR) / (data.length - 1);
  const yScale = (H - padT - padB) / (max - min || 1);

  const pts = data.map((d, i) => {
    const x = padL + i * xStep;
    const y = padT + (max - d.value) * yScale;
    return { x, y, ...d };
  });

  const dPath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  return (
    <div className="tm-line">
      <svg viewBox={`0 0 ${W} ${H}`} className="tm-svg" role="img" aria-label="Flagged posts">
        {[0, 1, 2, 3].map(i => (
          <line
            key={i}
            x1={padL}
            y1={padT + i * 48}
            x2={W - padR}
            y2={padT + i * 48}
            stroke="#EEF2F6"
          />
        ))}

        <path d={dPath} fill="none" stroke="#0D6E8B" strokeWidth="3" />
        {pts.map(p => (
          <circle key={p.label} cx={p.x} cy={p.y} r="5" fill="#0D6E8B" />
        ))}

        {pts.map((p, i) => (
          <text
            key={p.label}
            x={p.x}
            y={H - 18}
            textAnchor="middle"
            fontSize="11"
            fill="#8B97A6"
          >
            {data[i].label}
          </text>
        ))}

        {[0, Math.round(max / 2), max].map((v, i) => {
          const y = padT + (max - v) * yScale;
          return (
            <text key={i} x={12} y={y + 4} fontSize="11" fill="#8B97A6">
              {v}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function HeatmapUserActivity() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const values = useMemo(() => {
    return days.map((_, di) =>
      hours.map((h) => {
        const midday = Math.exp(-Math.pow((h - 15) / 5, 2));
        const evening = 0.6 * Math.exp(-Math.pow((h - 20) / 4, 2));
        const weekdayBoost = di <= 4 ? 1.0 : 0.75;
        const wave = 0.15 * (1 + Math.sin((h + di) * 0.9));
        const raw = (midday + evening + wave) * weekdayBoost;
        return Math.max(0, Math.min(4, Math.round(raw * 3.2)));
      })
    );
  }, []);

  const colors = ["#E7F2F4", "#B9DCE4", "#7CC0CF", "#2E97AD", "#0D6E8B"];

  return (
    <div className="tm-heat">
      <div className="tm-heat-grid">
        <div className="tm-heat-days">
          {days.map(d => (
            <div key={d} className="tm-heat-day">{d}</div>
          ))}
        </div>

        <div className="tm-heat-cells" aria-label="User activity heatmap">
          {values.map((row, r) => (
            <div key={r} className="tm-heat-row">
              {row.map((v, c) => (
                <div
                  key={c}
                  className="tm-heat-cell"
                  style={{ background: colors[v] }}
                  title={`${days[r]} @ ${c}:00`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="tm-heat-legend">
        <span className="tm-heat-legend-text">Less</span>
        {colors.map((col, i) => (
          <span key={i} className="tm-heat-legend-swatch" style={{ background: col }} />
        ))}
        <span className="tm-heat-legend-text">More</span>
      </div>
    </div>
  );
}

export default function Overview() {
  const stats = [
    { value: "6421", label: "Total Users" },
    { value: "847", label: "Active Users Today" },
    { value: "24", label: "Newly Registered" },
    { value: "2", label: "Suspended" },
    { value: "1", label: "Pending Tickets" },
    { value: "3", label: "Flagged Content" },
  ];

  const activeUsers = 6419;
  const suspendedUsers = 2;

  const barData = [
    { label: "Jun 2025", value: 150 },
    { label: "Jul 2025", value: 200 },
    { label: "Aug 2025", value: 160 },
    { label: "Sep 2025", value: 240 },
    { label: "Oct 2025", value: 190 },
    { label: "Nov 2025", value: 300 },
  ];

  const lineData = [
    { label: "Jun 2025", value: 1 },
    { label: "Jul 2025", value: 2 },
    { label: "Aug 2025", value: 0 },
    { label: "Sep 2025", value: 4 },
    { label: "Oct 2025", value: 3 },
    { label: "Nov 2025", value: 3 },
  ];

  return (
    <div className="tm-page">
      <div className="tm-stats">
        {stats.map((s) => (
          <div key={s.label} className="tm-stat">
            <Kebab />
            <div className="tm-stat-value">{s.value}</div>
            <div className="tm-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="tm-grid">
        <Card title="Distribution of users">
          <PieDistribution active={activeUsers} suspended={suspendedUsers} />
        </Card>

        <Card title="Number of posts per month">
          <BarPostsPerMonth data={barData} />
        </Card>

        <Card title="User Activity">
          <HeatmapUserActivity />
        </Card>

        <Card title="Number of flagged posts">
          <LineFlaggedPosts data={lineData} />
        </Card>
      </div>
    </div>
  );
}
