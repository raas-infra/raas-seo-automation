import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, actions }: Props) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && (
        <Breadcrumbs sx={{ mb: 1, fontSize: "0.85rem" }}>
          {breadcrumbs.map((c) =>
            c.href ? (
              <Link key={c.label} href={c.href} underline="hover" color="inherit">
                {c.label}
              </Link>
            ) : (
              <Typography key={c.label} color="text.primary" sx={{ fontSize: "inherit" }}>
                {c.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}
      <Box sx={{ display: "flex", alignItems: { sm: "center" }, justifyContent: "space-between", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h1" sx={{ wordBreak: "break-word" }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography component="div" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: "flex", gap: 1, flexShrink: 0, flexWrap: "wrap" }}>{actions}</Box>}
      </Box>
    </Box>
  );
}
