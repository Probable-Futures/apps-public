import { useCallback, useEffect, useState, FocusEvent } from "react";
import { useMutation, useQuery } from "@apollo/client";
import styled from "styled-components";
import { types } from "@probable-futures/lib";
import { useOutletContext } from "react-router-dom";

import {
  DELETE_PF_PARTNER_PROJECT,
  GET_PF_PARTNER_PROJECTS,
  UPDATE_PARTNER_PROJECT,
} from "../../../graphql/queries/projects";
import EmptyProjects from "./EmptyProjects";
import List from "./List";
import { itemsPerPage } from "../../../consts/dashboardConsts";
import ShareProject from "./ShareProject";
import DownloadProject from "./DownloadProject";
import { colors } from "../../../consts";
import { Pagination } from "../../Common";
import DashboardTitle from "../../Common/DashboardTitle";
import { GqlResponse, PageInfo, Project } from "../../../shared/types";
import { PUBLISHED_MAPS_QUERY } from "../../../graphql/queries/maps";
import { GRAPHQL_API_KEY } from "../../../consts/env";
import { GET_DATASET_SIGNED_URLS } from "../../../graphql/queries/datasets";

type PartnerProjectsReponse = {
  viewPartnerProjects: GqlResponse<Project> & { totalCount: number } & {
    pageInfo: PageInfo;
  };
};

export type ProjectImageURL = {
  [id: string]: string;
};

const CreateProjectButton = styled.a`
  box-sizing: border-box;
  height: 40px;
  width: 203px;
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-size: 16px;
  line-height: 28px;
  text-align: center;
  text-decoration: none;
  outline: 0;
  cursor: pointer;
  letter-spacing: 0;
  padding: 6px 20px;
  margin-left: auto;
  border: none;
  background-color: ${colors.secondaryBlack};

  :hover {
    color: ${colors.primaryWhite} !important;
    background-color: ${colors.skyBlue};
  }
`;

