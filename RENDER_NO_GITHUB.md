# Render deployment — important

Render's current Dashboard deployment flow does NOT accept an arbitrary ZIP upload as the source of a Web Service.
A Web Service is normally deployed from a connected Git repository, a public Git repository URL, or a prebuilt Docker image.

So this ZIP is **Render-ready**, but the ZIP itself is not something you can select in Render's Web Service source picker.

## Option A — easiest without GitHub
Use GitLab or Bitbucket:
1. Create an empty repository.
2. Upload/extract every file from this ZIP into the repository root.
3. In Render: New -> Web Service.
4. Connect the GitLab/Bitbucket repository.
5. Choose Docker runtime (Render can use the included Dockerfile).
6. Add these environment variables:
   ADMIN_USERNAME = your admin username
   ADMIN_PASSWORD = a strong admin password
   SESSION_SECRET = a long random secret
7. Add a persistent disk mounted at `/var/data` if the free plan/account allows it.
8. Deploy.

## Option B — prebuilt Docker image
Build this Dockerfile into a container image and publish it to a container registry, then select Existing Image in Render.

## Important data note
Render's normal filesystem is ephemeral. The app therefore stores its SQLite database at `/var/data/data.db` when `RENDER=true`. A persistent disk must be mounted at `/var/data` if you want users and settings to survive restarts/redeploys. Render documents persistent disks as a paid feature and recommends managed Postgres for relational production data.

## Security
Never put ADMIN_PASSWORD or SESSION_SECRET in the source files. Set them as Render environment variables.
