import React from "react";
import styled from "styled-components";

import UploadIcon from "../../../assets/icons/dashboard/dataset-upload.svg";
import { colors } from "../../../consts";

const Container = styled.div`
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 20px;
  align-items: center;
  width: 100%;
  height: 196px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: center;
  text-align: center;
  background-color: #f5f7ef;
`;

const StyledEmptyText = styled.p`
  flex: 0 1 100%;
`;

const LargeButton = styled.button`
  flex: 0 1 15%;
  outline: 0;
  cursor: pointer;
  padding: 6px 20px;
  display: block;
  height: 40px;
  width: 203px;
  border: 1px solid ${colors.secondaryBlack};
  color: ${colors.secondaryBlack};
  background-color: #f5f7ef;
  font-size: 14px;
  font-family: LinearSans;
`;

const StyledUploadIcon = styled.i`
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  height: 54px;
  width: 59px;
`;

type Props = {
  onUploadDatasetClick: () => void;
};

const EmptyDatasets: React.FC<Props> = ({ onUploadDatasetClick }: Props) => {
  return (
    <Container>
      <StyledUploadIcon icon={UploadIcon} />
      <StyledEmptyText>You haven't added any datasets yet.</StyledEmptyText>
      <LargeButton onClick={onUploadDatasetClick}>Upload dataset</LargeButton>
    </Container>
  );
};

export default EmptyDatasets;