const Projects = () => {
  const { toggleLoading } = useOutletContext<{
    toggleLoading: (arg: boolean) => {};
  }>();
  const [sharedProjectId, setSharedProjectId] = useState<string>();
  const [downloadProjectId, setDownloadProjectId] = useState<string>();
  const [offset, setOffset] = useState<number>(0);
  const [signedImageUrls, setSignedImageUrls] = useState<ProjectImageURL>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [updatedProject, setUdpatedProject] = useState<Project>();
  const {
    data: partnerProjects,
    refetch: refetchProjects,
    loading: loadingProjects,
  } = useQuery<PartnerProjectsReponse>(GET_PF_PARTNER_PROJECTS, {
    variables: {
      offset: 0,
      first: itemsPerPage,
    },
    notifyOnNetworkStatusChange: true,
  });
  const { data: publishedMaps } = useQuery(PUBLISHED_MAPS_QUERY, {
    context: {
      headers: {
        "api-key": GRAPHQL_API_KEY,
      },
    },
  });
  const maps: types.Map[] = publishedMaps?.pfMaps?.nodes || [];

  const [deleteProject, { data: deletedProject }] = useMutation(DELETE_PF_PARTNER_PROJECT);
  const [getSignedUrls] = useMutation(GET_DATASET_SIGNED_URLS);
  const [updatePartnerProject] = useMutation(UPDATE_PARTNER_PROJECT, {
    onCompleted: (data) => setUdpatedProject(data.updatePartnerProject.pfPartnerProject as Project),
  });

  useEffect(() => {
    if (partnerProjects?.viewPartnerProjects.nodes) {
      setProjects(partnerProjects.viewPartnerProjects.nodes);
    }
  }, [partnerProjects]);

  useEffect(() => {
    if (updatedProject && projects.length > 0) {
      const projectIdx = projects.findIndex((p) => p.id === updatedProject?.id);
      if (projectIdx !== -1) {
        const projectsUpdate = [...projects];
        const project = { ...projects[projectIdx], name: updatedProject.name };
        projectsUpdate[projectIdx] = project;
        setProjects(projectsUpdate);
        setUdpatedProject(undefined);
      }
    }
  }, [updatedProject, projects]);

  useEffect(() => {
    if (deletedProject) {
      refetchProjects();
    }
  }, [deletedProject, refetchProjects]);

  useEffect(() => {
    const generateSignedUrls = async (projectImageUrls: ProjectImageURL) => {
      const urls = Object.keys(projectImageUrls).map((projectId) => projectImageUrls[projectId]);
      if (urls.length > 0) {
        const signedUrlsResponse = await getSignedUrls({
          variables: {
            fileUrls: urls,
            type: "image/png",
          },
        });
        const signedUrls: string[] = signedUrlsResponse.data?.datasetSignedUrls;
        const projectImageWithSignedUrls = Object.keys(projectImageUrls).reduce(
          (prev, cur, curIndex) => {
            prev[cur] = signedUrls[curIndex];
            return prev;
          },
          {} as ProjectImageURL,
        );

        setSignedImageUrls((signedImageUrls) => ({
          ...signedImageUrls,
          ...projectImageWithSignedUrls,
        }));
      }
    };
    if (projects?.length > 0) {
      const imgUrls = projects.reduce((prev, cur) => {
        if (cur.imageUrl && !signedImageUrls[cur.id]) {
          prev[cur.id] = decodeURIComponent(new URL(cur.imageUrl).pathname).substring(1);
        }
        return prev;
      }, {} as ProjectImageURL);
      generateSignedUrls(imgUrls);
    }
  }, [projects, signedImageUrls, getSignedUrls]);

  useEffect(() => {
    if (loadingProjects) {
      toggleLoading(true);
    } else {
      toggleLoading(false);
    }
  }, [loadingProjects, toggleLoading]);

  const onDeleteClick = (id: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteProject({
        variables: {
          id,
        },
      });
    }
  };

  const onShareClick = (projectId: string) => setSharedProjectId(projectId);

  const onDownloadClick = (projectId: string) => setDownloadProjectId(projectId);

  const onPageChange = useCallback(
    (offset: number) => {
      refetchProjects({
        first: itemsPerPage,
        offset: offset,
      });
    },
    [refetchProjects],
  );

  const onProjectNameUpdate = useCallback(
    (event: FocusEvent<HTMLInputElement>, projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project || project.name === event.target.value || !event.target.value) {
        return;
      }
      updatePartnerProject({
        variables: {
          projectId: projectId,
          projectName: event.target.value.trim(),
        },
      });
    },
    [projects, updatePartnerProject],
  );

  return (
    <>
      <div>
        <DashboardTitle title="Projects">
          <CreateProjectButton href="/map">Create New Project</CreateProjectButton>
        </DashboardTitle>
        {projects.length > 0 ? (
          <List
            projects={projects}
            signedImageUrls={signedImageUrls}
            maps={maps}
            onDeleteClick={onDeleteClick}
            onShareClick={onShareClick}
            onDownloadClick={onDownloadClick}
            onProjectNameUpdate={onProjectNameUpdate}
          />
        ) : (
          !loadingProjects && <EmptyProjects />
        )}
        <ShareProject
          projectId={sharedProjectId}
          onModalClose={() => setSharedProjectId(undefined)}
        />
        <DownloadProject
          projectId={downloadProjectId}
          onModalClose={() => setDownloadProjectId(undefined)}
        />
        {partnerProjects?.viewPartnerProjects && (
          <Pagination
            total={partnerProjects.viewPartnerProjects.totalCount}
            pageInfo={partnerProjects.viewPartnerProjects.pageInfo}
            onPageChange={onPageChange}
            isLoading={loadingProjects}
            offset={offset}
            setOffset={setOffset}
          />
        )}
      </div>
    </>
  );
};

export default Projects;
