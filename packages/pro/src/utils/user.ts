import { User } from "@auth0/auth0-react";
import { isLocal } from "consts/env";

export const isAdmin = (user?: User) => {
  if (!user) {
    return false;
  }
  const rolesKey = isLocal
    ? "https://dev-pro.probablefutures.org/roles"
    : `${window.location.origin}/roles`;
  const roles: string[] = user[rolesKey] ?? [];

  return roles.find((role) => role.startsWith("admin"));
};
