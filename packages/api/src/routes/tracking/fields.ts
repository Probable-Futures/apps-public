import { isProd } from "../../utils/env";

enum FormFields {
  Helpful = "Helpful",
  Email = "Email",
  WhatWasHelpful = "What Was Helpful",
  HowToImprove = "How To Improve",
  ArticleName = "Article Name",
  ArticleLink = "Article Link",
  SubmissionDate = "Submission Date",
  PerspectiveCategory = "Perspective Category",
}

const formFieldsImpactTrackingDev: Record<FormFields, string> = {
  [FormFields.Helpful]: "fldznMMn12SappeN7",
  [FormFields.Email]: "fldpXqlqhh5s2EEsH",
  [FormFields.WhatWasHelpful]: "fldAUYkAWxqzuOuOb",
  [FormFields.HowToImprove]: "fldP6xR6O7bgYYR5n",
  [FormFields.ArticleName]: "fldcoTJWFoO2rjht9",
  [FormFields.ArticleLink]: "fldRdZboebIA6SgSd",
  [FormFields.SubmissionDate]: "fldEBh9YCeOES2yYW",
  [FormFields.PerspectiveCategory]: "flduOEEy0TOpQd3TL",
};

const formFieldsImpactTrackingProd: Record<FormFields, string> = {
  [FormFields.Helpful]: "fld7CadfU8fPoeIax",
  [FormFields.Email]: "fldqYOijMUHzYBg0H",
  [FormFields.WhatWasHelpful]: "fld1gjd8mpppHuQHp",
  [FormFields.HowToImprove]: "fldUfqXnWxwvaqMUI",
  [FormFields.ArticleName]: "fldsl006Di97FRjPR",
  [FormFields.ArticleLink]: "fldAtgKeJsdy2yYkx",
  [FormFields.SubmissionDate]: "fldr76poxijgWpAiQ",
  [FormFields.PerspectiveCategory]: "fldlEOUBpJ3hBx36T",
};

export const formFieldsImpactTracking = isProd
  ? formFieldsImpactTrackingProd
  : formFieldsImpactTrackingDev;
