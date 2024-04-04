# @probable-futures/maps

This package contains the React app for the map builder and the interactive map. The project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Running the App

To start the app, run `yarn start` at the project directory or `yarn workspace @probable-futures/maps start` at the root directory.
Then open [https://local.probablefutures.org/](https://local.probablefutures.org/) to view it in the browser.

## Updating the App in WordPress Site

To update the interactive map in WP, first, you need to generate a special type of build by running `yarn build:wp` at the project directory or `yarn workspace @probable-futures/maps build:wp` at the root directory. Then copy the generated `build` folder and replace the one inside [website-wp repository](https://github.com/Probable-Futures/website-wp/tree/dev/wordpress/wp-content/plugins/pf-interactive-map/app).

NOTE: you can also find the build files for WP as part of the GitHub release. Look for `maps_build_for_wp.zip` file under `Assets`.
