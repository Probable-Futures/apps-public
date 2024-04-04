import React, { useEffect, useState } from "react";
import styled from "styled-components";

// @ts-ignore
import { EXPORT_IMG_RATIO_OPTIONS, EXPORT_IMG_RESOLUTION_OPTIONS } from "kepler.gl";
// @ts-ignore
import { StyledModalContent } from "kepler.gl/components";
import { injectIntl } from "react-intl";

import { Dropdown } from "../../Common";
import { Option } from "../../../shared/types";
import { Theme } from "../../../shared/styles/styles";
import ImagePreview from "./CustomImagePreview";
import { colors } from "../../../consts";

const ImageOptionList = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 250px;

  .image-option-section {
    .image-option-section-title {
      font-weight: 500;
      font-size: 14px;
    }
  }

  .button-list {
    width: 192px;
    padding: 8px 0px;
  }

  input {
    margin-right: 8px;
  }
`;

const Container = styled.div`
  color: ${colors.darkPurple};
  font-family: LinearSans;
  font-size: 14px;
  letter-spacing: 0;
  line-height: 18px;
  .export-image-modal {
    background: ${colors.primaryWhite};
    padding: 10px 72px;
  }
`;

const RatioMessage = {
  SCREEN: "Original Screen",
  CUSTOM: "Custom",
  FOUR_BY_THREE: "4:3",
  SIXTEEN_BY_NINE: "16:9",
};

const CustomExportImageModalFactory = () => {
  const ExportImageModal = ({
    mapW,
    mapH,
    exportImage,
    onUpdateImageSetting,
    cleanupExportImage,
    intl,
  }: any) => {
    const { ratio, resolution } = exportImage;

    const [selectedResolution, setSelectedResolution] = useState<Option>({
      value: resolution,
      label:
        EXPORT_IMG_RESOLUTION_OPTIONS.find((resol: any) => resol.id === resolution)?.label || "",
    });
    const [selectedRatio, setSelectedRatio] = useState<Option>({
      value: ratio,
      label:
        RatioMessage[
          EXPORT_IMG_RATIO_OPTIONS.find((r: any) => r.id === ratio)?.id as keyof typeof RatioMessage
        ] || "",
    });

    useEffect(() => {
      onUpdateImageSetting({
        exporting: true,
      });
      return cleanupExportImage;
    }, [onUpdateImageSetting, cleanupExportImage]);

    useEffect(() => {
      if (mapH !== exportImage.mapH || mapW !== exportImage.mapW) {
        onUpdateImageSetting({
          mapH,
          mapW,
        });
      }
    }, [mapH, mapW, exportImage, onUpdateImageSetting]);

    const updateResolution = (option: Option) => {
      setSelectedResolution(option);
      const resolutionOption = EXPORT_IMG_RESOLUTION_OPTIONS.find(
        (resol: any) => resol.id === option.value,
      );
      resolutionOption.available && onUpdateImageSetting({ resolution: option.value });
    };

    const updateRation = (option: Option) => {
      setSelectedRatio(option);
      onUpdateImageSetting({ ratio: option.value });
    };

    return (
      <Container>
        <p>Choose how to export your image. Higher resolution is better for prints.</p>
        <StyledModalContent className="export-image-modal">
          <ImageOptionList>
            <div className="image-option-section">
              <div className="image-option-section-title">Ratio of image</div>
              <div className="button-list" id="export-image-modal__option_ratio">
                <Dropdown
                  options={EXPORT_IMG_RATIO_OPTIONS.filter((op: any) => !op.hidden).map(
                    (op: any) => {
                      return {
                        label: RatioMessage[op.id as keyof typeof RatioMessage],
                        value: op.id,
                      };
                    },
                  )}
                  value={selectedRatio}
                  onChange={updateRation}
                  theme={Theme.LIGHT}
                />
              </div>
            </div>
            <div className="image-option-section">
              <div className="image-option-section-title">Resolution</div>
              <div className="button-list" id="export-image-modal__option_resolution">
                <Dropdown
                  options={EXPORT_IMG_RESOLUTION_OPTIONS.map((op: any) => ({
                    label: op.label,
                    value: op.id,
                  }))}
                  value={selectedResolution}
                  onChange={updateResolution}
                  theme={Theme.LIGHT}
                />
              </div>
            </div>
          </ImageOptionList>
          <ImagePreview exportImage={exportImage} />
        </StyledModalContent>
      </Container>
    );
  };

  return injectIntl(ExportImageModal);
};

export default CustomExportImageModalFactory;
