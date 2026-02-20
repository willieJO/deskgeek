import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  HiBars3,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineBookOpen,
  HiOutlineCalendarDays,
  HiOutlineChevronDoubleLeft,
  HiOutlineHomeModern,
} from "react-icons/hi2";
import api from "../utils/api";

const menuItems = [
  {
    label: "Acompanhar mídia",
    icon: <HiOutlineHomeModern size={20} />,
    path: "/dashboard",
  },
  {
    label: "Minhas obras",
    icon: <HiOutlineBookOpen size={20} />,
    path: "/tabeladex",
  },
  {
    label: "Calendário",
    icon: <HiOutlineCalendarDays size={20} />,
    path: "/calendariodex",
  },
];

export default function AuthenticatedLayout({ onLogout }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage =
    menuItems.find((item) => location.pathname.startsWith(item.path))?.label ||
    "Painel";

  async function handleLogout() {
    try {
      await api.post("/usuario/logout");
    } catch {
      // Mesmo com erro no backend, seguimos limpando sessão local.
    } finally {
      localStorage.removeItem("token");
      setMobileOpen(false);
      onLogout?.();
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="app-shell text-slate-100">
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm transition lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-600/35 bg-[rgba(9,18,34,0.95)] px-3 py-5 shadow-2xl backdrop-blur transition-all duration-300 ${
          sidebarExpanded ? "lg:w-72" : "lg:w-24"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div
          className={`mb-8 flex items-center ${
            sidebarExpanded ? "justify-between px-2" : "justify-center"
          }`}
        >
          {sidebarExpanded ? (
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-200/85">
                MediaDex
              </p>
              <h1 className="text-xl font-extrabold text-slate-50">Painel</h1>
            </div>
          ) : (
            <p className="text-xl font-extrabold text-cyan-200">M</p>
          )}

          <button
            onClick={() => setSidebarExpanded((value) => !value)}
            className="hidden rounded-xl border border-slate-500/40 bg-slate-900/75 p-2 text-slate-300 transition hover:text-cyan-200 lg:block"
            aria-label="Expandir menu"
          >
            <HiOutlineChevronDoubleLeft
              size={20}
              className={`transition-transform ${
                sidebarExpanded ? "" : "rotate-180"
              }`}
            />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map(({ label, icon, path }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-cyan-300/45 bg-cyan-300/15 text-cyan-100"
                    : "border-transparent text-slate-300 hover:border-slate-500/45 hover:bg-slate-700/30 hover:text-slate-50"
                } ${sidebarExpanded ? "gap-3" : "justify-center"}`}
              >
                {icon}
                {sidebarExpanded && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className={`mt-4 flex items-center rounded-xl border border-rose-300/35 bg-rose-300/10 px-3 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/20 ${
            sidebarExpanded ? "gap-3" : "justify-center"
          }`}
          type="button"
        >
          <HiOutlineArrowLeftOnRectangle size={20} />
          {sidebarExpanded && <span>Sair</span>}
        </button>
      </aside>

      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarExpanded ? "lg:ml-72" : "lg:ml-24"
        }`}
      >
        <header className="sticky top-0 z-20 border-b border-slate-700/35 bg-[rgba(8,14,27,0.8)] px-4 py-3 backdrop-blur-lg sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileOpen((value) => !value)}
                className="rounded-xl border border-slate-500/40 bg-slate-900/80 p-2 text-slate-300 hover:text-cyan-200 lg:hidden"
                aria-label="Abrir menu"
              >
                <HiBars3 size={20} />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Navegação
                </p>
                <p className="text-sm font-semibold text-slate-100 sm:text-base">
                  {currentPage}
                </p>
              </div>
            </div>

            <div className="hidden rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100 sm:block">
              Organize, acompanhe e finalize.
            </div>
          </div>
        </header>

        <section className="px-4 py-5 sm:px-6 sm:py-7">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
