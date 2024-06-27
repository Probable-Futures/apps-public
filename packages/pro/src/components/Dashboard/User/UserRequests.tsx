import { useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useOutletContext } from "react-router-dom";

import DashboardTitle from "../../Common/DashboardTitle";
import {
  UPDATE_USER_ACCESS_REQUEST,
  GET_PF_USER_ACCESS_REQUESTS,
  APPROVE_USER_ACCESS_REQUEST,
} from "../../../graphql/queries/userRequests";
import { GqlResponse } from "../../../shared/types";
import UserRequestTable from "./UserRequestTable";

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
};

export type UserAccessRequestResponse = {
  viewUserAccessRequests: GqlResponse<UserRequestNode>;
};

const UserRequests = () => {
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
  const [approveRequest, { loading: isAccepting }] = useMutation(APPROVE_USER_ACCESS_REQUEST, {
    onCompleted: () => refetchUserRequests(),
  });

  const onReject = (userRequest: UserRequestNode) => {
    rejectRequest({
      variables: {
        id: userRequest.id,
        accessGranted: false,
        rejected: true,
        note: userRequest.note || "",
      },
    });
  };

  const onAccept = (userRequest: UserRequestNode) => {
    approveRequest({
      variables: {
        requestId: userRequest.id,
        note: userRequest.note || "",
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

  return (
    <>
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
    </>
  );
};

export default UserRequests;
