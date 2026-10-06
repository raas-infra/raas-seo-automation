import { useState, type SubmitEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AppProviders from "../components/AppProviders";
import PageHeader from "../components/common/PageHeader";
import { api } from "../lib/api/client";
import {
  EMPTY_PROJECT_FORM,
  toCreateProjectInput,
  validateProjectForm,
  type ProjectFormErrors,
  type ProjectFormValues,
} from "../lib/validation";
import { COUNTRIES, LANGUAGES, SEARCH_ENGINES } from "../mocks/options";

function CreateProject() {
  const [values, setValues] = useState<ProjectFormValues>(EMPTY_PROJECT_FORM);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = (field: keyof ProjectFormValues) => (e: { target: { value: string } }) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    if (attempted) setErrors(validateProjectForm(next));
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setAttempted(true);
    const found = validateProjectForm(values);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      document.getElementById(`field-${firstInvalid}`)?.focus();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const project = await api.createProject(toCreateProjectInput(values));
      window.location.href = `/projects/view?id=${encodeURIComponent(project.id)}`;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not create the project.");
      setSubmitting(false);
    }
  };

  const field = (name: keyof ProjectFormValues) => ({
    id: `field-${name}`,
    name,
    value: values[name],
    onChange: set(name),
    error: Boolean(errors[name]),
    fullWidth: true,
  });

  return (
    <>
      <PageHeader
        title="Create Project"
        subtitle="Tell us about the website and the market you want to research."
        breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: "Create Project" }]}
      />

      <Paper component="form" noValidate onSubmit={handleSubmit} sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 820 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <Typography variant="h6" component="h2">
          Website &amp; market
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Required
        </Typography>

        <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          <Box sx={{ gridColumn: "1 / -1" }}>
            <TextField
              {...field("websiteUrl")}
              label="Website URL"
              placeholder="https://example.com"
              required
              type="url"
              autoComplete="url"
              helperText={errors.websiteUrl ?? "The site you want to research."}
            />
          </Box>
          <TextField {...field("targetCountry")} select label="Target Country" required helperText={errors.targetCountry ?? " "}>
            {COUNTRIES.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField {...field("targetLanguage")} select label="Target Language" required helperText={errors.targetLanguage ?? " "}>
            {LANGUAGES.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ gridColumn: "1 / -1" }}>
            <TextField
              {...field("businessDescription")}
              label="Business Description"
              required
              multiline
              minRows={3}
              placeholder="What does the business sell, to whom, and where?"
              helperText={errors.businessDescription ?? "A few sentences about products, services and customers."}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3.5 }} />

        <Typography variant="h6" component="h2">
          Research hints
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Optional. These help focus the research.
        </Typography>

        <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          <TextField
            {...field("seedKeywords")}
            label="Seed Keywords"
            multiline
            minRows={2}
            placeholder="coffee subscription, single origin coffee"
            helperText={errors.seedKeywords ?? "Comma or line separated."}
          />
          <TextField
            {...field("knownCompetitors")}
            label="Known Competitors"
            multiline
            minRows={2}
            placeholder="competitor.com, another-rival.com"
            helperText={errors.knownCompetitors ?? "Domains or URLs, comma or line separated."}
          />
          <TextField
            {...field("targetSearchEngine")}
            select
            label="Target Search Engine"
            helperText="Defaults to Google."
          >
            <MenuItem value="">
              <em>Default (Google)</em>
            </MenuItem>
            {SEARCH_ENGINES.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 4 }}>
          <Button href="/projects" color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Creating…" : "Create Project"}
          </Button>
        </Box>
      </Paper>
    </>
  );
}

export default function CreateProjectPage() {
  return (
    <AppProviders>
      <CreateProject />
    </AppProviders>
  );
}
