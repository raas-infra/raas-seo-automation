import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ErrorOutline from "@mui/icons-material/ErrorOutlineOutlined";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import BarChart from "@mui/icons-material/BarChart";
import AppProviders from "../components/AppProviders";
import PageHeader from "../components/common/PageHeader";
import StatusChip from "../components/common/StatusChip";
import { ErrorState, LoadingState } from "../components/common/StateViews";
import { api } from "../lib/api/client";
import { domainOf, formatDate, queryParam } from "../lib/format";
import { useApi } from "../lib/useApi";
import type { ResearchRun, ResearchStep } from "../types/models";

const POLL_MS = 1500;

function StepIcon({ status }: { status: ResearchStep["status"] }) {
  if (status === "DONE") return <CheckCircle color="success" fontSize="small" />;
  if (status === "RUNNING") return <CircularProgress size={18} thickness={5} />;
  if (status === "FAILED") return <ErrorOutline color="error" fontSize="small" />;
  return <RadioButtonUnchecked fontSize="small" sx={{ color: "text.disabled" }} />;
}

/** Polls the run until it reaches a final state. */
function useRunPolling(runId: string | undefined) {
  const [run, setRun] = useState<ResearchRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const poll = async () => {
      try {
        const next = await api.getRun(runId);
        if (stopped) return;
        setRun(next);
        if (next.status === "RUNNING" || next.status === "QUEUED") timer = setTimeout(poll, POLL_MS);
      } catch (err) {
        if (!stopped) setError(err instanceof Error ? err.message : String(err));
      }
    };
    poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [runId]);

  return { run, error };
}

function ResearchRunView({ projectId }: { projectId: string }) {
  const { data: project, error: projectError } = useApi(() => api.getProject(projectId), [projectId]);
  const { run, error: runError } = useRunPolling(project?.latestRunId);

  const projectHref = `/projects/view?id=${encodeURIComponent(projectId)}`;
  const resultsHref = `/projects/results?id=${encodeURIComponent(projectId)}`;
  const back = <Button href={projectHref} color="inherit">Back to project</Button>;

  const error = projectError ?? runError;
  if (error) return <ErrorState message={error} action={back} />;
  if (!project) return <LoadingState label="Loading research run…" />;
  if (!project.latestRunId)
    return <ErrorState message="Research has not been started for this project yet." action={back} />;
  if (!run) return <LoadingState label="Loading research run…" />;

  const domain = domainOf(project.websiteUrl);
  const active = run.status === "RUNNING" || run.status === "QUEUED";

  return (
    <>
      <PageHeader
        title="Research Run"
        subtitle={`SEO market research for ${domain}`}
        breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: domain, href: projectHref }, { label: "Research Run" }]}
      />

      <Paper sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 760 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h6" component="h2">
              Status
            </Typography>
            <StatusChip status={run.status} size="medium" />
          </Box>
          <Typography sx={{ fontWeight: 650, fontVariantNumeric: "tabular-nums" }} aria-live="polite">
            {run.progress}%
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={run.progress}
          color={run.status === "FAILED" ? "error" : run.status === "COMPLETED" ? "success" : "primary"}
          sx={{ height: 8, borderRadius: 4, mb: 3 }}
        />

        <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 1.75 }}>
          {run.steps.map((step) => (
            <Box component="li" key={step.key} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 22, display: "flex", justifyContent: "center" }}>
                <StepIcon status={step.status} />
              </Box>
              <Typography sx={{ fontWeight: step.status === "RUNNING" ? 600 : 400, color: step.status === "PENDING" ? "text.secondary" : "text.primary" }}>
                {step.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Started {formatDate(run.startedAt)}
          {run.completedAt && ` · Completed ${formatDate(run.completedAt)}`}
        </Typography>

        {active && (
          <Alert severity="info" sx={{ mt: 3 }}>
            Research is running. You can leave this page — progress is saved and will continue.
          </Alert>
        )}
        {run.status === "FAILED" && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {run.error ?? "The research run failed."}
          </Alert>
        )}
        {run.status === "COMPLETED" && (
          <Alert
            severity="success"
            sx={{ mt: 3, alignItems: "center" }}
            action={
              <Button variant="contained" color="success" size="small" startIcon={<BarChart />} href={resultsHref}>
                View SEO Results
              </Button>
            }
          >
            Research completed.
          </Alert>
        )}
      </Paper>
    </>
  );
}

export default function ResearchRunPage() {
  const id = queryParam("id");
  return (
    <AppProviders>
      {id ? <ResearchRunView projectId={id} /> : <ErrorState message="No project selected." action={<Button href="/projects" color="inherit">Back to projects</Button>} />}
    </AppProviders>
  );
}
