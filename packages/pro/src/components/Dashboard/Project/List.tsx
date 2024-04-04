import { memo, FocusEvent } from "react";
import { types } from "@probable-futures/lib";

import Item from "./Item";
import { Project } from "../../../shared/types";
import { ProjectImageURL } from "./Projects";

type Props = {
  projects: Project[];
  maps: types.Map[];
  signedImageUrls: ProjectImageURL;
  onDeleteClick: (id: string) => void;
  onShareClick: (projectId: string) => void;
  onDownloadClick: (projectId: string) => void;
  onProjectNameUpdate: (event: FocusEvent<HTMLInputElement>, projectId: string) => void;
};

const List = ({
  projects,
  onDeleteClick,
  onShareClick,
  onDownloadClick,
  maps,
  signedImageUrls,
  onProjectNameUpdate,
}: Props) => (
  <div>
    {projects.map((project, index) => (
      <Item
        key={index}
        project={project}
        signedImageUrl={signedImageUrls[project.id]}
        maps={maps}
        onDeleteClick={onDeleteClick}
        onShareClick={onShareClick}
        onDownloadClick={onDownloadClick}
        onProjectNameUpdate={onProjectNameUpdate}
      />
    ))}
    <hr></hr>
  </div>
);

export default memo(List);
