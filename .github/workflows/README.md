# FTP Deployment Setup

This workflow automatically deploys the built application to an FTP server when code is pushed to the `main` branch.

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret** and add the following:

### Secrets to Add:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `FTP_SERVER` | Your FTP server address | `ftp.example.com` or `192.168.1.100` |
| `FTP_USERNAME` | FTP username | `myftpuser` |
| `FTP_PASSWORD` | FTP password | `your-secure-password` |

## Configuration Options

You can modify the workflow file (`.github/workflows/deploy.yml`) to customize:

- **server-dir**: The remote directory path on the FTP server (default: `./`)
  - Example: `/public_html/` or `/www/`

- **Trigger branch**: Currently set to `main`, change if needed

- **dangerous-clean-slate**: Set to `true` to delete all files on the server before uploading (use with caution!)

## Manual Deployment

You can also trigger the deployment manually:

1. Go to the **Actions** tab in your GitHub repository
2. Select the **Deploy to FTP** workflow
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

## How It Works

1. Checks out the code
2. Sets up Node.js 20
3. Installs dependencies with `npm ci`
4. Builds the project with `npm run build`
5. Uploads the `dist/` folder to your FTP server
