![Pumpel Banner](assets/banner.jpg)

# Pumpel - Workout Tracker

[![GitHub](https://img.shields.io/badge/GitHub-nico--martin%2Fpumpel-blue?logo=github)](https://github.com/nico-martin/pumpel/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A privacy-focused fitness app that helps you track your gym workouts, sets, and weights. Built with React, TypeScript, and Tailwind CSS.

> ## ⚠️ Development Notice
>
> **This entire app was built using [Claude Code](https://claude.com/claude-code) and Claude 4.5 Sonnet, with zero manual code editing.**
>
> This project was an experiment to see how far I could push AI-assisted development without writing a single line of code myself. Every component, database schema, feature, and style was implemented through natural language conversations with Claude Code. The entire codebase, from initial setup to deployment configuration, was generated and modified purely through AI assistance.
> 
## Features

- **100% Local** - All data stored locally in your browser using IndexedDB
- **No Cloud** - Your workout data never leaves your device
- **No Server** - Runs entirely in your browser
- **No Cost** - Free forever, no subscriptions or hidden fees
- **Progressive Web App (PWA)** - Install on your device and use offline
- **Offline First** - Works completely offline with cached resources
- **Auto Updates** - Automatic app updates with notification
- **Mobile-First** - Optimized for mobile use, works on desktop too
- **Exercise Management** - Create and manage custom exercises
- **Workout Tracking** - Track sets, rounds, weights, and reps
- **History** - View your workout history and progress
- **Export/Import** - Backup and restore your data as JSON
- **User Profile** - Personalize with your name

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **vite-plugin-pwa** - PWA support with Workbox
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI components
- **IndexedDB (idb)** - Local database
- **Service Workers** - Offline caching and updates
- **GitHub Actions** - Automated FTP deployment

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nico-martin/pumpel.git
cd pumpel
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Database Structure

Pumpel uses IndexedDB with the following structure:

### Object Stores

#### `user`
- Single record storing user profile information
- Fields: `id`, `name`, `createdAt`, `updatedAt`

#### `exercises`
- Stores exercise definitions
- Fields: `id`, `name`, `description`, `type`, `bodyPart`, `createdAt`
- Index: `name` (unique)

#### `trainings`
- Stores workout sessions
- Fields: `id`, `name`, `warmUp`, `calmDown`, `startTime`, `endTime`, `notes`, `createdAt`
- Indexes: `startTime`, `endTime`

#### `sets`
- Stores exercise sets within trainings
- Fields: `id`, `trainingId`, `exerciseId`, `orderInTraining`, `restPeriod`, `notes`, `createdAt`
- Indexes: `trainingId`, `exerciseId`, compound `exerciseId-trainingId`

#### `rounds`
- Stores individual rounds within sets
- Fields: `id`, `setId`, `orderInSet`, `weight`, `reps`, `notes`, `createdAt`
- Index: `setId`

## Deployment

The project includes a GitHub Actions workflow for automated FTP deployment.

### Setup FTP Deployment

1. Go to your GitHub repository settings
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Add the following secrets:
   - `FTP_SERVER` - Your FTP server address
   - `FTP_USERNAME` - Your FTP username
   - `FTP_PASSWORD` - Your FTP password

The workflow automatically deploys to your FTP server when you push to the `main` branch.

See [.github/workflows/README.md](.github/workflows/README.md) for detailed deployment configuration.

## Project Structure

```
pumpel/
├── .github/
│   └── workflows/       # GitHub Actions workflows
├── public/              # Static assets
│   └── icon.svg        # App icon/favicon
├── src/
│   ├── components/      # React components
│   │   ├── ui/         # shadcn/ui components
│   │   ├── AccountPage.tsx
│   │   ├── ExercisesPage.tsx
│   │   ├── NameSetupModal.tsx
│   │   ├── Navigation.tsx
│   │   ├── StartScreen.tsx
│   │   ├── StatsPage.tsx
│   │   ├── TrainingDetails.tsx
│   │   └── TrainingView.tsx
│   ├── db/             # Database layer
│   │   ├── init.ts     # Database initialization
│   │   ├── types.ts    # TypeScript types
│   │   ├── exercises.ts
│   │   ├── trainings.ts
│   │   ├── sets.ts
│   │   ├── rounds.ts
│   │   ├── user.ts
│   │   └── queries.ts  # Complex queries
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── index.html          # HTML template
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── tailwind.config.ts  # Tailwind config
└── vite.config.ts      # Vite config
```

## Development

### Code Style

- ESLint is configured for code quality
- Run linting: `npm run lint`

### Adding UI Components

This project uses shadcn/ui components. To add new components:

```bash
npx shadcn@latest add <component-name>
```

## Data Management

### Export Data

1. Navigate to the Account page
2. Click "Export Database"
3. Save the JSON file

### Import Data

1. Navigate to the Account page
2. Click "Import Database"
3. Select your backup JSON file
4. Confirm the import (this will replace all existing data)

### Delete All Data

1. Navigate to the Account page
2. Click "Delete All Data"
3. Confirm the deletion

## Progressive Web App (PWA)

Pumpel is a Progressive Web App, which means you can:

### Install on Mobile (iOS/Android)
1. Open Pumpel in your mobile browser
2. Tap the share/menu button
3. Select "Add to Home Screen"
4. The app will appear on your home screen like a native app

### Install on Desktop
1. Open Pumpel in Chrome/Edge
2. Click the install icon in the address bar
3. Click "Install" in the popup
4. The app will open in its own window

### Offline Support

- The app works completely offline after the first visit
- All static assets are cached automatically
- Database operations work offline (IndexedDB is local)
- Updates are downloaded in the background
- You'll see a notification when a new version is ready

## Browser Compatibility

Pumpel works in all modern browsers that support:
- IndexedDB
- Service Workers
- ES2020+
- CSS Grid & Flexbox

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Privacy & Security

- All data is stored locally in your browser's IndexedDB
- No analytics or tracking
- No external API calls (except for deployment)
- Your data never leaves your device unless you export it

## License

MIT License - see [LICENSE](LICENSE) file for details.

