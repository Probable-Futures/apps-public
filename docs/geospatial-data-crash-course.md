# Geospatial Data Crash Course

If you're new to digital geography, it can be daunting to learn about Geographic Information Systems (GIS) or how to visualize and analyze spatial and geographic data. This document is intended to be a jumping off point to understand GIS paradigms and technologies by providing a curated list of external resources to guide the reader through their own journey into GIS learning.

## Assumed Background Knowledge

This guide and the curated links assumes the reader has previous experience with programming, data science, or data analysis. Expertise in these area is by no means a prerequisite for reading this document, but familiarity with a programming language and/or SQL will be an immense help.

## Begin Here

For a condensed yet comprehensive overview of geography, cartography and geographic information, [Map School](https://mapschool.io/) is an excellent place begin. If you prefer a longer or more detailed introduction, [A Gentle Introduction to GIS](https://docs.qgis.org/3.16/en/docs/gentle_gis_introduction/index.html) from the QGIS documentation is another entry point. Finally, learners wishing for a more traditional style of learning should explore the [MIT OCW: GIS Tutorial](https://ocw.mit.edu/resources/res-str-001-geographic-information-system-gis-tutorial-january-iap-2016/index.htm). The tutorial provides exercises, sample data and an intro to spatial statistics.

## Quick Start

If you want to quickly view some spatial data without installing or configuring multiple tools, the [kepler.gl](https://kepler.gl/demo) demo is a fast web map that can import CSV, JSON and GeoJSON datasets. The User guide includes documentation on adding data, styling layers and adding interaction.

To quickly transform a geodata set into an acceptable format to analyze with familiar tools, [ogr2ogr](https://gdal.org/programs/ogr2ogr.html) is a command line tool for transforming GIS data between common formats, such as [XLSX](https://gdal.org/drivers/vector/xlsx.html), [MySQL](https://gdal.org/drivers/vector/mysql.html), [Postgres](https://gdal.org/drivers/vector/pg.html), [Oracle Spatial](https://gdal.org/drivers/vector/oci.html), [MongoDB](https://gdal.org/drivers/vector/mongodbv3.html), [SQLite](https://gdal.org/drivers/vector/sqlite.html), [GeoJSON](https://gdal.org/drivers/vector/geojson.html) and [CSV](https://gdal.org/drivers/vector/csv.html).

Here is an sample command to import a GeoJSON file into a Postgres DB.

    ogr2ogr -f PostgreSQL PG:"host=localhost user=postgres dbname=postgres password=password" \
    	-lco GEOMETRY_NAME=coordinates \ # What to name the column containing the spatial data
    -nln uploads \ # The name of the table to import the data to
    /path/to/import.geojson

To export a table from Postgres as GeoJSON

    ogr2ogr -f GeoJSON /path/to/output.geojson \
    	"PG:host=localhost dbname=postgres user=postgres password=password" \
    	-sql \
    	"select data_baseline, data_1C, data_1_5C, data_2C, data_2_5C, data_3C, coordinates from climate_data"

## GIS and Spatial Analysis

The following resources are helpful to develop deeper knowledge of GIS fundamentals:

- [Intro to GIS and Spatial Analysis](https://mgimond.github.io/Spatial/index.html): A compilation of lecture notes for a GIS and Spatial Analysis course. Covers specifics of working with spatial data and spatial analysis techniques using R.
- [University Consortium for Geographic Information Science GIS&T Body of Knowledge](https://gistbok.ucgis.org/): A massive encyclopedia of GIS knowledge and tools. This is a great resource for digging in deep about particular topics

### Penn State Open Education Resources

Penn State University has a large selection of free online courses for learning GIS. If structured learning works best for you, going through one or two of these course may be valuable.

- [The Nature of Geographic Information](https://open.ems.psu.edu/node/1461)
- [GIS Programming and Software Development](https://open.ems.psu.edu/node/1340)
- [GIS Analysis and Design](https://open.ems.psu.edu/node/1426)
- [Advanced Python Programming for GIS](https://open.ems.psu.edu/node/1342)
- [Geospatial System Analysis and Design](https://open.ems.psu.edu/node/1344)
- [Geographic Information Analysis](https://open.ems.psu.edu/node/1346)
- [Geospatial Technology Project Management](https://open.ems.psu.edu/node/1345)
- [Web Application Development for the Geospatial Professional](https://open.ems.psu.edu/node/1352)
- [Cloud and Server GIS](https://open.ems.psu.edu/node/1356)
- [Spatial Database Management](https://open.ems.psu.edu/node/1357)

## Mapping and Cartography

Mapping and map design is a key component of GIS. The techniques and technologies behind designing and serving maps is significantly different than serving other content.
The OpenStreetMap Wiki has a great explanation of the [Slippy Map](https://wiki.openstreetmap.org/wiki/Slippy_Map) technology used to serve map content over the web.

One key problem to highlight is the problem of displaying spatial data that crosses the AntiMeridian, aka the [The 180th Meridian](https://macwright.com/2016/09/26/the-180th-meridian.html). The linked article is a great introduction to the issues and possible solutions.

### Penn State Open Education Resources

Again, Penn State has a large selection of map specific courses to learn from.

- [Maps and the Geospatial Revolution](https://open.ems.psu.edu/node/1375)
- [Making Maps that Matter with GIS](https://open.ems.psu.edu/node/1298)
- [Cartography and Visualization](https://open.ems.psu.edu/node/1299)
- [Open Web Mapping](https://open.ems.psu.edu/node/1337)

## Technology

Below are a collection of links for learning and using specific GIS tools and technologies.

### PostGIS

PostGIS is the Spatial data extension for Postgres

- [Intro to PostGIS Workshop](https://postgis.net/workshops/postgis-intro/)
- [Crunchy Data: PostGIS Tutorial](https://learn.crunchydata.com/postgis)
- [Getting Started with QGIS, PostgreSQL and PostGIS](https://www.cybertec-postgresql.com/en/getting-started-qgis-postgresql-postgis/)
- [Traveling Salesman Problem with PostGIS and pgRouting](https://www.cybertec-postgresql.com/en/traveling-salesman-problem-with-postgis-and-pgrouting/)

### GeoJSON

- [More than you ever wanted to know about GeoJSON](https://macwright.com/2015/03/23/geojson-second-bite.html)
- [Extracting city administrative boundaries as GeoJSON polygons from OSM data](https://peteris.rocks/blog/openstreetmap-administrative-boundaries-in-geojson/)

### GDAL

The Geospatial Data Abstraction Library, GDAL, is a powerful library of [programs](https://gdal.org/programs/index.html) and [APIs](https://gdal.org/api/index.html#gdal-ogr-in-other-languages) for translating geodata between dozens of raster and [vector](https://gdal.org/drivers/vector/index.html) formats. It is especially useful for data loading and exporting. Ogr2Ogr uses GDAL to perform these transformations

### QGIS

- [Training Manual](https://docs.qgis.org/3.16/en/docs/training_manual/index.html)

## Collections

These are collections of links and resources hosted on github. Great for discovering libraries

- [awesome-geojson](https://github.com/tmcw/awesome-geojson)
- [awesome-gis](https://github.com/sshuair/awesome-gis)
- [awesome-geospatial](https://github.com/sacridini/Awesome-Geospatial)
- [GIS Programming Roadmap](https://github.com/petedannemann/gis-programming-roadmap)

## Communities

The Slack based [Spatial Community](https://thespatialcommunity.org/) is very active and welcoming towards newcomers. It's a great place to ask for help or find answers to specific questions or problems.
