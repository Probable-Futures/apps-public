import { colors, size } from "@probable-futures/lib";
import styled from "styled-components";
import { Title } from "./AboutMap";

type Props = {
  intro: string;
  title: string;
  resources: Resource[];
};

type Resource = {
  title: string;
  description: string;
  url: string;
};

const relatedResources: Resource[] = [
  {
    title: "Explainers",
    description: "Read explainers on key climate topics and applying our maps.",
    url: "https://climate.nasa.gov/explainers/",
  },
  {
    title: "Take a tour",
    description: "Take a tour of our map interface.",
    url: "https://climate.nasa.gov/explainers/",
  },
  {
    title: "Science",
    description: "Read about the science behind our maps.",
    url: "https://climate.nasa.gov/explainers/",
  },
  {
    title: "More about maps",
    description: "See an overview of our available maps and their features.",
    url: "https://climate.nasa.gov/explainers/",
  },
];

const dataResources: Resource[] = [
  {
    title: "Open data & integrations",
    description: "Access a suite of tools to work with the data behind our maps.",
    url: "https://climate.nasa.gov/explainers/",
  },
  {
    title: "Data documentation",
    description: "Read our data documentation to learn more.",
    url: "https://climate.nasa.gov/explainers/",
  },
  {
    title: "Probable Futures Pro",
    description: "Combine and visualize geospatial data in our free pro-level tool.",
    url: "https://climate.nasa.gov/explainers/",
  },
];

const relatedResourcesTitle =
  "Learn more about the maps by exploring helpful guides, reviewing the science behind the maps, and taking a tour.";

const dataResourcesTitle =
  "Probable Futures maps and data are freely available and licensed for widespread use. Learn about accessing our data and integrating our maps below.";

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
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              {resource.title}
            </a>
            <p>{resource.description}</p>
          </ResourceItem>
        ))}
      </ResourceGrid>
    </div>
  );
};

export const RelatedResources = () => {
  return (
    <AboutMapResource
      intro={relatedResourcesTitle}
      title="Related Resources"
      resources={relatedResources}
    />
  );
};

export const DataResources = () => {
  return (
    <AboutMapResource
      intro={dataResourcesTitle}
      title="Explore the data"
      resources={dataResources}
    />
  );
};
