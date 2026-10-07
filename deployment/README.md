# CoreMint CRM VPS deployment

The CRM is separate from Swavelink. A multi-stage image builds React and runs
the Express backend with `SERVE_FRONTEND=true`. Nginx forwards the domain to
127.0.0.1:8096. MongoDB is on an internal Docker network, with no public port.

## Repository setup

Pushes to `main` build `ghcr.io/hellen923/startboom_system-crm:<commit-sha>`.
Required Actions secrets:

- `COREMINT_DEPLOY_SSH_KEY`: dedicated key for the restricted `coremintci` account.
- `COREMINT_SSH_KNOWN_HOSTS`: verified SSH host keys for 213.210.20.181.

The package must grant this repository Actions access/admin rights for publishing
and version deletion. Images are private by default; the workflow's ephemeral
GITHUB_TOKEN is passed to the server only for pulling that release.

Deployment runs sequentially. Failed readiness restores the previous application
image. A successful deployment keeps the current and one previous successful
image in GHCR and locally. Rollback does not reverse database schema/data changes.
Do not run destructive migrations automatically. MongoDB upgrades are separate
from application deployments.

## VPS files (outside the web root)

- `/opt/coremintcrm/compose.yaml`: root-owned production services.
- `/etc/coremintcrm/compose.env`: private database bootstrap credentials.
- `/etc/coremintcrm/app.env`: private app credentials and database connection.
- `/usr/local/sbin/coremintcrm-deploy`: root-owned deployment script.
- `/usr/local/bin/coremintcrm-ssh-dispatch`: restricted SSH command handler.
- `/usr/local/sbin/coremintcrm-backup`: daily database backup.

Install MongoDB separately before the first application release. Create a dedicated
database user with readWrite on coremintcrm; do not use the root database user in
the app. Set FRONTEND_URL, APP_URL and CORS_ORIGINS to https://coremintcrm.com
(allow www as well for CORS), and set a random JWT_SECRET.

Email requires Brevo (`BREVO_API_KEY`, `BREVO_FROM`, `EMAIL_FROM`) or the supported
SMTP settings. Cloudinary credentials are needed for image uploads. Obtain these
privately. Set the initial administrator through the reviewed setup process; no
sample/demo users are seeded automatically.

Daily gzip mongodump archives retain 14 days under `/var/backups/coremintcrm`.
These local backups are not disaster recovery: configure an independent off-server
backup destination and test restoring before relying on this deployment.
Existing Atlas records require a separately scheduled migration and cutover.

Deployment account has no interactive shell, forwarding, or general sudo access.
Its SSH key can invoke only this app's deployment command with a 40-character SHA.
The private key is not committed; backend secrets stay on the VPS.
