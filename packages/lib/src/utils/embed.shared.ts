export const headerStyles = `
  .embeddable-map-header {font-family: LinearSans, Arial, Helvetica, sans-serif;border: 1px solid #b6b4b7;border-radius: 6px;background-color: #fdfdfd;padding: 15px 10px;position: relative;font-size: 16px;top: 20px;left: 20px;margin-right: 40px;display: inline-block;z-index: 1;}
  .embeddable-map-title {font-size: 10px;font-weight: 600;letter-spacing: 0.8px;line-height: 11px;text-transform: uppercase;margin-bottom: 5px;}
  .embeddable-map-header-description {margin: 0;font-size: 18px;font-weight: bold;}
`;

export const keyStyles = `
  .embeddable-key-container {position: absolute;min-width: 280px;top: unset;right: 20px;left: 20px;bottom: 20px;z-index: 1;width: auto;font-family: LinearSans, Arial, Helvetica, sans-serif;}
  .map-key-container {border: 1px solid #b6b4b7;border-radius:6px;padding: 12px 18px 9px;background-color: #fdfdfd;border-bottom: 1px solid #2a172d;}
  .embeddable-key-content {display: inline-block;width: 100%;}
  .map-key-header {display: flex;flex-direction: row;justify-content: space-between;align-items: center;margin-bottom: 10px;}
  .map-key-label {display: block;font-size: 10px;color: #2a172d;font-weight: 600;letter-spacing: 0.8px;line-height: 11px;text-transform: uppercase;margin-bottom: 8px;}
  .map-key-row {display: flex;width: 100%;}
  .map-key-bins-container {display: flex;align-items: flex-start;width: 100%;}
  .map-key-bin-container {display: flex;flex-direction: column;margin-right: 2px;min-width: 43px;flex: 1;max-width: 120px;}
  .map-key-color {height: 12px;}
  .map-key-bin {font-family: "RelativeMono", Courier, monospace;color: #2a172d;font-size: 9px;letter-spacing: 0;line-height: 16px;text-align: center;margin-top: 2px;display: flex;justify-content: space-evenly;}
  .map-key-bin .dash {font-size: 13px;}
  .map-key-inner-bin-label {display: flex;}
  .embeddable-bottom-link {position: absolute;left: 0;padding: 0 5px;background-color: rgba(255, 255, 255, 0.5);font-size: 12px;font-family: Helvetica Neue, Arial, Helvetica, sans-serif;line-height: 20px;color: rgba(0, 0, 0, 0.75);z-index: 3;cursor: pointer;text-decoration: none;bottom: 0;}
  @media (orientation: landscape) {.map-key-bin {font-size: 10px;}}
  @media (min-width: 768px) {.map-key-bin {font-size: 9px;}}
  @media (min-width: 768px) {.embeddable-key-container {right: unset; min-width: 480px;}}
  @media (min-width: 1200px) {.map-key-bin {font-size: 13px;margin-top: 4px;}}
  @media (min-width: 1200px) {.map-key-color {height: 14px;}}
  @media (orientation: landscape) {.map-key-bin-container {min-width: 43px;}}
  @media (min-width: 768px) {.map-key-bin-container {min-width: 47px;}}
  @media (min-width: 1200px) {.map-key-bin-container {margin-right: 3px;min-width: 80px;}}
  @media (min-width: 768px) {.map-key-bins-container {margin-right: 13px;}}
  @media (min-width: 1200px) {.map-key-bins-container {margin-right: 0;}}
  @media (min-width: 1200px) {.map-key-label {margin-bottom: 8px;}}
  @media (min-width: 1200px) {.map-key-header { margin-bottom: 10px;}}
  @media (min-width: 1200px) {.map-key-inner-bin-label { gap: 5px; }}
  /*Key toggle*/
  .embeddable-toggle-container {margin-top: -6px;}
  .embeddable-toggle {position: relative;width: 62px;height: 22px;background-color: #fdfdfd;border-radius: 4px;margin: 0 5px;border: 1px solid #2a172d;box-sizing: border-box;display: flex;font-family: "RelativeMono";font-size: 13px;letter-spacing: 0;line-height: 16px;text-align: center;user-select: none; align-items: center;}
  .embeddable-toggle .toggle-span {position: absolute;top: 2px;left: 3px;width: 25px;height: 16px;border-radius: 4px;transition: 0.2s;background-color: #2a172d;}
  .embeddable-toggle-label {display: flex;align-items: center;justify-content: space-between;cursor: pointer;}
  .embeddable-toggle-label:active .toggle-span {width: 30px;}
  .embeddable-toggle-label:hover .embeddable-toggle {border: 1px solid #8C6FF1;}
  .embeddable-toggle-label:hover .toggle-span {background-color: #8C6FF1;}
  .embeddable-toggle-input {display: none;}
  .embeddable-toggle-input:checked + .embeddable-toggle-label .toggle-span {left: calc(100% - 3px);transform: translateX(-100%);}
  .embeddable-toggle-option {flex: 1;   transition: color 0.6s ease;z-index: 1;}
  @media (min-width: 1200px) {.embeddable-toggle-container {margin-bottom: 14px; margin-top: 0px;}}
  @media (min-width: 1200px) {.embeddable-toggle {margin: 0 7px 0 9px;}}
  /* Climate Zones key*/
  .climate-zones-key-container {white-space: nowrap;box-sizing: content-box;padding: 0px;padding-left: 16px;width: auto;height: 80px;overflow-x: scroll;background-color: #fdfdfd;border: 1px solid #b6b4b7;border-radius: 6px;display: flex;align-items: center;}
  .cz-bins-container {display: grid;grid-template-columns: auto auto auto auto auto auto;margin-bottom: 10px;grid-column-gap: 40px;margin-right: -20px;}
  .cz-bin-container {display: flex;flex-direction: column;flex: 1;gap: 15px;position: relative;margin-top: 2px;}
  .cz-bin-container:not(:last-child):after {content: "";display: block;position: absolute;top: 20px;right: -21px;bottom: 0;width: 1px;background-color: #adadad;height: 22px;}
  .cz-color-bin-wrapper {display: flex;align-items: center;gap: 10px;}
  .cz-key-color {height: 10px;width: 10px;aspect-ratio: 1/1;}
  .cz-group-name {font-size: 12px;line-height: 11px;font-family: LinearSans;}
  @media (min-width: 1200px) {.cz-bin-container {margin-top: 0px;gap: 20px;}}
  @media (min-width: 1200px) {.cz-bin-container:not(:last-child):after {height: 32px;}}
  @media (min-width: 768px) {.climate-zones-key-container {overflow-x: hidden;}}
`;

