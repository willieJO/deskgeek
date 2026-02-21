import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { useSearchParams } from "react-router-dom";
import api from "../utils/api";
import "./calendario.css";

const baseURL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_PRODUCAO
    : import.meta.env.VITE_LOCALHOST;

const diaSemanaMap = {
  domingo: 0,
  "segunda-feira": 1,
  "terca-feira": 2,
  "terça-feira": 2,
  "quarta-feira": 3,
  "quinta-feira": 4,
  "sexta-feira": 5,
  sabado: 6,
  "sábado": 6,
};

const diasPorIndice = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const hoverPreviewWidth = 330;
const hoverPreviewHeight = 210;
const hoverPreviewPadding = 12;
const hoverPreviewOffset = 18;
const minimoBuscaUsuario = 2;

function getHoverPreviewPosition(clientX, clientY) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = clientX + hoverPreviewOffset;
  let top = clientY - 24;

  if (left + hoverPreviewWidth > viewportWidth - hoverPreviewPadding) {
    left = clientX - hoverPreviewWidth - hoverPreviewOffset;
  }
  if (left < hoverPreviewPadding) {
    left = hoverPreviewPadding;
  }

  if (top + hoverPreviewHeight > viewportHeight - hoverPreviewPadding) {
    top = viewportHeight - hoverPreviewHeight - hoverPreviewPadding;
  }
  if (top < hoverPreviewPadding) {
    top = hoverPreviewPadding;
  }

  return { left, top };
}

