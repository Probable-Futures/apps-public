import Projects from "../components/Dashboard/Project/Projects";
import Datasets from "../components/Dashboard/Dataset/Datasets";
import Documentation from "../components/Dashboard/Documentation/Documentation";
import UserDatasets from "../components/Dashboard/Dataset/UserDatasets";

export const routes = [
  {
    title: "Documentation",
    path: "documentation",
    component: Documentation,
  },
  {
    title: "Projects",
    path: "projects",
    component: Projects,
  },
  {
    title: "Your data",
    path: "your-data",
    component: UserDatasets,
  },
  {
    title: "Climate data",
    path: "climate-data",
    component: Datasets,
  },
  {
    title: "Log out",
    path: "/",
  },
];

export const PROJECT_QUERY_PARAM = "projectId";
export const PROJECT_SHARE_ID_QUERY_PARAM = "slugId";
export const CREATE_PROJECT_QUERY_PARAM = "createProject";
export const enrichmentPollingInterval = 5000;
export const processPollingInterval = enrichmentPollingInterval;
export const itemsPerPage = 6;
