import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useOutletContext } from "react-router-dom";
import { Alert, Link, Snackbar } from "@mui/material";

import DashboardTitle from "../../Common/DashboardTitle";
import {
  UPDATE_USER_ACCESS_REQUEST,
  GET_PF_USER_ACCESS_REQUESTS,
  APPROVE_USER_ACCESS_REQUEST,
} from "../../../graphql/queries/userRequests";
import { GqlResponse } from "../../../shared/types";
import UserRequestTable from "./UserRequestTable";
import { colors } from "@probable-futures/lib/src/consts";
import { isProd } from "../../../consts/env";

export type RequestField = {
  name: string;
  value: any;
};

export type UserRequestNode = {
  email: string;
  formFields: Record<string, RequestField>;
  formName: string;
  id: string;
  accessGranted: boolean;
  rejected: boolean;
  note: string;
  closing: string;
};

export type UserAccessRequestResponse = {
  viewUserAccessRequests: GqlResponse<UserRequestNode>;
};

const UserRequests = () => {
  const [apiError, setApiError] = useState<string>();
  const { toggleLoading } = useOutletContext<{
    toggleLoading: (arg: boolean) => {};
  }>();
  const {
    loading: loadingUserAccessRequests,
    data,
    refetch: refetchUserRequests,
  } = useQuery<UserAccessRequestResponse>(GET_PF_USER_ACCESS_REQUESTS, {
    variables: {},
    fetchPolicy: "no-cache",
    notifyOnNetworkStatusChange: true,
  });

  const [rejectRequest, { loading: isRejecting }] = useMutation(UPDATE_USER_ACCESS_REQUEST, {
    onCompleted: () => refetchUserRequests(),
  });
  const [approveRequest, { loading: isAccepting, error, data: dataFromAccept }] = useMutation<{
    acceptInvitation: { clientId: string; error: string; userId: string };
  }>(APPROVE_USER_ACCESS_REQUEST, {
    onCompleted: () => refetchUserRequests(),
  });

  useEffect(() => {
    if (apiError) {
      setTimeout(() => {
        setApiError(undefined);
      }, 6000);
    }
  }, [apiError]);

  const onReject = (userRequest: UserRequestNode, note: string, closing: string) => {
    rejectRequest({
      variables: {
        id: userRequest.id,
        accessGranted: false,
        rejected: true,
        note,
        closing,
      },
    });
  };

  const onAccept = (userRequest: UserRequestNode, note: string, closing: string) => {
    approveRequest({
      variables: {
        requestId: userRequest.id,
        note,
        closing,
      },
    });
  };

  useEffect(() => {
    if (loadingUserAccessRequests) {
      toggleLoading(true);
    } else {
      toggleLoading(false);
    }
  }, [loadingUserAccessRequests, toggleLoading]);

  useEffect(() => {
    if (error) {
      if (error.message) {
        setApiError(error.message);
      } else {
        setApiError("Something went wrong!");
      }
    }
  }, [error]);

  useEffect(() => {
    if (dataFromAccept?.acceptInvitation.error) {
      setApiError(dataFromAccept.acceptInvitation.error);
    }
  }, [dataFromAccept]);

  return (
    <>
      <Snackbar open={!!apiError} autoHideDuration={6000}>
        <Alert severity="error">{apiError}</Alert>
      </Snackbar>
      <div>
        <DashboardTitle title="User Requests" />
      </div>
      {!loadingUserAccessRequests && data && (
        <UserRequestTable
          data={data}
          onReject={onReject}
          onAccept={onAccept}
          isAccepting={isAccepting}
          isRejecting={isRejecting}
        />
      )}
      <div style={{ marginTop: 10 }}>
        <Link
          href={
            isProd
              ? "https://airtable.com/app5vySCXl6f2s8zB/tblAwRZ543C2izH3B/viwVzNxu66YUOFF6n?blocks=hide"
              : "https://airtable.com/app6CUTr7QTYBc57b/tblBDd0UeypLRjEBb/viwWG9yjgBLDnpCEX?blocks=hide"
          }
          rel="noopener"
          target="_blank"
          sx={{ color: colors.purple, textDecorationColor: "inherit" }}
        >
          Link to all user requests in Airtable
        </Link>
      </div>
    </>
  );
};

export default UserRequests;
