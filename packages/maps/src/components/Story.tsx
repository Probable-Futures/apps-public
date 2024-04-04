import { useRef, useEffect, MouseEventHandler, useState } from "react";
import parse from "html-react-parser";
import Headroom from "react-headroom";
import styled, { css } from "styled-components";
import { types } from "@probable-futures/lib";
import { styles } from "@probable-futures/components-lib";
import { ReactComponent as CloseIcon } from "@probable-futures/components-lib/src/assets/icons/cancel.svg";

import AudioPlayer from "../components/AudioPlayer";
import VideoPlayer from "../components/VideoPlayer";
import { useMapData } from "../contexts/DataContext";
import { colors, size } from "../consts";
import ArrowIcon from "../assets/icons/nav-arrow-right.svg";
import { useTranslation } from "../contexts/TranslationContext";

type Props = {
  story?: types.Story;
  isOpen: boolean;
  currentStory: number;
  onClose: MouseEventHandler<HTMLButtonElement>;
  onNavButtonClick: Function;
};

const textStyles = css`
  p {
    margin: 0;
    padding: 0;
  }
`;

const StoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(100% - 74px);

  @media (min-width: ${size.laptop}) {
    width: 650px;
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

const Container = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: ${colors.whiteSmoke};
  transition: transform 0.7s ease;
  transform: ${({ isOpen }: { isOpen: boolean }) =>
    isOpen ? "translateX(0); box-shadow: -1px 0 5px 0 rgba(0, 0, 0, 0.3);" : "translateX(100%);"}
  z-index: 5;

  @media (min-width: ${size.laptop}) {
    width: 650px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(151, 151, 151, 0.4);
  background-color: ${colors.white};
  padding: 30px 20px 17px;

  @media (min-width: ${size.tablet}) {
    padding: 20px 40px 20px 60px;
  }
`;

const KeyFacts = styled.dl`
  display: flex;
  flex-direction: column;
  color: ${colors.darkPurple};
  letter-spacing: 0;
  margin: 0;

  dt {
    display: inline;
    font-size: 12px;
    line-height: 24px;
    margin-right: 5px;
  }

  dd {
    font-family: "RelativeMono";
    display: inline;
    font-size: 14px;
    line-height: 18px;
    margin: 0;
  }

  @media (min-width: ${size.tablet}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    dt,
    dd {
      display: block;
    }

    dt {
      margin-right: 0;
      margin-bottom: 5px;
    }
  }
`;

const Location = styled.span`
  display: block;
  font-family: "RelativeMono";
  font-size: 16px;
  line-height: 18px;
  margin-bottom: 8px;
  margin-right: 5px;
  ${textStyles};

  @media (min-width: ${size.tablet}) {
    margin-right: 63px;
    margin-bottom: 0;
  }
`;

const KeyFact = styled.div`
  @media (min-width: ${size.tablet}) {
    margin-right: 70px;
    min-width: 80px;
  }
`;

const CloseButton = styled.button`
  height: 30px;
  width: 30px;
  background-color: transparent;
  border: none;
  outline: 0;
  cursor: pointer;
  padding: 0;
  align-self: start;
  flex-shrink: 0;
  margin: 0;
  ${styles.whiteFilter}

  svg path {
    stroke-width: 1px;
    stroke: ${colors.black};
  }

  @media (min-width: ${size.tablet}) {
    height: 40px;
    width: 40px;
    margin-top: 5px;
    svg {
      height: 40px;
      width: 40px;
    }
  }
`;

const Content = styled.div`
  padding: 23px 20px 0;
  font-family: "Cambon";
  color: ${colors.darkPurple};

  p {
    font-size: 21px;
    letter-spacing: 0;
    line-height: 34px;
    margin: 24px 0;
  }

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
    padding: 40px 40px 56px 60px;

    h2 {
      font-size: 42px;
      line-height: 50px;
    }
  }
`;

const FeaturedImageFigure = styled.figure`
  figcaption {
    margin-top: 0;
    margin-bottom: 24px;
  }
`;

const ImageWrapper = styled.div`
  position: relative;
  min-height: 200px;

  &::before {
    content: "";
    display: ${({ isImageLoaded }: { isImageLoaded: boolean }) =>
      isImageLoaded ? "none" : "block"};
    position: absolute;
    top: calc(50% - 16px);
    left: calc(50% - 16px);
    background-color: ${colors.darkPurple};
    border-radius: 50%;
    height: 32px;
    width: 32px;
    box-shadow: 0 0 0 0 rgb(42, 23, 45, 50%);
    animation: pulse 1.25s infinite;
    z-index: 1;

    @keyframes pulse {
      0% {
        transform: scale(0.9);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 32px rgba(42, 23, 45, 0);
      }
      100% {
        transform: scale(0.9);
        box-shadow: 0 0 0 0 rgba(42, 23, 45, 0);
      }
    }
  }
`;

const VignetteTitle = styled.h2`
  margin: 0;
  padding: 0;
  ${textStyles};

  p {
    font-weight: 400;
    font-size: 38px;
    letter-spacing: 0px;
    line-height: 48px;
    margin-bottom: 15px;
  }
`;

const FeaturedImage = styled.img`
  margin-bottom: 4px;
  visibility: ${({ isLoaded }: { isLoaded: boolean }) => (isLoaded ? "visible" : "hidden")};
`;

const Contributor = styled.div`
  color: ${colors.darkPurple};
  font-size: 13px;
  letter-spacing: 0;
  line-height: 24px;

  span {
    display: block;
  }

  a {
    color: ${colors.darkPurple};
    text-decoration: underline;
  }
`;

const Nav = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  position: sticky;
  bottom: 0;
  min-height: 50px;
  z-index: 2;
  padding: 0 20px 0;
  color: ${colors.darkPurple};
  border-top: 1px solid rgba(151, 151, 151, 0.4);

  @media (min-width: ${size.tablet}) {
    padding-right: 40px;
    padding-left: 60px;
  }
`;

const CurrentStory = styled.span`
  color: ${colors.black};
  font-family: "RelativeMono";
  font-size: 14px;
  letter-spacing: 0;
  line-height: 20px;
`;

const NavButton = styled.button`
  height: 33px;
  width: 54px;
  background-color: ${colors.dimBlack};
  border: none;
  outline: 0;
  cursor: pointer;
  background-image: url(${ArrowIcon});
  background-repeat: no-repeat;
  background-size: 20px auto;
  background-position: 18px center;
  margin-left: 9px;
  transform: ${({ left }: { left?: boolean }) => (left ? "rotate(180deg)" : "rotate(0)")};
`;

const StorySubmission = styled.div`
  background-color: #ecf0e0;
  padding: 17px 20px 20px;
  margin: 0 -20px;

  p {
    color: ${colors.darkPurple};
    font-family: "LinearSans";
    font-size: 13px;
    letter-spacing: 0;
    line-height: 20px;
    margin: 0;
  }

  @media (min-width: ${size.tablet}) {
    padding-left: 60px;
    padding-right: 40px;
    margin: 0 -40px -56px -60px;
  }
`;

const VignetteContributorName = styled.a`
  p {
    margin: 0;
    padding: 0;
    font-size: 13px;
    letter-spacing: 0px;
    line-height: 24px;

    &:hover {
      color: ${colors.purple} !important;
    }
  }
`;

const VignetteContributorTitle = styled.div`
  ${textStyles};
`;

const VignetteDetail = styled.dd`
  ${textStyles};
`;

export default function Story({
  story,
  currentStory,
  isOpen,
  onClose,
  onNavButtonClick,
}: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFeaturedImageLoaded, setIsFeaturedImageLoaded] = useState(false);
  const { stories, storySubmission } = useMapData();
  const { translate } = useTranslation();

  useEffect(() => {
    setIsFeaturedImageLoaded(false);
    if (containerRef.current) {
      containerRef.current.scrollTo(0, 0);
    }
  }, [containerRef, story]);

  const renderFeaturedMedia = (media: types.StoryFeaturedMedia) => {
    if (media.featured_media_type === "image" && typeof media.image === "object") {
      return (
        <FeaturedImageFigure>
          <ImageWrapper isImageLoaded={isFeaturedImageLoaded}>
            <FeaturedImage
              isLoaded={isFeaturedImageLoaded}
              alt={media.image.alt}
              src={media.image.sizes.medium_large}
              onLoad={() => setIsFeaturedImageLoaded(true)}
            />
          </ImageWrapper>
          {media.image.caption && <figcaption>{media.image.caption}</figcaption>}
        </FeaturedImageFigure>
      );
    } else if (media.featured_media_type === "video" && media.video) {
      return <VideoPlayer src={media.video} isDisplayed={isOpen} />;
    }
    return null;
  };

  const renderContent = () => {
    if (story) {
      const {
        acf: {
          vignette_title_wysiwyg,
          vignette_location,
          vignette_featured_media,
          vignette_contributor,
          vignette_body,
        },
      } = story;

      return (
        <StoryContainer>
          <Headroom disableInlineStyles parent={() => containerRef.current}>
            <Header>
              <KeyFacts>
                {vignette_location.name_wysiwyg && (
                  <Location dangerouslySetInnerHTML={{ __html: vignette_location.name_wysiwyg }} />
                )}
                {vignette_location.climate_zone_wysiwyg && (
                  <KeyFact>
                    <dt>{translate("vignette.climateZone")}:</dt>
                    <VignetteDetail
                      dangerouslySetInnerHTML={{ __html: vignette_location.climate_zone_wysiwyg }}
                    />
                  </KeyFact>
                )}
                {vignette_location.population_wysiwyg && (
                  <KeyFact>
                    <dt>{translate("vignette.population")}:</dt>
                    <VignetteDetail
                      dangerouslySetInnerHTML={{ __html: vignette_location.population_wysiwyg }}
                    />
                  </KeyFact>
                )}
              </KeyFacts>
              <CloseButton title="Close" onClick={onClose}>
                <CloseIcon width={30} height={30} />
              </CloseButton>
            </Header>
          </Headroom>
          <Content>
            {vignette_featured_media && renderFeaturedMedia(vignette_featured_media)}
            <VignetteTitle dangerouslySetInnerHTML={{ __html: vignette_title_wysiwyg }} />
            {vignette_featured_media &&
              vignette_featured_media.featured_media_type === "audio" &&
              typeof vignette_featured_media.audio === "object" && (
                <AudioPlayer src={vignette_featured_media.audio.url} isDisplayed={isOpen} />
              )}
            {vignette_contributor.name_wysiwyg && (
              <Contributor>
                <span>{translate("vignette.contributionFrom")}:</span>
                <span>
                  <VignetteContributorName
                    dangerouslySetInnerHTML={{ __html: vignette_contributor.name_wysiwyg }}
                    target="_blank"
                    rel="noopener noreferrer"
                    href={vignette_contributor.link}
                  />

                  {vignette_contributor.title_wysiwyg ? (
                    <VignetteContributorTitle
                      dangerouslySetInnerHTML={{ __html: vignette_contributor.title_wysiwyg }}
                    />
                  ) : (
                    ""
                  )}
                </span>
              </Contributor>
            )}
            {vignette_body &&
              parse(vignette_body, {
                replace: (domNode: any) => {
                  if (
                    domNode.type === "tag" &&
                    domNode.name === "audio" &&
                    domNode.children[0]?.name === "source"
                  ) {
                    return (
                      <AudioPlayer src={domNode.children[0].attribs.src} isDisplayed={isOpen} />
                    );
                  }
                },
              })}
            {storySubmission && (
              <StorySubmission dangerouslySetInnerHTML={{ __html: storySubmission }} />
            )}
          </Content>
        </StoryContainer>
      );
    }
  };

  const renderNav = () =>
    stories.length > 1 && (
      <Nav>
        <CurrentStory>
          {`${translate("vignette.vignette")} ${currentStory} ${translate("vignette.of")} ${
            stories.length
          }`}
        </CurrentStory>
        <div>
          <NavButton title="Previous Vignette" left onClick={() => onNavButtonClick(-1)} />
          <NavButton title="Next Vignette" onClick={() => onNavButtonClick(1)} />
        </div>
      </Nav>
    );

  return (
    <Container id="map-story" ref={containerRef} isOpen={isOpen}>
      {renderContent()}
      {renderNav()}
    </Container>
  );
}
