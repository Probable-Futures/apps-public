# @probable-futures/pro

This package contains the React app for the professional platform. The project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Running the App

To start the app, run `yarn start` at the project directory or `yarn workspace @probable-futures/pro start` at the root directory.
Then open [https://local.probablefutures.org/](https://local.probablefutures.org/) to view it in the browser.

## **Kepler**

- ### Definition:

  Kepler is a powerful tool used to visualize a large amount of data in the browser with the ability to explore, filter, and engage with location data.

  As a react application, kepler.gl is used to render millions of points representing thousands of trips and perform spatial aggregations on the fly.

- ### Kepler Dependency Injection:

  Kepler.gl has a dependency injection system that allows users to inject custom components to kepler.gl UI replacing the default ones at bootstrap time.

  ![Alt text](kepler-DI.png?raw=true "Title")

  In the picture above, the `Injector` object creates Components A and B, it creates the factory, and then it injects the components A and B into the factory. A factory is just a function that takes a set of dependencies and returns a component instance.

- ### Usage Example:

  This example shows how to override the close button inside the sidebar.

  The `CloseButtonFactory` is a dependency of the `SideBarFactory`. We replace the `CloseButtonFactory` with a custom component, pass it to the dependency array of `SidebarFactory`. Now when the injector mounts `SidebarFactory` it will use the custom `CloseButtonFactory` and return a new component instance based on that.

      const CloseButtonFactory = () => {
        const CloseButton = ({ onClick, isOpen, }) => (
          <StyledCloseButton onClick={onClick}>
          </StyledCloseButton>
        );
        return CloseButton;
      };

      function CustomSidebarFactory(CloseButtonFactory: any) {
        const SideBar = SidebarFactory(CloseButtonFactory);
        const CustomSidebar = (props: any) => (
          <StyledSideBarContainer>
            <SideBar {...props} />
          </StyledSideBarContainer>
        );
        return CustomSidebar;
      }

      CustomSidebarFactory.deps = [CloseButtonFactory];

      export default CustomSidebarFactory;

  More examples can be found on kepler [docs page](https://docs.kepler.gl/docs/api-reference/advanced-usages/replace-ui-component).

## **Enrichment process - General flow:**

- The user uploads a file, and the file gets uploaded to S3 via `@uppy/aws-s3-multipart`.
- When the file is finished uploading, the client sends a request to the server and inserts a partner dataset record into `pf_partner_dataset` table providing the name and the description of the file.
- The client, then, sends another request to the server to insert a partner dataset upload record into `pf_partner_dataset_upload` table providing the url of the file in S3 and the id of the record created inside the `pf_partner_dataset` table.
- After the record is created inside `pf_partner_dataset_upload`, a database function `process_partner_dataset_upload` will be triggered, which adds a new job `process_partner_dataset_upload` to the `graphite_worker`. When this job is completed a new job `add_nearby_pf_coordinates_to_partner_dataset` will be automatically added to the job’s queue.
- At this point, the client starts the polling process, which is to continuously check if the `process_partner_dataset_upload` is completed, by checking the status of the record created inside the `pf_partner_dataset_upload` table.
- When the file is finished processing, the client stops polling and checks for any errors occurred during the processing. If there are any errors, they will be displayed for the users in a UI modal with the ability to download the failed records, correct them, and add them again for processing. The user can then proceed to the enrichment process.
- When the user starts the enrichment process, a new record will be created inside `pf_partner_dataset_enrichments` that saves both the selected climate dataset and the user dataset to be used during the enrichment.
- Upon creating this record, a new database function `enrich_partner_dataset` will be triggered, which adds a new job `enrich_partner_dataset` to the `graphite_worker`.
- The client will also start the polling again to check on the status of the enrichment in an interval of 5 secs between requests.
- After the enrichment is completed, the enriched file will be fetched from S3, and passed to kepler to display the data on the map.

Check the [README](/packages/worker/README.md) in `worker` folder for more info on the different background jobs mentioned above.
