import { isProd } from "./env";

const requestUserAccessFormFieldsDev = [
  {
    id: "fldVMq1OLD3Dx15Qy",
    name: "First name",
    description: null,
    type: "singleLineText",
    options: null,
    isComputed: false,
    width: 200,
  },
  {
    id: "fldBHkXHlkr3DAOpS",
    name: "Last name",
    description: null,
    type: "singleLineText",
    options: null,
    isComputed: false,
    width: 200,
  },
  {
    id: "fldCqzLO29tUJ4DjO",
    name: "Email",
    description: null,
    type: "email",
    options: null,
    isComputed: false,
    width: 200,
  },
  {
    id: "fld8hkxoHNHoCGnSB",
    name: "Title",
    description: null,
    type: "singleLineText",
    options: null,
    isComputed: false,
    width: 200,
  },
  {
    id: "fld0LBNoUvO46reOd",
    name: "Company or organization",
    description: null,
    type: "singleLineText",
    options: null,
    isComputed: false,
    width: 200,
  },
  {
    id: "fldZ3iCTwo3O868r0",
    name: "Location",
    description: null,
    type: "singleLineText",
    options: null,
    isComputed: false,
    width: 200,
  },
  {
    id: "fldwznDMsXqzs5EOT",
    name: "Using PF tools for...",
    description: null,
    type: "richText",
    options: null,
    isComputed: false,
    width: 500,
  },
  {
    id: "fld9dRNe1zJmEc8BO",
    name: "How did you find us?",
    description: null,
    type: "singleLineText",
    options: null,
    isComputed: false,
    width: 250,
  },
  {
    id: "fldMamuN1eqCoUhIx",
    name: "Anything else?",
    description: null,
    type: "richText",
    options: null,
    isComputed: false,
    width: 150,
  },
  {
    id: "fld6dHA11eCEIoAZw",
    name: "What would you like to use?",
    description: null,
    type: "multipleSelects",
    options: {
      choices: [
        { id: "selObrA5VpB4XVjDt", name: "Probable Futures Pro", color: "blueLight2" },
        { id: "selHB9fHgC4AQz2Lj", name: "Probable Futures API", color: "cyanLight2" },
        { id: "selkpsGFYsWDKIm8Z", name: "Probable Futures raw data", color: "tealLight2" },
        {
          id: "sel9Em7tUgvjWQ8fk",
          name: "Probable Futures map tilesets (using Mapbox)",
          color: "greenLight2",
        },
      ],
    },
    isComputed: false,
    width: 400,
  },
];

const requestUserAccessFormFieldsProd = [
  {
    id: "fldUF40ZB8gUYh8iY",
    name: "First name",
    description: null,
    type: "singleLineText",
    options: null,
    isComputed: false,
    width: 200,
  },
  {
    id: "fldAAYWSbPEk4QRRi",
    name: "Last name",
    description: null,
    type: "singleLineText",
    options: null,
    isComputed: false,
    width: 200,
  },
  {
    id: "fldBjdKZSEGbakGLe",
    name: "Email",
    description: null,
    type: "email",
    options: null,
    isComputed: false,
    width: 200,
  },
  {
    id: "fld7aYwzxiUF3Wqk1",
    name: "Title",
    description: null,
    type: "singleLineText",
    options: null,
    isComputed: false,
    width: 200,
  },
  {
    id: "fldZEfMzK01lxHhgD",
    name: "Company or organization",
    description: null,
    type: "singleLineText",
    options: null,
    isComputed: false,
    width: 200,
  },

  {
    id: "fldYWWB4mTg5zmbTq",
    name: "Location",
    description: null,
    type: "singleLineText",
    options: null,
    isComputed: false,
    width: 200,
  },
  {
    id: "fldvs1CXisDQTlHgj",
    name: "Using PF tools for...",
    description: null,
    type: "richText",
    options: null,
    isComputed: false,
    width: 500,
  },
  {
    id: "fld86vMpR4WD5sb3e",
    name: "How did you find us?",
    description: null,
    type: "singleLineText",
    options: null,
    isComputed: false,
    width: 250,
  },
  {
    id: "fldL30tYRJDTPakaX",
    name: "Anything else?",
    description: null,
    type: "richText",
    options: null,
    isComputed: false,
    width: 150,
  },
  {
    id: "fld56lzcRJPV9EDrW",
    name: "What would you like to use?",
    description: null,
    type: "multipleSelects",
    options: {
      choices: [
        {
          id: "selObrA5VpB4XVjDt",
          name: "Probable Futures Pro",
          color: "blueLight2",
        },
        {
          id: "selkpsGFYsWDKIm8Z",
          name: "Probable Futures raw data (to download)",
          color: "cyanLight2",
        },
        {
          id: "sel9Em7tUgvjWQ8fk",
          name: "Customizable versions of Probable Futures maps",
          color: "tealLight2",
        },
        {
          id: "selHB9fHgC4AQz2Lj",
          name: "Probable Futures API",
          color: "greenLight2",
        },
      ],
    },
    isComputed: false,
    width: 400,
  },
];

export const requestUserAccessFormFields = isProd
  ? requestUserAccessFormFieldsProd
  : requestUserAccessFormFieldsDev;
