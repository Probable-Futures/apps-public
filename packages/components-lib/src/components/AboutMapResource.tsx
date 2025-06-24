import { colors, Resource, size } from "@probable-futures/lib";
import styled from "styled-components";
import { Title } from "./AboutMap";

type Props = {
  intro: string;
  title: string;
  resources: Resource[];
};

type SharedProps = {
  translatedHeader?: any;
  resources?: Resource[];
  intro?: string;
  title?: string;
};

const Intro = styled.p`
  color: ${colors.darkPurple};
  font-family: "Linear Sans";
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

const AboutMapResource = ({ intro, title, resources }: Props) => {
  return (
    <div>
      <Title>{title}</Title>
      <Intro>{intro}</Intro>
      <ResourceGrid>
        {resources.map((resource, index) => (
          <ResourceItem key={index}>
            <a
              href={resource.resource.url}
              target={resource.resource.target}
              rel="noopener noreferrer"
            >
              {resource.resource.title}
            </a>
            <p>{resource.description}</p>
          </ResourceItem>
        ))}
      </ResourceGrid>
    </div>
  );
};

export const RelatedResources = ({ resources = [], intro = "", title = "" }: SharedProps) => {
  return <AboutMapResource intro={intro} title={title} resources={resources} />;
};

export const DataResources = ({ resources = [], intro = "", title = "" }: SharedProps) => {
  return <AboutMapResource intro={intro} title={title} resources={resources} />;
};
