import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiBars3,
} from "react-icons/hi2";

export default function AuthenticatedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    {
      label: "Acompanhar obra",
      icon: <HiOutlineHome size={20} />,
      path: "/dashboard",
    },
    {
      label: "Minhas obras",
      icon: <HiOutlineUser size={20} />,
      path: "/tabeladex", // ou ajuste para a página de perfil real
    },
    {
      label: "Meu calendário ",
      icon: <HiOutlineUser size={20} />,
      path: "/calendariodex", // ou ajuste para a página de perfil real
    },
    //{
    //  label: "Configurações",
    //  icon: <HiOutlineCog6Tooth size={20} />,
    //  path: "/settings", // ajuste conforme seu app
    //},
  ];

  return (
    <div className="bg-[#0f0f0f] text-white">
      <aside
         className={`fixed left-0 top-0 h-full bg-[#1e1e1e] p-4 border-r border-[#A855F7] flex flex-col transition-all duration-300 ${
    sidebarOpen ? "w-64" : "w-16 items-center"
        }`}
      >
        {/* Botão icone simples */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mb-6 p-2 rounded hover:bg-[#2e2e2e] hover:text-[#A855F7] transition"
          aria-label="Toggle Sidebar"
        >
          <HiBars3
            size={24}
            className={`transition-transform duration-300  ${
              sidebarOpen ? "rotate-90" : ""
            }`}
          />
        </button>

        <nav className="flex-1">
          <ul className="space-y-2">
            {menuItems.map(({ label, icon, path }) => (
              <li key={path}>
                <Link
                  to={path}
                  className={`flex items-center gap-2 p-2 rounded transition hover:bg-[#2e2e2e] hover:text-[#A855F7] ${
                    location.pathname === path ? "bg-[#2e2e2e] text-[#A855F7]" : ""
                  }`}
                >
                  {icon}
                  {sidebarOpen && <span>{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main
  className={`p-6 bg-[#121212] text-white transition-all duration-300 ${
    sidebarOpen ? "ml-64" : "ml-16"
  }`}
>
  <Outlet />
</main>
    </div>
  );
}
