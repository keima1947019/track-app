# Google Drive Setup

The app saves and restores athlete entries, track results, field trials, wind values, and referee approval state in one `track-app-backup.json` file in the signed-in user's Google Drive.

## Google Cloud Configuration

1. Create or select a project in Google Cloud Console and enable the Google Drive API.
2. Configure the OAuth consent screen. If the app is in Testing mode, add the Google account that will use the app as a test user.
3. Create an OAuth 2.0 Client ID with application type **Web application**.
4. Add each address used to access the app under **Authorized JavaScript origins**, for example `http://localhost:8081` and `http://localhost:5173`.

The app requests the `drive.file` scope. It can access the backup file it creates, not all files in Drive. A client secret is not needed in the browser and must not be added to this project.

## Local Development

Set the OAuth Client ID in `.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

Restart the Vite development server after changing the environment file.

## Docker

Pass the OAuth Client ID at build time because Vite embeds it in the static app:

```powershell
docker build --build-arg VITE_GOOGLE_CLIENT_ID="your-web-client-id.apps.googleusercontent.com" -t track-app .
docker rm -f track-app
docker run -d --name track-app -p 8081:80 track-app
```

Use the **Google Drive保存** button to create or update the backup. The download-icon button restores it and replaces the data currently shown in the app.
