import { AdMob, AdOptions, RewardAdOptions, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core'; // 👈 Necesitamos esto para detectar si es PC o Celu

const AD_IDS = {
    INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712', 
    REWARDED:     'ca-app-pub-3940256099942544/5224354917' 
};

export const AdService = {

    // 1️⃣ INTERSTITIAL (Pantalla completa)
    mostrarIntersticial: async () => {
        // 💻 MODO COMPU (WEB)
        if (Capacitor.getPlatform() === 'web') {
            console.log("💻 [WEB] Simulando Anuncio Intersticial...");
            alert("💻 [MODO WEB]\nAcá saldría un anuncio de Pantalla Completa.\n(Imaginate que lo cerraste).");
            return true;
        }

        // 📱 MODO CELULAR (REAL)
        try {
            await AdMob.prepareInterstitial({ 
                adId: AD_IDS.INTERSTITIAL, 
                isTesting: true 
            });
            await AdMob.showInterstitial();
            return true;
        } catch (e) {
            console.error('Fallo el anuncio:', e);
            return false;
        }
    },

    // 2️⃣ REWARDED (Video con Premio)
    mirarVideoRecompensa: async (onExito: () => void, onError?: () => void) => {
        
        // 💻 MODO COMPU (WEB)
        if (Capacitor.getPlatform() === 'web') {
            console.log("💻 [WEB] Simulando Video Rewarded...");
            // Usamos un 'confirm' para simular si el usuario ve o cierra el video
            const vioElVideo = window.confirm("💻 [MODO WEB]\nSimulacro de Video Publicitario.\n\n¿Querés ver el video para ganar el premio?");
            
            if (vioElVideo) {
                console.log("🎁 [WEB] Premio otorgado.");
                onExito(); // Ejecutamos la función de éxito
            } else {
                console.log("❌ [WEB] Usuario canceló.");
                if (onError) onError();
            }
            return;
        }

        // 📱 MODO CELULAR (REAL)
        let listener: any = null;
        try {
            listener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
                console.log("🎁 ¡Premio ganado!", reward);
                onExito();
            });

            const options: RewardAdOptions = { adId: AD_IDS.REWARDED, isTesting: true };
            await AdMob.prepareRewardVideoAd(options);
            await AdMob.showRewardVideoAd();

        } catch (e) {
            console.error("Error AdMob:", e);
            if (listener) listener.remove();
            
            // Si falla en el celu (por internet o lo que sea), le damos el premio igual (fallback)
            // O llamamos a onError si preferís ser estricta.
            if (onError) onError(); 
            else {
                alert("El anuncio falló, pero te regalo el premio igual 😉");
                onExito();
            }
        }
    }
};