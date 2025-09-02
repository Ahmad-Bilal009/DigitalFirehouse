# Digital Firehouse Notification System Setup

This document provides step-by-step instructions to set up the complete notification system for the Digital Firehouse app.

## Overview

The notification system automatically processes emails sent to `alert@digital-firehouse.com` and sends FCM notifications to the app with custom sounds based on alarm types.

## Features

- **Automatic Email Processing**: Emails to alert@digital-firehouse.com trigger FCM notifications
- **Smart Alarm Classification**: Automatically detects alarm types based on email content keywords
- **Custom Sound Mapping**: Different sounds for different alarm types
- **Real-time Notifications**: Instant delivery via Firebase Cloud Messaging (FCM)
- **Offline Storage**: Notifications are stored locally for offline access
- **Unread Count Badge**: Visual indicator of unread notifications
- **Test Notifications**: Built-in testing for different alarm types

## Alarm Types & Keywords

| Keyword | Title | Type | Sound File |
|---------|-------|------|------------|
| general | Fire | 0 | 1.mp3 |
| hazard | Hazardous Condition | 1 | 2.mp3 |
| investigation | General Investigation | 2 | 3.mp3 |
| ems | Medical Emergency | 3 | 4.mp3 |
| mva | Motor Vehicle Accident | 4 | 5.mp3 |
| structure | Structure Fire | 5 | 6.mp3 |
| vehicle | Vehicle Fire | 6 | 7.mp3 |
| outside | Outside Fire | 7 | 8.mp3 |
| co | Carbon Monoxide Alarm | 8 | 9.mp3 |
| alarm | Alarm Activation | 9 | 10.mp3 |
| assist | Lift Assist | 10 | 1.mp3 |

**Note**: If no keywords are found, the system defaults to "general" type (0).

## Prerequisites

1. **Firebase Project**: Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. **FCM Setup**: Enable Firebase Cloud Messaging in your project
3. **Sound Files**: Ensure MP3 files (1.mp3 through 10.mp3) are in the correct locations

## Installation Steps

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

The following packages will be installed:
- `@react-native-firebase/app`: Firebase core
- `@react-native-firebase/messaging`: Firebase Cloud Messaging
- `react-native-push-notification`: Local notification display
- `@react-native-community/push-notification-ios`: iOS-specific notifications
- `react-native-sound`: Custom sound playback
- `@react-native-async-storage/async-storage`: Local storage for notifications

### 2. Firebase Configuration

#### Android Setup

1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/`
3. Update `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

4. Update `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
}
```

#### iOS Setup

1. Download `GoogleService-Info.plist` from Firebase Console
2. Add it to your iOS project via Xcode
3. Update `ios/Podfile`:

```ruby
target 'DigitalFirehouse' do
  pod 'Firebase/Messaging'
end
```

4. Run `cd ios && pod install`

### 3. Configure Firebase Config

Update your Firebase configuration in the respective platform files:

- **Android**: `google-services.json` (downloaded from Firebase Console)
- **iOS**: `GoogleService-Info.plist` (downloaded from Firebase Console)

### 4. Sound Files Setup

Ensure your MP3 files are in the correct locations:

- **Android**: `android/app/src/main/res/raw/` (1.mp3, 2.mp3, ..., 10.mp3)
- **iOS**: Add to Xcode project bundle resources

### 5. Permissions Setup

The app automatically requests necessary permissions:
- Camera
- Storage (Android)
- Photo Library (iOS)
- Notifications (handled automatically)

## Backend Integration

### Email Processing

Your backend should:

1. Monitor emails sent to `alert@digital-firehouse.com`
2. Parse email content for keywords
3. Send FCM notification with appropriate payload

### FCM Payload Structure

```json
{
  "notification": {
    "title": "Alarm",
    "body": "Your email content here"
  },
  "data": {
    "alarmType": "0",
    "timestamp": "1234567890"
  },
  "to": "FCM_TOKEN_FROM_APP"
}
```

## How It Works

1. **Email Reception**: Backend receives email to `alert@digital-firehouse.com`
2. **Keyword Analysis**: Backend analyzes email content for alarm keywords
3. **FCM Send**: Backend sends FCM notification to the app
4. **App Processing**: App receives FCM, determines alarm type, plays sound
5. **Local Display**: App shows local notification and stores in local storage

## Usage

### In-App Notifications

1. **Notification Badge**: Tap the bell icon (🔔) in the top-right corner
2. **View Notifications**: See all notifications with unread indicators
3. **Mark as Read**: Tap any notification to mark it as read
4. **Stop Sound**: Use "Stop Sound" button to silence current alarm
5. **Clear All**: Remove all notifications with confirmation
6. **Test Notifications**: Use test buttons to verify different alarm types

### Testing Notifications

The app includes built-in test functionality:

1. **Test Hazard**: Triggers notification with "hazard" keyword
2. **Test EMS**: Triggers notification with "ems" keyword  
3. **Test Structure**: Triggers notification with "structure" keyword

### Notification States

- **Unread**: Red left border, bold text, unread indicator
- **Read**: Normal styling, no indicators

## Troubleshooting

### Common Issues

1. **Notifications not working**
   - Check Firebase configuration
   - Verify FCM token generation
   - Ensure notification permissions are granted

2. **Sounds not playing**
   - Verify sound files are in correct locations
   - Check device volume settings
   - Ensure sound files are valid MP3 format

3. **Permission errors**
   - Manually grant permissions in device settings
   - Restart the app after granting permissions

### Debug Information

Enable debug logging by checking console output for:
- FCM token generation
- Notification permission status
- Notification processing
- Sound playback status
- Test notification triggers

## Testing

### Test Notifications

1. Use the built-in test buttons in the notification list
2. Test different keywords: hazard, ems, structure
3. Verify notification appears in app
4. Check correct sound plays
5. Verify alarm type classification

### Test Sound Files

1. Trigger different alarm types using test buttons
2. Verify correct sound files play
3. Test sound stopping functionality
4. Check volume controls work

## Security Considerations

1. **FCM Tokens**: Store securely, rotate regularly
2. **Email Validation**: Implement proper email validation on backend
3. **Rate Limiting**: Prevent notification spam
4. **User Authentication**: Ensure notifications only go to authorized users

## Support

For technical support or questions about the notification system, please contact the development team or refer to the Firebase documentation.

## Changelog

- **v1.0.0**: Initial implementation with basic notification functionality
- **v1.1.0**: Added custom sound mapping and alarm type classification
- **v1.2.0**: Implemented offline storage and unread count management
- **v2.0.0**: Migrated to React Native Push Notification for better stability
- **v2.1.0**: Added Firebase integration for FCM notifications from backend
