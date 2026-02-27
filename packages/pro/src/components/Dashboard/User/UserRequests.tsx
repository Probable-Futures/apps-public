import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useOutletContext } from "react-router-dom";
import { Alert, Link, Snackbar } from "@mui/material";

import DashboardTitle from "../../Common/DashboardTitle";
import {
  UPDATE_USER_ACCESS_REQUEST,
  GET_PF_USER_ACCESS_REQUESTS,
  SEND_CUSTOM_ONBOARDING_EMAIL,
} from "../../../graphql/queries/userRequests";
import { PageInfo } from "../../../shared/types";
import UserRequestTable from "./UserRequestTable";
import { colors } from "@probable-futures/lib";
import { isProd } from "../../../consts/env";

const ITEMS_PER_PAGE = 10;

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
  finalEmail: string;
  customEmail?: string;
  customEmailDiscarded?: boolean;
};

export type UserAccessRequestResponse = {
  viewUserAccessRequests: {
    nodes: UserRequestNode[];
    pageInfo: PageInfo;
    totalCount: number;
  };
};

const UserRequests = () => {
  const [apiError, setApiError] = useState<string>();
  const [offset, setOffset] = useState(0);
  const { toggleLoading } = useOutletContext<{
    toggleLoading: (arg: boolean) => {};
  }>();
  const {
    loading: loadingUserAccessRequests,
    data,
    refetch: refetchUserRequests,
  } = useQuery<UserAccessRequestResponse>(GET_PF_USER_ACCESS_REQUESTS, {
    variables: {
      first: ITEMS_PER_PAGE,
      offset,
      condition: {
        rejected: false,
        customEmailDiscarded: false,
        customEmail: null,
      },
    },
    fetchPolicy: "no-cache",
    notifyOnNetworkStatusChange: true,
  });

  const [updateUserAccessRequest] = useMutation(UPDATE_USER_ACCESS_REQUEST, {
    onCompleted: () => refetchUserRequests(),
  });

  const [sendCustomOnboardingEmail] = useMutation(SEND_CUSTOM_ONBOARDING_EMAIL, {
    onCompleted: () => refetchUserRequests(),
  });

  useEffect(() => {
    if (apiError) {
      setTimeout(() => {
        setApiError(undefined);
      }, 6000);
    }
  }, [apiError]);

  const onDiscard = (userRequest: UserRequestNode, note: string) => {
    updateUserAccessRequest({
      variables: {
        id: userRequest.id,
        customEmailDiscarded: true,
      },
    });
  };

  const onSend = (userRequest: UserRequestNode, note: string) => {
    sendCustomOnboardingEmail({
      variables: {
        requestId: userRequest.id,
        emailBody: note,
      },
    });
  };

  const handlePageChange = useCallback(
    (newOffset: number) => {
      setOffset(newOffset);
      refetchUserRequests({
        first: ITEMS_PER_PAGE,
        offset: newOffset,
        condition: {
          rejected: false,
          customEmailDiscarded: false,
          customEmail: null,
        },
      });
    },
    [refetchUserRequests],
  );

  useEffect(() => {
    if (loadingUserAccessRequests) {
      toggleLoading(true);
    } else {
      toggleLoading(false);
    }
  }, [loadingUserAccessRequests, toggleLoading]);

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
          onDiscard={onDiscard}
          onSend={onSend}
          offset={offset}
          setOffset={setOffset}
          onPageChange={handlePageChange}
          isLoading={loadingUserAccessRequests}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}
      <div style={{ marginTop: 10, marginBottom: 20 }}>
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
