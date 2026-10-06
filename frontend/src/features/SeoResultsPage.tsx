import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import AppProviders from "../components/AppProviders";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import { ErrorState, LoadingState } from "../components/common/StateViews";
import { api } from "../lib/api/client";
import { domainOf, formatDate, formatNumber, queryParam } from "../lib/format";
import { useApi } from "../lib/useApi";
import type { CompetitorResult, KeywordGap, KeywordResult, SearchIntent } from "../types/models";

const INTENT_COLORS: Record<SearchIntent, "default" | "info" | "success" | "secondary"> = {
  informational: "info",
  commercial: "secondary",
  transactional: "success",
  navigational: "default",
};

const num = { fontVariantNumeric: "tabular-nums" } as const;

function Score({ value, color = "primary" }: { value: number; color?: "primary" | "warning" | "success" }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 110 }}>
      <LinearProgress variant="determinate" value={value} color={color} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
      <Typography variant="body2" sx={{ ...num, width: 26, textAlign: "right" }}>
        {value}
      </Typography>
    </Box>
  );
}

function KeywordsTable({ rows }: { rows: KeywordResult[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Keyword</TableCell>
          <TableCell align="right">Monthly volume</TableCell>
          <TableCell>Difficulty</TableCell>
          <TableCell>Intent</TableCell>
          <TableCell align="right">Your rank</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((k) => (
          <TableRow key={k.keyword} hover>
            <TableCell sx={{ fontWeight: 500 }}>{k.keyword}</TableCell>
            <TableCell align="right" sx={num}>{formatNumber(k.searchVolume)}</TableCell>
            <TableCell>
              <Score value={k.difficulty} color={k.difficulty > 60 ? "warning" : "primary"} />
            </TableCell>
            <TableCell>
              <Chip label={k.intent} size="small" color={INTENT_COLORS[k.intent]} variant="outlined" />
            </TableCell>
            <TableCell align="right" sx={{ ...num, color: k.currentRank ? "text.primary" : "text.secondary" }}>
              {k.currentRank ?? "Not ranking"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CompetitorsTable({ rows }: { rows: CompetitorResult[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Competitor</TableCell>
          <TableCell>Keyword overlap</TableCell>
          <TableCell align="right">Shared keywords</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((c) => (
          <TableRow key={c.domain} hover>
            <TableCell sx={{ fontWeight: 500 }}>{c.domain}</TableCell>
            <TableCell sx={{ width: "40%" }}>
              <Score value={c.overlapScore} />
            </TableCell>
            <TableCell align="right" sx={num}>{c.sharedKeywords}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function GapsTable({ rows }: { rows: KeywordGap[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Keyword</TableCell>
          <TableCell align="right">Monthly volume</TableCell>
          <TableCell>Competitors ranking</TableCell>
          <TableCell>Opportunity</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((g) => (
          <TableRow key={g.keyword} hover>
            <TableCell sx={{ fontWeight: 500 }}>{g.keyword}</TableCell>
            <TableCell align="right" sx={num}>{formatNumber(g.searchVolume)}</TableCell>
            <TableCell>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {g.competitorsRanking.map((d) => (
                  <Chip key={d} label={d} size="small" />
                ))}
              </Box>
            </TableCell>
            <TableCell>
              <Score value={g.opportunityScore} color="success" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function loadResults(projectId: string) {
  const [project, runs] = await Promise.all([api.getProject(projectId), api.listRuns(projectId)]);
  const run = runs.find((r) => r.status === "COMPLETED");
  return { project, results: run ? await api.getResults(run.id) : null };
}

function SeoResults({ projectId }: { projectId: string }) {
  const { data, error } = useApi(() => loadResults(projectId), [projectId]);
  const [tab, setTab] = useState(0);

  const projectHref = `/projects/view?id=${encodeURIComponent(projectId)}`;
  const back = <Button href={projectHref} color="inherit">Back to project</Button>;

  if (error) return <ErrorState message={error} action={back} />;
  if (!data) return <LoadingState label="Loading SEO results…" />;

  const { project, results } = data;
  const domain = domainOf(project.websiteUrl);
  if (!results) return <ErrorState message="No completed research run yet for this project." action={back} />;

  const totalVolume = results.keywords.reduce((s, k) => s + k.searchVolume, 0);
  const avgDifficulty = Math.round(results.keywords.reduce((s, k) => s + k.difficulty, 0) / (results.keywords.length || 1));
  const ranking = results.keywords.filter((k) => k.currentRank).length;

  return (
    <>
      <PageHeader
        title="SEO Results"
        subtitle={`${domain} · generated ${formatDate(results.generatedAt)}`}
        breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: domain, href: projectHref }, { label: "SEO Results" }]}
        actions={<Button variant="outlined" href={projectHref}>Back to project</Button>}
      />

      <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
        <strong>Mock data.</strong> {results.summary}
      </Alert>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, mb: 3 }}>
        <StatCard label="Keywords found" value={results.keywords.length} hint={`${ranking} already ranking`} />
        <StatCard label="Total monthly volume" value={formatNumber(totalVolume)} />
        <StatCard label="Avg. difficulty" value={avgDifficulty} hint="0 = easy · 100 = hard" />
        <StatCard label="Keyword gaps" value={results.gaps.length} hint={`vs ${results.competitors.length} competitors`} />
      </Box>

      <Paper>
        <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }} variant="scrollable">
          <Tab label={`Keywords (${results.keywords.length})`} />
          <Tab label={`Competitors (${results.competitors.length})`} />
          <Tab label={`Keyword Gaps (${results.gaps.length})`} />
        </Tabs>
        <Box sx={{ overflowX: "auto" }}>
          {tab === 0 && <KeywordsTable rows={results.keywords} />}
          {tab === 1 && <CompetitorsTable rows={results.competitors} />}
          {tab === 2 && <GapsTable rows={results.gaps} />}
        </Box>
      </Paper>
    </>
  );
}

export default function SeoResultsPage() {
  const id = queryParam("id");
  return (
    <AppProviders>
      {id ? <SeoResults projectId={id} /> : <ErrorState message="No project selected." action={<Button href="/projects" color="inherit">Back to projects</Button>} />}
    </AppProviders>
  );
}
