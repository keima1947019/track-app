# Track and Field Meet Management Support Tool

## Project Overview

This project aims to develop tools to assist in the organization of track and field meet and competitions. It seeks to streamline the handling of information related to event management—from managing athlete entries to recording competition results, sharing real-time updates, and generating reports.

By reducing the workload on competition officials and event organizers and making it easier for stakeholders to check records and progress, the project supports the smooth and accurate operation of events. It also aims to create an environment where athletes and spectators can easily view competition results.

## Key Features

- Listing, searching, and managing athlete entry information
- Scheduling and heat assignments by event and gender
- Entering track event records, rankings, and wind speeds
- Entering the overall finishing order for track results. Athletes are identified by bib number for sprints and by event-specific entry number for events of 1,000 meters or longer
- Detecting bib numbers from heats other than the selected one and issuing a warning
- Management of attempt records and best marks for field events
- Display of team standings and total scores
- Preview of real-time live update screens for athletes and spectators
- Report output screens for certificates, programs, official results, and other documents


## Development Status

This app is currently under development, with a focus on ensuring the practicality of its screens and operations to support tournament management. It includes features that utilize sample data and simulations, as well as features that require configuration to connect with external services. Before using this app in an actual tournament, please verify the accuracy of the records, permission management, backup procedures, and compliance with the applicable competition rules.

## Technology Stack

- React
- Vite
- Tailwind CSS
- lucide-react
- Docker / Nginx

## Starting the Development Environment

Set up Node.js 20 or later, and run the following command in the project root directory.

```bash
npm install
npm run dev
```

To generate static files for production, do the following:

```bash
npm run build
```

## Patch Application

```bash
git apply --check <name-of-patchfile>
git apply <name-of-patchfile>
docker compose up -d --build app
docker compose ps
```