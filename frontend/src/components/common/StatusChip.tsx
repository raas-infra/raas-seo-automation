import Chip, { type ChipProps } from "@mui/material/Chip";
import type { ProjectStatus } from "../../types/models";

const COLORS: Record<ProjectStatus, ChipProps["color"]> = {
  DRAFT: "default",
  QUEUED: "info",
  RUNNING: "warning",
  COMPLETED: "success",
  FAILED: "error",
};

export default function StatusChip({ status, size = "small" }: { status: ProjectStatus; size?: ChipProps["size"] }) {
  return (
    <Chip
      label={status}
      color={COLORS[status]}
      size={size}
      variant={status === "DRAFT" ? "outlined" : "filled"}
      sx={{ fontWeight: 600, letterSpacing: "0.03em", fontSize: "0.7rem" }}
    />
  );
}