export const miscStyles = `
  .reset-map-button:hover {background-color: rgb(0 0 0 / 5%)!important;}
`;

export const displayKeyFunction = `
  function displayKey() {
    // create main divs
    const embeddableKeyContainer = document.createElement("div");
    embeddableKeyContainer.className = "embeddable-key-container";
    const mapKeyContainer = document.createElement("div");
    mapKeyContainer.className = "map-key-container";
    const keyContent = document.createElement("div");
    keyContent.className = "map-key-content";
    const keyHeader = document.createElement("div");
    keyHeader.className = "map-key-header";
    const label = document.createElement("span");
    label.className = "map-key-label";
    const keyRow = document.createElement("div");
    keyRow.className = "map-key-row";
    keyHeader.appendChild(label);
    keyContent.appendChild(keyHeader);
    keyContent.appendChild(keyRow);
    mapKeyContainer.appendChild(keyContent);
    embeddableKeyContainer.appendChild(mapKeyContainer);
    document.body.appendChild(embeddableKeyContainer);

    if(isTempMap || isPrecipitationMap) {
      keyHeader.appendChild(displayKeyToggle());
    }
    label.textContent = isTempMap ? dataset.dataset.pfDatasetUnitByUnit.unitLong.replace("°C", tempUnit) : dataset.dataset.pfDatasetUnitByUnit.unitLong;

    const binsContainerDiv = document.createElement("div");
    binsContainerDiv.className = "map-key-bins-container";
    dataset.binHexColors.map(function(color, index) {
      const [from, to] = getBinLabel(dataset.stops, index, dataset.dataset.pfDatasetUnitByUnit.unitLong, dataset.dataset.minValue,
        dataset.dataset.maxValue, dataset.dataset.unit === "mm" && precipitationUnit === "in" ? 0.1 : dataset.step,
        tempUnit, dataset.isDiff, isFrequent, precipitationUnit, isPrecipitationMap);
      const binContainerDiv = document.createElement("div");
      const colorDiv = document.createElement("div");
      const binSpan = document.createElement("span");
      binContainerDiv.className = "map-key-bin-container";
      colorDiv.className = "map-key-color";
      binSpan.className = "map-key-bin";
      colorDiv.style.backgroundColor = color;

      if(dataset.binLabels) {
        const innerBinSpan = document.createElement("span");
        innerBinSpan.textContent = dataset.binLabels[index];
        binSpan.appendChild(innerBinSpan);
      } else if (to !== undefined) {
        const innerBinSpan = document.createElement("span");
        innerBinSpan.className = "map-key-inner-bin-label";
        const dashSpan = document.createElement("span");
        const fromText = document.createTextNode(from);
        const toText = document.createTextNode(to);
        dashSpan.textContent = "–";
        innerBinSpan.appendChild(fromText);
        innerBinSpan.appendChild(dashSpan);
        innerBinSpan.appendChild(toText);
        binSpan.appendChild(innerBinSpan);
      } else {
        const innerBinSpan = document.createElement("span");
        innerBinSpan.className = "map-key-inner-bin-label";
        const fromText = document.createTextNode(from);
        innerBinSpan.appendChild(fromText);
        binSpan.appendChild(innerBinSpan);
      }
      binContainerDiv.appendChild(colorDiv);
      binContainerDiv.appendChild(binSpan);
      binsContainerDiv.appendChild(binContainerDiv);
    });
    keyRow.appendChild(binsContainerDiv);
  }
`;

