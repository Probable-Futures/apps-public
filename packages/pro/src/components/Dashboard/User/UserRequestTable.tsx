import { useEffect, useMemo, useState } from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Paper, Box, Typography, IconButton, Chip } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import Editor, { ContentEditableEvent } from "react-simple-wysiwyg";

import { UserRequestNode, UserAccessRequestResponse, RequestField } from "./UserRequests";
import { requestUserAccessFormFields } from "../../../consts/forms";
import { isDateString } from "../../../utils/date";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "10px 12px",
    whiteSpace: "nowrap",
    borderBottom: "none",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 13,
    padding: "8px 12px",
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    verticalAlign: "top",
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: "background-color 0.15s ease",
  "&:nth-of-type(even)": {
    backgroundColor: theme.palette.grey[50],
  },
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

type Props = {
  data: UserAccessRequestResponse;
  onDiscard: (userRequest: UserRequestNode, note: string) => void;
  onSend: (userRequest: UserRequestNode, note: string) => void;
  offset: number;
  setOffset: (offset: number) => void;
  onPageChange: (offset: number) => void;
  isLoading: boolean;
  itemsPerPage: number;
};

const defaultNoteValue = `<p> I noticed you signed up to use our data and maps. I know it can be helpful to get a walkthrough when learning how they work. If you'd like, I would be happy to meet on a call to give you a guided demo or answer any questions. You can <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2TEZX3fp1ty-JZr8iIVE5K8tmEE8AAyDLXvAm8Iqn1bo4xEWDtuw1rC_AAt7maw6iiybODG3mH">schedule a time on my calendar here</a>.</p>
    <p>
      Happy to answer any questions. Thanks for your interest in exploring the risks and consequences of climate change.
    </p>
    <br/>
    <p>
      Peter
    </p>
    `;

const emailSignature = `
  <br />
  <div style="margin:0in;line-height:19.2px;font-size:12pt;font-family:Calibri,sans-serif;color:rgb(0,0,0)">
    <span style="font-family:Helvetica;color:rgb(42,23,45)">—</span>
    <span style="font-family:Helvetica;color:rgb(133,31,255)">—</span>
    <span style="font-family:Helvetica;color:rgb(241,128,60)">—</span>
  </div>
  <div style="margin:0in;line-height:19.2px;font-size:12pt;font-family:Calibri,sans-serif;color:rgb(0,0,0)">
    <b style="font-family:Calibri,sans-serif">
      <span style="font-size:7.5pt;line-height:12px;font-family:Helvetica;color:rgb(42,23,45)">
        <a href="https://probablefutures.org/" style="font-family:Helvetica;color:rgb(17,85,204)" target="_blank">
          Probable Futures
        </a>
      </span>
    </b>
  </div>
  <div style="margin:0in;line-height:19.2px;font-size:12pt;font-family:Calibri,sans-serif;color:rgb(0,0,0)">
    <span style="font-size:x-small;font-family:Calibri,sans-serif">Peter Croce, Director of Product</span>
  </div>
  <div style="margin:0in;line-height:19.2px;font-family:Calibri,sans-serif;color:rgb(0,0,0)">
    <span style="font-size:x-small;font-family:Calibri,sans-serif">he/him</span>
    <font size="1" style="font-family:Calibri,sans-serif;color:rgb(0,0,0)"><br></font>
  </div>
`;

const getFormFieldValueByName = (name: string, formFields: Record<string, RequestField>) => {
  for (const key in formFields) {
    if (formFields.hasOwnProperty(key)) {
      const field = formFields[key];
      if (field.name === name) {
        return field.value;
      }
    }
  }
};

