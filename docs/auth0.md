# Auth0

We use Auth0 for authentication and authorization across all applications. There is an Auth0 tenant for each environment: dev, staging and production. All [Auth0 resources](../infra/services/src/auth.ts) are managed by Pulumi.

## Applications

- Map Builder
- Professional Platform
- WordPress Website

## Actions

- `domain-access-action`: this action is executed after login. It determines who has access to the map applications, and WP website based on the email domain.
- `assign-admin-role-action`: this action is executed after login and after the `domain-access-action` action. It assigns the admin role to every user logging into the pro platform. This role has 3 permissions `partner-manage`, `partner-read`, and `partner-write` and when assigned to a user, any access token that will be generated will include those permissions (scopes). Those permissions are required to create projects and datasets in the pro platform.
