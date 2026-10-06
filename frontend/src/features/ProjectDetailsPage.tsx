import { useState, type ReactNode } from "react";
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
import Typography from "@mui/material/Typography";
import PlayArrow from "@mui/icons-material/PlayArrow";
import BarChart from "@mui/icons-material/BarChart";
import OpenInNew from "@mui/icons-material/OpenInNew";
import AppProviders from "../components/AppProviders";
import PageHeader from "../components/common/PageHeader";
import StatusChip from "../components/common/StatusChip";
import { ErrorState, LoadingState } from "../components/common/StateViews";
import { api } from "../lib/api/client";
import { domainOf, formatDate, queryParam } from "../lib/format";
import { useApi } from "../lib/useApi";
import { COUNTRIES, LANGUAGES, SEARCH_ENGINES, labelFor } from "../mocks/options";
import type { Project, ResearchRun } from "../types/models";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.5 }}>{children}</Box>
    </Box>
  );
}

function ChipList({ items }: { items?: string[] }) {
  if (!items?.length) return <Typography color="text.secondary">None provided</Typography>;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {items.map((i) => (
        <Chip key={i} label={i} size="small" variant="outlined" />
      ))}
    </Box>
  );
}

function ProjectDetails({ id }: { id: string }) {
  const { data, error, loading } = useApi(
    () => Promise.all([api.getProject(id), api.listRuns(id)]),
    [id],
  );
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  if (error) return <ErrorState message={error} action={<Button href="/projects" color="inherit">Back to projects</Button>} />;
  if (loading || !data) return <LoadingState label="Loading project…" />;

  const [project, runs]: [Project, ResearchRun[]] = data;
  const running = project.status === "RUNNING";
  const latestCompleted = runs.find((r) => r.status === "COMPLETED");
  const runHref = `/projects/run?id=${encodeURIComponent(project.id)}`;

  const handleStart = async () => {
    setStarting(true);
    setStartError(null);
    try {
      await api.startResearch(project.id);
      window.location.href = runHref;
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Could not start research.");
      setStarting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={domainOf(project.websiteUrl)}
        subtitle={
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
            <StatusChip status={project.status} /> Created {formatDate(project.createdAt)}
          </Box>
        }
        breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: domainOf(project.websiteUrl) }]}
        actions={
          <>
            {latestCompleted && (
              <Button variant="outlined" startIcon={<BarChart />} href={`/projects/results?id=${encodeURIComponent(project.id)}`}>
                View SEO Results
              </Button>
            )}
            {running ? (
              <Button variant="contained" color="warning" href={runHref}>
                View research status
              </Button>
            ) : (
              <Button variant="contained" startIcon={<PlayArrow />} onClick={handleStart} disabled={starting}>
                {starting ? "Starting…" : latestCompleted ? "Run research again" : "Start Research"}
              </Button>
            )}
          </>
        }
      />

      {startError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {startError}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2.5, sm: 3 }, mb: 3 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2.5 }}>
          Project setup
        </Typography>
        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
          <Detail label="Website">
            <Box component="a" href={project.websiteUrl} target="_blank" rel="noreferrer" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "primary.main", wordBreak: "break-all" }}>
              {project.websiteUrl} <OpenInNew sx={{ fontSize: 14 }} />
            </Box>
          </Detail>
          <Detail label="Target country">{labelFor(COUNTRIES, project.targetCountry)}</Detail>
          <Detail label="Target language">{labelFor(LANGUAGES, project.targetLanguage)}</Detail>
          <Detail label="Search engine">{labelFor(SEARCH_ENGINES, project.targetSearchEngine ?? "google")}</Detail>
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Detail label="Business description">
              <Typography>{project.businessDescription}</Typography>
            </Detail>
          </Box>
          <Box sx={{ gridColumn: { md: "span 2" } }}>
            <Detail label="Seed keywords">
              <ChipList items={project.seedKeywords} />
            </Detail>
          </Box>
          <Box sx={{ gridColumn: { md: "span 2" } }}>
            <Detail label="Known competitors">
              <ChipList items={project.knownCompetitors} />
            </Detail>
          </Box>
        </Box>
      </Paper>

      <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
        Research runs
      </Typography>
      {runs.length === 0 ? (
        <Paper sx={{ p: 3, color: "text.secondary" }}>
          No research has been run yet. Click <strong>Start Research</strong> to begin.
        </Paper>
      ) : (
        <Paper sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Run</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {runs.map((run, i) => (
                <TableRow key={run.id} sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>#{runs.length - i}</TableCell>
                  <TableCell>
                    <StatusChip status={run.status} />
                  </TableCell>
                  <TableCell>{formatDate(run.startedAt)}</TableCell>
                  <TableCell>{formatDate(run.completedAt)}</TableCell>
                  <TableCell align="right">
                    {i === 0 && (
                      <Button size="small" href={run.status === "COMPLETED" ? `/projects/results?id=${encodeURIComponent(project.id)}` : runHref}>
                        {run.status === "COMPLETED" ? "Results" : "Status"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </>
  );
}

export default function ProjectDetailsPage() {
  const id = queryParam("id");
  return (
    <AppProviders>
      {id ? <ProjectDetails id={id} /> : <ErrorState message="No project selected." action={<Button href="/projects" color="inherit">Back to projects</Button>} />}
    </AppProviders>
  );
}
