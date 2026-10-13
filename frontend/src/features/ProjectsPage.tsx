import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Add from "@mui/icons-material/Add";
import Search from "@mui/icons-material/Search";
import AppProviders from "../components/AppProviders";
import PageHeader from "../components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateViews";
import ProjectsTable from "../components/ProjectsTable";
import { api } from "../lib/api/client";
import { useApi } from "../lib/useApi";

function Projects() {
  const { data: projects, error, loading } = useApi(() => api.listProjects());
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered =
    projects?.filter((p) => !q || p.websiteUrl.toLowerCase().includes(q) || p.businessDescription.toLowerCase().includes(q)) ?? [];

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="All websites set up for SEO market research."
        actions={
          <Button variant="contained" startIcon={<Add />} href="/projects/new">
            Create Project
          </Button>
        }
      />

      {error && <ErrorState message={error} />}
      {loading && !projects && <LoadingState />}

      {projects &&
        (projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create a project to start researching a website's market."
            action={
              <Button variant="contained" href="/projects/new" startIcon={<Add />}>
                Create Project
              </Button>
            }
          />
        ) : (
          <>
            <Box sx={{ mb: 2, maxWidth: 360 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by website or description"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
            {filtered.length === 0 ? (
              <EmptyState title="No matching projects" description={`Nothing matches “${query}”.`} />
            ) : (
              <ProjectsTable projects={filtered} />
            )}
          </>
        ))}
    </>
  );
}

export default function ProjectsPage() {
  return (
    <AppProviders>
      <Projects />
    </AppProviders>
  );
}
