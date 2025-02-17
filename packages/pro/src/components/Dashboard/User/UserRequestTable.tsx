import { useEffect, useMemo, useState } from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Paper } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import Editor, { ContentEditableEvent } from "react-simple-wysiwyg";

import { UserRequestNode, UserAccessRequestResponse, RequestField } from "./UserRequests";
import { requestUserAccessFormFields } from "../../../consts/forms";
import { isDateString } from "../../../utils/date";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

type Props = {
  data: UserAccessRequestResponse;
  onDiscard: (userRequest: UserRequestNode, note: string) => void;
  onSend: (userRequest: UserRequestNode, note: string) => void;
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
    <span style="font-size:x-small;font-family:Calibri,sans-serif">Peter Croce, Product Lead</span>
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

const UserRequestTable = ({ data, onDiscard, onSend }: Props) => {
  const [notes, setNotes] = useState<{ [nodeId: string]: string }>({});

  const cellValue = (value: any) => {
    if (typeof value === "string") {
      if (isDateString(value)) {
        const dateObject = new Date(value);
        const year = dateObject.getUTCFullYear();
        const month = String(dateObject.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-indexed
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

  const filteredData = useMemo(
    () =>
      data.viewUserAccessRequests.nodes
        .filter((node) => !node.rejected && !node.customEmailDiscarded && !node.customEmail)
        .map((node) => {
          const note =
            notes[node.id] ??
            `<p>Hi ${cellValue(getFormFieldValueByName("First name", node.formFields))},</p>` +
              defaultNoteValue +
              emailSignature;
          return { ...node, note };
        }),
    [data.viewUserAccessRequests.nodes, notes],
  );

  useEffect(() => {
    const defaultNotes: { [nodeId: string]: string } = {};
    data.viewUserAccessRequests.nodes.forEach((node) => {
      defaultNotes[node.id] =
        `<p>Hi ${cellValue(getFormFieldValueByName("First name", node.formFields))},</p>` +
        defaultNoteValue +
        emailSignature;
    });

    setNotes(defaultNotes);
  }, [data.viewUserAccessRequests.nodes]);

  const handleNoteChange = (event: ContentEditableEvent, userRequest: UserRequestNode) => {
    const newNotes = { ...notes, [userRequest.id]: event.target.value };
    setNotes(newNotes);
  };

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 700 }} aria-label="customized table">
        <TableHead>
          <TableRow>
            {requestUserAccessFormFields.map((field) => (
              <StyledTableCell
                key={field.id}
                align="left"
                width={field.width}
                sx={{ minWidth: field.width }}
              >
                {field.name}
              </StyledTableCell>
            ))}
            <StyledTableCell sx={{ minWidth: 80 }}>Access granted</StyledTableCell>
            <StyledTableCell sx={{ minWidth: 80 }}>Received access email</StyledTableCell>
            <StyledTableCell sx={{ minWidth: 80 }}>Custom email</StyledTableCell>
            <StyledTableCell>Action</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.length === 0 && (
            <StyledTableRow>
              <StyledTableCell colSpan={requestUserAccessFormFields.length + 3}>
                No Requests Found
              </StyledTableCell>
            </StyledTableRow>
          )}
          {filteredData.map((row) => (
            <StyledTableRow key={row.id}>
              {requestUserAccessFormFields.map((field) => (
                <StyledTableCell
                  align="left"
                  key={field.id}
                  width={field.width}
                  sx={{ minWidth: field.width }}
                >
                  {cellValue(getFormFieldValueByName(field.name, row.formFields))}
                </StyledTableCell>
              ))}
              <StyledTableCell align="left" width={80} sx={{ verticalAlign: "top" }}>
                {row.accessGranted ? "True" : "False"}
              </StyledTableCell>
              <StyledTableCell sx={{ maxWidth: 400, maxHeight: 200, verticalAlign: "top" }}>
                <Editor
                  value={row.finalEmail}
                  style={{
                    paddingLeft: 20,
                    paddingRight: 20,
                    maxHeight: 200,
                    overflowY: "auto",
                    background: "lightgrey",
                  }}
                  disabled
                />
              </StyledTableCell>
              <StyledTableCell sx={{ maxWidth: 400, maxHeight: 200, verticalAlign: "top" }}>
                <Editor
                  value={notes[row.id]}
                  style={{ paddingLeft: 20, paddingRight: 20, maxHeight: 200, overflowY: "auto" }}
                  onChange={(e) => handleNoteChange(e, row)}
                />
              </StyledTableCell>
              <StyledTableCell
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <LoadingButton
                  color="success"
                  variant="contained"
                  onClick={() => {
                    onSend(row, notes[row.id]);
                  }}
                  sx={{ marginBottom: 2, width: 200, paddingX: "4px", paddingY: "3px" }}
                  loadingIndicator="Sending…"
                >
                  Send custom email
                </LoadingButton>
                <LoadingButton
                  color="error"
                  variant="contained"
                  onClick={() => {
                    onDiscard(row, notes[row.id]);
                  }}
                  sx={{ marginBottom: 2, width: 150, paddingX: "5px", paddingY: "3px" }}
                  loadingIndicator="Discarding…"
                >
                  Discard draft
                </LoadingButton>
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UserRequestTable;
