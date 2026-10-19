import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import AppProviders from "../components/AppProviders";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import { ErrorState, LoadingState } from "../components/common/StateViews";
import WeeklyChart from "../components/performance/WeeklyChart";
import { api } from "../lib/api/client";
import { domainOf, queryParam } from "../lib/format";
import { compare, formatMetric, formatWeek, METRICS, type Direction, type MetricKey } from "../lib/performance";
import { useApi } from "../lib/useApi";

const num = { fontVariantNumeric: "tabular-nums" } as const;
const DIRECTION_COLOR: Record<Direction, "success" | "error" | "default"> = { improved: "success", declined: "error", flat: "default" };

function DeltaChip({ metric, delta, direction }: { metric: string; delta: number; direction: Direction }) {
  const sign = delta > 0 ? "+" : "";
  return (
    <Chip
      size="small"
      color={DIRECTION_COLOR[direction]}
      variant="outlined"
      data-testid="delta-chip"
      data-direction={direction}
      aria-label={`${metric} ${direction} by ${Math.abs(delta)} vs last week`}
      label={`${direction === "flat" ? "No change" : `${sign}${delta}`} · ${direction}`}
    />
  );
}

function WeeklyPerformance({ projectId }: { projectId: string }) {
  const { data: project, error: projectError } = useApi(() => api.getProject(projectId), [projectId]);
  const { data: perf, error: perfError, loading } = useApi(() => api.getWeeklyPerformance(projectId), [projectId]);
  const [metricKey, setMetricKey] = useState<MetricKey>("organicClicks");

  const projectHref = `/projects/view?id=${encodeURIComponent(projectId)}`;
  const back = <Button href={projectHref} color="inherit">Back to project</Button>;
  if (projectError || perfError)
    return <ErrorState message={(projectError ?? perfError)!} action={<Button href="/projects" color="inherit">Back to projects</Button>} />;
  if (!project || !perf || loading) return <LoadingState label="Loading weekly performance…" />;
  if (perf.weeks.length < 2) return <ErrorState message="Not enough weekly data to compare yet." action={back} />;

  const domain = domainOf(project.websiteUrl);
  const latest = perf.weeks[perf.weeks.length - 1];
  const previous = perf.weeks[perf.weeks.length - 2];
  const metric = METRICS.find((m) => m.key === metricKey)!;
  const rows = [...perf.weeks].reverse(); // newest first

  return (
    <>
      <PageHeader
        title="Weekly Performance"
        subtitle={`${domain} · week of ${formatWeek(latest.weekStart)} vs ${formatWeek(previous.weekStart)}`}
        breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: domain, href: projectHref }, { label: "Weekly Performance" }]}
        actions={<Button variant="outlined" href={projectHref}>Back to project</Button>}
      />

      <Alert severity="warning" variant="outlined" sx={{ mb: 3 }} data-testid="mock-banner">
        <strong>Mock / simulated data.</strong> These numbers are generated locally for demonstration. They are not from Google Search
        Console, a SERP provider or a technical audit.
      </Alert>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" }, mb: 3 }}>
        {METRICS.map((m) => {
          const c = compare(m, latest, previous);
          return (
            <Box key={m.key} data-testid={`summary-${m.key}`}>
              <StatCard
                label={`${m.label} (simulated)`}
                value={formatMetric(m, c.current)}
                hint={`Last week ${formatMetric(m, c.previous)}${m.lowerIsBetter ? " · lower is better" : ""}`}
              />
              <Box sx={{ mt: 1 }}>
                <DeltaChip metric={m.label} delta={c.delta} direction={c.direction} />
              </Box>
            </Box>
          );
        })}
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2, mb: 2 }}>
          <Typography variant="h6" component="h2">
            Weekly trend (simulated)
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={metricKey}
            onChange={(_, v: MetricKey | null) => v && setMetricKey(v)}
            aria-label="Chart metric"
            sx={{ flexWrap: "wrap" }}
          >
            {METRICS.map((m) => (
              <ToggleButton key={m.key} value={m.key}>
                {m.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <WeeklyChart weeks={perf.weeks} metric={metric} />
        <Typography variant="caption" color="text.secondary">
          {metric.lowerIsBetter ? "Lower values are better, so the axis is inverted: higher on the chart means improvement. " : ""}
          Future source: {metric.source}.
        </Typography>
      </Paper>

      <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
        Week-by-week comparison (simulated)
      </Typography>
      <Paper sx={{ overflowX: "auto" }}>
        <Table aria-label="Weekly comparison">
          <TableHead>
            <TableRow>
              <TableCell>Week starting</TableCell>
              <TableCell align="right">Clicks</TableCell>
              <TableCell align="right">Impressions</TableCell>
              <TableCell align="right">Avg. position</TableCell>
              <TableCell align="right">Top-10 keywords</TableCell>
              <TableCell align="right">Critical</TableCell>
              <TableCell align="right">Warning</TableCell>
              <TableCell align="right">Notice</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "text.secondary", fontWeight: 400 }}>Future source</TableCell>
              <TableCell align="right" sx={{ color: "text.secondary", fontWeight: 400 }}>Search Console</TableCell>
              <TableCell align="right" sx={{ color: "text.secondary", fontWeight: 400 }}>Search Console</TableCell>
              <TableCell align="right" sx={{ color: "text.secondary", fontWeight: 400 }}>Search Console</TableCell>
              <TableCell align="right" sx={{ color: "text.secondary", fontWeight: 400 }}>SERP provider</TableCell>
              <TableCell align="right" colSpan={3} sx={{ color: "text.secondary", fontWeight: 400 }}>Technical audit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((w, i) => (
              <TableRow key={w.weekStart} hover data-testid="week-row" data-week={w.weekStart} sx={{ "&:last-child td": { border: 0 } }}>
                <TableCell sx={{ fontWeight: 500 }}>
                  {formatWeek(w.weekStart)}
                  {i === 0 && <Chip label="Latest" size="small" sx={{ ml: 1 }} />}
                </TableCell>
                <TableCell align="right" sx={num}>{w.organicClicks.toLocaleString()}</TableCell>
                <TableCell align="right" sx={num}>{w.impressions.toLocaleString()}</TableCell>
                <TableCell align="right" sx={num}>{w.avgPosition.toFixed(1)}</TableCell>
                <TableCell align="right" sx={num}>{w.top10Keywords}</TableCell>
                <TableCell align="right" sx={num}>{w.technicalIssues.critical}</TableCell>
                <TableCell align="right" sx={num}>{w.technicalIssues.warning}</TableCell>
                <TableCell align="right" sx={num}>{w.technicalIssues.notice}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}

export default function WeeklyPerformancePage() {
  const id = queryParam("id");
  return (
    <AppProviders>
      {id ? <WeeklyPerformance projectId={id} /> : <ErrorState message="No project selected." action={<Button href="/projects" color="inherit">Back to projects</Button>} />}
    </AppProviders>
  );
}
