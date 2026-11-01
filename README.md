# SUT Findback

🌐 [English](README.md) | [ภาษาไทย](README.th.md)

**A campus lost-and-found application for Suranaree University of Technology.**

SUT Findback gives students and staff a shared place to report lost belongings, publish found items, and arrange returns. It brings searchable posts, location information, and real-time conversations together instead of spreading announcements across social media groups.

**Course:** Project in Scripting Language Application Development

**Project period:** March–May 2026

**Project type:** Collaborative course project

## My Contribution

I was responsible for the entire mobile application, including its screens, navigation, user workflows, and integration with Firebase, Google Maps, and Cloudinary. Other team members contributed to the project, including the administrator web application.

## Features

### Mobile Application

- **Accounts and profiles:** Register, sign in with email or username, reset or change passwords, and edit profile information and photos.
- **Lost-and-found posts:** Create, edit, and delete posts with categories, dates, descriptions, photos, and return locations. Capture photos or select them from the gallery.
- **Location selection:** Use GPS and Google Maps to specify where an item was lost or found.
- **Search and filters:** Search by keyword and filter posts by type, category, date, location, and status.
- **Real-time chat:** Exchange text, images, and post cards to coordinate item returns.
- **Notifications:** Follow new messages, item claims, post status changes, and report reviews through real-time updates.
- **Personal collections:** Save posts and view personal posts, saved items, and claimed items.
- **Item recovery and reporting:** Update recovery status and report inappropriate posts.

### Administrator Web Application

- Dashboard with post, user, report, and resolved-case statistics.
- Post review and status management.
- Report review and user account moderation.
- Support conversations with users.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Mobile | React Native, Expo SDK 58, TypeScript, Expo Router |
| Authentication and data | Firebase Authentication, Cloud Firestore |
| Maps and location | Google Maps API, Expo Location |
| Media | Cloudinary, Expo Image Picker, Expo Image Manipulator |
| Notifications | Firestore listeners, Expo Notifications |
| Administrator web app | React, TypeScript, Vite, Recharts, Lucide React |
| Web deployment | Firebase Hosting |

## Repository Structure

```text
app/                 Mobile screens and Expo Router layouts
components/          Shared mobile components and user context
constants/           Firebase setup, shared values, and services
hooks/               Notifications, theme, and other shared hooks
assets/              Images, icons, and visual assets
admin/               Separate administrator web application
screens/             Additional screen code
scripts/             Project utility scripts
app.json             Expo configuration
firebase.json        Firebase Hosting and Functions configuration
```

## Getting Started

### Requirements

- Node.js 24.3 or later on the Node.js 24 release line, with npm.
- Expo Go compatible with SDK 58, or a compatible development build.
- Access to the configured Firebase, Google Maps, and Cloudinary services.

### 1. Clone and install

```bash
git clone https://github.com/ichiniran/sut-findback.git
cd sut-findback
npm install
```

### 2. Configure services

The current service configuration lives in source files; there is no environment-variable setup wired into the application yet. To use your own services, update:

| Service | Configuration locations |
| --- | --- |
| Firebase | `constants/firebase.ts`, `admin/src/firebase.ts` |
| Google Maps | `app/post-form.tsx` |
| Cloudinary cloud name and upload preset | `app/post-form.tsx`, `app/edit-profile.tsx`, `app/chat/ChatDetail.tsx`, `admin/src/pages/AdminChatInbox.tsx` |
| Admin support account | `constants/admin.ts`, `admin/src/constants/admin.ts` |
| Firebase deployment project | `.firebaserc` |

Enable email/password authentication in Firebase Authentication and provide a Firestore database with access rules appropriate to your project. The admin application checks for an `admins/{uid}` document for the signed-in account. Queries may also require Firestore indexes; follow any index-creation links returned by Firebase during development.

### 3. Run the mobile application

```bash
npx expo start --go --clear
```

Connect your phone and computer to the same Wi-Fi network, then scan the QR code. On a physical iPhone, Expo Go and Expo CLI must be signed in to the same Expo account:

```bash
npx expo login
npx expo whoami
```

If browser login does not complete, use `npx expo login --no-browser`. If the local network is inaccessible, start with `npx expo start --go --tunnel --clear` instead.

### 4. Run the administrator web application

The administrator app has its own dependencies. Install the root dependencies first, then run:

```bash
cd admin
npm install
npm run dev
```

Open the local URL printed by Vite. Use an account configured for administrator access.

### Windows PowerShell

If PowerShell blocks `npm.ps1` or `npx.ps1`, use `npm.cmd` and `npx.cmd` in place of `npm` and `npx` in the commands above.

## Web Build and Hosting

Run the Expo web application locally:

```bash
npm run web
```

Generate the static export:

```bash
npm run build:web
```

The output is written to `dist/`. Firebase Hosting is configured to serve this Expo export and automatically build it before deployment:

```bash
npx -y firebase-tools@latest deploy --only hosting
```

The checked-in default Firebase project is `sut-find-back`. Update `.firebaserc` when deploying to a different project. This command deploys the Expo web app; the administrator app has a separate Vite build. Use `--only hosting` because the repository also contains Functions configuration, while the referenced `functions/` source directory is absent.

## Checks and Current Limitations

```bash
npx tsc --noEmit
npx expo install --check
npx expo-doctor
```

- The root TypeScript configuration excludes the separate `admin/` project. Its build can be checked with `npm --prefix admin run build` after installing its dependencies.
- The existing phone verification flow uses the deprecated `expo-firebase-recaptcha` package. Expo Doctor reports this package and its nested older `expo-constants`; OTP needs migration and separate device validation.
- Browser notification support differs from native mobile behavior. Test notifications, camera access, maps, and location on the intended device.
- This is an academic team project. SDK 58 and deployment updates were made after the original March–May 2026 development period.
