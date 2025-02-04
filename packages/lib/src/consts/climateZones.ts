import { DatasetDescriptionResponse } from "../types";

export const climateZonesDescriptions: DatasetDescriptionResponse = {
  dataset_id: "40901",
  map_volume: false,
  vignette_title_wysiwyg: "<p>Climate Zones (v3)</p>\n",
  climate_zones: [
    {
      name: "Tropical",
      description:
        '<p><span style="font-weight: 400;">Every month of the year has an average temperature of 18\u00b0C (64.4\u00b0F) or higher, with significant precipitation</span></p>\n',
      list: [
        {
          name: "Tropical, rainforest",
          value: "1",
          symbol: "Af",
          description:
            '<p><span style="font-weight: 400;">Every month of the year has an average temperature of 18\u00b0C (64.4\u00b0F) or higher, with significant precipitation: At least 60 millimeters (2.4 inches) of precipitation on average.</span></p>\n',
        },
        {
          name: "Tropical, monsoon",
          value: "2",
          symbol: "Am",
          description:
            '<p><span style="font-weight: 400;">Every month of the year has an average temperature of 18\u00b0C (64.4\u00b0F) or higher, with significant precipitation. The driest month, usually at or soon after the \u201cwinter\u201d solstice for a given location, has less than 60 millimeters (2.4 inches) of precipitation but at least 100 millimeters (3.9 inches) minus 4% of the total annual precipitation in millimeters, on average.</span></p>\n',
        },
        {
          name: "Tropical, savanna",
          value: "3",
          symbol: "Aw",
          description:
            '<p><span style="font-weight: 400;">Every month of the year has an average temperature of 18\u00b0C (64.4\u00b0F) or higher, with significant precipitation. The driest month has less than 60 millimeters (2.4 inches) of precipitation and less than 100 millimeters (3.9 inches) minus 4% of the total annual precipitation in millimeters, on average.</span></p>\n',
        },
      ],
    },
    {
      name: "Dry",
      description:
        '<p><span style="font-weight: 400;">At least one month per year averages above 10\u00b0C (50\u00b0F), with very little precipitation.</span></p>\n',
      list: [
        {
          name: "Dry, semi-arid, hot",
          value: "4",
          symbol: "BSh",
          description:
            '<p><span style="font-weight: 400;">At least one month per year averages above 10\u00b0C (50\u00b0F), with very little precipitation. The average temperature is above 18\u00b0C (64.4\u00b0F).</span></p>\n',
        },
        {
          name: "Dry, semi-arid, cold",
          value: "5",
          symbol: "BSk",
          description:
            '<p><span style="font-weight: 400;">At least one month per year averages above 10\u00b0C (50\u00b0F), with very little precipitation. The average temperature is below 18\u00b0C (64.4\u00b0F).</span></p>\n',
        },
        {
          name: "Dry, arid desert, hot",
          value: "6",
          symbol: "BWh",
          description:
            '<p><span style="font-weight: 400;">At least one month per year averages above 10\u00b0C (50\u00b0F), with a severe excess of evaporation over precipitation. The average temperature is above 18\u00b0C (64.4\u00b0F).</span></p>\n',
        },
        {
          name: "Dry, arid desert, cold",
          value: "7",
          symbol: "BWk",
          description:
            '<p><span style="font-weight: 400;">At least one month per year averages above 10\u00b0C (50\u00b0F), with a severe excess of evaporation over precipitation. The average temperature is below 18\u00b0C (64.4\u00b0F).</span></p>\n',
        },
      ],
    },
    {
      name: "Temperate",
      description:
        '<p><span style="font-weight: 400;">The coldest month of the year averages between -3\u00b0C (27\u00b0F) and 18\u00b0C (64.4\u00b0F) and at least one month per year averages above 10\u00b0C (50\u00b0F). Precipitation varies seasonally. </span></p>\n',
      list: [
        {
          name: "Temperate, no dry season, hot summer",
          value: "8",
          symbol: "Cfa",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages above -3\u00b0C (27\u00b0F), at least one month has an average temperature above 22\u00b0C (71.6\u00b0F), and at least four months have an average temperature above 10\u00b0C (50\u00b0F). Precipitation is consistent across seasons, with no dry months in the summer.</span></p>\n',
        },
        {
          name: "Temperate, no dry season, warm summer",
          value: "9",
          symbol: "Cfb",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages above -3\u00b0C (27\u00b0F), all months have an average temperature below 22\u00b0C (71.6\u00b0F), and at least four months have an average temperature above 10\u00b0C (50\u00b0F). Precipitation is consistent across seasons.</span></p>\n',
        },
        {
          name: "Temperate, no dry season, cold summer",
          value: "10",
          symbol: "Cfc",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages above -3\u00b0C (27\u00b0F), and 1-3 months have an average temperature above 10\u00b0C (50\u00b0F). Precipitation is consistent across seasons.</span></p>\n',
        },
        {
          name: "Temperate, dry summer, hot summer",
          value: "11",
          symbol: "Csa",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages above -3\u00b0C (27\u00b0F), at least one month has an average temperature above 22\u00b0C (71.6\u00b0F), and at least four months have an average temperature above 10\u00b0C (50\u00b0F). The wettest month of the winter has at least three times as much precipitation as the driest month of the summer. The driest month of the summer has less than 40 millimeters (1.6 inches) of precipitation.</span></p>\n',
        },
        {
          name: "Temperate, dry summer, warm summer",
          value: "12",
          symbol: "Csb",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages above -3\u00b0C (27\u00b0F), all months have an average temperature below 22\u00b0C (71.6\u00b0F), and at least four months have an average temperature above 10\u00b0C (50\u00b0F). The wettest month of the winter has at least three times as much precipitation as the driest month of the summer. The driest month of the summer has less than 40 millimeters (1.6 inches) of precipitation.</span></p>\n',
        },
        {
          name: "Temperate, dry summer, cold summer",
          value: "13",
          symbol: "Csc",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages above -3\u00b0C (27\u00b0F) and 1-3 months have an average temperature above 10\u00b0C (50\u00b0F). The wettest month of the winter has at least three times as much precipitation as the driest month of the summer. The driest month of the summer has less than 40 millimeters (1.6 inches) of precipitation.</span></p>\n',
        },
        {
          name: "Temperate, dry winter, hot summer",
          value: "14",
          symbol: "Cwa",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages above -3\u00b0C (27\u00b0F), at least one month has an average temperature above 22\u00b0C (71.6\u00b0F), and at least four months have an average temperature above 10\u00b0C (50\u00b0F). The wettest month of the summer has at least ten times as much precipitation as the driest month of winter.</span></p>\n',
        },
        {
          name: "Temperate, dry winter, warm summer",
          value: "15",
          symbol: "Cwb",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages above -3\u00b0C (27\u00b0F), all months have an average temperature below 22\u00b0C (71.6\u00b0F), and at least four months have an average temperature above 10\u00b0C (50\u00b0F). The wettest month of the summer has at least ten times as much precipitation as the driest month of winter.</span></p>\n',
        },
        {
          name: "Temperate, dry winter, cold summer",
          value: "16",
          symbol: "Cwc",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages above -3\u00b0C (27\u00b0F) and 1-3 months have an average temperature above 10\u00b0C (50\u00b0F). The wettest month of the summer has at least ten times as much precipitation as the driest month of winter.</span></p>\n',
        },
      ],
    },
    {
      name: "Continental",
      description:
        '<p><span style="font-weight: 400;">At least one month per year averages below -3\u00b0C (27\u00b0F) and at least one month per year averages above 10\u00b0C (50\u00b0F). Precipitation varies seasonally. </span></p>\n',
      list: [
        {
          name: "Continental, no dry season, hot summe",
          value: "17",
          symbol: "Dfa",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages below -3\u00b0C (27\u00b0F), at least one month has an average temperature above 22\u00b0C (71.6\u00b0F), and at least four months have an average temperature above 10\u00b0C (50\u00b0F). Precipitation is consistent across seasons.</span></p>\n',
        },
        {
          name: "Continental, no dry season, warm summer",
          value: "18",
          symbol: "Dfb",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages below -3\u00b0C (27\u00b0F), all months have an average temperature below 22\u00b0C (71.6\u00b0F), and at least four months have an average temperature above 10\u00b0C (50\u00b0F). Precipitation is consistent across seasons.</span></p>\n',
        },
        {
          name: "Continental, no dry season, cold summer",
          value: "19",
          symbol: "Dfc",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages below -3\u00b0C (27\u00b0F) and 1-3 months have an average temperature above 10\u00b0C (50\u00b0F). Precipitation is consistent across seasons.</span></p>\n',
        },
        {
          name: "Continental, dry summer, hot summer",
          value: "20",
          symbol: "Dsa",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages below -3\u00b0C (27\u00b0F), the warmest month has an average temperature above 22\u00b0C (71.6\u00b0F), and at least four months have an average temperature above 10\u00b0C (50\u00b0F). The wettest month of the winter has at least three times as much precipitation as the driest month of the summer. The driest month of the summer has less than 30 millimeters (1.2 inches) of precipitation.</span></p>\n',
        },
        {
          name: "Continental, dry summer, warm summer",
          value: "21",
          symbol: "Dsb",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages below -3\u00b0C (27\u00b0F), the warmest month has an average temperature below 22\u00b0C (71.6\u00b0F), and at least four months have an average temperature above 10\u00b0C (50\u00b0F). The wettest month of the winter has at least three times as much precipitation as the driest month of the summer. The driest month of the summer has less than 30 millimeters (1.2 inches) of precipitation.</span></p>\n',
        },
        {
          name: "Continental, dry summer, cold summer",
          value: "22",
          symbol: "Dsc",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages below -3\u00b0C (27\u00b0F) and 1-3 months have an average temperature above 10\u00b0C (50\u00b0F). The wettest month of the winter has at least three times as much precipitation as the driest month of the summer. The driest month of the summer has less than 30 millimeters (1.2 inches) of precipitation.</span></p>\n',
        },
        {
          name: "Contintental, dry winter, hot summer",
          value: "23",
          symbol: "Dwa",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages below -3\u00b0C (27\u00b0F), at least one month has an average temperature above 22\u00b0C (71.6\u00b0F), and at least four months have an average temperature above 10\u00b0C (50\u00b0F). The wettest month of the summer has at least ten times as much precipitation as the driest month of the winter.</span></p>\n',
        },
        {
          name: "Continental, dry winter, warm summer",
          value: "24",
          symbol: "Dwb",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages below -3\u00b0C (27\u00b0F), all months have an average temperature below 22\u00b0C (71.6\u00b0F), and at least four months have an average temperature above 10\u00b0C (50\u00b0F). The wettest month of the summer has at least ten times as much precipitation as the driest month of the winter.</span></p>\n',
        },
        {
          name: "Continental, dry winter, cold summer",
          value: "25",
          symbol: "Dwc",
          description:
            '<p><span style="font-weight: 400;">The coldest month of the year averages below -3\u00b0C (27\u00b0F) and 1-3 months have an average temperature above 10\u00b0C (50\u00b0F). The wettest month of the summer has at least ten times as much precipitation as the driest month of the win</span></p>\n',
        },
      ],
    },
    {
      name: "Polar",
      description:
        '<p><span style="font-weight: 400;">Every month of the year has an average temperature below 10\u00b0C (50\u00b0F), with very little precipitation.</span></p>\n',
      list: [
        {
          name: "Polar, tundra",
          value: "26",
          symbol: "ET",
          description:
            '<p><span style="font-weight: 400;">Every month of the year has an average temperature below 10\u00b0C (50\u00b0F), with very little precipitation. Every month of the year has an average temperature below 0\u00b0C (32\u00b0F).</span></p>\n',
        },
        {
          name: "Polar, ice cap",
          value: "27",
          symbol: "EF",
          description:
            '<p><span style="font-weight: 400;">Every month of the year has an average temperature below 10\u00b0C (50\u00b0F), with very little precipitation. The warmest month has an average temperature between 0\u00b0C (32\u00b0F) and 10\u00b0C (50\u00b0F).</span></p>\n',
        },
      ],
    },
  ],
  dataset_description:
    '<p><span style="font-weight: 400;">Climate zones are a way of categorizing the world\u2019s regional climates. In a stable climate, they can be useful for understanding typical weather patterns for a place, which can inform what plants might grow there successfully, or how infrastructure should be designed. In a warming world, local weather patterns change, and climate zones can shift. Knowing how they will shift can help us plan.\u00a0</span></p>\n<p><span style="font-weight: 400;">This map uses the widely-accepted climate classification system K\u00f6ppen-Geiger, which delineates climate zones using monthly average temperature, monthly precipitation, and seasonal patterns.\u00a0</span></p>\n<p><span style="font-weight: 400;">First, climates are divided into five primary climate groups based on temperature: Tropical, Dry, Temperate, Continental, and Polar. Each primary climate classification is divided into subgroups based on quantity and seasonal timing of precipitation. Read more about </span><a href="https://en.wikipedia.org/wiki/K%C3%B6ppen_climate_classification"><span style="font-weight: 400;">K\u00f6ppen-Geiger on Wikipedia</span></a><span style="font-weight: 400;">. </span></p>\n',
};
