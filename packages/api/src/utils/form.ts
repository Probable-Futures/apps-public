import { isProd } from "./env";

enum FormFields {
  FirstName = "firstName",
  LastName = "lastName",
  Email = "email",
  Title = "title",
  Company = "company",
  Location = "location",
  UsingPFToolsFor = "usingPFToolsFor",
  HowDidYouFindUs = "howDidYouFindUs",
  AnythingElse = "anuthingElse",
  WhatWouldYouLikeToUse = "whatWouldYouLikeToUse",
  PfPro = "pfPro",
  PfApi = "pfApi",
  PfRawData = "pfRawData",
  CustomizableMaps = "customizableMaps",
  EmailList = "emailList",
}

const formFieldsNameIdMapDev: Record<FormFields, string> = {
  [FormFields.FirstName]: "fldVMq1OLD3Dx15Qy",
  [FormFields.LastName]: "fldBHkXHlkr3DAOpS",
  [FormFields.Email]: "fldCqzLO29tUJ4DjO",
  [FormFields.Title]: "fld8hkxoHNHoCGnSB",
  [FormFields.Company]: "fld0LBNoUvO46reOd",
  [FormFields.Location]: "fldZ3iCTwo3O868r0",
  [FormFields.UsingPFToolsFor]: "fldwznDMsXqzs5EOT",
  [FormFields.HowDidYouFindUs]: "fld9dRNe1zJmEc8BO",
  [FormFields.AnythingElse]: "fldMamuN1eqCoUhIx",
  [FormFields.WhatWouldYouLikeToUse]: "fld6dHA11eCEIoAZw",
  [FormFields.PfPro]: "selObrA5VpB4XVjDt",
  [FormFields.PfApi]: "selHB9fHgC4AQz2Lj",
  [FormFields.PfRawData]: "selkpsGFYsWDKIm8Z",
  [FormFields.CustomizableMaps]: "sel9Em7tUgvjWQ8fk",
  [FormFields.EmailList]: "fldxQbeUjmdlU93Lc",
};

const formFieldsNameIdMapProd: Record<FormFields, string> = {
  [FormFields.FirstName]: "fldUF40ZB8gUYh8iY",
  [FormFields.LastName]: "fldAAYWSbPEk4QRRi",
  [FormFields.Email]: "fldBjdKZSEGbakGLe",
  [FormFields.Title]: "fld7aYwzxiUF3Wqk1",
  [FormFields.Company]: "fldZEfMzK01lxHhgD",
  [FormFields.Location]: "fldYWWB4mTg5zmbTq",
  [FormFields.UsingPFToolsFor]: "fldvs1CXisDQTlHgj",
  [FormFields.HowDidYouFindUs]: "fld86vMpR4WD5sb3e",
  [FormFields.AnythingElse]: "fldL30tYRJDTPakaX",
  [FormFields.WhatWouldYouLikeToUse]: "fld56lzcRJPV9EDrW",
  [FormFields.PfPro]: "selObrA5VpB4XVjDt",
  [FormFields.PfApi]: "selHB9fHgC4AQz2Lj",
  [FormFields.PfRawData]: "selkpsGFYsWDKIm8Z",
  [FormFields.CustomizableMaps]: "sel9Em7tUgvjWQ8fk",
  [FormFields.EmailList]: "fldwJPd59RqClp6dC",
};

export const formFieldsNameIdMap = isProd ? formFieldsNameIdMapProd : formFieldsNameIdMapDev;
