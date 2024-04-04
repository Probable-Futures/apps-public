import { useRef, useEffect } from "react";
import Player from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import styled from "styled-components";

import { colors, size } from "../consts";
import PlayIcon from "../assets/icons/play.svg";
import PauseIcon from "../assets/icons/pause.svg";

type Props = {
  src: string;
  isDisplayed: boolean;
};

const Container = styled(Player)`
  border: 1px solid ${colors.darkPurple};
  border-radius: 22px;
  background: none;
  box-shadow: none;
  margin: 24px 0;
  padding: 8px 15px;

  @media (min-width: ${size.tablet}) {
    margin: 32px 0;
  }

  .rhap_controls-section {
    display: block;
    flex: unset;
    margin-right: 18px;
  }

  .rhap_main-controls-button {
    margin: 0;
  }

  .rhap_play-pause-button {
    width: 30px;
    height: 30px;
  }

  .rhap_additional-controls,
  .rhap_volume-controls {
    display: none;
  }

  .rhap_time {
    font-family: "RelativeMono";
    font-size: 16px;
    letter-spacing: 0;
    line-height: 18px;
    color: ${colors.darkPurple};
  }

  .rhap_progress-container {
    margin: 0 15px 0 21px;
  }

  .rhap_progress-bar {
    height: 4px;
    background-color: #d6d6d6;
  }

  .rhap_progress-indicator,
  .rhap_progress-filled {
    background-color: ${colors.darkPurple};
  }

  .rhap_progress-indicator {
    width: 18px;
    height: 18px;
    margin-left: -9px;
    top: -7px;
    box-shadow: none;
  }
`;

const ControlIcon = styled.i`
  display: block;
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: 30px;
  height: 30px;
`;

const AudioPlayer = ({ src, isDisplayed }: Props) => {
  const playerRef = useRef<Player>(null);

  useEffect(() => {
    if (!isDisplayed && playerRef.current?.isPlaying()) {
      playerRef.current.audio.current?.pause();
    }
  }, [isDisplayed]);

  return (
    <Container
      ref={playerRef}
      src={src}
      showJumpControls={false}
      showDownloadProgress={false}
      autoPlayAfterSrcChange={false}
      layout="horizontal-reverse"
      customIcons={{
        play: <ControlIcon icon={PlayIcon} />,
        pause: <ControlIcon icon={PauseIcon} />,
      }}
      customVolumeControls={[]}
      customAdditionalControls={[]}
    />
  );
};

export default AudioPlayer;
