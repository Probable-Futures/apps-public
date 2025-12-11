import { colors, Resource, size } from "@probable-futures/lib";
import styled from "styled-components";
import { Source, Title } from "./AboutMap";

type Props = {
  intro: string;
  title: string;
  resources: Resource[];
  source?: Source;
  handleTourClick?: () => void;
};

type SharedProps = {
  translatedHeader?: any;
  resources?: Resource[];
  intro?: string;
  title?: string;
  source?: Source;
  handleTourClick?: () => void;
};

const Intro = styled.p`
  color: ${colors.darkPurple};
  font-size: 20px;
  font-style: normal;
  font-weight: 400;
  line-height: 34px;
  margin-bottom: 50px;
`;

const ResourceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;

  @media (min-width: ${size.tablet}) {
    grid-template-columns: 1fr 1fr;
    gap: 50px;
  }
`;

const ResourceItem = styled.div`
  p {
    margin-top: 10px;
    font-size: 16px;
  }

  a {
    font-size: 20px;
    font-weight: 600;
  }
`;

const SimulateAnchorTag = styled.span`
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: ${colors.purple};
  }
`;

const isExternalLink = (url: string) => /^https?:\/\//i.test(url);

const AboutMapResource = ({ intro, title, resources, source, handleTourClick }: Props) => {
  const renderResourceItem = (resource: Resource, index: number) => {
    // Add a special case for handling Take Tour link
    if (resource.resource.title.toLowerCase().indexOf("tour") !== -1 && source === "maps") {
      return (
        <ResourceItem key={index}>
          <SimulateAnchorTag onClick={handleTourClick}>{resource.resource.title}</SimulateAnchorTag>
          <p>{resource.description}</p>
        </ResourceItem>
      );
    } else {
      const externalLink = isExternalLink(resource.resource.url);

      return (
        <ResourceItem key={index}>
          <a
            href={resource.resource.url}
            target={externalLink ? "_blank" : resource.resource.target}
            rel="noopener noreferrer"
          >
            {resource.resource.title}
          </a>
          <p>{resource.description}</p>
        </ResourceItem>
      );
    }
  };

  return (
    <div>
      <Title>{title}</Title>
      <Intro>{intro}</Intro>
      <ResourceGrid>{resources.map(renderResourceItem)}</ResourceGrid>
    </div>
  );
};

export const RelatedResources = ({
  resources = [],
  intro = "",
  title = "",
  handleTourClick,
  source = "maps",
}: SharedProps) => {
  return (
    <AboutMapResource
      intro={intro}
      title={title}
      resources={resources}
      source={source}
      handleTourClick={handleTourClick}
    />
  );
};

export const DataResources = ({ resources = [], intro = "", title = "" }: SharedProps) => {
  return <AboutMapResource intro={intro} title={title} resources={resources} />;
};
