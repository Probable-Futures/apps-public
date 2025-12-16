import Projects from "../components/Dashboard/Project/Projects";
import Datasets from "../components/Dashboard/Dataset/Datasets";
import Home from "../components/Dashboard/Home/Home";
import UserDatasets from "../components/Dashboard/Dataset/UserDatasets";
import UserRquests from "../components/Dashboard/User/UserRequests";

export const routes = [
  {
    title: "Home",
    path: "home",
    component: Home,
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
    title: "User Requests",
    path: "user-requests",
    adminOnly: true,
    component: UserRquests,
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
