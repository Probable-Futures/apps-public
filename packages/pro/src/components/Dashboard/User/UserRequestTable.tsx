import { ChangeEvent, useMemo } from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { TextField, Paper } from "@mui/material";
import { LoadingButton } from "@mui/lab";

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
  onReject: (userRequest: UserRequestNode) => void;
  onAccept: (userRequest: UserRequestNode) => void;
  isAccepting: boolean;
  isRejecting: boolean;
};

const defaultNoteValue = "Thanks for reaching out.";

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
        .map((node) => ({ ...node, note: defaultNoteValue })),
    [data.viewUserAccessRequests.nodes],
  );

  const handleNoteChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    userRequest: UserRequestNode,
  ) => {
    userRequest.note = event.target.value;
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
            <StyledTableCell>Admin note</StyledTableCell>
            <StyledTableCell>Action</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.length === 0 && (
            <StyledTableRow>
              <StyledTableCell colSpan={requestUserAccessFormFields.length + 2}>
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
              <StyledTableCell>
                <TextField
                  id="filled-multiline-static"
                  label="note"
                  multiline
                  rows={4}
                  variant="filled"
                  placeholder="⚠️This note will be included in the email"
                  sx={{ width: 200 }}
                  onChange={(e) => handleNoteChange(e, row)}
                  defaultValue={defaultNoteValue}
                />
              </StyledTableCell>
              <StyledTableCell>
                <LoadingButton
                  loading={isAccepting}
                  color="success"
                  variant="contained"
                  onClick={() => onAccept(row)}
                  sx={{ marginBottom: 2, width: 150 }}
                  loadingIndicator="Accepting…"
                >
                  Accept
                </LoadingButton>
                <LoadingButton
                  loading={isRejecting}
                  color="error"
                  variant="contained"
                  onClick={() => onReject(row)}
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
