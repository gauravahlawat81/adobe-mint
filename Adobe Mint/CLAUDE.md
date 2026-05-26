# Adobe Mint — Claude Instructions

## Testing on Device

**Always build APK and install directly on the physical Android device.**
Never use Expo Go for testing. When the user asks to run/test the app:

1. Build the release APK:
```bash
cd "/Users/gaahlawat/Desktop/Adobe Mint/Adobe Mint/android" && \
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
./gradlew assembleRelease
```

2. Copy to Desktop:
```bash
cp "android/app/build/outputs/apk/release/app-release.apk" ~/Desktop/AdobeMint.apk
```

3. Install and launch on device:
```bash
~/Library/Android/sdk/platform-tools/adb install -r ~/Desktop/AdobeMint.apk
~/Library/Android/sdk/platform-tools/adb shell am start -n com.adobe.mint/.MainActivity
```

Device serial: `62181VDCR000KT`

## Why not Expo Go
Custom URI scheme `com.adobe.mint://` is not handled by Expo Go — Google Sign-In breaks. The APK has the scheme registered and works end-to-end.
