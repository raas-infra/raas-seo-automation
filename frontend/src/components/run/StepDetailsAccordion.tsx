import type { ReactNode } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Chip, { type ChipProps } from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import PlayCircleOutlined from "@mui/icons-material/PlayCircleOutlined";
import { formatDate } from "../../lib/format";
import type { ResearchStep, StepExecutionDetail } from "../../types/models";

// Title case on purpose: the run-level chip uses upper case (RUNNING, COMPLETED) and tests match those exactly.
const STATUS_CHIP: Record<ResearchStep["status"], { label: string; color: ChipProps["color"] }> = {
  PENDING: { label: "Pending", color: "default" },
  RUNNING: { label: "Running", color: "warning" },
  DONE: { label: "Done", color: "success" },
  FAILED: { label: "Failed", color: "error" },
};

const heading = { fontWeight: 600, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "text.secondary", mb: 0.75 } as const;

interface Props {
  step: ResearchStep;
  /** Simulated details; null until first loaded. */
  detail: StepExecutionDetail | null;
  icon: ReactNode;
  expanded: boolean;
  onToggle: (key: ResearchStep["key"], expanded: boolean) => void;
}

export default function StepDetailsAccordion({ step, detail, icon, expanded, onToggle }: Props) {
  const chip = STATUS_CHIP[step.status];
  const panelId = `step-${step.key}`;

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => onToggle(step.key, isExpanded)}
      disableGutters
      square
      slotProps={{ transition: { unmountOnExit: true } }}
      data-testid={`step-details-${step.key}`}
      sx={{ border: 0, bgcolor: "transparent", "&::before": { display: "none" } }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls={`${panelId}-content`}
        id={`${panelId}-header`}
        sx={{ px: 0, minHeight: 40, "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1.5, my: 0.75 } }}
      >
        <Box sx={{ width: 22, display: "flex", justifyContent: "center" }}>{icon}</Box>
        <Typography sx={{ fontWeight: step.status === "RUNNING" ? 600 : 400, color: step.status === "PENDING" ? "text.secondary" : "text.primary" }}>
          {step.label}
        </Typography>
        <Chip label={chip.label} color={chip.color} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
      </AccordionSummary>

      <AccordionDetails id={`${panelId}-content`} sx={{ pl: 5, pt: 0, pb: 2, display: "grid", gap: 2 }}>
        {!detail ? (
          <Typography variant="body2" color="text.secondary">Loading details…</Typography>
        ) : detail.status === "PENDING" ? (
          <Typography variant="body2" color="text.secondary">Not started yet.</Typography>
        ) : (
          <>
            <Box>
              <Typography component="h3" sx={heading}>Actions performed</Typography>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none", display: "grid", gap: 0.5 }}>
                {detail.actions.map((a) => (
                  <Box component="li" key={a.label} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    {a.state === "done" ? (
                      <CheckCircleOutlined sx={{ fontSize: 16, mt: "3px", color: "success.main" }} />
                    ) : (
                      <PlayCircleOutlined sx={{ fontSize: 16, mt: "3px", color: "warning.main" }} />
                    )}
                    <Typography variant="body2">
                      {a.label}
                      {a.state === "active" && <Typography component="span" variant="body2" color="text.secondary"> (in progress)</Typography>}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box>
              <Typography component="h3" sx={heading}>Results</Typography>
              {detail.results.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {detail.status === "FAILED" ? "No results — this stage failed." : "Pending — results appear when this stage finishes."}
                </Typography>
              ) : (
                <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "max-content 1fr", columnGap: 2, rowGap: 0.5 }}>
                  {detail.results.map((r) => (
                    <Box key={r.label} sx={{ display: "contents" }}>
                      <Typography component="dt" variant="body2" color="text.secondary">{r.label}</Typography>
                      <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{r.value}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Box>
              <Typography component="h3" sx={heading}>Timing</Typography>
              <Typography variant="body2">
                Started {formatDate(detail.startedAt)}
                {detail.completedAt && ` · Finished ${formatDate(detail.completedAt)}`}
                {detail.durationMs !== undefined && ` · ${detail.durationMs / 1000}s`}
              </Typography>
            </Box>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
