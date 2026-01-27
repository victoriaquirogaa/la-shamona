import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.victoria.elviajero',
  appName: 'El Viajero',
  webDir: 'dist', // O 'build' dependiendo de tu proyecto
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '930301862044-855blh0lde4i34m4vti3eubh80233n8d.apps.googleusercontent.com', // <--- BUSCAR ESTO
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;