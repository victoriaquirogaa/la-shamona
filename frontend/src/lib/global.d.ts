declare module 'capacitor-plugin-app-tracking-transparency' {
  export const AppTrackingTransparency: {
    requestPermission: () => Promise<{ status: string }>;
  };
  export default AppTrackingTransparency;
}

// Allow importing image assets without types complaints
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
