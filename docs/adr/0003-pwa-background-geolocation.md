# PWA with background geolocation for geofence detection

The app is built and distributed as a Progressive Web App (PWA) to enable background geolocation via the Web Background Synchronization API and persistent geolocation watching. This allows geofence detection to continue when the MSR switches to a navigation app, without requiring a separate native build.

Known constraint: iOS Safari imposes strict limits on background execution — background geolocation on iOS may require the MSR to have the PWA installed to the home screen and the screen unlocked. This must be documented as a usage requirement. A companion native app remains the long-term solution if iOS background reliability proves insufficient in production.
