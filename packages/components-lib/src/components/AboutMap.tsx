import { useRef, MouseEventHandler, useEffect, useState } from "react";
import Headroom from "react-headroom";
import styled, { css } from "styled-components";
import { ReactComponent as CloseIcon } from "@probable-futures/components-lib/src/assets/icons/cancel-circle-thin.svg";
import ArrowRightIcon from "@probable-futures/components-lib/src/assets/icons/arrow-right.svg";
import { Map, Option } from "@probable-futures/lib/src/types";
import camelcase from "lodash.camelcase";

import { colors, size } from "../../../maps/src/consts";
import { ExpandCollapseIcon, purpleFilter } from "@probable-futures/components-lib/src/styles";
import {
  DatasetDescriptionResponse,
  degreesOptions,
  WarmingScenarioDescs,
  AboutMapResources,
} from "@probable-futures/lib";
import DatasetSelectorForAboutMap from "./DatasetSelectorFoAboutMap";
import MapOverlay from "./MapOverlay";
import { DataResources, RelatedResources } from "./AboutMapResource";

type Props = {
  isOpen: boolean;
  datasetDescriptionResponse?: DatasetDescriptionResponse;
  warmingScenarioDescs: WarmingScenarioDescs;
  datasets: Map[];
  translatedHeader?: any;
  selectedDataset?: Map;
  aboutMapResources?: AboutMapResources;
  onDatasetChange: (option: Option) => void;
  onClose: MouseEventHandler<HTMLButtonElement>;
};

const SharedLeftPadding = css`
  padding-left: 20px;

  @media (min-width: ${size.tablet}) {
    padding-left: 80px;
  }
`;

const AboutMapContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  background-color: #ecf0e0;
  color: ${colors.darkPurple};

  @media (min-width: ${size.laptop}) {
    width: 100%;
  }

  .headroom {
    transition: transform 0.2s ease-in-out;
  }

  .headroom-wrapper {
    position: sticky;
    top: 0;
    z-index: 2;
  }

  .headroom--unfixed,
  .headroom--pinned {
    transform: translateY(0);
  }

  .headroom--unpinned {
    transform: translateY(-100%);
  }
`;

const MainContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: ${colors.whiteSmoke};
  transition: transform 0.7s ease;
  transform: ${({ isOpen }: { isOpen: boolean }) =>
    isOpen ? "translateX(100%); box-shadow: -1px 0 5px 0 rgba(0, 0, 0, 0.3);" : "translateX(200%);"}
  z-index: 7;

  @media (min-width: ${size.laptop}) {
    width: 50vw;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(151, 151, 151, 0.4);
  background-color: ${colors.white};

  padding-right: 20px;
  ${SharedLeftPadding};

  @media (min-width: ${size.tablet}) {
    padding-right: 18px;
  }
`;

const HeaderTitle = styled.dl`
  display: flex;
  letter-spacing: 0;
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  font-family: "RelativeMono";
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Content = styled.div`
  font-family: "LinearSans";
  color: ${colors.darkPurple};
  padding-right: 20px;

  ${SharedLeftPadding}

  a {
    color: ${colors.darkPurple};
  }

  figure {
    margin: 0;
  }

  figcaption {
    font-family: "LinearSans";
    font-size: 12px;
    line-height: 24px;
    margin-top: 24px;
  }

  img {
    height: auto;
    max-width: 100%;
  }

  @media (min-width: ${size.tablet}) {
    padding-right: 75px;
    h2 {
      font-size: 42px;
      line-height: 50px;
    }
  }
`;

export const Title = styled.h3`
  font-size: 12px;
  font-weight: 400;
  text-transform: uppercase;
  margin: 0;
  font-family: "RelativeMono";
  margin-bottom: 20px;

  @media (min-width: ${size.tablet}) {
    margin-bottom: 25px;
  }
