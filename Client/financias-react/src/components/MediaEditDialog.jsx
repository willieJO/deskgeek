import EmailReminderToggle from "./EmailReminderToggle";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  useMediaQuery,
} from "@mui/material";
import { ImagePlus, Save } from "lucide-react";
import ButtonSpinner from "./ButtonSpinner";
import MediaCover from "./MediaCover";
import { mediaImageSource } from "../utils/mediaImages";
import {
  MEDIA_TYPES,
  STATUSES,
  WEEKDAYS,
  normalize,
  validateMedia,
} from "../utils/library";

export default function MediaEditDialog({ item, busy, onClose, onSave }) {
  const [draft, setDraft] = useState({ ...item });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const film = normalize(draft.tipoMidia) === "filme";
  const episode = ["anime", "serie"].includes(normalize(draft.tipoMidia));

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function change(field, value) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const validation = validateMedia(draft);
    if (validation) {
      setError(validation);
      return;
    }
    try {
      await onSave({ ...draft, imagemUrl: file ? "" : draft.imagemUrl }, file);
    } catch (cause) {
      setError(cause.message || "Não foi possível salvar. Tente novamente.");
    }
  }

  return (
    <Dialog
      open
      onClose={() => !busy && onClose()}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      aria-labelledby="edit-media-title"
      slotProps={{ paper: { component: "form", onSubmit: submit } }}
    >
      <DialogTitle id="edit-media-title">Editar obra</DialogTitle>
      <DialogContent dividers>
        <fieldset disabled={busy} className="edit-fields">
          <div className="edit-cover-row">
            <MediaCover
              src={preview || mediaImageSource(draft)}
              alt={`Capa de ${draft.nome || "obra"}`}
              className="edit-cover"
            />
            <div className="edit-cover-controls">
              <label className="ui-button-secondary upload-button">
                <ImagePlus size={18} /> Trocar capa
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label="Selecionar capa"
                  disabled={busy}
                  onChange={(event) => {
                    const selected = event.target.files?.[0];
                    if (selected) {
                      setFile(selected);
                      setError("");
                    }
                  }}
                />
              </label>
              <p className="section-subtitle">
                Envie uma capa em boa resolução ou informe a URL abaixo. O
                upload preserva o arquivo original.
              </p>
              {file && <p className="file-name">{file.name}</p>}
            </div>
          </div>
          <TextField
            disabled={busy}
            label="URL da capa"
            value={file ? "" : draft.imagemUrl || ""}
            onChange={(event) => {
              setFile(null);
              change("imagemUrl", event.target.value);
            }}
            fullWidth
          />
          <TextField
            disabled={busy}
            label="Nome"
            value={draft.nome || ""}
            onChange={(event) => change("nome", event.target.value)}
            required
            fullWidth
            autoFocus
          />
          <div className="edit-field-grid">
            <TextField
              disabled={busy}
              select
              label="Tipo de mídia"
              value={draft.tipoMidia || ""}
              onChange={(event) => change("tipoMidia", event.target.value)}
              fullWidth
            >
              <MenuItem value="">Não definido</MenuItem>
              {draft.tipoMidia && !MEDIA_TYPES.includes(draft.tipoMidia) && (
                <MenuItem value={draft.tipoMidia}>{draft.tipoMidia}</MenuItem>
              )}
              {MEDIA_TYPES.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              disabled={busy}
              select
              label="Status"
              value={draft.status || ""}
              onChange={(event) => change("status", event.target.value)}
              fullWidth
            >
              <MenuItem value="">Não definido</MenuItem>
              {draft.status && !STATUSES.includes(draft.status) && (
                <MenuItem value={draft.status}>{draft.status}</MenuItem>
              )}
              {STATUSES.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
          </div>
          <div className="edit-field-grid">
            <TextField
              disabled={busy}
              label={
                film
                  ? "Total"
                  : `Total de ${episode ? "episódios" : "capítulos"}`
              }
              type="number"
              value={draft.totalCapitulos ?? ""}
              onChange={(event) => change("totalCapitulos", event.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              fullWidth
            />
            <TextField
              disabled={busy}
              label={
                film
                  ? "Progresso"
                  : `${episode ? "Episódio" : "Capítulo"} atual`
              }
              type="number"
              value={draft.capituloAtual ?? ""}
              onChange={(event) => change("capituloAtual", event.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              fullWidth
            />
          </div>
          {!film && (
            <TextField
              disabled={busy}
              select
              label="Dia de lançamento"
              value={draft.diaNovoCapitulo || ""}
              onChange={(event) =>
                change("diaNovoCapitulo", event.target.value)
              }
              fullWidth
            >
              <MenuItem value="">Sem dia definido</MenuItem>
              {draft.diaNovoCapitulo &&
                !WEEKDAYS.includes(draft.diaNovoCapitulo) && (
                  <MenuItem value={draft.diaNovoCapitulo}>
                    {draft.diaNovoCapitulo}
                  </MenuItem>
                )}
              {WEEKDAYS.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
          )}
          <EmailReminderToggle
            checked={draft.notificarLancamentos ?? true}
            onChange={(value) => change("notificarLancamentos", value)}
            disabled={busy}
          />
          <TextField
            disabled={busy}
            label="Link para assistir ou ler"
            placeholder="https://..."
            value={draft.urlMidia || ""}
            onChange={(event) => change("urlMidia", event.target.value)}
            fullWidth
          />
        </fieldset>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} role="alert">
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" variant="contained" disabled={busy}>
          {busy ? <ButtonSpinner /> : <Save size={17} />}
          {busy ? "Salvando..." : "Salvar alterações"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
