import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { SubscriptionProvider, useSubscription } from "./context/SubscriptionContext";

import { Capacitor } from "@capacitor/core";
import { AppTrackingTransparency } from "capacitor-plugin-app-tracking-transparency";
import { AdMob, BannerAdSize, BannerAdPosition } from "@capacitor-community/admob";

// BD / API
import { api } from "./lib/api";
import { Drink } from "./lib/drinks-data";

// PANTALLAS PRINCIPALES
import { Welcome } from "./screens/Welcome";
import { Home } from "./screens/Home";
import { MenuOffline } from "./screens/MenuOffline";
import { MenuOnline } from "./screens/MenuOnline";
import { Store } from "./screens/Store";

// JUEGOS OFFLINE
import { LaJefa } from "./screens/LaJefa";
import { Peaje } from "./screens/Peaje";
import { JuegoSimple } from "./screens/JuegoSimple";
import { Impostor } from "./screens/Impostor";

// JUEGOS ONLINE
import { LaJefaOnline } from "./screens/LaJefaOnline";
import { PiramideOnline } from "./screens/PiramideOnline";
import { VotacionOnline } from "./screens/VotacionOnline";
import { ImpostorOnline } from "./screens/ImpostorOnline";

// TRAGOS
import Bebidas from "./screens/Bebidas";

const AppController = () => {
  const { user } = useAuth();
  const { sinAnuncios } = useSubscription();

  const [vista, setVista] = useState("home");

  // 👉 TRAGOS DESDE LA BD
  const [drinks, setDrinks] = useState<Drink[]>([]);

  
  // 👉 PARTIDA ONLINE
  const [datosOnline, setDatosOnline] = useState<{
    codigo: string;
    soyHost: boolean;
    nombre: string;
    juego: string;
  } | null>(null);

  // -------------------- PUBLICIDAD --------------------
  useEffect(() => {
    const iniciarPublicidad = async () => {
      try {
        if (sinAnuncios) {
          await AdMob.hideBanner().catch(() => {});
          return;
        }

        if (Capacitor.getPlatform() === "ios") {
          await AppTrackingTransparency.requestPermission();
        }

        await AdMob.initialize({ initializeForTesting: true });

        await AdMob.showBanner({
          adId: "ca-app-pub-3940256099942544/6300978111",
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: true,
        });
      } catch (e) {
        console.error("Error publicidad:", e);
      }
    };

    if (user) iniciarPublicidad();
  }, [user, sinAnuncios]);

  // -------------------- CARGA DE TRAGOS (BD) --------------------
  useEffect(() => {
    const cargarTragos = async () => {
      try {
        const data = await api.obtenerTragos(); // 👈 AJUSTAR si se llama distinto
        setDrinks(data);
      } catch (e) {
        console.error("❌ Error cargando tragos:", e);
        setDrinks([]);
      }
    };

    if (user) {
      cargarTragos();
    }
  }, [user]);

  // -------------------- ONLINE --------------------
  const handleJuegoOnlineIniciado = (
    juego: string,
    codigo: string,
    soyHost: boolean,
    nombre: string
  ) => {
    setDatosOnline({ codigo, soyHost, nombre, juego });

    switch (juego) {
      case "impostor":
        setVista("impostor-online");
        break;
      case "votacion":
      case "rico_pobre":
      case "probable":
        setVista("votacion-online");
        break;
      case "piramide":
        setVista("piramide-online");
        break;
      case "la-jefa":
        setVista("lajefa-online");
        break;
      default:
        console.warn("Juego desconocido:", juego);
    }
  };

  const salirOnline = () => {
    setDatosOnline(null);
    setVista("home");
  };

  // -------------------- RUTEO --------------------
  if (!user) return <Welcome />;

  switch (vista) {
    case "home":
      return <Home irA={setVista} />;

    case "store":
      return <Store volver={() => setVista("home")} />;

    case "menu-offline":
      return <MenuOffline irA={setVista} volver={() => setVista("home")} />;

    // OFFLINE
    case "lajefa":
      return <LaJefa volver={() => setVista("menu-offline")} />;
    case "peaje":
      return <Peaje volver={() => setVista("menu-offline")} />;
    case "juego-simple":
      return <JuegoSimple juego="yo-nunca" volver={() => setVista("menu-offline")} />;
    case "preguntas":
      return <JuegoSimple juego="preguntas" volver={() => setVista("menu-offline")} />;
    case "rico-pobre":
    case "mas-probable":
      return <JuegoSimple juego="votacion" volver={() => setVista("menu-offline")} />;
    case "impostor":
      return <Impostor volver={() => setVista("menu-offline")} />;

    // ONLINE
    case "menu-online":
      return (
        <MenuOnline
          volver={() => setVista("home")}
          onJuegoIniciado={handleJuegoOnlineIniciado}
        />
      );

    case "impostor-online":
      return datosOnline ? (
        <ImpostorOnline datos={datosOnline} salir={salirOnline} />
      ) : (
        <Home irA={setVista} />
      );

    case "votacion-online":
      return datosOnline ? (
        <VotacionOnline datos={datosOnline} salir={salirOnline} />
      ) : (
        <Home irA={setVista} />
      );

    case "piramide-online":
      return datosOnline ? (
        <PiramideOnline datos={datosOnline} salir={salirOnline} />
      ) : (
        <Home irA={setVista} />
      );

    case "lajefa-online":
      return datosOnline ? (
        <LaJefaOnline datos={datosOnline} salir={salirOnline} />
      ) : (
        <Home irA={setVista} />
      );

    // 🍹 BEBIDAS
    case "bebidas": 
  return <Bebidas volver={() => setVista("home")} />;

    default:
      return <Home irA={setVista} />;
  }
};

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <AppController />
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
