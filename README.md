# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Deploy the Expo web app to Firebase Hosting

This project uses Expo SDK 58. To open it in Expo Go on a phone, stop any
previous Metro server and run:

```bash
npx expo start --go --clear
```

Connect the phone and computer to the same Wi-Fi network, then scan the QR
code (use Camera on iPhone). If the local network is inaccessible, try
`npx expo start --go --tunnel --clear`.

The existing phone OTP flow still uses the deprecated
`expo-firebase-recaptcha` package. Expo Doctor reports this package and its
nested older `expo-constants`; phone OTP needs separate device validation.

Firebase Hosting serves the Expo static export in `dist`, not the `admin` app.

Build locally with:

```bash
npm run build:web
```

Deploy to the `sut-find-back` project with:

```bash
npx -y firebase-tools@latest deploy --only hosting
```

Hosting automatically runs the web build before uploading. Use `--only hosting`
to avoid deploying the separate Functions configuration. On Windows PowerShell,
use `npm.cmd` and `npx.cmd` if script execution policy blocks `npm` or `npx`.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
