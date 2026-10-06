// Rendered on the server only (no client directive) — static navigation, zero JS.
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { ThemeProvider } from "@mui/material/styles";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import AddCircleOutline from "@mui/icons-material/AddCircleOutlineOutlined";
import Insights from "@mui/icons-material/Insights";
import { theme } from "../../theme/theme";

const NAV = [
  { href: "/", label: "Dashboard", icon: <DashboardOutlined fontSize="small" />, match: (p: string) => p === "/" },
  {
    href: "/projects",
    label: "Projects",
    icon: <FolderOutlined fontSize="small" />,
    match: (p: string) => p.startsWith("/projects") && !p.startsWith("/projects/new"),
  },
  {
    href: "/projects/new",
    label: "Create Project",
    icon: <AddCircleOutline fontSize="small" />,
    match: (p: string) => p.startsWith("/projects/new"),
  },
];

export default function SideNav({ currentPath }: { currentPath: string }) {
  const path = currentPath.replace(/\/$/, "") || "/";
  return (
    <ThemeProvider theme={theme}>
      <Box component="nav" aria-label="Main" sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 1, py: 1.5, mb: 1 }}>
          <Insights color="primary" />
          <Box>
            <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>SEO Research</Typography>
            <Typography variant="caption" color="text.secondary">
              RAAS internal tool
            </Typography>
          </Box>
        </Box>
        <List dense disablePadding>
          {NAV.map((item) => {
            const active = item.match(path);
            return (
              <ListItemButton
                key={item.href}
                component="a"
                href={item.href}
                selected={active}
                aria-current={active ? "page" : undefined}
                sx={{ borderRadius: 1.5, mb: 0.5, "&.Mui-selected": { bgcolor: "rgba(29,78,216,0.08)", color: "primary.main" } }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: active ? "primary.main" : "text.secondary" }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: active ? 600 : 500 } } }} />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </ThemeProvider>
  );
}