const UserRequestTable = ({
  data,
  onDiscard,
  onSend,
  offset,
  setOffset,
  onPageChange,
  isLoading,
  itemsPerPage,
}: Props) => {
  const [notes, setNotes] = useState<{ [nodeId: string]: string }>({});

  const { nodes, pageInfo, totalCount } = data.viewUserAccessRequests;

  const cellValue = (value: any) => {
    if (typeof value === "string") {
      if (isDateString(value)) {
        const dateObject = new Date(value);
        const year = dateObject.getUTCFullYear();
        const month = String(dateObject.getUTCMonth() + 1).padStart(2, "0");
        const day = String(dateObject.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      return value;
    } else if (Array.isArray(value)) {
      return (value as Array<any>).map((v) => v.name).join(", ");
    } else if (value?.name) {
      return value.name;
    }
    return value;
  };

  const enrichedData = useMemo(
    () =>
      nodes.map((node) => {
        const note =
          notes[node.id] ??
          `<p>Hi ${cellValue(getFormFieldValueByName("First name", node.formFields))},</p>` +
            defaultNoteValue +
            emailSignature;
        return { ...node, note };
      }),
    [nodes, notes],
  );

  useEffect(() => {
    const defaultNotes: { [nodeId: string]: string } = {};
    nodes.forEach((node) => {
      defaultNotes[node.id] =
        `<p>Hi ${cellValue(getFormFieldValueByName("First name", node.formFields))},</p>` +
        defaultNoteValue +
        emailSignature;
    });

    setNotes(defaultNotes);
  }, [nodes]);

  const handleNoteChange = (event: ContentEditableEvent, userRequest: UserRequestNode) => {
    const newNotes = { ...notes, [userRequest.id]: event.target.value };
    setNotes(newNotes);
  };

  const rangeStart = offset + 1;
  const rangeEnd = Math.min(offset + itemsPerPage, totalCount);

  const handlePreviousPage = () => {
    if (pageInfo.hasPreviousPage && !isLoading) {
      const newOffset = Math.max(0, offset - itemsPerPage);
      setOffset(newOffset);
      onPageChange(newOffset);
    }
  };

  const handleNextPage = () => {
    if (pageInfo.hasNextPage && !isLoading) {
      const newOffset = offset + itemsPerPage;
      setOffset(newOffset);
      onPageChange(newOffset);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: 2,
        overflow: "hidden",
        width: "100%",
        marginTop: 2,
      }}
    >
      <TableContainer sx={{ maxHeight: "calc(100vh - 260px)" }}>
        <Table stickyHeader sx={{ minWidth: 900 }} aria-label="user requests table" size="small">
          <TableHead>
            <TableRow>
              {requestUserAccessFormFields.map((field) => (
                <StyledTableCell
                  key={field.id}
                  align="left"
                  sx={{
                    minWidth: Math.min(field.width, 150),
                    maxWidth: Math.min(field.width, 200),
                  }}
                >
                  {field.name}
                </StyledTableCell>
              ))}
              <StyledTableCell sx={{ minWidth: 70 }}>Status</StyledTableCell>
              <StyledTableCell sx={{ minWidth: 250, maxWidth: 300 }}>
                Received access email
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 250, maxWidth: 300 }}>Custom email</StyledTableCell>
              <StyledTableCell sx={{ minWidth: 160 }}>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enrichedData.length === 0 && (
              <StyledTableRow>
                <StyledTableCell
                  colSpan={requestUserAccessFormFields.length + 4}
                  sx={{ textAlign: "center", py: 4, color: "text.secondary" }}
                >
                  No requests found
                </StyledTableCell>
              </StyledTableRow>
            )}
            {enrichedData.map((row) => (
              <StyledTableRow key={row.id}>
                {requestUserAccessFormFields.map((field) => (
                  <StyledTableCell
                    align="left"
                    key={field.id}
                    sx={{
                      minWidth: Math.min(field.width, 150),
                      maxWidth: Math.min(field.width, 200),
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {cellValue(getFormFieldValueByName(field.name, row.formFields))}
                  </StyledTableCell>
                ))}
                <StyledTableCell align="left" sx={{ minWidth: 70 }}>
                  <Chip
                    label={row.accessGranted ? "Granted" : "Pending"}
                    size="small"
                    color={row.accessGranted ? "success" : "warning"}
                    variant="outlined"
                    sx={{ fontSize: 11, height: 24 }}
                  />
                </StyledTableCell>
                <StyledTableCell sx={{ maxWidth: 300 }}>
                  <Editor
                    value={row.finalEmail}
                    style={{
                      paddingLeft: 12,
                      paddingRight: 12,
                      maxHeight: 160,
                      overflowY: "auto",
                      background: "#f5f5f5",
                      borderRadius: 6,
                      fontSize: 12,
                      border: "1px solid #e0e0e0",
                    }}
                    disabled
                  />
                </StyledTableCell>
                <StyledTableCell sx={{ maxWidth: 300 }}>
                  <Editor
                    value={notes[row.id]}
                    style={{
                      paddingLeft: 12,
                      paddingRight: 12,
                      maxHeight: 160,
                      overflowY: "auto",
                      borderRadius: 6,
                      fontSize: 12,
                      border: "1px solid #ccc",
                    }}
                    onChange={(e) => handleNoteChange(e, row)}
                  />
                </StyledTableCell>
                <StyledTableCell>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}
                  >
                    <LoadingButton
                      color="success"
                      variant="contained"
                      size="small"
                      onClick={() => onSend(row, notes[row.id])}
                      sx={{
                        width: 160,
                        fontSize: 11,
                        textTransform: "none",
                        borderRadius: 1.5,
                        boxShadow: "none",
                        "&:hover": { boxShadow: "none" },
                      }}
                      loadingIndicator="Sending…"
                    >
                      Send custom email
                    </LoadingButton>
                    <LoadingButton
                      color="error"
                      variant="outlined"
                      size="small"
                      onClick={() => onDiscard(row, notes[row.id])}
                      sx={{
                        width: 130,
                        fontSize: 11,
                        textTransform: "none",
                        borderRadius: 1.5,
                        boxShadow: "none",
                      }}
                      loadingIndicator="Discarding…"
                    >
                      Discard draft
                    </LoadingButton>
                  </Box>
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          px: 2,
          py: 1.5,
          borderTop: "1px solid",
          borderColor: "grey.200",
          backgroundColor: "grey.50",
        }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary", mr: 2, fontSize: 13 }}>
          {totalCount === 0 ? "No results" : `${rangeStart}–${rangeEnd} of ${totalCount}`}
        </Typography>
        <IconButton
          size="small"
          onClick={handlePreviousPage}
          disabled={!pageInfo.hasPreviousPage || isLoading}
          sx={{
            border: "1px solid",
            borderColor: "grey.300",
            borderRadius: 1,
            mr: 0.5,
            width: 32,
            height: 32,
          }}
        >
          ‹
        </IconButton>
        <IconButton
          size="small"
          onClick={handleNextPage}
          disabled={!pageInfo.hasNextPage || isLoading}
          sx={{
            border: "1px solid",
            borderColor: "grey.300",
            borderRadius: 1,
            width: 32,
            height: 32,
          }}
        >
          ›
        </IconButton>
      </Box>
    </Paper>
  );
};

export default UserRequestTable;
