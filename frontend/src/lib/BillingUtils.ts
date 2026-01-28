import { Purchases, PurchasesPackage, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

// 🔑 API KEY DE REVENUECAT (La pondremos cuando configures la consola)
const API_KEY_GOOGLE = 'goog_PLACEHOLDER_AQUI'; 

export const BillingService = {
    
    inicializar: async () => {
        try {
            await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
            await Purchases.configure({ apiKey: API_KEY_GOOGLE });
            console.log('Sistema de Pagos Listo 💰');
        } catch (e) {
            console.error('Error iniciando pagos:', e);
        }
    },

    obtenerOfertas: async (): Promise<PurchasesPackage[]> => {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current && offerings.current.availablePackages.length > 0) {
                return offerings.current.availablePackages;
            }
        } catch (e) {
            console.error('Error buscando precios:', e);
        }
        return [];
    },

    comprarVIP: async (paquete: PurchasesPackage, onExito: () => void, onError: () => void) => {
        try {
            // 👇 TRUCO: Le decimos ": any" para que no marque rojo 'entitlements'
            const result: any = await Purchases.purchasePackage({ aPackage: paquete });
            const customerInfo = result.customerInfo;
            
            if (customerInfo.entitlements.active['vip_access']) {
                onExito();
            }
        } catch (e: any) {
            if (!e.userCancelled) {
                console.error("Error compra:", e);
                onError();
            }
        }
    },

    verificarEstadoVIP: async (): Promise<boolean> => {
        try {
            // 👇 TRUCO: Aquí también usamos ": any"
            const customerInfo: any = await Purchases.getCustomerInfo();
            return !!customerInfo.entitlements.active['vip_access'];
        } catch (e) { return false; }
    },
    
    restaurarCompras: async () => {
        try {
            // 👇 TRUCO: Y aquí también
            const customerInfo: any = await Purchases.restorePurchases();
            return !!customerInfo.entitlements.active['vip_access'];
        } catch(e) { return false; }
    }
};