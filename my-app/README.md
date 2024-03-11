# To deploy from a fresh checkout

### build
```
npm install
./rebuildForServer.sh $MY_API_SERVER_URL
```

`MY_API_SERVER_URL` is based on your Google App Engine project name and region, or your local host.

### deploy to the GAE server

https://cloud.google.com/appengine/docs/standard/serving-static-files?tab=python#serving_from_your_application

#### or deploy to the root of a bucket

Serving static files from a bucket lightens the load on the backend. Here are the [official docs](https://cloud.google.com/appengine/docs/standard/serving-static-files?tab=python#serving_files_from).

```
gsutil rm -r gs://$FRONTEND_BUCKET
gsutil cp -r build/*  gs://$FRONTEND_BUCKET
gsutil iam ch allUsers:legacyObjectReader gs://$FRONTEND_BUCKET
gsutil web set -m index.html -e index.html gs://$FRONTEND_BUCKET
```

#### or deploy to a folder inside a bucket
```
gsutil rm -r gs://$FRONTEND_BUCKET/$FOLDER
gsutil cp -r build/*  gs://$FRONTEND_BUCKET/$FOLDER
gsutil acl ch -r -u AllUsers:R gs://$FRONTEND_BUCKET/$FOLDER
gsutil web set -m $FOLDER/index.html -e $FOLDER/index.html gs://$FRONTEND_BUCKET
```

While testing, use `gsutil setmeta -h Cache-Control:60 -r gs://$FRONTEND_BUCKET/$FOLDER` 
else the 3600s default cache will mandate long breaks between tests. Be sure to set it back when done testing otherwise the page reloads will be annoying during gameplay.

----

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