`;

const ContentWrapper = styled.div`
  padding-top: 20px;

  @media (min-width: ${size.tablet}) {
    padding-top: 56px;
  }
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const Paragraph = styled.p`
  font-size: 18px;
  font-weight: 400;
  line-height: 28px;
  margin: 10px 0;

  @media (min-width: ${size.tablet}) {
    font-size: 20px;
    line-height: 34px;
    margin: 20px 0;
  }
`;

const Related = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 1rem;
  font-size: 0.9rem;
  margin-bottom: 40px;

  @media (min-width: ${size.tablet}) {
    margin-bottom: 70px;
  }
`;

const RelatedItem = styled.a`
  display: flex;
  align-items: center;
  padding: 0.6rem 1rem;
  background: ${colors.secondaryWhite};
  border-radius: 30px;
  border: 1px solid transparent;
  width: fit-content;
  cursor: pointer;
  text-decoration: none;
  color: ${colors.darkPurple};
  transition: transform 0.3s ease, color 0.3s ease;

  &:hover {
    transform: translateX(25px);
    color: ${colors.purpleLight};
  }
`;

const StyledArrowIcon = styled.img`
  margin-left: 0.5rem;
  width: 0.6rem;
  height: 0.6rem;
  filter: brightness(0) saturate(100%);
`;

const WarmingScenarioSection = styled.div`
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  padding: 25px 0px;
`;

const WarmingScenarioTitle = styled.div`
  font-weight: bold;
  font-size: 0.95rem;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  align-items: center;
`;

const WarmingScenarioWrapper = styled.div<{ isExpanded: boolean }>`
  opacity: ${({ isExpanded }) => (isExpanded ? 1 : 0)};
  transform: ${({ isExpanded }) => (isExpanded ? "translateY(0)" : "translateY(-10px)")};
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  visibility: ${({ isExpanded }) => (isExpanded ? "visible" : "hidden")};
  height: ${({ isExpanded }) => (isExpanded ? "auto" : "0")}; /* Collapses when hidden */
  overflow: hidden;
`;

const WarmingScenarioContent = styled.div`
  font-size: 16px;
  display: flex;
  flex-direction: column;
  padding-top: 36px;

  h4 {
    font-size: 18px;
    font-weight: 600;
    line-height: 29px;
    margin: 0;
    min-width: 45px;
  }

  p {
    margin: 0;
  }

  @media (min-width: ${size.tablet}) {
    flex-direction: row;
    gap: 40px;
    align-items: start;
    justify-content: space-between;
  }
`;

const WarmingScenarioCitation = styled.div`
  text-align: right;
  margin-top: 5px;

  p {
    font-size: 14px;
    font-weight: 300;
  }
`;

const CloseButton = styled.button`
  height: 30px;
  width: 30px;
  border: none;
  outline: 0;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  margin: 0;
  background: transparent;

  svg {
    height: 30px;
    width: 30px;
  }

  &:hover {
    ${purpleFilter}
  }
