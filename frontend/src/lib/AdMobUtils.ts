import { AdMob, AdOptions, RewardAdOptions } from '@capacitor-community/admob';

// ---------------------------------------------------------
// 🚨 CONFIGURACIÓN DE IDs 🚨
// ---------------------------------------------------------
const TEST_IDS = {
    interstitial: 'ca-app-pub-3940256099942544/1033173712', 
    rewarded:     'ca-app-pub-3940256099942544/5224354917'     
};

// Pega aquí tus IDs reales de AdMob
const REAL_IDS = {
    interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', 
    rewarded:     'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX'     
};

// 👇 MANTENER EN FALSE PARA PRUEBAS
const IS_PRODUCTION = false; 

const AD_UNITS = IS_PRODUCTION ? REAL_IDS : TEST_IDS;

export const AdService = {
    
    inicializar: async () => {
        try {
            // 1. 👇 ESTO CAMBIÓ: Ahora se pide permiso ANTES de inicializar
            // (Esto es vital para iOS, en Android no hace daño)
            await AdMob.requestTrackingAuthorization();

            // 2. Inicializamos
            await AdMob.initialize({
                initializeForTesting: !IS_PRODUCTION, 
                // Ya no va 'requestTrackingAuthorization' aquí adentro
            });
            
            console.log('AdMob Inicializado correctamente');
        } catch (e) {
            console.error('Error inicializando AdMob:', e);
        }
    },

    mostrarIntersticial: async () => {
        try {
            const options: AdOptions = { adId: AD_UNITS.interstitial };
            await AdMob.prepareInterstitial(options);
            await AdMob.showInterstitial();
        } catch (e) {
            console.error('Fallo al mostrar intersticial:', e);
        }
    },

    mirarVideoRecompensa: async (onExito: () => void, onFallo: () => void) => {
        try {
            const options: RewardAdOptions = { adId: AD_UNITS.rewarded };
            await AdMob.prepareRewardVideoAd(options);
            const rewardItem = await AdMob.showRewardVideoAd();
            
            // Si llegamos acá, el usuario vio el video
            console.log('Recompensa ganada:', rewardItem);
            onExito();
        } catch (e) {
            console.error('Fallo al mostrar video:', e);
            // Damos la recompensa igual para no frustrar al usuario si falla la red
            onExito(); 
        }
    }
};
"id intersticial: ca-app-pub-6568186454693181/1873555414 "
"id rewarded: ca-app-pub-6568186454693181/8871510976 "