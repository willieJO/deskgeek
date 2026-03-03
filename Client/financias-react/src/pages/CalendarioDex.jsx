import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { useSearchParams } from "react-router-dom";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from "@mui/material";
import { toast } from "react-toastify";
import api from "../utils/api";
import ButtonSpinner from "../components/ButtonSpinner";
import HoverMediaPreview from "../components/HoverMediaPreview";
import { useHoverMediaPreview } from "../components/useHoverMediaPreview";
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

const minimoBuscaUsuario = 2;
const statusMidiaOpcoes = ["Em andamento", "Finalizado", "Inativo"];
const calendarioDialogTextFieldSx = {
  "& .MuiInputLabel-root": {
    color: "rgba(203,213,225,0.9)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#67e8f9",
  },
  "& .MuiOutlinedInput-root": {
    color: "#e2edff",
    backgroundColor: "rgba(10,19,37,0.88)",
    "& fieldset": {
      borderColor: "rgba(148,163,184,0.32)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(103,232,249,0.45)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(103,232,249,0.75)",
    },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "rgba(148,163,184,0.85)",
    opacity: 1,
  },
  "& .MuiSvgIcon-root": {
    color: "#cbd5e1",
  },
};

function parseNonNegativeInteger(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const parsed = Number.parseInt(String(value).trim(), 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function isValidHttpUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

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
  const [filtroUsuario, setFiltroUsuario] = useState(usuarioSelecionado);
  const [mensagemFiltro, setMensagemFiltro] = useState("");
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const [acaoCarregamento, setAcaoCarregamento] = useState("");
  const [usuarioSelecionadoMeta, setUsuarioSelecionadoMeta] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [loadingEditDetails, setLoadingEditDetails] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const cacheBuscaUsuarios = useRef(new Map());
  const { preview, cardRef, clearPreview, getTriggerProps } = useHoverMediaPreview();

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

  const fetchEventos = useCallback(async () => {
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
        const startRecur = item.dataInicioRecorrencia || new Date().toISOString().slice(0, 10);
        const endRecur = item.dataFimRecorrenciaExclusiva || undefined;

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
          startRecur,
          endRecur,
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
      setMensagemFiltro(mensagemApi || "Não foi possível carregar o calendário para este usuário.");
      setEventos([]);
    } finally {
      setLoading(false);
      setAcaoCarregamento("");
    }
  }, [usuarioConsulta]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

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
    clearPreview();
  }, [usuarioConsulta, clearPreview]);

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

  const handleCloseEditModal = () => {
    if (savingEdit) return;
    setOpenEditModal(false);
    setEditingMedia(null);
    setEditError("");
  };

  const handleEventClick = async (clickInfo) => {
    const mediaId = clickInfo?.event?.id;
    if (!mediaId) return;

    if (visualizandoTerceiro) {
      toast.info("Modo somente leitura: você só pode editar o próprio calendário.");
      return;
    }

    setLoadingEditDetails(true);
    setEditError("");
    try {
      const response = await api.get(`/MediaDex/${mediaId}`, { withCredentials: true });
      const detalhe = response?.data;
      if (!detalhe?.id) {
        toast.error("Não foi possível carregar os detalhes da mídia.");
        return;
      }

      setEditingMedia({
        id: detalhe.id,
        nome: detalhe.nome || "",
        tipoMidia: detalhe.tipoMidia || "",
        status: detalhe.status || "Em andamento",
        diaNovoCapitulo: detalhe.diaNovoCapitulo || "",
        totalCapitulos: detalhe.totalCapitulos ?? "",
        capituloAtual: detalhe.capituloAtual ?? "",
        imagemDirectory: detalhe.imagemDirectory || "",
        imagemUrl: detalhe.imagemUrl || "",
        urlMidia: detalhe.urlMidia ?? "",
      });
      setOpenEditModal(true);
    } catch (error) {
      if (error?.response?.status === 404) {
        toast.error("A mídia não foi encontrada. O calendário foi atualizado.");
        await fetchEventos();
        return;
      }
      toast.error("Falha ao carregar os detalhes da mídia.");
    } finally {
      setLoadingEditDetails(false);
    }
  };

  const handleConcluirEdicao = () => {
    setEditingMedia((anterior) => {
      if (!anterior) return anterior;

      const total = parseNonNegativeInteger(anterior.totalCapitulos);
      const capituloAtual = total !== null ? String(total) : anterior.capituloAtual;

      return {
        ...anterior,
        status: "Finalizado",
        capituloAtual,
      };
    });
    setEditError("");
  };

  const handleInativarEdicao = () => {
    setEditingMedia((anterior) => {
      if (!anterior) return anterior;
      return {
        ...anterior,
        status: "Inativo",
      };
    });
    setEditError("");
  };

  const validateEditPayload = () => {
    if (!editingMedia) return "Nenhuma mídia selecionada.";
    if (!editingMedia.nome.trim()) return "Nome é obrigatório para salvar.";

    const capituloAtualRaw = String(editingMedia.capituloAtual ?? "").trim();
    const totalRaw = String(editingMedia.totalCapitulos ?? "").trim();

    if (capituloAtualRaw !== "") {
      const capituloAtual = parseNonNegativeInteger(capituloAtualRaw);
      if (capituloAtual === null) {
        return "Capítulo atual deve ser um inteiro maior ou igual a zero.";
      }

      if (totalRaw !== "") {
        const total = parseNonNegativeInteger(totalRaw);
        if (total === null) {
          return "Total de capítulos deve ser um inteiro maior ou igual a zero.";
        }
        if (capituloAtual > total) {
          return "Capítulo atual não pode ser maior que o total de capítulos.";
        }
      }
    }

    const urlMidia = String(editingMedia.urlMidia ?? "").trim();
    if (urlMidia && !isValidHttpUrl(urlMidia)) {
      return "A URL da mídia deve ser válida (http/https).";
    }

    return "";
  };

  const handleSalvarEdicao = async () => {
    if (!editingMedia || savingEdit) return;

    const validationError = validateEditPayload();
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setSavingEdit(true);
    setEditError("");
    try {
      const payload = {
        nome: editingMedia.nome.trim(),
        tipoMidia: editingMedia.tipoMidia || null,
        status: editingMedia.status || null,
        diaNovoCapitulo: editingMedia.diaNovoCapitulo || null,
        totalCapitulos:
          String(editingMedia.totalCapitulos ?? "").trim() === ""
            ? null
            : String(editingMedia.totalCapitulos).trim(),
        capituloAtual:
          String(editingMedia.capituloAtual ?? "").trim() === ""
            ? null
            : String(editingMedia.capituloAtual).trim(),
        imagemDirectory: editingMedia.imagemDirectory || null,
        imagemUrl: editingMedia.imagemUrl || null,
        urlMidia:
          String(editingMedia.urlMidia ?? "").trim() === ""
            ? null
            : String(editingMedia.urlMidia).trim(),
      };

      await api.put(`/MediaDex/${editingMedia.id}`, payload, { withCredentials: true });

      toast.success("Mídia atualizada com sucesso.");
      setOpenEditModal(false);
      setEditingMedia(null);
      await fetchEventos();
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      if (error?.response?.status === 404) {
        toast.error("A mídia não foi encontrada. O calendário foi atualizado.");
        setOpenEditModal(false);
        setEditingMedia(null);
        await fetchEventos();
        return;
      }

      if (Array.isArray(error?.response?.data) && error.response.data[0]?.message) {
        setEditError(error.response.data[0].message);
      } else {
        setEditError(apiMessage || "Erro ao salvar alterações.");
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const eventContent = (eventInfo) => (
    <div
      className="cal-event-content cal-event-content--editable"
      {...getTriggerProps({
        title: eventInfo.event.title,
        image: eventInfo.event.extendedProps.imagem,
        meta: diasPorIndice[eventInfo.event.extendedProps.dayIndex] || "Sem dia definido",
      })}
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

          {loadingEditDetails && (
            <p className="flex items-center gap-2 text-sm text-slate-300">
              <ButtonSpinner />
              Carregando detalhes para edição...
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
          eventClick={handleEventClick}
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

      <Dialog
        open={openEditModal}
        onClose={(_, reason) => {
          if (savingEdit && (reason === "backdropClick" || reason === "escapeKeyDown")) return;
          handleCloseEditModal();
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            border: "1px solid rgba(103,232,249,0.35)",
            background: "linear-gradient(160deg,#0e1930,#0a1326)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#e2edff" }}>Editar mídia pelo calendário</DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            borderColor: "rgba(148,163,184,0.22)",
            color: "#e2edff",
          }}
        >
          <TextField
            label="Nome"
            value={editingMedia?.nome || ""}
            InputProps={{ readOnly: true }}
            sx={calendarioDialogTextFieldSx}
            fullWidth
          />
          <TextField
            label="Tipo"
            value={editingMedia?.tipoMidia || "Não definido"}
            InputProps={{ readOnly: true }}
            sx={calendarioDialogTextFieldSx}
            fullWidth
          />
          <TextField
            label="Total de capítulos"
            value={editingMedia?.totalCapitulos || "Não definido"}
            InputProps={{ readOnly: true }}
            sx={calendarioDialogTextFieldSx}
            fullWidth
          />
          <TextField
            label="Dia de lançamento"
            value={editingMedia?.diaNovoCapitulo || "Não definido"}
            InputProps={{ readOnly: true }}
            sx={calendarioDialogTextFieldSx}
            fullWidth
          />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outlined"
              color="success"
              onClick={handleConcluirEdicao}
              disabled={savingEdit}
            >
              Concluir
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleInativarEdicao}
              disabled={savingEdit}
            >
              Inativar
            </Button>
          </div>

          <TextField
            select
            label="Status"
            value={editingMedia?.status || ""}
            onChange={(event) =>
              setEditingMedia((anterior) =>
                anterior
                  ? {
                      ...anterior,
                      status: event.target.value,
                    }
                  : anterior
              )
            }
            disabled={savingEdit}
            sx={calendarioDialogTextFieldSx}
            fullWidth
          >
            {statusMidiaOpcoes.map((status) => (
              <MenuItem key={status} value={status} sx={{ color: "#e2edff" }}>
                {status}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Capítulo atual"
            type="number"
            value={editingMedia?.capituloAtual ?? ""}
            onChange={(event) =>
              setEditingMedia((anterior) =>
                anterior
                  ? {
                      ...anterior,
                      capituloAtual: event.target.value,
                    }
                  : anterior
              )
            }
            disabled={savingEdit}
            sx={calendarioDialogTextFieldSx}
            fullWidth
          />

          <TextField
            label="URL para assistir/ler (opcional)"
            type="url"
            placeholder="https://..."
            value={editingMedia?.urlMidia ?? ""}
            onChange={(event) =>
              setEditingMedia((anterior) =>
                anterior
                  ? {
                      ...anterior,
                      urlMidia: event.target.value,
                    }
                  : anterior
              )
            }
            disabled={savingEdit}
            sx={calendarioDialogTextFieldSx}
            fullWidth
          />

          {editError ? <p className="text-sm text-rose-300">{editError}</p> : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid rgba(148,163,184,0.18)" }}>
          <Button
            onClick={handleCloseEditModal}
            color="inherit"
            disabled={savingEdit}
            sx={{ color: "#cbd5e1" }}
          >
            Cancelar
          </Button>
          <Button onClick={handleSalvarEdicao} variant="contained" disabled={savingEdit}>
            {savingEdit ? (
              <>
                <ButtonSpinner />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <HoverMediaPreview preview={preview} cardRef={cardRef} />
    </div>
  );
}
