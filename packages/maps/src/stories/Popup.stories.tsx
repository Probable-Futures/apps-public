import type { Meta, StoryObj } from "@storybook/react";
import styled from "styled-components";
import MapGL from "react-map-gl";
import * as DocBlock from "@storybook/blocks";
import { BrowserRouter } from "react-router-dom";

import Popup from "../components/common/Popup";
import { datasets } from "./assets/mock-data/datasets.data";
import { size } from "@probable-futures/lib/src/consts";
import { TranslationLoader, TranslationProvider } from "../contexts/TranslationContext";
import AdditionalDocs from "./AdditionalDocs";
import { PopupContent } from "@probable-futures/components-lib/src/components";
import { PopupFeature } from "@probable-futures/lib/src/types";

const Container = styled.div`
  position: relative;

  #map-header {
    display: flex;
  }

  .mapboxgl-map {
    font: unset;
  }

  .mapboxgl-ctrl-attrib-inner a {
    font-size: 12px;
    font-family: Helvetica Neue, Arial, Helvetica, sans-serif;
    line-height: 20px;
  }

  .mapboxgl-ctrl-attrib-button {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    justify-content: center;
    align-items: center;

    @media (min-width: ${size.tablet}) {
      display: none;
    }
  }

  .mapboxgl-ctrl-attrib.mapboxgl-compact {
    margin-bottom: 5px;
  }

  .mapbox-improve-map {
    font-weight: 700;
  }

  .mapboxgl-popup-tip {
    position: absolute;
    left: calc(50% - 12px);
    top: -6px;
  }
`;

const meta: Meta<typeof Popup> = {
  title: "PF/InspectorPopup",
  component: Popup,
  parameters: {
    layout: "centered",
    docs: {
      page: () => (
        <>
          <DocBlock.Title />
          <AdditionalDocs
            whatIsIt="The inspector of the map popup that shows the value of each cell when clicking the map."
            whenAndHowToUse="It is used along with the mapbox map to be displayed once the user click somewhere on the map. Values inside the popup represent the value of each cell in the tileset."
            currentUsage="Maps page"
          />
          <DocBlock.Heading>Props</DocBlock.Heading>
          <DocBlock.Controls />
        </>
      ),
    },
  },
  argTypes: {},
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <TranslationProvider>
          <TranslationLoader />
          <Container>
            <MapGL>
              <Story />
            </MapGL>
          </Container>
        </TranslationProvider>
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Popup>;

const mapFeature: PopupFeature = {
  data_1_5c_high: 147,
  data_1_5c_low: 66,
  data_1_5c_mid: 106,
  data_1c_high: 136,
  data_1c_low: 43,
  data_1c_mid: 88,
  data_2_5c_high: 205,
  data_2_5c_low: 98,
  data_2_5c_mid: 143,
  data_2c_high: 163,
  data_2c_low: 76,
  data_2c_mid: 118,
  data_3c_high: 267,
  data_3c_low: 110,
  data_3c_mid: 175,
  data_baseline_high: 109,
  data_baseline_low: 26,
  data_baseline_mid: 62,
  latitude: -4.250142937760316,
  longitude: 33.940363191723975,
  selectedData: { high: 267, low: 110, mid: 175 },
  selectedField: "data_3c",
};

export const Primary: Story = {
  args: {
    feature: mapFeature,
    onClose: () => {},
    children: (
      <PopupContent
        feature={{
          ...mapFeature,
        }}
        dataset={datasets[0]}
        degreesOfWarming={3}
        tempUnit="°C"
        onReadMoreClick={() => {}}
        onBaselineClick={() => {}}
        showInspector={false}
        datasetDescriptionResponse={{
          dataset_description:
            "<p>As mean global temperatures rise, local climates will experience extreme temperatures more frequently...</p>",
          dataset_id: "40104",
          vignette_title_wysiwyg: "<p>Days above 32°C (90°F)</p>",
          map_volume: true,
        }}
        precipitationUnit="mm"
      />
    ),
  },
};