export const displayKeyToggleFunction = `
  function displayKeyToggle() {
    const toggleContainer = document.createElement("div");
    const leftToggleLabel = isTempMap ? "°C" : "mm";
    const rightToggleLabel = isTempMap ? "°F" : "in";

    const isChecked = isTempMap ? tempUnit === "°F" : precipitationUnit === "in";
    toggleContainer.className = "embeddable-toggle-container";

    const toggleInput = document.createElement("input");
    toggleInput.className = "embeddable-toggle-input";
    toggleInput.id = "toggle";
    toggleInput.type = "checkbox";
    toggleInput.checked = isChecked;
    toggleInput.addEventListener('change', handleToggleChange);

    const toggleLabel = document.createElement("label");
    toggleLabel.htmlFor = "toggle";
    toggleLabel.className = "embeddable-toggle-label";

    const toggle = document.createElement("div");
    toggle.className = "embeddable-toggle";

    const toggleOptionLeft = document.createElement("span");
    toggleOptionLeft.className = "embeddable-toggle-option";
    toggleOptionLeft.id = "toggle-option1";
    if(isChecked) {toggleOptionLeft.style.color = "#2a172d"}
    else {toggleOptionLeft.style.color = "#fdfdfd"}
    toggleOptionLeft.textContent = leftToggleLabel;

    const toggleOptionRight = document.createElement("span");
    toggleOptionRight.className = "embeddable-toggle-option";
    toggleOptionRight.id = "toggle-option2";
    if(isChecked) {toggleOptionRight.style.color = "#fdfdfd"}
    else {toggleOptionRight.style.color = "#2a172d"}
    toggleOptionRight.textContent = rightToggleLabel;

    const toggleSpan = document.createElement("span");
    toggleSpan.className = "toggle-span";

    toggle.appendChild(toggleOptionLeft);
    toggle.appendChild(toggleOptionRight);
    toggle.appendChild(toggleSpan);
    toggleLabel.appendChild(toggle);

    toggleContainer.appendChild(toggleInput);
    toggleContainer.appendChild(toggleLabel);

    return toggleContainer;
  }
`;

