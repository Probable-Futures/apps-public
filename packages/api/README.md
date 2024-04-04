# @probable-futures/api

The server is responsible for serving the GraphQL endpoint (via [PostGraphile](https://graphile.org/postgraphile/), based on database in `@probable-futures/db`).

## Usage

The server exposes two endpoints:

- `/graphql`: this endpoint will accept GraphQL queries and mutations
- `/graphiql`: playground endpoint (available on the dev environment only)

### Example Queries

Note: There is a [Postman collection](https://app.getpostman.com/join-team?invite_code=b55240aad8bd0d80fa455fcf19b3de6a&ws=a9724eba-4bca-4977-9d41-8f99acc5bd74) that contains the following queries as well.

This will retrieve the list of available datasets:

```
{
  datasets {
    nodes {
      id
      internalId
      name
      slug
      description
      category
      model
      resolution
      unit
      descriptionBaseline
      description1C
      description15C
      description2C
      description25C
      description3C
    }
  }
}
```

This will retrieve the list of available Mapbox maps and the dataset associated to each one of them:

```
{
  maps {
    nodes {
      mapStyleId
      name
      description
      bins
      colorScheme
      dataset {
        internalId
        name
        description
      }
    }
  }
}
```

This will retrieve the climate risk values for dataset whose id is `11006`:

```
{
  climateData(condition: { datasetId: 11006 }) {
    nodes {
      latitude
      longitude
      dataBaseline
      data1C
      data15C
      data2C
      data25C
      data3C
    }
  }
}
```

The API also supports returning the climate data in GeoJSON format.

This will return the data as list of point features:

```
{
  points(datasetId: 13001, degreesOfWarming: 1.5) {
    type
    features {
      type
      geometry {
        ... on GeoPoint {
          type
          coordinates
        }
      }
      properties {
        value
      }
    }
  }
}
```

This will return the data as list of polygon features:

```
{
  geotile(datasetId: 13001, degreesOfWarming: 1.5) {
    type
    features {
      type
      geometry {
        ... on Polygon {
          type
          coordinates
        }
      }
      properties {
        value
      }
    }
  }
}
```
