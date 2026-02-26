import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { useSearchParams } from "react-router-dom";
import api from "../utils/api";
import ButtonSpinner from "../components/ButtonSpinner";
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

function normalizarUsuario(valor) {
  return (valor ?? "").trim().toLowerCase();
}

function normalizarUsuarioResumo(item) {
  return {
    id: item?.id ?? "",
    usuario: (item?.usuario ?? "").trim(),
    fotoPerfilDisponivel: Boolean(item?.fotoPerfilDisponivel),
  };
}

function UsuarioAvatar({
  userId,
  usuario,
  fotoPerfilDisponivel,
  sizeClass = "h-8 w-8",
  textClass = "text-xs",
}) {
  const [erroImagem, setErroImagem] = useState(false);

  useEffect(() => {
    setErroImagem(false);
  }, [userId, fotoPerfilDisponivel]);

  const inicial = (usuario || "U").trim().slice(0, 1).toUpperCase();
  const fotoUrl =
    userId && fotoPerfilDisponivel ? api.getUri({ url: `/usuario/foto/${userId}` }) : null;

  if (fotoUrl && !erroImagem) {
    return (
      <img
        src={fotoUrl}
        alt={`Foto de perfil de ${usuario || "usuário"}`}
        className={`${sizeClass} rounded-full border border-cyan-300/35 object-cover`}
        onError={() => setErroImagem(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-300/10 font-bold text-cyan-100 ${textClass}`}
      aria-label={`Avatar de ${usuario || "usuário"}`}
    >
      {inicial || "U"}
    </div>
  );
}

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

export default function CalendarioDex({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const usuarioSelecionado = (searchParams.get("usuario") ?? "").trim();
  const usuarioLogado = (currentUser?.usuario ?? "").trim();
  const usuarioSelecionadoNormalizado = normalizarUsuario(usuarioSelecionado);
  const usuarioLogadoNormalizado = normalizarUsuario(usuarioLogado);
  const visualizandoTerceiro =
    Boolean(usuarioSelecionado) && usuarioSelecionadoNormalizado !== usuarioLogadoNormalizado;
  const usuarioConsulta = visualizandoTerceiro ? usuarioSelecionado : "";

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverPreview, setHoverPreview] = useState(null);
  const [filtroUsuario, setFiltroUsuario] = useState(usuarioSelecionado);
  const [mensagemFiltro, setMensagemFiltro] = useState("");
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const [acaoCarregamento, setAcaoCarregamento] = useState("");
  const [usuarioSelecionadoMeta, setUsuarioSelecionadoMeta] = useState(null);
  const cacheBuscaUsuarios = useRef(new Map());
  const hoverPreviewCardRef = useRef(null);
  const hoverPreviewRafRef = useRef(null);
  const hoverPreviewNextPosRef = useRef(null);

  const cancelHoverPreviewFrame = () => {
    if (hoverPreviewRafRef.current != null) {
      window.cancelAnimationFrame(hoverPreviewRafRef.current);
      hoverPreviewRafRef.current = null;
    }
  };

  const queueHoverPreviewPosition = (clientX, clientY) => {
    hoverPreviewNextPosRef.current = getHoverPreviewPosition(clientX, clientY);

    if (hoverPreviewRafRef.current != null) return;

    hoverPreviewRafRef.current = window.requestAnimationFrame(() => {
      hoverPreviewRafRef.current = null;

      const node = hoverPreviewCardRef.current;
      const pos = hoverPreviewNextPosRef.current;
      if (!node || !pos) return;

      node.style.left = `${pos.left}px`;
      node.style.top = `${pos.top}px`;
    });
  };

  useEffect(() => {
    cacheBuscaUsuarios.current.clear();
  }, [currentUser?.id, usuarioLogadoNormalizado]);

  useEffect(() => {
    setFiltroUsuario(usuarioSelecionado);
  }, [usuarioSelecionado]);

  useEffect(() => {
    if (!usuarioSelecionado || !usuarioLogadoNormalizado) {
      return;
    }
    if (usuarioSelecionadoNormalizado !== usuarioLogadoNormalizado) {
      return;
    }

    setMensagemFiltro("");
    setUsuariosFiltrados([]);
    setUsuarioSelecionadoMeta(null);
    setAcaoCarregamento("");
    setSearchParams({}, { replace: true });
  }, [
    usuarioSelecionado,
    usuarioSelecionadoNormalizado,
    usuarioLogadoNormalizado,
    setSearchParams,
  ]);

  useEffect(() => {
    async function fetchEventos() {
      setLoading(true);
      try {
        const response = usuarioConsulta
          ? await api.get("/MediaDex/obterMediaPorUsuarioPorStatusEmAndamentoPorUsuario", {
              params: { usuario: usuarioConsulta },
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
        setAcaoCarregamento("");
      }
    }

    fetchEventos();
  }, [usuarioConsulta]);

  useEffect(() => {
    if (!usuarioConsulta) {
      setUsuarioSelecionadoMeta(null);
      return;
    }

    let ativo = true;
    async function resolverUsuarioSelecionado() {
      try {
        const response = await api.get("/usuario/buscar", {
          params: { termo: usuarioConsulta, limite: 8 },
          withCredentials: true,
        });

        if (!ativo) return;

        const resultados = Array.isArray(response.data)
          ? response.data.map(normalizarUsuarioResumo)
          : [];
        const usuarioEncontrado = resultados.find(
          (item) => normalizarUsuario(item.usuario) === normalizarUsuario(usuarioConsulta)
        );

        if (usuarioEncontrado) {
          setUsuarioSelecionadoMeta(usuarioEncontrado);
          return;
        }

        setUsuarioSelecionadoMeta({
          id: "",
          usuario: usuarioConsulta,
          fotoPerfilDisponivel: false,
        });
      } catch {
        if (!ativo) return;
        setUsuarioSelecionadoMeta({
          id: "",
          usuario: usuarioConsulta,
          fotoPerfilDisponivel: false,
        });
      }
    }

    resolverUsuarioSelecionado();

    return () => {
      ativo = false;
    };
  }, [usuarioConsulta]);

  useEffect(() => {
    const termo = filtroUsuario.trim();
    if (termo.length < minimoBuscaUsuario) {
      setBuscandoUsuarios(false);
      setUsuariosFiltrados([]);
      return;
    }

    const cacheKey = `${termo}|${currentUser?.id ?? ""}`;
    if (cacheBuscaUsuarios.current.has(cacheKey)) {
      setUsuariosFiltrados(cacheBuscaUsuarios.current.get(cacheKey));
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
          const resultados = Array.isArray(response.data)
            ? response.data.map(normalizarUsuarioResumo)
            : [];

          const resultadosSemUsuarioLogado = resultados.filter(
            (item) => normalizarUsuario(item.usuario) !== usuarioLogadoNormalizado
          );

          cacheBuscaUsuarios.current.set(cacheKey, resultadosSemUsuarioLogado);
          setUsuariosFiltrados(resultadosSemUsuarioLogado);
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
  }, [filtroUsuario, currentUser?.id, usuarioLogadoNormalizado]);

  useEffect(() => {
    const clearHoverPreview = () => {
      cancelHoverPreviewFrame();
      hoverPreviewNextPosRef.current = null;
      setHoverPreview(null);
    };

    window.addEventListener("resize", clearHoverPreview);
    window.addEventListener("scroll", clearHoverPreview, true);

    return () => {
      window.removeEventListener("resize", clearHoverPreview);
      window.removeEventListener("scroll", clearHoverPreview, true);
    };
  }, []);

  useEffect(() => () => cancelHoverPreviewFrame(), []);

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
    cancelHoverPreviewFrame();
    hoverPreviewNextPosRef.current = { left, top };

    setHoverPreview({
      left,
      top,
      title: eventInfo.event.title,
      imagem: eventInfo.event.extendedProps.imagem,
      dia: diasPorIndice[dayIndex] || "Sem dia definido",
    });
  };

  const handleEventMouseMove = (mouseEvent) => {
    if (!hoverPreviewCardRef.current) return;
    queueHoverPreviewPosition(mouseEvent.clientX, mouseEvent.clientY);
  };

  const handleEventMouseLeave = () => {
    cancelHoverPreviewFrame();
    hoverPreviewNextPosRef.current = null;
    setHoverPreview(null);
  };

  const handleFiltrarCalendario = (event) => {
    event.preventDefault();
    const usuarioNormalizado = filtroUsuario.trim();

    if (!usuarioNormalizado) {
      setMensagemFiltro("Informe um usuário para visualizar outro calendário.");
      return;
    }

    if (normalizarUsuario(usuarioNormalizado) === usuarioLogadoNormalizado) {
      handleVerMeuCalendario();
      return;
    }

    setMensagemFiltro("");
    setUsuariosFiltrados([]);
    setUsuarioSelecionadoMeta(null);
    setAcaoCarregamento("usuario");
    setSearchParams({ usuario: usuarioNormalizado });
  };

  const handleSelecionarUsuario = (usuarioResumo) => {
    setFiltroUsuario(usuarioResumo.usuario);
    setMensagemFiltro("");
    setUsuariosFiltrados([]);
    setUsuarioSelecionadoMeta(usuarioResumo);
    setAcaoCarregamento("usuario");
    setSearchParams({ usuario: usuarioResumo.usuario });
  };

  const handleVerMeuCalendario = () => {
    setMensagemFiltro("");
    setFiltroUsuario("");
    setUsuariosFiltrados([]);
    setUsuarioSelecionadoMeta(null);
    setAcaoCarregamento("meu");
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

  const usuarioBanner = usuarioSelecionadoMeta || {
    id: "",
    usuario: usuarioConsulta,
    fotoPerfilDisponivel: false,
  };

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
            <button type="submit" className="ui-button w-full sm:w-auto" disabled={loading}>
              {loading && acaoCarregamento === "usuario" ? (
                <>
                  <ButtonSpinner />
                  Carregando...
                </>
              ) : (
                "Carregar"
              )}
            </button>
            <button
              type="button"
              onClick={handleVerMeuCalendario}
              className="ui-button-secondary w-full sm:w-auto"
              disabled={loading}
            >
              {loading && acaoCarregamento === "meu" ? (
                <>
                  <ButtonSpinner />
                  Carregando...
                </>
              ) : (
                "Ver meu calendário"
              )}
            </button>
          </div>

          {buscandoUsuarios && (
            <p className="flex items-center gap-2 text-sm text-slate-300">
              <ButtonSpinner />
              Buscando usuários cadastrados...
            </p>
          )}

          {!buscandoUsuarios && usuariosFiltrados.length > 0 && (
            <ul className="max-h-52 overflow-y-auto rounded-xl border border-slate-600/70 bg-slate-900/90 p-1">
              {usuariosFiltrados.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelecionarUsuario(item)}
                    className="cal-user-search-item"
                  >
                    <UsuarioAvatar
                      userId={item.id}
                      usuario={item.usuario}
                      fotoPerfilDisponivel={item.fotoPerfilDisponivel}
                    />
                    <span className="cal-user-search-name">@{item.usuario}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {mensagemFiltro && <p className="text-sm text-amber-300">{mensagemFiltro}</p>}
        </form>
      </section>

      {visualizandoTerceiro && (
        <section className="cal-context-banner">
          <div className="cal-context-banner-content">
            <UsuarioAvatar
              userId={usuarioBanner.id}
              usuario={usuarioBanner.usuario}
              fotoPerfilDisponivel={usuarioBanner.fotoPerfilDisponivel}
              sizeClass="h-12 w-12"
              textClass="text-base"
            />
            <div className="min-w-0">
              <p className="cal-context-banner-tag">Modo visualização</p>
              <p className="cal-context-banner-title">
                Visualizando calendário de <span>@{usuarioBanner.usuario}</span>
              </p>
              <p className="cal-context-banner-subtitle">
                Eventos e métricas abaixo refletem os dados desse usuário.
              </p>
            </div>
          </div>
          <button type="button" onClick={handleVerMeuCalendario} className="ui-button-secondary">
            Voltar para meu calendário
          </button>
        </section>
      )}

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
            ref={hoverPreviewCardRef}
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
