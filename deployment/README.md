# Deployment

Push your changes to `main` to deploy automatically:

```sh
git push origin main
```

GitHub Actions builds the React frontend and Node.js backend into a Docker image,
then updates the application on the VPS at https://coremintcrm.com.

The deployment checks database readiness and restores the previous application
image if the new release fails. It keeps the current and one previous successful
image. MongoDB data persists across application updates.

Follow deployment progress in the repository’s **Actions** tab.
