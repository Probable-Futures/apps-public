# @probable-futures/probable-futures-maps

This package empowers developers to seamlessly integrate dynamic and interactive climate maps into their web applications

## Installing

Using npm:
`npm install @probable-futures/probable-futures-maps`

Using yarn:
`yarn add @probable-futures/probable-futures-maps`

## Functions

### `generateEmbedMap`

Easily embed any Probable Futures map in a website without touching a single line of code. This function can be used to generate embeddable maps as an html-string template.

**Params:**

- `datasetId` (Number): The id of the dataset associated to each map. The list can be found in the [docs](https://docs.probablefutures.org/maps/#all-maps)
- `tempUnit` (`°C` or `°F`): If the map unit is a temperature unit, eg. "Average Tempareture" map, you can choose the initial unit for the map data. Note that unit can still be changed from the map key
- `scenario` (Number): The warming scenario
- `viewState` (Object): This is an object which defines the initial view port of the map. The object includes `longitude`, `latitude`, and `zoom`
- `compare` (Object): This object can be specified in case the user wants to generate a comparison embeddable map. The object fields are `scenarioBefore` and `scenarioAfter`
- `hideControls` (Boolean) - default false: Hide the map controls, such as zoom buttons
- `hideMapLegend` (Boolean) - default false: Hide the map key
- `hideTitle` (Boolean) - default false: Hide the title containing the map name
- `hideResetMapButton` (Boolean) - default true: Hide the reset button. This button could be used to reset the map to its original view given the initial long, lat and zoom.

**Example:**

```js
import { generateEmbedMap } from "@probable-futures/probable-futures-maps";
import * as fs from "fs";

const htmlTemplate = await generateEmbedMap({
  datasetId: 40101,
  viewState: {
    zoom: 4,
  },
  scenario: 2,
});

// Do whatever you want with the html template, eg. write it to an html
// file or render it in inside an html iframe.

const fullPath = "./output.html";

fs.writeFileSync(fullPath, htmlTemplate);
```

<blockquote style="font-family: 'Source Sans Pro', 'Lucida Grande', sans-serif;-webkit-font-smoothing: antialiased;line-height: 1.6;font-size: 1rem;color: #333;box-sizing: border-box;background: #efefef;padding: 1px 16px;margin-left: 0;margin-right: 0;border-left: #cecece solid 10px;border-radius: 3px;">
<p><strong>Note</strong> Pass "compare" parameter to genereate an embeddable comparison map instead of a simple map. Check the Config section for more info about how to use this param.</p>
</blockquote>

**Additionally, the HTML template listens to the following message events that you can trigger from the main page where you are rendering the template**

- `onDegreeChanged`: You can change the selected warming scenario from outside the tempalte code. Example, if you are rendering the template inside an iframe:

  ```js
  // Simple map
  const newDegree = 3;
  const data = {
    action: "onDegreeChanged",
    degree: newDegree,
  };
  iframe.contentWindow?.postMessage(data, "*");
  ```

  ```js
  // Compare map
  const newDegreeBefore = 1.5;
  const newDegreeAfter = 3;
  const data = {
    action: "onDegreeChanged",
    degreeBefore: newDegreeBefore,
    degreeAfter: newDegreeAfter,
  };
  iframe.contentWindow?.postMessage(data, "*");
  ```

### `getLatestMaps`

Use this function to get the latest Maps. Each Map object is of type Map.

### `getMapObject`

Get the full object of a spcific Map. eg. `getMapObject(40104)`

### `getDatasetIds`

Get all the available dataset Ids. Find each map and its associated datasetId [here](https://docs.probablefutures.org/maps/)

### `getDataDescriptionAtPlaceGenerator`

You can generate a magic sentence that describes the data of a specific map at a specific location. Currenly, only maps whose names start with "Days above" have an associated magic sentence. Usage example:

Example:

```js
import {
  getDataDescriptionAtPlaceGenerator,
  getMapObject,
  DataDescriptionAtPlaceFuncType,
} from "@probable-futures/probable-futures-maps";

const generator = getDataDescriptionAtPlaceGenerator();
const func: DataDescriptionAtPlaceFuncType = generator[40104];
// call the function by passing the required params:
const sentence = func({
  place: "Arizona, United States",
  valueLow: 6,
  valueMid: 32,
  valueHigh: 74,
  degree: 0.5,
  datasetId: 40104,
});

console.log(sentence);

// The result:
// Between 1970 and 2000, people in Arizona, United States could expect about 32 Days above 32°C (90°F) in an average year, 6 days in a cooler year and 74 days in a warmer year. In a 1.5°C warming scenario, people in Arizona, United States can expect about 57 Days above 32°C (90°F) in an average year, 26 days in a cooler year and 106 days in a warmer year.
```

## Components

This library provides react components that you can use to easily and quickly integrate some of the tools and functionalities that Probable Futures provides into your own app.

### `Chart`

Rather than calling the API and creating your own charts, we've provided a Chart component that you can easily integrate into your React app.

**Props:**

- **width** (number, required)
- **height** (number, required)
- **datasetStats** (StatisticsData[], required): the stats that you receive after calling the PF API to get the climate data of a specific location ([learn more about calling the api](https://docs.probablefutures.org/calling-the-api/)).
  Note that you can import that StatisticsData from `@probable-futures/lib`
- **datasetId** (number, required)
- **warmingScenario** (number, required) - supported values: `0.5 | 1 | 1.5 | 2 | 2.5 | 3`
- **hideTitle** (boolean, optional): show or hide the title of the chart
- **onLineClicked** (Function): this event will fire whenever one of the chart lines is clicked

Example:

```jsx
import { Chart } from "@probable-futures/probable-futures-maps";

const [selectedChartDegree, setSelectedChartDegree] = useState(0.5);

<Chart
  width={700}
  height={400}
  datasetStats={datasetStats}
  datasetId={40104}
  warmingScenario={selectedChartDegree}
  hideTitle
  onLineClicked={(degree) => setSelectedChartDegree(degree)}
/>;
```

### `SimpleMap`

This component displays a single map given a dataset id and a warming scenario.

**Props:**

- **datasetId** (Number): The id of the dataset associated to each map. The list can be found in the [docs](https://docs.probablefutures.org/maps/#all-maps)
- **dataset** (Map): Alternatively, you can provide the whole dataset object.
- **tempUnit** (`°C` or `°F`): If the map unit is a temperature unit, eg. "Average Tempareture" map, you can choose the initial unit for the map data. Note that unit can still be changed from the map key
- **precipitationUnit** (`mm` or `in`): If the map unit is a mm, eg. "Change in total annual percipication" map, you can choose the initial unit for the map data. Note that unit can still be changed from the map key
- **showBorders** (Boolean): Show/hide the geopolitical boundaries of the countries over the map
- **showPopupOnFirstLoad** (Boolean): Whether to show the map popup or not when the map initially loads
- **scenario** (Number): The warming scenario
- **viewState** (Object): This is an object which defines the initial view port of the map. The object includes `longitude`, `latitude`, and `zoom`
- **hideControls** (Boolean) - default false: Hide the map controls, such as zoom buttons
- **hideMapLegend** (Boolean) - default false: Hide the map key
- **hideTitle** (Boolean) - default false: Hide the title containing the map name
- **hideResetMapButton** (Boolean) - default true: Hide the reset button. This button could be used to reset the map to its original view given the initial long, lat and zoom.
- **mapboxAccessToken** (String, required) - provide the mapbox access token
- **usePfFonts** (Boolean) - default true. Decides whether to load PF fonts in the page or not.

Example:

```jsx
import { SimpleMap } from "@probable-futures/probable-futures-maps";

<div className="relative h-[500px]">
  <SimpleMap
    viewState={{ zoom: 4, longitude: long, latitude: lat }}
    datasetId={40104}
    mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
  />
</div>;
```

### `CompareMap`

This component provides maps comparison between two different warming scenarios

**Props:**

- **datasetId** (Number): The id of the dataset associated to each map. The list can be found in the [docs](https://docs.probablefutures.org/maps/#all-maps)
- **dataset** (Map): Alternatively, you can provide the whole dataset object.
- **tempUnit** (`°C` or `°F`): If the map unit is a temperature unit, eg. "Average Tempareture" map, you can choose the initial unit for the map data. Note that unit can still be changed from the map key
- **precipitationUnit** (`mm` or `in`): If the map unit is a mm, eg. "Change in total annual percipication" map, you can choose the initial unit for the map data. Note that unit can still be changed from the map key
- **showBorders** (Boolean): Show/hide the geopolitical boundaries of the countries over the map
- **showPopupOnFirstLoad** (Boolean): Whether to show the map popup or not when the map initially loads
- **viewState** (Object): This is an object which defines the initial view port of the map. The object includes `longitude`, `latitude`, and `zoom`
- **hideControls** (Boolean) - default false: Hide the map controls, such as zoom buttons
- **hideMapLegend** (Boolean) - default false: Hide the map key
- **hideTitle** (Boolean) - default false: Hide the title containing the map name
- **hideResetMapButton** (Boolean) - default true: Hide the reset button. This button could be used to reset the map to its original view given the initial long, lat and zoom.
- **mapboxAccessToken** (String, required) - provide the mapbox access token
- **usePfFonts** (Boolean) - default true. Decides whether to load PF fonts in the page or not.
- **compare** (Object): This object can be specified in case the user wants to generate a comparison embeddable map. The object fields are `scenarioBefore` and `scenarioAfter`

Example:

```jsx
import { CompareMap } from "@probable-futures/probable-futures-maps";

<div className="relative h-[500px]">
  <CompareMap
    viewState={{ zoom: 4, longitude: long, latitude: lat }}
    datasetId={40104}
    compare={{ scenarioBefore: 1, scenarioAfter: 3 }}
    mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
  />
</div>;
```

#### Version history

For details about updates and changes in each version of this package, check the version history at this [link](https://github.com/Probable-Futures/apps-public/blob/main/packages/probable-futures-maps/CHANGELOG.md).
