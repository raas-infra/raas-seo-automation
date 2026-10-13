import type { ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 6, justifyContent: "center", color: "text.secondary" }}>
      <CircularProgress size={20} />
      <Typography>{label}</Typography>
    </Box>
  );
}

export function ErrorState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <Alert severity="error" action={action} sx={{ alignItems: "center" }}>
      {message}
    </Alert>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <Paper sx={{ py: 6, px: 3, textAlign: "center" }}>
      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mt: 0.5, mb: action ? 2.5 : 0 }}>
          {description}
        </Typography>
      )}
      {action}
    </Paper>
  );
}
