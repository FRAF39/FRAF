# SHOFI HOSTING-style Login + Admin Panel

This starter reproduces the publicly visible login concept of the supplied URL and adds an admin-controlled multi-user system.

## Included
- Username/password login
- Admin panel
- Create hundreds of separate user accounts
- Per-user expiry date/time
- Enable/disable accounts
- Delete normal users
- SQLite database
- Password hashing with bcrypt
- Session-based authentication

## Run
1. Install Node.js 18+.
2. Run `npm install`
3. Set environment variables from `.env.example` (recommended).
4. Run `npm start`
5. Open `/login`.

Default development admin if environment variables are not set:
- username: `admin`
- password: `ChangeMe123!`

Change these before deploying.

## Deployment
This is designed for Node-compatible hosting such as Render. Persistent SQLite storage requires a persistent disk/volume on hosts where the filesystem is ephemeral.

## Important
The supplied URL currently redirects `/b6bbcf2c/home` to a login page. Only the publicly accessible login screen was inspectable without credentials, so this project is a functional recreation/extension rather than a claim of being the site's private source code.
