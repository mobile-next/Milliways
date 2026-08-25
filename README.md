# Milliways Demo App

  <img src="./docs/screenshot.png" alt width="300" align="right" style="margin-left: 3em; margin-bottom: 3em; border: 2px solid #444; border-radius: 12px; padding: 4px;" />

An iOS (Swift) and Android (Jetpack Compose) application inspired by The Restaurant at the End of the Universe. Designed as a testing ground for mobile automation tools and frameworks from [Mobile Next](https://mobilenext.ai).

## Purpose

This project serves as a testing environment for:
- [Mobile MCP](https://github.com/mobile-next/mobile-mcp)
- [Mobile Next Cloud](https://mobilenext.ai/cloud)
- [Mobilewright](https://github.com/mobile-next/mobilewright)

The app features a food ordering flow with a space-themed menu, shopping cart, delivery tracking, and user account — providing various UI elements and scenarios for testing mobile automation capabilities.

You can [view Mobilewright test report](https://mobilewright-samples.s3.amazonaws.com/milliways/runs/c6d69830dc9cb4e9e1e0d4ce06013d63c1e6c2a5/index.html) of the last build.

## Known Issues

This application contains intentionally placed bugs for testing purposes.

## Getting Started

### iOS

1. Clone the repository
2. Open `ios/Milliways.xcodeproj` in Xcode
3. Build and run on iOS Simulator or real device

### Android

1. Clone the repository
2. Open `android/` in Android Studio
3. Build and run on emulator or real device

## Building with Make

```bash
make all       # Build everything: simulator zip, IPA, and APK
make zip       # Build iOS app for simulator (zip)
make ipa       # Build unsigned IPA
make apk       # Build signed release APK (Milliways.apk)
make clean     # Clean build artifacts
```

## Community

Join our [Slack](https://mobilenext.ai/join-slack), let's talk.
