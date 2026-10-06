import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { Project } from "../types/models";
import { COUNTRIES, LANGUAGES, labelFor } from "../mocks/options";
import { domainOf, formatDate } from "../lib/format";
import StatusChip from "./common/StatusChip";

export default function ProjectsTable({ projects }: { projects: Project[] }) {
  return (
    <TableContainer component={Paper}>
      <Table size="medium">
        <TableHead>
          <TableRow>
            <TableCell>Website</TableCell>
            <TableCell>Market</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Last updated</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((p) => {
            const href = `/projects/view?id=${encodeURIComponent(p.id)}`;
            return (
              <TableRow
                key={p.id}
                hover
                sx={{ cursor: "pointer", "&:last-child td": { border: 0 } }}
                onClick={() => (window.location.href = href)}
              >
                <TableCell>
                  <Link href={href} underline="hover" sx={{ fontWeight: 600 }} onClick={(e) => e.stopPropagation()}>
                    {domainOf(p.websiteUrl)}
                  </Link>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {p.businessDescription}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ whiteSpace: "nowrap" }}>{labelFor(COUNTRIES, p.targetCountry)}</Box>
                  <Typography variant="body2" color="text.secondary">
                    {labelFor(LANGUAGES, p.targetLanguage)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <StatusChip status={p.status} />
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>
                  {formatDate(p.updatedAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
