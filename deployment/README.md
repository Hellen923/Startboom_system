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

## Switch uploads to server storage

In `startboom-digital/backend/routes/upload.js`, replace Cloudinary uploads with
files saved in the backend’s `uploads` folder. Use unique filenames and return
`/uploads/<filename>` URLs, keeping the existing `filename`, `path`, and `url`
response fields, authentication, and file limits. Push to `main` to deploy.

The uploads folder persists across deployments. Daily local backups include
MongoDB and uploads, retained for 14 days. Existing Cloudinary files and their
database URLs need migration separately.

## Email settings

In GitHub **Settings → Secrets and variables → Actions**, set:
- Secrets: `BREVO_API_KEY` for Brevo, or `GMAIL_APP_PASSWORD` for Gmail.
- Variables: `EMAIL_FROM` (verified sender), and `EMAIL_USER` for Gmail.

Brevo is used when its key is present; otherwise Gmail is used. After editing
settings, push to `main` or choose **Actions → Deploy CoreMint CRM → Run workflow**.
Credentials stay out of the source code and Docker image.

## Cloudinary settings

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`
in GitHub Actions secrets. Push to `main` or run the deployment workflow to apply
them to the VPS. These credentials are needed while uploads use Cloudinary.