export const displayClimateZonesKey = `
  function displayClimateZoneKey() {
    const czKeyContainer = document.createElement("div");
    czKeyContainer.className = "climate-zones-key-container";
    const czBinsContainer = document.createElement("div");
    czBinsContainer.className = "cz-bins-container";
    const embeddableKeyContainer = document.createElement("div");
    embeddableKeyContainer.className = "embeddable-key-container";

    let index = 0;
    datasetDescriptionResponse.climate_zones.map(group => {
      const czBinContainer = document.createElement("div");
      czBinContainer.className = "cz-bin-container";
      const czGroupName = document.createElement("div");
      czGroupName.className = "cz-group-name";
      czGroupName.textContent = group.name;
      czBinContainer.appendChild(czGroupName);
      const czColorBinWrapper = document.createElement("div");
      czColorBinWrapper.className = "cz-color-bin-wrapper";

      group.list?.map((climateZone) => {
        const color = dataset.binHexColors[index++];
        const czKeyColor = document.createElement("div");
        czKeyColor.className = "cz-key-color";
        czKeyColor.style.backgroundColor = color;
        czKeyColor.title = climateZone.name;
        czColorBinWrapper.appendChild(czKeyColor);
      });
      czBinContainer.appendChild(czColorBinWrapper);
      czBinsContainer.appendChild(czBinContainer);
    });
    czKeyContainer.appendChild(czBinsContainer);
    embeddableKeyContainer.appendChild(czKeyContainer);
    document.body.appendChild(embeddableKeyContainer);
  }
`;

export const displayBottomLinkFunction = `
  function displayBottomLink() {
    const link = document.createElement("a");
    link.target = "_blank";
    link.target = "noopener noreferrer";
    link.href = MAP_VERSION_URL;
    link.textContent = "Probable Futures map v" + dataset.mapVersion;
    link.className = "embeddable-bottom-link";
    document.body.appendChild(link);
  }
`;

export const displayHeaderFunction = `
  function displayHeader() {
    const headerDiv = document.createElement("div");
    headerDiv.className = "embeddable-map-header";
    const headerTitle = document.createElement("div");
    headerTitle.className = "embeddable-map-title";
    headerTitle.textContent = "CLIMATE MAP";
    const headerDesc = document.createElement("p");
    headerDesc.className = "embeddable-map-header-description";
    headerDesc.textContent = showCompare ? dataset.name : dataset.name + " in a " + degrees + "°C " + "warming scenario";
    headerDiv.appendChild(headerTitle);
    headerDiv.appendChild(headerDesc);
    document.body.appendChild(headerDiv);
  }
`;

export const displayResetMapButton = `
  function displayResetButton() {
    const resetDiv = document.createElement("div");
    resetDiv.className = "reset-map-container";
    resetDiv.style.position = "absolute";
    resetDiv.style.right = "20px";
    resetDiv.style.top = "calc(50% + 85px)";
    resetDiv.style.transform = "translateY(-50%)";
    resetDiv.style.zIndex = "1000";
    resetDiv.style.backgroundColor = "white";
    resetDiv.style.borderRadius = "50%";

    const resetButton = document.createElement("button");
    resetButton.className = "reset-map-button";

    resetButton.style.padding = "10px";
    resetButton.style.backgroundColor = "#fdfdfd";
    resetButton.style.border = "none";
    resetButton.style.borderRadius = "50%";
    resetButton.style.width = "35px";
    resetButton.style.height = "35px";
    resetButton.style.display = "flex";
    resetButton.style.alignItems = "center";
    resetButton.style.justifyContent = "center";
    resetButton.style.cursor = "pointer";
    resetButton.style.position = "relative";
    resetButton.style.boxShadow = "0 3px 5px 0 rgb(56 22 63 / 50%)";

    const arrowDiv = document.createElement("div");
    arrowDiv.className = "incomplete-circular-arrow";

    arrowDiv.style.width = "15px";
    arrowDiv.style.height = "11px";
    arrowDiv.style.border = "2px solid transparent";
    arrowDiv.style.borderTopColor = "black";
    arrowDiv.style.borderLeftColor = "black";
    arrowDiv.style.borderBottomColor = "black";
    arrowDiv.style.borderRadius = "50%";
    arrowDiv.style.position = "relative";

    const arrowHead = document.createElement("div");
    arrowHead.className = "arrow-head";

    arrowHead.style.width = "4px";
    arrowHead.style.height = "4px";
    arrowHead.style.borderTop = "2px solid black";
    arrowHead.style.borderRight = "2px solid black";
    arrowHead.style.transform = "rotate(72deg)";
    arrowHead.style.position = "absolute";
    arrowHead.style.top = "-3px";
    arrowHead.style.right = "0px";

    arrowDiv.appendChild(arrowHead);
    resetButton.appendChild(arrowDiv);

    resetButton.addEventListener("click", handleResetButtonClick);

    resetDiv.appendChild(resetButton);
    document.body.appendChild(resetDiv);
  }
`;
