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
  onReject: (userRequest: UserRequestNode, note: string, closing: string) => void;
  onAccept: (userRequest: UserRequestNode, note: string, closing: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
};

const defaultNoteValue = `<p> Thanks for reaching out. If you'd like, I would be happy to meet on a call to give you a guided demo and answer any
      questions. You can <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2TEZX3fp1ty-JZr8iIVE5K8tmEE8AAyDLXvAm8Iqn1bo4xEWDtuw1rC_AAt7maw6iiybODG3mH">schedule a time on my calendar here</a>.
      If you would like to join a Slack group where you can message with the Probable Futures team and others using our maps and data, please <a href="https://join.slack.com/t/probablefuturesdata/shared_invite/zt-1id97wfdw-49padl_S6Dt6mi5HiRbbYg">join using this link</a>.</p>
    <p>
      If you haven't already done so, I would recommend you read (or listen to) the
      <a href="https://probablefutures.org/stability/">climate handbook</a> on the Probable Futures website. It provides essential context for interpreting the maps and data you will find in the resources below.
      You may also be aware of our <a href="https://probablefutures.org/maps">climate maps</a>, which are publicly available. The resources below are simply other ways of accessing or analyzing the data in these same climate maps.
    </p>`;

const defaultClosingValue = `<p>Let me know if you have questions. Thanks for joining us in our efforts to help people explore the risks and consequences of climate change.</p>`;

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

const UserRequestTable = ({ data, onReject, onAccept, isAccepting, isRejecting }: Props) => {
  const [notes, setNotes] = useState<{ [nodeId: string]: string }>({});
  const [closings, setClosings] = useState<{ [nodeId: string]: string }>({});
  const [rowIdOfClickedAction, setRowIdOfClickedAction] = useState<string>();

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
        .filter((node) => !node.accessGranted && !node.rejected)
        .map((node) => {
          const note = notes[node.id] || defaultNoteValue;
          const closing = closings[node.id] || defaultClosingValue;
          return { ...node, note, closing };
        }),
    [closings, data.viewUserAccessRequests.nodes, notes],
  );

  useEffect(() => {
    const defaultNotes: { [nodeId: string]: string } = {};
    const defaultClosings: { [nodeId: string]: string } = {};
    data.viewUserAccessRequests.nodes.forEach((node) => {
      defaultNotes[node.id] = defaultNoteValue;
      defaultClosings[node.id] = defaultClosingValue;
    });

    setNotes(defaultNotes);
    setClosings(defaultClosings);
  }, [data.viewUserAccessRequests.nodes]);

  const handleNoteChange = (event: ContentEditableEvent, userRequest: UserRequestNode) => {
    const newNotes = { ...notes, [userRequest.id]: event.target.value };
    setNotes(newNotes);
  };

  const handleClosingChange = (event: ContentEditableEvent, userRequest: UserRequestNode) => {
    const newClosings = { ...closings, [userRequest.id]: event.target.value };
    setClosings(newClosings);
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
            <StyledTableCell sx={{ minWidth: 80 }}>Email intro</StyledTableCell>
            <StyledTableCell sx={{ minWidth: 90 }}>Email closing</StyledTableCell>
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
              {requestUserAccessFormFields.map((field) => {
                return (
                  <StyledTableCell
                    align="left"
                    key={field.id}
                    width={field.width}
                    sx={{ minWidth: field.width }}
                  >
                    {cellValue(getFormFieldValueByName(field.name, row.formFields))}
                  </StyledTableCell>
                );
              })}
              <StyledTableCell sx={{ maxWidth: 400, maxHeight: 200, verticalAlign: "top" }}>
                <Editor
                  value={notes[row.id]}
                  style={{ paddingLeft: 20, paddingRight: 20, maxHeight: 200, overflowY: "auto" }}
                  onChange={(e) => handleNoteChange(e, row)}
                />
              </StyledTableCell>
              <StyledTableCell
                sx={{ maxWidth: 400, maxHeight: 200, display: "flex", verticalAlign: "top" }}
              >
                <Editor
                  value={closings[row.id]}
                  style={{ paddingLeft: 20, paddingRight: 20, maxHeight: 200, overflowY: "auto" }}
                  onChange={(e) => handleClosingChange(e, row)}
                />
              </StyledTableCell>
              <StyledTableCell>
                <LoadingButton
                  loading={isAccepting && rowIdOfClickedAction === row.id}
                  color="success"
                  variant="contained"
                  onClick={() => {
                    setRowIdOfClickedAction(row.id);
                    onAccept(row, notes[row.id], closings[row.id]);
                  }}
                  sx={{ marginBottom: 2, width: 150 }}
                  loadingIndicator="Accepting…"
                >
                  Accept
                </LoadingButton>
                <LoadingButton
                  loading={isRejecting && rowIdOfClickedAction === row.id}
                  color="error"
                  variant="contained"
                  onClick={() => {
                    setRowIdOfClickedAction(row.id);
                    onReject(row, notes[row.id], closings[row.id]);
                  }}
                  sx={{ marginBottom: 2, width: 150 }}
                  loadingIndicator="Rejecting…"
                >
                  Reject
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
