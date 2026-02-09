import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

/** ---------- Components ---------- **/

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
        <button className="tm-kebab tm-kebab--static" aria-label="More">
          ⋯
        </button>
      </div>
      {children}
    </section>
  );
}

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

/** ---------- Main Overview ---------- **/

export default function Overview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    pendingTickets: 0,
  });

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/overview", {
          withCredentials: true,
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch overview", err);
      }
    };
    fetchOverview();
  }, []);

  return (
    <div className="tm-page">
      <div className="tm-stats">
        <div className="tm-stat">
          <Kebab />
          <div className="tm-stat-value">{stats.totalUsers}</div>
          <div className="tm-stat-label">Total Users</div>
        </div>

        <div className="tm-stat">
          <Kebab />
          <div className="tm-stat-value">{stats.activeUsers}</div>
          <div className="tm-stat-label">Active Users</div>
        </div>

        <div className="tm-stat">
          <Kebab />
          <div className="tm-stat-value">{stats.suspendedUsers}</div>
          <div className="tm-stat-label">Suspended Users</div>
        </div>

        <div className="tm-stat">
          <Kebab />
          <div className="tm-stat-value">{stats.pendingTickets}</div>
          <div className="tm-stat-label">Pending Tickets</div>
        </div>
      </div>

      <div className="tm-grid">
        <Card title="Distribution of Users">
          <PieDistribution active={stats.activeUsers} suspended={stats.suspendedUsers} />
        </Card>

        <Card title="User Activity">
          <HeatmapUserActivity />
        </Card>
      </div>
    </div>
  );
}