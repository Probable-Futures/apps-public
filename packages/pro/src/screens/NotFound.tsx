import { useNavigate } from "react-router-dom";

import Error from "../components/Common/Error";

const projectNotFoundDescription =
  "It looks like that project was not found in this account. If someone shared the link with you, ask them to create a publicly sharable link. If it is for a project you created, try logging in using the email you used when you created the project.";

const NotFound = () => {
  const navigate = useNavigate();

  const onClick = () => navigate("/dashboard/projects");

  return (
    <Error
      title="Project not found"
      description={projectNotFoundDescription}
      actionName="Back to all projects"
      onButtonClicked={onClick}
    />
  );
};

export default NotFound;
