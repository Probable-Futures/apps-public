import { useCallback, FocusEvent, useState, useRef } from "react";
import styled from "styled-components";
import { types } from "@probable-futures/lib";
import { styles } from "@probable-futures/components-lib";
import { Popover } from "react-tiny-popover";

import ShareIcon from "../../../assets/icons/dashboard/share.svg";
import DownloadIcon from "../../../assets/icons/map/download-offline.svg";
import TrashIcon from "../../../assets/icons/dashboard/trash.svg";
import { Project } from "../../../shared/types";
import {
  GridActions,
  ItemInfo,
  ItemContainer,
  StyledItemAction,
  StyledItemIcon,
} from "../../Common";
import { colors, size } from "../../../consts";
import EditIcon from "../../../assets/icons/dashboard/pen.svg";
import CheckIcon from "../../../assets/icons/dashboard/check.svg";
import MoreIcon from "../../../assets/icons/map/more.svg";

type Props = {
  project: Project;
  maps: types.Map[];
  signedImageUrl?: string;
  onDeleteClick: (id: string) => void;
  onShareClick: (projectId: string) => void;
  onDownloadClick: (projectId: string) => void;
  onProjectNameUpdate: (event: FocusEvent<HTMLInputElement>, projectId: string) => void;
};

type InputProps = {
  size: number;
  icon: string;
  useWhiteFilter?: boolean;
};

const ImageContainer = styled.div`
  box-sizing: border-box;
  height: 76px;
  width: 135px;
  border: 1px solid ${colors.grey};
  flex: 1;
  min-width: 120px;
  max-width: 140px;
  background-image: url(${({ src }: { src: string }) => src});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StyledIcon = styled.i`
  background-image: url(${({ icon }: InputProps) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: ${({ size }: InputProps) => size + "px"};
  height: ${({ size }: InputProps) => size + "px"};
  cursor: pointer;

  ${({ useWhiteFilter }: InputProps) => useWhiteFilter && styles.whiteFilter}
`;

const EditTitleInput = styled.input`
  font-size: 22px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  box-sizing: border-box;
  line-height: 20px;
  border: none;
  background: transparent;
  max-width: 350px;

  &:focus {
    outline: none;
  }
`;

const PopoverContent = styled.div`
  background-color: ${colors.secondaryBlack};
  color: ${colors.primaryWhite};
`;

const OptionWrapper = styled.div`
  display: flex;
  padding: 8px 16px;
  gap: 5px;
  justify-content: left;
  align-items: center;
  cursor: pointer;

  &:first-child {
    padding-top: 16px;
  }

  &:last-child {
    padding-bottom: 16px;
  }

  &:hover {
    color: ${colors.blue};
    i {
      ${styles.blueFilter}
    }
  }
`;

const StyledMoreIcon = styled.button`
  position: relative;
  height: 14px;
  width: 14px;
  background-image: url(${MoreIcon});
  background-repeat: no-repeat;
  background-position: center;
  background-color: transparent;
  border: none;
  outline: 0;
  cursor: pointer;
  padding: 0;
  ${styles.whiteFilter}

  ${({ isPopoverOpen }: { isPopoverOpen: Boolean }) => isPopoverOpen && styles.blueFilter}

  @media (min-width: ${size.laptop}) {
    &:hover {
      ${styles.blueFilter}
    }
  }
`;

const moreOptions = [
  {
    id: "edit",
    name: "Edit name",
    icon: EditIcon,
  },
  {
    id: "delete",
    name: "Delete",
    icon: TrashIcon,
  },
];

const Item = ({
  signedImageUrl,
  project,
  maps,
  onDeleteClick,
  onShareClick,
  onDownloadClick,
  onProjectNameUpdate,
}: Props) => {
  const editNameInputRef = useRef<HTMLInputElement>(null);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);

  const link = `${window.location.origin}/map?projectId=${project.id}`;

  const getClimateDatasetName = useCallback(
    (pfDatasetId: number) => {
      const map = maps.find((m) => m.dataset.id === pfDatasetId);
      return map?.name || map?.dataset.name || "";
    },
    [maps],
  );

  const onOptionClick = (id: string) => {
    switch (id) {
      case "delete":
        onDeleteClick(project.id);
        break;
      case "edit":
        setIsEditingProjectName(true);
        break;
      default:
        break;
    }
    setIsMoreActionsOpen(false);
  };

  return (
    <ItemContainer>
      {signedImageUrl && <ImageContainer src={signedImageUrl} />}
      <ItemInfo>
        <div>
          <TitleWrapper>
            {isEditingProjectName ? (
              <>
                <EditTitleInput
                  ref={editNameInputRef}
                  type="text"
                  defaultValue={project.name}
                  autoFocus
                  onBlur={(event) => {
                    setIsEditingProjectName(false);
                    onProjectNameUpdate(event, project.id);
                  }}
                  style={{ width: project.name.length + "ch" }}
                  onInput={() => {
                    if (editNameInputRef.current) {
                      editNameInputRef.current.style.width =
                        editNameInputRef.current.value.length + "ch";
                    }
                  }}
                />
                <StyledIcon
                  onClick={() => setIsEditingProjectName(false)}
                  icon={CheckIcon}
                  size={24}
                />
              </>
            ) : (
              <a className="title" href={link}>
                {project.name}
              </a>
            )}
          </TitleWrapper>
          <div className="date-info">
            <span>
              {project.updatedAt ? `Edited: ${new Date(project.updatedAt).toDateString()}` : null}
            </span>
            <span>{project.updatedAt && project.createdAt ? " . " : null}</span>
            <span>
              {project.createdAt ? `Created: ${new Date(project.createdAt).toDateString()}` : null}
            </span>
          </div>
          <div className="date-info">
            {project.pfDatasetId && (
              <span>Climate data: {getClimateDatasetName(project.pfDatasetId)}</span>
            )}
          </div>
        </div>
      </ItemInfo>
      <GridActions>
        <StyledItemAction onClick={() => onShareClick(project.id)}>
          <StyledItemIcon icon={ShareIcon} />
          <span>Share</span>
        </StyledItemAction>
        <StyledItemAction onClick={() => onDownloadClick(project.id)}>
          <StyledItemIcon icon={DownloadIcon} />
          <span>Download Data</span>
        </StyledItemAction>
        <Popover
          containerStyle={{ zIndex: "100", top: "5px" }}
          isOpen={isMoreActionsOpen}
          positions={["bottom"]}
          align="start"
          onClickOutside={() => setIsMoreActionsOpen(false)}
          content={() => (
            <PopoverContent>
              {moreOptions.map((option) => (
                <OptionWrapper key={option.id} onClick={() => onOptionClick(option.id)}>
                  <StyledIcon size={18} icon={option.icon} useWhiteFilter={true} />
                  <div>{option.name}</div>
                </OptionWrapper>
              ))}
            </PopoverContent>
          )}
        >
          <StyledMoreIcon
            isPopoverOpen={isMoreActionsOpen}
            onClick={() => setIsMoreActionsOpen(true)}
          />
        </Popover>
      </GridActions>
    </ItemContainer>
  );
};

export default Item;
