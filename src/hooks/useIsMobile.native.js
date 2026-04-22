/**
 * On React Native we're always on a mobile device.
 * Metro auto-selects this over useIsMobile.js for iOS/Android builds.
 */
export const useIsMobile = () => true;