`;

const OverlayContainer = styled.div`
  transition: opacity 0.2s ease-in-out;
  opacity: 0;
  pointer-events: none;

  ${({ visible }: { visible: boolean }) =>
    visible &&
    `
  opacity: 1;
  pointer-events: all;
`}
`;

const AboutMap = ({
  isOpen,
  datasetDescriptionResponse,
  warmingScenarioDescs,
  datasets,
  translatedHeader,
  selectedDataset,
  aboutMapResources,
  onDatasetChange,
  onClose,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const translatedDatasets = translatedHeader?.datasets || {};

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo(0, 0);
    }
  }, [containerRef]);

  if (!selectedDataset) {
    return null;
  }

  const renderContent = () => {
    if (containerRef.current) {
      return (
        <AboutMapContainer>
          <Headroom disableInlineStyles parent={() => containerRef.current}>
            <Header>
              <HeaderTitle>{translatedHeader?.aboutThisMap || "About this map"}</HeaderTitle>
              <CloseButton title="Close" onClick={onClose}>
                <CloseIcon width={30} height={30} />
              </CloseButton>
            </Header>
          </Headroom>
          <Content>
            <ContentWrapper>
              <Section>
                <Title>{translatedHeader?.currentMap || "Current Map"}</Title>
                <DatasetSelectorForAboutMap
                  datasets={datasets}
                  translatedDatasets={translatedDatasets}
                  value={{
                    value: selectedDataset.slug || "",
                    label:
                      (translatedDatasets || {})[camelcase(selectedDataset.slug)] ||
                      selectedDataset.name,
                  }}
                  onChange={onDatasetChange}
                />
              </Section>

              <Section>
                <Title>
                  {translatedHeader?.whatDoesThisMapMeasure || "What does this map measure?"}
                </Title>
                <Paragraph>
                  {datasetDescriptionResponse && (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: datasetDescriptionResponse.dataset_description,
                      }}
                    />
                  )}
                </Paragraph>
                {datasetDescriptionResponse?.related_posts &&
                  datasetDescriptionResponse.related_posts.length > 0 && (
                    <Related>
                      <Paragraph>{translatedHeader?.related || "Related"}:</Paragraph>
                      {datasetDescriptionResponse.related_posts.map((item, index) => (
                        <RelatedItem
                          key={index}
                          href={item.post.url}
                          target={item.post.target || "_self"}
                        >
                          <span dangerouslySetInnerHTML={{ __html: item.post.title }} />
                          <StyledArrowIcon src={ArrowRightIcon} alt="Arrow Right" />
                        </RelatedItem>
                      ))}
                    </Related>
                  )}
              </Section>

              <Section>
                <Title>
                  {translatedHeader?.whatAreWarmingScenarios || "What are warming scenarios?"}
                </Title>
                <Paragraph>
                  {translatedHeader?.descriptionOfWarmingScenarios ||
                    "Warming scenarios tell us how much Earth’s global average surface temperature has increased since pre-industrial times. The widely-accepted 0°C baseline warming scenario for pre-industrial times is Earth’s average temperature from 1850 to 1900. These maps depict warming scenarios from 0.5°C (Earth’s average temperature from 1971 to 2000) to 3°C (a possible future scenario.) Read more about how we measure climate change."}
                </Paragraph>

                <WarmingScenarioSection>
                  <WarmingScenarioTitle onClick={() => setIsExpanded(!isExpanded)}>
                    {translatedHeader?.aboutEachWarmingScenario || "About each warming scenario"}
                    <ExpandCollapseIcon isOpen={isExpanded} />
                  </WarmingScenarioTitle>

                  <WarmingScenarioWrapper isExpanded={isExpanded}>
                    {degreesOptions.map(({ label, descKey, citationKey }) => (
                      <WarmingScenarioContent key={descKey}>
                        <h4>{label}</h4>
                        <div>
                          <div
                            dangerouslySetInnerHTML={{ __html: warmingScenarioDescs[descKey]! }}
                          />
                          {citationKey && (
                            <WarmingScenarioCitation
                              dangerouslySetInnerHTML={{
                                __html: warmingScenarioDescs[citationKey]!,
                              }}
                            />
                          )}
                        </div>
                      </WarmingScenarioContent>
                    ))}
                  </WarmingScenarioWrapper>
                </WarmingScenarioSection>
              </Section>

              <Section>
                <RelatedResources
                  translatedHeader={translatedHeader}
                  resources={aboutMapResources?.resources}
                  intro={aboutMapResources?.related_subheading}
                  title={aboutMapResources?.related_heading}
                />
              </Section>
              <Section>
                <DataResources
                  translatedHeader={translatedHeader}
                  resources={aboutMapResources?.data_resources}
                  intro={aboutMapResources?.explore_subheading}
                  title={aboutMapResources?.explore_heading}
                />
              </Section>
            </ContentWrapper>
          </Content>
        </AboutMapContainer>
      );
    }
  };

  return (
    <>
      <MainContainer id="about-map" ref={containerRef} isOpen={isOpen}>
        {renderContent()}
      </MainContainer>
      <OverlayContainer visible={isOpen}>
        <MapOverlay onClick={() => {}} />
      </OverlayContainer>
    </>
  );
};

export default AboutMap;
