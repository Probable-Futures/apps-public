# Probable Futures

## Setup

**Requirements**

- [Docker](https://docs.docker.com/docker-for-mac/install/)
- Node v18 _Recommended to install via [volta](https://volta.sh/)_
- [Yarn](https://yarnpkg.com/lang/en/) via `volta install yarn`

### Environment Secrets

Access tokens and other required credentials can be found inside the Probable Futures vault in the Postlight 1Password organization. The following secure notes inside the 1password vault should be copied verbatim to their corresponding paths within this repository.

- `packages/maps/.env`
- `packages/db/.env`
- `packages/api/.env`
- `packages/worker/.env`
- `packages/pro/.env`

### Host File Modifications

In development, we use the hostname alias `http://local.probablefutures.org`. This makes it easier to work with services that require domain whitelisting such as [mapbox](https://www.mapbox.com/). It also provides an easy-to-remember entrypoint to the services exposed by docker. To enable the hostname alias on your development machine, run the following command.

```sh
echo "127.0.0.1       local.probablefutures.org" | sudo tee -a /etc/hosts
```

### Setting up TLS for local development

We use [mkcert](https://github.com/FiloSottile/mkcert) for creating a TLS certificates for local development.
Setup requires the following steps:

```sh
brew install mkcert
brew install nss # if you use Firefox

# use the absolute path here
export CAROOT=./docker/nginx/certs
mkcert -install
```

### First time Installation Notes

Before starting the docker services, make sure you have `pf_public.pf.datasets.csv` and `pf_public.pf.maps.csv` files placed in files under data/seeds. These two files are required by the `migrate` service when seeding the database. They can be found in the `global-pf-data-engineering` bucket on S3.

Finally, in the db's .env file, change the DATABASE HOST from `localhost` to `db`.

### Running Docker Services

If this is the first time you are running the services exposed by this project's [docker-compose.yml](./docker-compose.yml) file you must first install the dependencies in each package. You can do so by running the following commands from the root directory of this repository.

```
yarn install
```

Once you have completed the steps above, you may run `yarn start` to spin up the infrastructure required for local development.

### Running Frontend Packages Locally

To run a package within this repo in your browser you must both start the docker services and start the frontend of each specific application.

#### Maps Package

To run the frontend for the [Maps](https://probablefutures.org/maps/) application locally run `yarn workspace @probable-futures/maps start` in the command line from the root directory or run `yarn start` from within the `/maps` directory. More info on the maps package [here](/packages/maps/readme.md).

#### PF Pro (pro package)

To start the app, run `yarn start` at the `pro` directory or `yarn workspace @probable-futures/pro start` at the root directory. More info on the PF Pro package [here](/packages/pro/readme.md).

## Deployment & Infrastructure

AWS infrastructure is managed by [Pulumi](https://www.pulumi.com/).

GitHub Actions will preview infrastructure changes on pull request, and apply
them automatically on merges to main, staging and production branches. Each branch deploys to its corresponding stack.

## Further Documentation

Further documentation for each package can be found below.
| Package |
| ------- |
| [API](/packages/api/readme.md)|
| [DB](/packages/db/readme.md) |
| [Maps](/packages/maps/readme.md) |
| [Pro](/packages/pro/readme.md) |
| [Worker](/packages/worker/readme.md) |

More information on Probable Futures data, climate models, and the organization itself can be found at [probablefutures.org](https://probablefutures.org/).
