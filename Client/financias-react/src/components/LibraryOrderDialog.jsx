import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
} from "@mui/material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, Save } from "lucide-react";
import MediaCover from "./MediaCover";
import ButtonSpinner from "./ButtonSpinner";
import { mediaImageSource } from "../utils/mediaImages";
import { mergeVisibleOrder } from "../utils/library";

function SortableWork({ item, index, count, busy, onMove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: busy });
  return (
    <li
      ref={setNodeRef}
      className={`order-work ${isDragging ? "dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="order-drag-handle ui-icon-button"
        disabled={busy}
        aria-label={`Arrastar ${item.nome}`}
        aria-roledescription="obra reordenável"
      >
        <GripVertical size={21} />
      </button>
      <span className="order-position" aria-label={`Posição ${index + 1}`}>
        {index + 1}
      </span>
      <MediaCover
        src={mediaImageSource(item)}
        alt=""
        className="order-cover"
        loading="lazy"
      />
      <span className="order-work-text">
        <strong>{item.nome}</strong>
        <small>
          {item.tipoMidia || "Mídia"} · {item.status || "Sem status"}
        </small>
      </span>
      <div className="order-arrow-buttons">
        <button
          className="ui-icon-button"
          disabled={busy || index === 0}
          onClick={() => onMove(index, index - 1)}
          aria-label={`Mover ${item.nome} para cima`}
        >
          <ArrowUp size={17} />
        </button>
        <button
          className="ui-icon-button"
          disabled={busy || index === count - 1}
          onClick={() => onMove(index, index + 1)}
          aria-label={`Mover ${item.nome} para baixo`}
        >
          <ArrowDown size={17} />
        </button>
      </div>
    </li>
  );
}

export default function LibraryOrderDialog({
  allItems,
  visibleItems,
  busy,
  onClose,
  onSave,
}) {
  const [selection] = useState(() => ({
    allIds: allItems.map((item) => item.id),
    byId: new Map(visibleItems.map((item) => [item.id, item])),
  }));
  const [ids, setIds] = useState(() => [...selection.byId.keys()]);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const byId = selection.byId;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function move(from, to) {
    if (busy || from === to || from < 0 || to < 0 || to >= ids.length) return;
    setIds((previous) => arrayMove(previous, from, to));
    setAnnouncement(
      `${byId.get(ids[from]).nome} movida para a posição ${to + 1}.`,
    );
    setError("");
  }
  async function save() {
    if (busy) return;
    try {
      await onSave(mergeVisibleOrder(selection.allIds, ids));
    } catch (cause) {
      setError(
        cause.message || "Não foi possível salvar sua ordem. Tente novamente.",
      );
    }
  }
  const title = (id) => byId.get(id)?.nome || "Obra";
  return (
    <Dialog
      open
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      onClose={() => !busy && onClose()}
      aria-labelledby="library-order-title"
      aria-describedby="library-order-description"
    >
      <DialogTitle id="library-order-title">
        Organizar minha biblioteca
      </DialogTitle>
      <DialogContent dividers>
        <p id="library-order-description" className="order-description">
          Arraste pela alça ou use as setas para escolher o que aparece
          primeiro. Sua ordem fica salva na conta.
        </p>
        <p className="order-selection-count">
          {ids.length} obras do filtro atual · Inclui todas as páginas
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={({ active, over }) => {
            if (over) move(ids.indexOf(active.id), ids.indexOf(over.id));
          }}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                "Para mover uma obra, pressione Espaço. Use as setas para mudar de posição, Espaço para soltar e Escape para cancelar.",
            },
            announcements: {
              onDragStart: ({ active }) =>
                `${title(active.id)} selecionada. Use as setas para mover.`,
              onDragOver: ({ active, over }) =>
                over
                  ? `${title(active.id)} na posição ${ids.indexOf(over.id) + 1}.`
                  : undefined,
              onDragEnd: ({ active, over }) =>
                over
                  ? `${title(active.id)} movida para a posição ${ids.indexOf(over.id) + 1}.`
                  : "Movimento cancelado.",
              onDragCancel: () => "Movimento cancelado.",
            },
          }}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ol className="order-work-list">
              {ids.map((id, index) => (
                <SortableWork
                  key={id}
                  item={byId.get(id)}
                  index={index}
                  count={ids.length}
                  busy={busy}
                  onMove={move}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
        <span role="status" className="sr-only">
          {announcement}
        </span>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={save} disabled={busy}>
          {busy ? <ButtonSpinner /> : <Save size={17} />}
          {busy ? "Salvando..." : "Salvar ordem"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
