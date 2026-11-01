import LibraryOrderDialog from "../components/LibraryOrderDialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  ArrowDownWideNarrow,
  GripVertical,
  ArrowUpRight,
  BookOpen,
  BellRing,
  BellOff,
  CalendarDays,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Library,
  Pause,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import ButtonSpinner from "../components/ButtonSpinner";
import MediaCover from "../components/MediaCover";
import MediaEditDialog from "../components/MediaEditDialog";
import api from "../utils/api";
import { mediaImageSource } from "../utils/mediaImages";
import {
  filterLibrary,
  completedMedia,
  MEDIA_TYPES,
  mediaPayload,
  nextProgress,
  normalize,
  paginate,
  PAGE_SIZE,
  progress,
  releasesToday,
  STATUSES,
  todayWeekday,
  validHttpUrl,
  WEEKDAYS,
} from "../utils/library";
import "./tabeladex.css";

const defaultFilters = {
  search: "",
  status: "",
  type: "",
  day: "",
  todayOnly: false,
  sort: "manual",
};
const statusIcons = [Library, CirclePlay, CheckCheck, Pause];

function apiError(error, fallback) {
  const body = error?.response?.data;
  return (Array.isArray(body) ? body[0]?.message : body?.message) || fallback;
}

function MediaCard({
  item,
  today,
  busy,
  blocked,
  onEdit,
  onDelete,
  onIncrement,
  onToggleEmail,
  emailsEnabled,
}) {
  const { current, total, percent } = progress(item);
  const film = normalize(item.tipoMidia) === "filme";
  const episode = ["anime", "serie"].includes(normalize(item.tipoMidia));
  const statusClass =
    normalize(item.status) === "finalizado"
      ? "finished"
      : normalize(item.status) === "inativo"
        ? "inactive"
        : "watching";
  const next = nextProgress(item);
  const unit = episode ? "episódio" : "capítulo";
  return (
    <article className="media-card" aria-label={item.nome}>
      <div className="media-card-art">
        <MediaCover
          src={mediaImageSource(item)}
          alt={`Capa de ${item.nome || "obra"}`}
          loading="lazy"
        />
        <span className="media-type">{item.tipoMidia || "Mídia"}</span>
        {releasesToday(item, today) && (
          <span className="release-today">
            <Sparkles size={12} /> Hoje
          </span>
        )}
      </div>
      <div className="media-card-info">
        <span className={`media-status ${statusClass}`}>
          <span />
          {item.status || "Sem status"}
        </span>
        <h2 title={item.nome}>{item.nome || "Sem título"}</h2>
        {film ? (
          <p className="media-progress-label">
            <span>Filme</span>
            <strong>
              {item.status === "Finalizado" ? "Assistido" : "Não concluído"}
            </strong>
          </p>
        ) : (
          <>
            <p className="media-progress-label">
              <span>{episode ? "Episódios" : "Capítulos"}</span>
              <strong>
                {current}
                <span> / {total !== null && total > 0 ? total : "?"}</span>
              </strong>
            </p>
            {percent !== null ? (
              <div
                className="media-progress-bar"
                role="progressbar"
                aria-label={`Progresso de ${item.nome}`}
                aria-valuenow={Math.min(current, total)}
                aria-valuetext={`${current} de ${total}`}
                aria-valuemin={0}
                aria-valuemax={total}
              >
                <span style={{ width: `${percent}%` }} />
              </div>
            ) : (
              <p className="unknown-total">Total desconhecido</p>
            )}
          </>
        )}
        <p className="media-release">
          <CalendarDays size={14} />
          {film ? "Longa-metragem" : item.diaNovoCapitulo || "Sem dia definido"}
        </p>
        <div className="media-card-primary">
          {!film && normalize(item.status) === normalize(STATUSES[0]) && (
            <button
              className="increment-button"
              disabled={blocked || next === null}
              onClick={() => onIncrement(item)}
              aria-label={`+1 ${unit} de ${item.nome}`}
              title={
                next === null
                  ? "Limite do progresso atingido ou dados inválidos"
                  : `Marcar mais um ${unit}`
              }
            >
              {busy ? <ButtonSpinner /> : <Plus size={15} />}{" "}
              {next === null
                ? total !== null && current >= total
                  ? "No limite"
                  : "Indisponível"
                : `1 ${unit}`}
            </button>
          )}
          {item.urlMidia && validHttpUrl(item.urlMidia) && (
            <a
              className="media-link"
              href={item.urlMidia}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir link de ${item.nome}`}
            >
              <ArrowUpRight size={16} />
              {episode || film ? "Assistir" : "Ler"}
            </a>
          )}
        </div>
        <button
          className={`media-reminder ${(item.notificarLancamentos ?? true) ? "enabled" : ""}`}
          disabled={blocked}
          aria-label={`${(item.notificarLancamentos ?? true) ? "Desativar" : "Ativar"} lembrete de ${item.nome}`}
          aria-pressed={item.notificarLancamentos ?? true}
          title={
            !emailsEnabled
              ? "Os e-mails estão pausados no perfil. Sua escolha por obra ficará salva."
              : "Lembrete por e-mail no dia cadastrado, às 12h de Brasília."
          }
          onClick={() => onToggleEmail(item)}
        >
          {(item.notificarLancamentos ?? true) ? (
            <BellRing size={14} />
          ) : (
            <BellOff size={14} />
          )}
          {(item.notificarLancamentos ?? true)
            ? emailsEnabled
              ? "Lembrete ativo"
              : "Obra selecionada"
            : "Ativar lembrete"}
        </button>
        <div className="media-card-actions">
          <button
            onClick={() => onEdit(item)}
            disabled={blocked}
            aria-label={`Editar ${item.nome}`}
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            className="remove-action"
            onClick={() => onDelete(item)}
            disabled={blocked}
            aria-label={`Remover ${item.nome}`}
          >
            <Trash2 size={14} /> Remover
          </button>
        </div>
      </div>
    </article>
  );
}

export function TabelaDex({ currentUser }) {
  const emailsEnabled = currentUser?.receberEmailsLancamentos ?? true;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState({
    ...defaultFilters,
    status: "Em andamento",
  });
  const [organizing, setOrganizing] = useState(false);
  const [page, setPage] = useState(1);
  const [today, setToday] = useState(todayWeekday);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [pending, setPending] = useState(new Set());
  const locks = useRef(new Set());
  const fetchVersion = useRef(0);

  const fetchData = useCallback(async () => {
    const version = ++fetchVersion.current;
    setLoading(true);
    setLoadError("");
    try {
      const response = await api.get("/MediaDex/obterMediaPorUsuario");
      if (version === fetchVersion.current)
        setData(
          Array.isArray(response.data) ? response.data.map(completedMedia) : [],
        );
    } catch {
      if (version === fetchVersion.current)
        setLoadError(
          "Não foi possível atualizar sua biblioteca. Seus dados continuam aqui; tente novamente.",
        );
    } finally {
      if (version === fetchVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const tracker = fetchVersion;
    fetchData();
    return () => {
      ++tracker.current;
    };
  }, [fetchData]);

  useEffect(() => {
    const refreshDay = () => setToday(todayWeekday());
    const timer = setInterval(refreshDay, 60000);
    window.addEventListener("focus", refreshDay);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refreshDay);
    };
  }, []);

  const filtered = useMemo(
    () => filterLibrary(data, filters, today),
    [data, filters, today],
  );
  const paginated = paginate(filtered, page);
  const counts = [
    data.length,
    ...STATUSES.map(
      (status) =>
        data.filter((item) => normalize(item.status) === normalize(status))
          .length,
    ),
  ];
  const hasFilters = Object.keys(defaultFilters).some(
    (key) => filters[key] !== defaultFilters[key],
  );
  const todayCount = data.filter((item) => releasesToday(item, today)).length;

  // Clamp the stored page too, so new results cannot unexpectedly restore an old page.
  useEffect(() => {
    setPage((previous) =>
      Math.min(previous, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))),
    );
  }, [filtered.length]);

  function changeFilter(key, value) {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  }
  function clearFilters() {
    setFilters(defaultFilters);
    setPage(1);
  }
  function acquire(id) {
    if (locks.current.size > 0) return false;
    locks.current.add(id);
    ++fetchVersion.current;
    setLoading(false);
    setPending(new Set(locks.current));
    return true;
  }
  function release(id) {
    locks.current.delete(id);
    setPending(new Set(locks.current));
  }

  async function saveEdit(draft, file) {
    if (!acquire(draft.id))
      throw new Error("Aguarde a atualização em andamento e tente novamente.");
    const payload = mediaPayload(draft);
    try {
      if (file) {
        const form = new FormData();
        Object.entries(payload).forEach(([key, value]) =>
          form.append(key, value),
        );
        form.append("ImagemUpload", file);
        await api.put(`/MediaDex/${draft.id}`, form);
      } else {
        await api.put(`/MediaDex/${draft.id}`, payload);
      }
      setData((previous) =>
        previous.map((item) =>
          item.id === draft.id ? completedMedia({ ...item, ...payload }) : item,
        ),
      );
      setEditing(null);
      toast.success("Obra atualizada com sucesso.");
      await fetchData();
    } catch (error) {
      throw new Error(
        apiError(
          error,
          "Não foi possível salvar as alterações. Tente novamente.",
        ),
      );
    } finally {
      release(draft.id);
    }
  }

  async function increment(item) {
    const next = nextProgress(item);
    if (next === null || !acquire(item.id)) return;
    try {
      await api.put(`/MediaDex/${item.id}`, {
        nome: item.nome,
        capituloAtual: next,
      });
      ++fetchVersion.current;
      setData((previous) =>
        previous.map((value) =>
          value.id === item.id
            ? completedMedia({ ...value, capituloAtual: next })
            : value,
        ),
      );
      toast.success(
        completedMedia({ ...item, capituloAtual: next }).status === "Finalizado"
          ? "Obra finalizada! Ela continua disponível no filtro Finalizado."
          : "Progresso atualizado.",
      );
    } catch (error) {
      toast.error(
        apiError(
          error,
          "Não foi possível atualizar o progresso. Tente novamente.",
        ),
      );
    } finally {
      release(item.id);
    }
  }

  async function toggleEmail(item) {
    if (!acquire(item.id)) return;
    const enabled = !(item.notificarLancamentos ?? true);
    try {
      await api.put(`/MediaDex/${item.id}/notificacoes`, {
        notificarLancamentos: enabled,
      });
      ++fetchVersion.current;
      setData((previous) =>
        previous.map((value) =>
          value.id === item.id
            ? { ...value, notificarLancamentos: enabled }
            : value,
        ),
      );
      toast.success(
        enabled
          ? "Lembrete desta obra ativado."
          : "Lembrete desta obra desativado.",
      );
    } catch (error) {
      toast.error(
        apiError(error, "Não foi possível alterar o lembrete desta obra."),
      );
    } finally {
      release(item.id);
    }
  }

  async function saveOrder(mediaIds) {
    if (!acquire("library-order"))
      throw new Error("Aguarde a atualização em andamento.");
    try {
      const response = await api.put("/MediaDex/ordem", { mediaIds });
      const positions = new Map(
        response.data.ordem.map((item) => [item.id, item.ordemPersonalizada]),
      );
      setData((previous) =>
        previous.map((item) =>
          positions.has(item.id)
            ? { ...item, ordemPersonalizada: positions.get(item.id) }
            : item,
        ),
      );
      setFilters((previous) => ({ ...previous, sort: "manual" }));
      setPage(1);
      setOrganizing(false);
      toast.success("Sua ordem foi salva na conta.");
    } catch (error) {
      throw new Error(
        apiError(error, "Não foi possível salvar sua ordem. Tente novamente."),
      );
    } finally {
      release("library-order");
    }
  }

  async function confirmDelete() {
    if (!deleting || !acquire(deleting.id)) return;
    const id = deleting.id;
    setDeleteError("");
    try {
      await api.delete(`/MediaDex/${id}`);
      ++fetchVersion.current;
      setData((previous) => previous.filter((item) => item.id !== id));
      setDeleting(null);
      toast.success("Obra removida da biblioteca.");
    } catch (error) {
      setDeleteError(
        apiError(error, "Não foi possível remover a obra. Tente novamente."),
      );
    } finally {
      release(id);
    }
  }

  return (
    <div className="library-page fade-slide-in">
      <section className="library-heading">
        <div>
          <p className="section-tag">
            <Library size={14} /> Sua coleção, seu universo
          </p>
          <h1 className="section-title">
            Minhas obras<span className="title-dot">.</span>
          </h1>
          <p className="section-subtitle">
            Cada história no seu ritmo. Continue de onde parou.
          </p>
        </div>
        <Link to="/dashboard" className="ui-button">
          <Plus size={18} /> Adicionar obra
        </Link>
      </section>
      <div className="library-stats" aria-label="Filtrar biblioteca por status">
        {["Todas as obras", ...STATUSES].map((label, index) => {
          const Icon = statusIcons[index];
          const value = index === 0 ? "" : label;
          return (
            <button
              key={label}
              className={`library-stat stat-${index} ${filters.status === value ? "selected" : ""}`}
              aria-pressed={filters.status === value}
              onClick={() => changeFilter("status", value)}
            >
              <span className="stat-icon">
                <Icon size={20} />
              </span>
              <span>
                <span className="stat-label">{label}</span>
                <strong>{loading && !data.length ? "—" : counts[index]}</strong>
              </span>
              <span className="stat-indicator" />
            </button>
          );
        })}
      </div>
      {!emailsEnabled && (
        <div className="email-paused-banner">
          <BellOff size={18} />
          <p>
            Seus lembretes por e-mail estão pausados. As escolhas por obra
            continuam salvas.
          </p>
          <Link to="/configuracoes">Gerenciar e-mails</Link>
        </div>
      )}
      <section className="library-tools" aria-label="Busca e filtros">
        <div className="library-search">
          <Search size={19} />
          <input
            type="search"
            aria-label="Buscar na biblioteca"
            placeholder="Busque uma história na sua coleção..."
            value={filters.search}
            onChange={(event) => changeFilter("search", event.target.value)}
          />
        </div>
        <div className="library-filter-row">
          <span className="filter-caption">
            <SlidersHorizontal size={15} /> Filtrar por
          </span>
          <select
            className="ui-select"
            aria-label="Tipo de mídia"
            value={filters.type}
            onChange={(event) => changeFilter("type", event.target.value)}
          >
            <option value="">Todos os tipos</option>
            {MEDIA_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
            <option value="undefined">Tipo não definido</option>
          </select>
          <select
            className="ui-select"
            aria-label="Dia de lançamento"
            value={filters.day}
            onChange={(event) => changeFilter("day", event.target.value)}
          >
            <option value="">Qualquer dia</option>
            {WEEKDAYS.map((day) => (
              <option key={day}>{day}</option>
            ))}
            <option value="undefined">Sem dia definido</option>
          </select>
          <button
            className={`today-filter ${filters.todayOnly ? "active" : ""}`}
            aria-pressed={filters.todayOnly}
            onClick={() => changeFilter("todayOnly", !filters.todayOnly)}
          >
            <Sparkles size={15} /> Lançamentos de hoje <span>{todayCount}</span>
          </button>
          {hasFilters && (
            <button className="clear-filters" onClick={clearFilters}>
              <X size={14} /> Limpar
            </button>
          )}
        </div>
      </section>
      <div className="library-results-heading">
        <p aria-live="polite">
          <strong>{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "obra encontrada" : "obras encontradas"}
          {loading && data.length > 0 ? " · Atualizando..." : ""}
        </p>
        <div className="library-view-actions">
          <button
            className="ui-button-secondary organize-button"
            disabled={loading || pending.size > 0 || filtered.length < 2}
            onClick={() => setOrganizing(true)}
          >
            <GripVertical size={16} /> Organizar
          </button>
          <div className="library-sort">
            <ArrowDownWideNarrow size={16} />
            <select
              aria-label="Ordenar obras"
              value={filters.sort}
              onChange={(event) => changeFilter("sort", event.target.value)}
            >
              <option value="manual">Minha ordem</option>
              <option value="title-asc">Título: A–Z</option>
              <option value="title-desc">Título: Z–A</option>
              <option value="progress-desc">Maior progresso</option>
              <option value="progress-asc">Menor progresso</option>
            </select>
          </div>
        </div>
      </div>
      {loadError && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchData}
              disabled={loading || pending.size > 0}
            >
              <RotateCcw size={14} /> Tentar novamente
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}
      {loading && !data.length ? (
        <div
          className="media-grid"
          aria-label="Carregando biblioteca"
          aria-busy="true"
        >
          {Array.from({ length: 8 }, (_, index) => (
            <div className="media-skeleton" key={index}>
              <div />
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <>
          <section className="media-grid" aria-label="Obras da biblioteca">
            {paginated.items.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                today={today}
                busy={pending.has(item.id)}
                blocked={pending.size > 0}
                onEdit={setEditing}
                onDelete={(item) => {
                  setDeleteError("");
                  setDeleting(item);
                }}
                onIncrement={increment}
                onToggleEmail={toggleEmail}
                emailsEnabled={emailsEnabled}
              />
            ))}
          </section>
          {paginated.totalPages > 1 && (
            <nav className="library-pagination" aria-label="Paginação">
              <button
                className="ui-button-secondary"
                disabled={paginated.page === 1}
                onClick={() => setPage(paginated.page - 1)}
              >
                <ChevronLeft size={17} /> Anterior
              </button>
              <span>
                Página <strong>{paginated.page}</strong> de{" "}
                {paginated.totalPages}
              </span>
              <button
                className="ui-button-secondary"
                disabled={paginated.page === paginated.totalPages}
                onClick={() => setPage(paginated.page + 1)}
              >
                Próxima <ChevronRight size={17} />
              </button>
            </nav>
          )}
        </>
      ) : (
        !loadError && (
          <section className="library-empty">
            <span className="empty-icon">
              <BookOpen size={36} />
            </span>
            <h2>
              {data.length
                ? filters.status === "Em andamento" &&
                  !filters.search &&
                  !filters.type &&
                  !filters.day &&
                  !filters.todayOnly
                  ? "Nenhuma obra em andamento"
                  : "Nenhuma história por aqui"
                : "Sua próxima história começa aqui"}
            </h2>
            <p>
              {data.length
                ? "Tente outro título ou ajuste os filtros para encontrar suas obras."
                : "Adicione seus animes, mangás, séries e filmes para acompanhar tudo em um só lugar."}
            </p>
            {data.length ? (
              <button className="ui-button-secondary" onClick={clearFilters}>
                Ver todas as obras
              </button>
            ) : (
              <Link className="ui-button" to="/dashboard">
                <Plus size={17} /> Adicionar primeira obra
              </Link>
            )}
          </section>
        )
      )}
      {organizing && (
        <LibraryOrderDialog
          allItems={filterLibrary(data, { sort: "manual" })}
          visibleItems={filtered}
          busy={pending.has("library-order")}
          onClose={() => setOrganizing(false)}
          onSave={saveOrder}
        />
      )}
      {editing && (
        <MediaEditDialog
          key={editing.id}
          item={editing}
          busy={pending.has(editing.id)}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}
      <Dialog
        open={Boolean(deleting)}
        onClose={() => !pending.has(deleting?.id) && setDeleting(null)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="delete-media-title"
        aria-describedby="delete-media-description"
      >
        <DialogTitle id="delete-media-title">
          Remover da biblioteca?
        </DialogTitle>
        <DialogContent>
          <p id="delete-media-description" className="delete-description">
            Você vai remover <strong>{deleting?.nome}</strong> e seu progresso
            da coleção. Essa ação não pode ser desfeita.
          </p>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            color="inherit"
            disabled={pending.has(deleting?.id)}
            onClick={() => setDeleting(null)}
          >
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={pending.has(deleting?.id)}
            onClick={confirmDelete}
          >
            {pending.has(deleting?.id) ? (
              <ButtonSpinner />
            ) : (
              <Trash2 size={16} />
            )}{" "}
            Remover obra
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
