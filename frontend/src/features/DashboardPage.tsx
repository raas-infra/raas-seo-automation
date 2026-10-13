import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Add from "@mui/icons-material/Add";
import AppProviders from "../components/AppProviders";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateViews";
import ProjectsTable from "../components/ProjectsTable";
import { api } from "../lib/api/client";
import { resetMockData } from "../lib/api/mockClient";
import { useApi } from "../lib/useApi";

function Dashboard() {
  const { data: projects, error, loading } = useApi(() => api.listProjects());

  const count = (status: string) => projects?.filter((p) => p.status === status).length ?? 0;

  const handleReset = () => {
    if (!window.confirm("Reset all mock projects and runs back to the demo data?")) return;
    resetMockData();
    window.location.reload();
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your SEO market research projects."
        actions={
          <Button variant="contained" startIcon={<Add />} href="/projects/new">
            Create Project
          </Button>
        }
      />

      {error && <ErrorState message={error} />}
      {loading && !projects && <LoadingState />}

      {projects && (
        <>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, mb: 4 }}>
            <StatCard label="Total projects" value={projects.length} />
            <StatCard label="Running" value={count("RUNNING")} hint="Research in progress" />
            <StatCard label="Completed" value={count("COMPLETED")} hint="Results available" />
            <StatCard label="Drafts" value={count("DRAFT")} hint="Not yet researched" />
          </Box>

          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 1.5 }}>
            <Typography variant="h6" component="h2">
              Recent projects
            </Typography>
            <Button href="/projects" size="small">
              View all
            </Button>
          </Box>

          {projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Create your first project to start SEO market research."
              action={
                <Button variant="contained" href="/projects/new" startIcon={<Add />}>
                  Create Project
                </Button>
              }
            />
          ) : (
            <ProjectsTable projects={projects.slice(0, 5)} />
          )}

          <Box sx={{ mt: 4, display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
            <Typography variant="caption">Phase 1 uses local mock data stored in this browser.</Typography>
            <Button size="small" color="inherit" onClick={handleReset} sx={{ fontSize: "0.75rem" }}>
              Reset demo data
            </Button>
          </Box>
        </>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <AppProviders>
      <Dashboard />
    </AppProviders>
  );
}