export default function CalendarioDex() {
  const [searchParams, setSearchParams] = useSearchParams();
  const usuarioSelecionado = (searchParams.get("usuario") ?? "").trim();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverPreview, setHoverPreview] = useState(null);
  const [filtroUsuario, setFiltroUsuario] = useState(usuarioSelecionado);
  const [mensagemFiltro, setMensagemFiltro] = useState("");
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const cacheBuscaUsuarios = useRef(new Map());

  useEffect(() => {
    setFiltroUsuario(usuarioSelecionado);
  }, [usuarioSelecionado]);

  useEffect(() => {
    async function fetchEventos() {
      setLoading(true);
      try {
        const response = usuarioSelecionado
          ? await api.get("/MediaDex/obterMediaPorUsuarioPorStatusEmAndamentoPorUsuario", {
              params: { usuario: usuarioSelecionado },
              withCredentials: true,
            })
          : await api.get("/MediaDex/obterMediaPorUsuarioPorStatusEmAndamento", {
              withCredentials: true,
            });

        const lista = Array.isArray(response.data) ? response.data : [];
        const data = lista.filter(
          (item) => item.status === "Em andamento" && item.diaNovoCapitulo != null
        );

        const eventosFullCalendar = data.map((item) => {
          const dayIndex = diaSemanaMap[item.diaNovoCapitulo?.toLowerCase()] ?? 4;

          let urlImagem = "https://placehold.co/50x70?text=No+Image&font=roboto";
          if (item.imagemDirectory) {
            urlImagem = `${baseURL}/MediaDex/imagem/${item.imagemDirectory}`;
          } else if (item.imagemUrl) {
            urlImagem = item.imagemUrl;
          }

          return {
            id: item.id,
            title: item.nome,
            daysOfWeek: [dayIndex],
            display: "block",
            classNames: ["cal-event-card"],
            extendedProps: {
              imagem: urlImagem,
              status: item.status,
              dayIndex,
            },
          };
        });

        setMensagemFiltro("");
        setEventos(eventosFullCalendar);
      } catch (error) {
        const mensagemApi = error?.response?.data?.message;
        setMensagemFiltro(
          mensagemApi || "Não foi possível carregar o calendário para este usuário."
        );
        setEventos([]);
      } finally {
        setLoading(false);
      }
    }

    fetchEventos();
  }, [usuarioSelecionado]);

  useEffect(() => {
    const termo = filtroUsuario.trim();
    if (termo.length < minimoBuscaUsuario) {
      setBuscandoUsuarios(false);
      setUsuariosFiltrados([]);
      return;
    }
    if (cacheBuscaUsuarios.current.has(termo)) {
      setUsuariosFiltrados(cacheBuscaUsuarios.current.get(termo));
      setBuscandoUsuarios(false);
      return;
    }

    let ativo = true;
    const timer = setTimeout(async () => {
      setBuscandoUsuarios(true);
      try {
        const response = await api.get("/usuario/buscar", {
          params: { termo, limite: 8 },
          withCredentials: true,
        });

        if (ativo) {
          const resultados = Array.isArray(response.data) ? response.data : [];
          cacheBuscaUsuarios.current.set(termo, resultados);
          setUsuariosFiltrados(resultados);
        }
      } catch {
        if (ativo) {
          setUsuariosFiltrados([]);
        }
      } finally {
        if (ativo) {
          setBuscandoUsuarios(false);
        }
      }
    }, 250);

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [filtroUsuario]);

  useEffect(() => {
    const clearHoverPreview = () => setHoverPreview(null);

    window.addEventListener("resize", clearHoverPreview);
    window.addEventListener("scroll", clearHoverPreview, true);

    return () => {
      window.removeEventListener("resize", clearHoverPreview);
      window.removeEventListener("scroll", clearHoverPreview, true);
    };
  }, []);

  const quantidadePorDia = useMemo(() => {
    const porDia = {};
    eventos.forEach((evento) => {
      const diaIndex = evento.daysOfWeek?.[0];
      const diaNome = diasPorIndice[diaIndex] || "Sem dia";
      porDia[diaNome] = (porDia[diaNome] || 0) + 1;
    });
    return porDia;
  }, [eventos]);

  const diaMaisCheio = useMemo(() => {
    const entradas = Object.entries(quantidadePorDia);
    if (entradas.length === 0) return "Sem lançamentos";
    return entradas.sort((a, b) => b[1] - a[1])[0][0];
  }, [quantidadePorDia]);

  const handleEventMouseEnter = (mouseEvent, eventInfo) => {
    const { left, top } = getHoverPreviewPosition(mouseEvent.clientX, mouseEvent.clientY);
    const dayIndex = eventInfo.event.extendedProps.dayIndex;

    setHoverPreview({
      left,
      top,
      title: eventInfo.event.title,
      imagem: eventInfo.event.extendedProps.imagem,
      dia: diasPorIndice[dayIndex] || "Sem dia definido",
    });
  };

  const handleEventMouseMove = (mouseEvent) => {
    setHoverPreview((prev) => {
      if (!prev) return prev;
      const { left, top } = getHoverPreviewPosition(mouseEvent.clientX, mouseEvent.clientY);
      return { ...prev, left, top };
    });
  };

  const handleEventMouseLeave = () => {
    setHoverPreview(null);
  };

  const handleFiltrarCalendario = (event) => {
    event.preventDefault();
    const usuarioNormalizado = filtroUsuario.trim();

    if (!usuarioNormalizado) {
      setMensagemFiltro("Informe um usuário para visualizar outro calendário.");
      return;
    }

    setMensagemFiltro("");
    setUsuariosFiltrados([]);
    setSearchParams({ usuario: usuarioNormalizado });
  };

  const handleSelecionarUsuario = (usuario) => {
    setFiltroUsuario(usuario);
    setMensagemFiltro("");
    setUsuariosFiltrados([]);
    setSearchParams({ usuario });
  };

  const handleVerMeuCalendario = () => {
    setMensagemFiltro("");
    setFiltroUsuario("");
    setUsuariosFiltrados([]);
    setSearchParams({});
  };

  const eventContent = (eventInfo) => (
    <div
      className="cal-event-content"
      onMouseEnter={(event) => handleEventMouseEnter(event, eventInfo)}
      onMouseMove={handleEventMouseMove}
      onMouseLeave={handleEventMouseLeave}
    >
      <img
        src={eventInfo.event.extendedProps.imagem}
        alt={eventInfo.event.title}
        className="cal-event-image"
      />
      <span className="cal-event-title">{eventInfo.event.title}</span>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <section className="page-surface fade-slide-in p-5 sm:p-7">
        <p className="section-tag">Lançamentos</p>
        <h1 className="section-title">Calendário de obras</h1>
        <p className="section-subtitle">
          Veja rapidamente em quais dias cada capítulo novo costuma sair.
        </p>

        <form onSubmit={handleFiltrarCalendario} className="mt-4 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
            Visualizar calendário de outro usuário
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={filtroUsuario}
              onChange={(event) => setFiltroUsuario(event.target.value)}
              placeholder="Digite o usuário"
              className="w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl border border-cyan-300/45 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/25"
            >
              Carregar
            </button>
            <button
              type="button"
              onClick={handleVerMeuCalendario}
              className="rounded-xl border border-slate-500/40 bg-slate-800/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700/70"
            >
              Ver meu calendário
            </button>
          </div>

          {buscandoUsuarios && (
            <p className="text-sm text-slate-300">Buscando usuários cadastrados...</p>
          )}

          {!buscandoUsuarios && usuariosFiltrados.length > 0 && (
            <ul className="max-h-52 overflow-y-auto rounded-xl border border-slate-600/70 bg-slate-900/90 p-1">
              {usuariosFiltrados.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelecionarUsuario(item.usuario)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-cyan-300/20"
                  >
                    {item.usuario}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {mensagemFiltro && <p className="text-sm text-amber-300">{mensagemFiltro}</p>}
          {usuarioSelecionado && (
            <p className="text-sm text-cyan-100">
              Visualizando calendário do usuário:{" "}
              <span className="font-semibold">{usuarioSelecionado}</span>
            </p>
          )}
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="page-surface p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Total ativo</p>
          <p className="mt-2 text-3xl font-extrabold text-cyan-200">{eventos.length}</p>
          <p className="mt-1 text-sm text-slate-300">obras com dia de lançamento definido</p>
        </article>

        <article className="page-surface p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Dia mais cheio</p>
          <p className="mt-2 text-2xl font-bold text-slate-100">{diaMaisCheio}</p>
          <p className="mt-1 text-sm text-slate-300">maior concentração de novidades</p>
        </article>

        <article className="page-surface p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Visão mensal</p>
          <p className="mt-2 text-2xl font-bold text-slate-100">
            {loading ? "Carregando..." : "Atualizado"}
          </p>
          <p className="mt-1 text-sm text-slate-300">arraste para navegar entre meses</p>
        </article>
      </section>

      <section className="page-surface p-3 sm:p-5">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={eventos}
          locale={ptBrLocale}
          height="auto"
          contentHeight="auto"
          headerToolbar={{
            start: "prev,next today",
            center: "title",
            end: "",
          }}
          dayMaxEvents={4}
          eventContent={eventContent}
        />
      </section>

      {hoverPreview && (
        <div className="cal-hover-preview-layer" aria-hidden="true">
          <article
            className="cal-hover-preview"
            style={{ left: `${hoverPreview.left}px`, top: `${hoverPreview.top}px` }}
          >
            <img
              src={hoverPreview.imagem}
              alt={hoverPreview.title}
              className="cal-hover-preview-image"
            />
            <div className="cal-hover-preview-info">
              <p className="cal-hover-preview-day">{hoverPreview.dia}</p>
              <h3 className="cal-hover-preview-title">{hoverPreview.title}</h3>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
