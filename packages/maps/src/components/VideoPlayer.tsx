import { useRef, useEffect } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import styled from "styled-components";

import { colors, size } from "../consts";
import PlayIcon from "../assets/icons/play-large.svg";

type PlyrInstance = Plyr;
type HTMLPlyrVideoElement = HTMLVideoElement & { plyr?: PlyrInstance };

type Props = {
  src: string;
  isDisplayed: boolean;
};

const Container = styled.div`
  margin: -23px -20px 24px;
  --plyr-color-main: ${colors.darkPurple};

  .plyr--video.plyr--stopped .plyr__controls {
    display: none;
  }

  .plyr__control--overlaid {
    width: 50px;
    height: 50px;
    background-image: url(${PlayIcon});
    background-repeat: no-repeat;
    background-size: 50px auto;
    background-position: center;

    &:hover {
      background-image: url(${PlayIcon});
    }

    svg {
      display: none;
    }
  }

  .plyr__time,
  .plyr__tooltip {
    font-family: "RelativeMono";
  }

  @media (min-width: ${size.tablet}) {
    margin: -40px -40px 32px -60px;
  }
`;

const VideoPlayer = ({ src, isDisplayed }: Props) => {
  const playerRef = useRef<HTMLPlyrVideoElement>(null);

  useEffect(() => {
    if (playerRef.current) {
      // Initialize player
      if (!playerRef.current.plyr) {
        playerRef.current.plyr = new Plyr(playerRef.current, {
          ratio: "16:9",
          controls: [
            "play-large",
            "play",
            "current-time",
            "progress",
            "duration",
            "mute",
            "volume",
            "fullscreen",
          ],
        });
      }

      // Load source
      playerRef.current.plyr.source = {
        type: "video",
        sources: [
          {
            src,
            provider: "vimeo",
          },
        ],
      };
    }
  }, [src]);

  useEffect(() => {
    if (!isDisplayed && playerRef.current) {
      playerRef.current.plyr?.stop();
    }
  }, [isDisplayed]);

  return (
    <Container>
      <video ref={playerRef} />
    </Container>
  );
};

export default VideoPlayer;
