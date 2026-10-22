import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { formatMetric, formatWeek, type MetricDef } from "../../lib/performance";
import type { WeeklyMetrics } from "../../types/models";

const W = 720;
const H = 260;
const PAD = { top: 16, right: 20, bottom: 40, left: 64 };

/** Dependency-free SVG line chart. For lower-is-better metrics the y-axis is inverted so "up" always means better. */
export default function WeeklyChart({ weeks, metric }: { weeks: WeeklyMetrics[]; metric: MetricDef }) {
  const theme = useTheme();
  const values = weeks.map(metric.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const lo = min - span * 0.1;
  const hi = max + span * 0.1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (weeks.length === 1 ? innerW / 2 : (i / (weeks.length - 1)) * innerW);
  const norm = (v: number) => (v - lo) / (hi - lo);
  const y = (v: number) => PAD.top + (metric.lowerIsBetter ? norm(v) : 1 - norm(v)) * innerH;
  const ticks = [0, 0.5, 1].map((t) => lo + t * (hi - lo));
  const path = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const label = `Simulated weekly line chart of ${metric.label}: ${weeks
    .map((w, i) => `${formatWeek(w.weekStart)} ${formatMetric(metric, values[i])}`)
    .join(", ")}`;

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      <svg
        role="img"
        aria-label={label}
        data-testid="weekly-chart"
        data-metric={metric.key}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", minWidth: 480, height: "auto", display: "block" }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={theme.palette.divider} />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={theme.palette.text.secondary}>
              {formatMetric(metric, t)}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke={theme.palette.primary.main} strokeWidth="2.5" strokeLinejoin="round" />
        {weeks.map((w, i) => (
          <g key={w.weekStart}>
            <circle cx={x(i)} cy={y(values[i])} r="4" fill={theme.palette.primary.main} data-testid="chart-point" />
            <text x={x(i)} y={H - 16} textAnchor="middle" fontSize="11" fill={theme.palette.text.secondary}>
              {new Date(`${w.weekStart}T00:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" })}
            </text>
          </g>
        ))}
      </svg>
    </Box>
  );
}
