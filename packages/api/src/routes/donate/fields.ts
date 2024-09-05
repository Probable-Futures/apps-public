import { isProd } from "../../utils/env";

enum FormFields {
  FullName = "Full Name",
  Email = "Email",
  TotalDonated = "Total Donated",
  DonationDate = "Donation Date",
  PrivateNote = "Private Note",
}

const formFieldsDonationDev: Record<FormFields, string> = {
  [FormFields.FullName]: "fldfUTqwtNqJo4cvV",
  [FormFields.Email]: "fldUoaM2R4LXVg1lV",
  [FormFields.TotalDonated]: "fldO071LymyIzgoYC",
  [FormFields.DonationDate]: "fld7kBQdRsZX010E0",
  [FormFields.PrivateNote]: "fldOQ735PCK4E4ZXt",
};

const formFieldsDonationProd: Record<FormFields, string> = {
  [FormFields.FullName]: "flde3v3TYCYaMYxDZ",
  [FormFields.Email]: "fldTxMppmTjojamtZ",
  [FormFields.TotalDonated]: "fldN9JE83b69XaJ6G",
  [FormFields.DonationDate]: "fldXr3s4qEwmo72TS",
  [FormFields.PrivateNote]: "fldNZJGskriv2Yk5x",
};

export const formFieldsDonation = isProd ? formFieldsDonationProd : formFieldsDonationDev;
