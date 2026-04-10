import { useAuth } from '../context/AuthContext';
import '../App.css';

interface TopBarProps {
  titulo: string;
  icono?: string;
  color?: string;
  onVolver: () => void;
  onAvatarClick?: () => void;
}

export const TopBar = ({ titulo, icono, color = '#66fcf1', onVolver, onAvatarClick }: TopBarProps) => {
  const { user } = useAuth();

  return (
    <div className="topbar-container" style={{ borderBottom: `1px solid ${color}30` }}>
      {/* Botón Volver */}
      <button className="topbar-btn-back" onClick={onVolver} aria-label="Volver">
        <span style={{ fontSize: '1.2rem' }}>‹</span>
      </button>

      {/* Título central */}
      <div className="topbar-titulo">
        {icono && <span className="topbar-icono">{icono}</span>}
        <span 
          className="topbar-titulo-text"
          style={{
            background: `linear-gradient(90deg, ${color}, #ffffff)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {titulo}
        </span>
      </div>

      {/* Avatar del usuario */}
      <button 
        className="topbar-avatar" 
        onClick={onAvatarClick}
        aria-label="Perfil"
      >
        {user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Perfil" 
            className="topbar-avatar-img"
          />
        ) : (
          <span className="topbar-avatar-emoji">{user?.avatar || '👤'}</span>
        )}
      </button>
    </div>
  );
};

export default TopBar;
