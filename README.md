# auspol-maps-2019

A collection of GeoJSON and TopoJSON files representing Commonwealth electoral boundaries for the 2019 federal election. The files have been created by merging and transforming the spatial data files for the most recent redistribution in each state provided by the Australian Electoral Commission.

## Getting Started

The map files in this collection are made available in two formats under the `geojson` and `topojson` directories. If you're not familiar with those formats and the differences, some starting points for information are [the GeoJSON specification](http://geojson.org/) and [the TopoJSON documentation](https://github.com/topojson/topojson/wiki).

You can clone or download the full repository, or download just the specific map file(s) you're interested in using.

## About the Project

All of the code used to generate the map files is available in this repository. You don't need to run any of that code to make use of the maps, but it's available for reproducibility, debugging and extension of the project.

If you want to run the code to (re-)generate the map files then you'll need to have [Node.js](https://nodejs.org/) installed on your system.

From a command line prompt in the project directory, you can rebuild the maps with the following steps:

1.  `npm install` to install the project dependencies.
2.  `npm run download` to download the ESRI shapefiles from the AEC website.
3.  `npm run build` to merge the original files and transform them to GeoJSON and TopoJSON.

The project uses [Mapshaper](https://github.com/mbloch/mapshaper) to convert the original ESRI shapefiles to an equivalent GeoJSON file and for all subsequent transformations.

The build process first converts the original map files to GeoJSON and then merges them into a national file. The national GeoJSON file is then converted to TopoJSON, which is the format used for all subsequent transformations (e.g., simplification), because TopoJSON preserves shared topology and ensures the boundaries shared by divisions won't be transformed separately within each division's geometry. Once all transformations have been completed, all of the TopoJSON files are then converted back to GeoJSON for use cases where TopoJSON isn't supported.

### Choosing a map file

This repository provides national map files containing all divisions (filenames containing `alldivisions`), as well as separate files for each electoral division (filenames containing the name of the relevant division).

Each map is available at different simplification levels, so that you can choose a version appropriate to your needs based on the trade-off between level of detail and file size. The numeral prefixed with a `p` in each filename indicates the percentage of removable points that have been retained, so `p100` indicates full-detail maps that have not been simplified at all, `p10` indicates maps that have had 10% of removable points retained (and 90% removed), etc.

### Work in progress

Additional transformations will be added to provide more map files and/or layers, e.g., divisions grouped by state/territory, as well as metropolitan groupings that would be suited to allowing users to select a region from the national map and zoom into it.

Feel free to create an issue if there is a specific map configuration that you think would be useful.

## Licence

This product (`auspol-maps-2019`) incorporates data that is:

**© Commonwealth of Australia (Australian Electoral Commission) 2019**

This package is made available under the [MIT License](LICENSE).
