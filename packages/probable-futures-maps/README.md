# @probable-futures/probable-futures-maps

This package empowers developers to seamlessly integrate dynamic and interactive climate maps into their web applications

### Installing

Using npm:
`npm install @probable-futures/probable-futures-maps`

Using yarn:
`yarn add @probable-futures/probable-futures-maps`

### Example

#### Generate embeddable map

<blockquote style="font-family: 'Source Sans Pro', 'Lucida Grande', sans-serif;-webkit-font-smoothing: antialiased;line-height: 1.6;font-size: 1rem;color: #333;box-sizing: border-box;background: #efefef;padding: 1px 16px;margin-left: 0;margin-right: 0;border-left: #cecece solid 10px;border-radius: 3px;">
<p><strong>Note</strong> Pass "compare" parameter to genereate an embeddable comparison map instead of a simple map. Check the Config section for more info about how to use this param.</p>
</blockquote>

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

### Config

- **generateEmbedMap**: This function can be used to generate embeddable maps as an html-string template. It takes the following parameters:

  - **datasetId:** The id of the dataset associated to each map. The list can be found in the [docs](https://docs.probablefutures.org/maps/#all-maps)
  - **tempUnit**: `°C` or `°F`. If the map unit is a temperature unit, eg. "Average Tempareture" map, you can choose the initial unit for the map data. Note that unit can still be changed from the map key.
  - **scenario**: The warming scenario
  - **viewState**: This is an object which defines the initial view port of the map. The object includes `longitude`, `latitude`, and `zoom`
  - **compare**: This object can be specified in case the user wants to generate a comparison embeddable map. The object fields are `scenarioBefore` and `scenarioAfter`

- **getLatestMaps**: Use this function to get the latest Maps. Each Map object is of type Map.
- **getMapObject**: Get the full object of a spcific Map. eg. `getMapObject(40104)`
- **getDatasetIds**: Get all the available dataset Ids. Find each map and its associated datasetId [here](https://docs.probablefutures.org/maps/)
- **getDataDescriptionAtPlaceGenerator**: You can generate a magic sentence that describes the data of a specific map at a specific location. Currenly, only maps whose names start with "Days above" have an associated magic sentence. Usage example:

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
