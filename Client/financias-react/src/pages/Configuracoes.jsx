import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ButtonSpinner from "../components/ButtonSpinner";
import api from "../utils/api";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function AvatarPreview({ currentUser, localPreviewUrl }) {
  const remoteUrl =
    currentUser?.fotoPerfilDisponivel && currentUser?.fotoCacheKey
      ? `${api.getUri({ url: "/usuario/me/foto" })}?v=${currentUser.fotoCacheKey}`
      : null;

  const imageSrc = localPreviewUrl || remoteUrl;
  const fallbackLetter = (currentUser?.usuario || currentUser?.email || "U")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt="Foto de perfil"
        className="h-24 w-24 rounded-full border border-cyan-300/35 object-cover"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-300/10 text-2xl font-bold text-cyan-100">
      {fallbackLetter}
    </div>
  );
}

export default function Configuracoes({ currentUser, refreshCurrentUser }) {
  const [nome, setNome] = useState(currentUser?.usuario || "");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmNovaSenha, setConfirmNovaSenha] = useState("");

  useEffect(() => {
    setNome(currentUser?.usuario || "");
  }, [currentUser?.usuario]);

  const localPreviewUrl = useMemo(() => {
    if (!selectedPhoto) return null;
    return URL.createObjectURL(selectedPhoto);
  }, [selectedPhoto]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  async function handleSaveName(e) {
    e.preventDefault();
    if (isSavingName) return;

    const usuario = nome.trim();
    if (!usuario) {
      toast.error("Informe um nome de usuário válido.");
      return;
    }
    if (usuario.length < 3) {
      toast.error("O nome deve ter pelo menos 3 caracteres.");
      return;
    }

    setIsSavingName(true);
    try {
      await api.put("/usuario/me/nome", { usuario });
      const refreshed = await refreshCurrentUser?.();
      setNome(refreshed?.usuario || usuario);
      toast.success("Nome atualizado com sucesso.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Erro ao atualizar nome.");
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleSavePassword(e) {
    e.preventDefault();
    if (isSavingPassword) return;

    if (!senhaAtual || !novaSenha || !confirmNovaSenha) {
      toast.error("Preencha todos os campos de senha.");
      return;
    }
    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmNovaSenha) {
      toast.error("A confirmação da nova senha não confere.");
      return;
    }
    if (senhaAtual === novaSenha) {
      toast.error("A nova senha deve ser diferente da senha atual.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await api.put("/usuario/me/senha", {
        senhaAtual,
        novaSenha,
      });
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmNovaSenha("");
      toast.success("Senha atualizada com sucesso.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Erro ao atualizar senha.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleSavePhoto(e) {
    e.preventDefault();
    if (isSavingPhoto) return;
    if (!selectedPhoto) {
      toast.error("Selecione uma foto para enviar.");
      return;
    }
    if (selectedPhoto.size > MAX_PHOTO_BYTES) {
      toast.error("A foto deve ter no máximo 2MB.");
      return;
    }
    if (!ALLOWED_PHOTO_TYPES.has(selectedPhoto.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WEBP.");
      return;
    }

    setIsSavingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("foto", selectedPhoto);
      await api.put("/usuario/me/foto", formData);
      setSelectedPhoto(null);
      await refreshCurrentUser?.();
      toast.success("Foto de perfil atualizada com sucesso.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Erro ao atualizar foto.");
    } finally {
      setIsSavingPhoto(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-700/40 bg-[rgba(9,18,34,0.75)] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
              Configurações
            </p>
            <h1 className="mt-1 text-xl font-extrabold text-slate-50">Perfil</h1>
            <p className="mt-2 text-sm text-slate-400">
              Atualize foto, nome de usuário e senha de forma independente.
            </p>
          </div>
          <div className="rounded-xl border border-slate-500/30 bg-slate-900/40 px-3 py-2 text-sm text-slate-300">
            Email: <span className="font-semibold text-slate-100">{currentUser?.email || "-"}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <form
          onSubmit={handleSavePhoto}
          className="rounded-2xl border border-slate-700/40 bg-[rgba(9,18,34,0.75)] p-4 sm:p-6"
        >
          <h2 className="text-lg font-bold text-slate-50">Foto de perfil</h2>
          <p className="mt-1 text-sm text-slate-400">
            Formatos permitidos: JPG, PNG, WEBP. Tamanho máximo: 2MB.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <AvatarPreview currentUser={currentUser} localPreviewUrl={localPreviewUrl} />
            <div className="flex-1 min-w-[220px]">
              <label className="ui-label" htmlFor="foto-perfil">
                Selecionar foto
              </label>
              <input
                id="foto-perfil"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setSelectedPhoto(e.target.files?.[0] || null)}
                className="ui-input file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-300/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-cyan-100"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button type="submit" className="ui-button" disabled={isSavingPhoto}>
              {isSavingPhoto ? (
                <>
                  <ButtonSpinner />
                  Salvando foto...
                </>
              ) : (
                "Salvar foto"
              )}
            </button>
          </div>
        </form>

        <form
          onSubmit={handleSaveName}
          className="rounded-2xl border border-slate-700/40 bg-[rgba(9,18,34,0.75)] p-4 sm:p-6"
        >
          <h2 className="text-lg font-bold text-slate-50">Nome de usuário</h2>
          <p className="mt-1 text-sm text-slate-400">Esse nome é usado nas buscas de usuário e exibição no app.</p>

          <div className="mt-4">
            <label className="ui-label" htmlFor="perfil-usuario">
              Nome (usuário)
            </label>
            <input
              id="perfil-usuario"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="ui-input"
              maxLength={100}
              required
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button type="submit" className="ui-button" disabled={isSavingName}>
              {isSavingName ? (
                <>
                  <ButtonSpinner />
                  Salvando nome...
                </>
              ) : (
                "Salvar nome"
              )}
            </button>
          </div>
        </form>
      </div>

      <form
        onSubmit={handleSavePassword}
        className="rounded-2xl border border-slate-700/40 bg-[rgba(9,18,34,0.75)] p-4 sm:p-6"
      >
        <h2 className="text-lg font-bold text-slate-50">Senha</h2>
        <p className="mt-1 text-sm text-slate-400">Informe sua senha atual para confirmar a alteração.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="ui-label" htmlFor="senha-atual">
              Senha atual
            </label>
            <input
              id="senha-atual"
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className="ui-input"
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label className="ui-label" htmlFor="nova-senha">
              Nova senha
            </label>
            <input
              id="nova-senha"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="ui-input"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="ui-label" htmlFor="confirmar-nova-senha">
              Confirmar nova senha
            </label>
            <input
              id="confirmar-nova-senha"
              type="password"
              value={confirmNovaSenha}
              onChange={(e) => setConfirmNovaSenha(e.target.value)}
              className="ui-input"
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="submit" className="ui-button" disabled={isSavingPassword}>
            {isSavingPassword ? (
              <>
                <ButtonSpinner />
                Alterando senha...
              </>
            ) : (
              "Alterar senha"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
