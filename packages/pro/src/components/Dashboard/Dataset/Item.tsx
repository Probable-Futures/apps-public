import styled from "styled-components";

import TrashIcon from "../../../assets/icons/dashboard/trash.svg";
import FileIcon from "../../../assets/icons/dashboard/file.svg";
import DownloadIcon from "../../../assets/icons/map/download-offline.svg";
import {
  ItemContainer,
  GridActions,
  ItemInfo,
  StyledItemAction,
  StyledItemIcon,
} from "../../Common";

type Props = {
  name: string;
  index: number;
  updatedAt?: Date;
  createdAt?: Date;
  onDeleteClick?: (index: number) => void;
  onDownload?: (index: number) => void;
  onTitleClick?: (index: number) => void;
};

const StyledFileIcon = styled.i`
  display: inline-block;
  background-image: url(${FileIcon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  margin-right: 15px;
  height: 42px;
  width: 29.59px;
`;

const Title = styled.span`
  ${({ clickable }: { clickable: boolean }) => clickable && `cursor: pointer;`}
`;

const Item = ({
  name,
  updatedAt,
  index,
  createdAt,
  onDeleteClick,
  onDownload,
  onTitleClick,
}: Props) => (
  <ItemContainer>
    <ItemInfo>
      <StyledFileIcon />
      <div>
        <Title
          className="title"
          onClick={() => onTitleClick && onTitleClick(index)}
          clickable={onTitleClick !== undefined}
        >
          {name}
        </Title>
        <div className="date-info">
          <span>{updatedAt ? `Edited: ${new Date(updatedAt).toDateString()}` : null}</span>
          <span>{updatedAt && createdAt ? " . " : null}</span>
          <span>{createdAt ? `Created: ${new Date(createdAt).toDateString()}` : null}</span>
        </div>
      </div>
    </ItemInfo>
    <GridActions>
      {onDeleteClick && (
        <StyledItemAction onClick={() => onDeleteClick(index)}>
          <StyledItemIcon icon={TrashIcon} />
          <span>Delete</span>
        </StyledItemAction>
      )}
      {onDownload && (
        <StyledItemAction onClick={() => onDownload(index)}>
          <StyledItemIcon icon={DownloadIcon} />
          <span>Download Data</span>
        </StyledItemAction>
      )}
    </GridActions>
  </ItemContainer>
);

export default Item;
