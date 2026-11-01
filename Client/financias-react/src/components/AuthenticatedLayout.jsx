import { useState } from "react";
import { Drawer } from "@mui/material";
import {
  Outlet,
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Library,
  LogOut,
  Menu,
  Plus,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import ButtonSpinner from "./ButtonSpinner";
import Brand from "./Brand";
import api from "../utils/api";

const menuItems = [
  { label: "Minhas obras", icon: Library, path: "/tabeladex" },
  { label: "Calendário", icon: CalendarDays, path: "/calendariodex" },
  { label: "Configurações", icon: Settings2, path: "/configuracoes" },
];

function UserAvatar({ currentUser }) {
  const [failedPhoto, setFailedPhoto] = useState(null);
  const initials = (currentUser?.usuario || currentUser?.email || "U")
    .trim()
    .slice(0, 1)
    .toUpperCase();
  const photo =
    currentUser?.fotoPerfilDisponivel && currentUser?.fotoCacheKey
      ? `${api.getUri({ url: "/usuario/me/foto" })}?v=${currentUser.fotoCacheKey}`
      : null;
  return photo && failedPhoto !== photo ? (
    <img
      src={photo}
      alt=""
      className="user-avatar"
      onError={() => setFailedPhoto(photo)}
    />
  ) : (
    <span className="user-avatar">{initials}</span>
  );
}

export default function AuthenticatedLayout({ onLogout, currentUser }) {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage =
    menuItems.find((item) => location.pathname === item.path)?.label ||
    "Adicionar obra";

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.post("/usuario/logout");
    } catch {
      /* Clear local session even if the server is unavailable. */
    } finally {
      localStorage.removeItem("token");
      setMobileOpen(false);
      onLogout?.();
      navigate("/login", { replace: true });
    }
  }

  function sidebar(mobile = false) {
    const showLabels = mobile || expanded;
    return (
      <div className={`sidebar-content ${showLabels ? "" : "compact"}`}>
        <div className="sidebar-brand">
          <Link
            to="/tabeladex"
            aria-label="MediaDex, minhas obras"
            onClick={() => setMobileOpen(false)}
          >
            <Brand compact={!showLabels} />
          </Link>
          {mobile && (
            <button
              className="ui-icon-button"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </button>
          )}
        </div>
        {showLabels && <p className="nav-caption">Seu espaço</p>}
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {menuItems.map((item) => {
            const { label, path } = item;
            const Icon = item.icon;
            return (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                aria-label={label}
                title={!showLabels ? label : undefined}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon size={20} />
                {showLabels && <span>{label}</span>}
                {showLabels && (
                  <ChevronRight size={14} className="nav-chevron" />
                )}
              </NavLink>
            );
          })}
        </nav>
        <Link
          to="/dashboard"
          className="ui-button sidebar-add"
          onClick={() => setMobileOpen(false)}
          aria-label="Adicionar obra"
          title={!showLabels ? "Adicionar obra" : undefined}
        >
          <Plus size={20} />
          {showLabels && "Adicionar obra"}
        </Link>
        {showLabels && (
          <div className="sidebar-note">
            <span>
              <Sparkles size={19} />
            </span>
            <p>
              Seu próximo capítulo<strong>começa por aqui.</strong>
            </p>
            <small>
              Organize suas histórias favoritas e aproveite cada uma no seu
              ritmo.
            </small>
          </div>
        )}
        <div className="sidebar-bottom">
          <Link
            to="/configuracoes"
            className="sidebar-profile"
            aria-label="Meu perfil"
            onClick={() => setMobileOpen(false)}
          >
            <UserAvatar currentUser={currentUser} />
            {showLabels && (
              <span>
                <strong>{currentUser?.usuario || "Meu perfil"}</strong>
                <small>{currentUser?.email}</small>
              </span>
            )}
          </Link>
          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Sair da conta"
          >
            {loggingOut ? <ButtonSpinner /> : <LogOut size={18} />}
            {showLabels && (
              <span>{loggingOut ? "Saindo..." : "Sair da conta"}</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${expanded ? "" : "sidebar-collapsed"}`}>
      <a className="skip-link" href="#page-content">
        Ir para conteúdo
      </a>
      <aside className="desktop-sidebar">
        {sidebar()}
        <button
          className="sidebar-collapse ui-icon-button"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? "Recolher menu" : "Expandir menu"}
          aria-expanded={expanded}
        >
          {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </aside>
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{
          paper: {
            className: "mobile-sidebar",
            sx: { width: 280, maxWidth: "90vw" },
          },
        }}
      >
        {sidebar(true)}
      </Drawer>
      <div className="app-main">
        <header className="app-header">
          <div className="header-breadcrumb">
            <button
              className="mobile-menu-button ui-icon-button"
              aria-label="Abrir menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span className="header-brand-label">Meu espaço</span>
            <ChevronRight size={14} />
            <strong>{currentPage}</strong>
          </div>
          <div className="header-profile">
            <span>{currentUser?.usuario || "Seu universo de histórias"}</span>
            <Link to="/configuracoes" aria-label="Abrir meu perfil">
              <UserAvatar currentUser={currentUser} />
            </Link>
          </div>
        </header>
        <main id="page-content" className="page-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>MediaDex</span> Uma história de cada vez.
        </footer>
      </div>
    </div>
  );
}
