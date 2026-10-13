import type { ReactNode } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Paper sx={{ p: 2.5, height: "100%" }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "1.75rem", fontWeight: 650, mt: 0.5, fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Paper>
  );
}
