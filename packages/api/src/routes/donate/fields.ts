import { isProd } from "../../utils/env";

enum FormFields {
  ChargeID = "Charge ID",
  FullName = "Full Name",
  Email = "Email",
  TotalDonated = "Total Donated",
  DonationDate = "Donation Date",
  PrivateNote = "Private Note",
}

const formFieldsDonationDev: Record<FormFields, string> = {
  [FormFields.ChargeID]: "fld1XtTzQ72BNuMk1",
  [FormFields.FullName]: "fldxPdp5xetpJcjZk",
  [FormFields.Email]: "fld1DtL7DCEc4RFL4",
  [FormFields.TotalDonated]: "fldvKIyYTg6FlNbGf",
  [FormFields.DonationDate]: "fldHGcNgfJfX6Jp2M",
  [FormFields.PrivateNote]: "fldZrc7Vu3makfNwk",
};

const formFieldsDonationProd: Record<FormFields, string> = {
  [FormFields.ChargeID]: "fld065wWlWA2bo7s5",
  [FormFields.FullName]: "fldwYP2s231Q76E7o",
  [FormFields.Email]: "fldrLo3KLhToxo2Nm",
  [FormFields.TotalDonated]: "flduTkblo5E6JHwOj",
  [FormFields.DonationDate]: "fldGPOqDKyNouDKaQ",
  [FormFields.PrivateNote]: "fldYAOKiZSUBI98Eo",
};

export const formFieldsDonation = isProd ? formFieldsDonationProd : formFieldsDonationDev;
