import { useState, useEffect } from "react";
import { request, gql } from "graphql-request";
import api from "../utils/api";
import { toast } from "react-toastify";

const anilistEndpoint = "https://graphql.anilist.co";
const mangaDexEndpoint = "https://api.mangadex.org";

const anilistQuery = gql`
  query ($search: String, $type: MediaType) {
    Page(perPage: 10) {
      media(search: $search, type: $type) {
        id
        title {
          romaji
        }
        coverImage {
          medium
        }
        episodes
        chapters
      }
    }
  }
`;

const diasSemana = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const statusOptions = ["Em andamento", "Finalizado", "Inativo"];

export default function MediaTracker() {
  const [tipo, setTipo] = useState("ANIME");
  const [busca, setBusca] = useState("");
  const [sugestoes, setSugestoes] = useState([]);
  const [selecionado, setSelecionado] = useState(null);

  const [capituloAtual, setCapituloAtual] = useState("");
  const [status, setStatus] = useState("Em andamento");

  const [criandoNovo, setCriandoNovo] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaImagemFile, setNovaImagemFile] = useState(null);
  const [novaImagemPreview, setNovaImagemPreview] = useState(null);
  const [novoTotalCapitulos, setNovoTotalCapitulos] = useState("");
  const [novoStatus, setNovoStatus] = useState("Em andamento");
  const [novoCapituloAtual, setNovoCapituloAtual] = useState("");
  const [diaNovosCapitulos, setDiaNovosCapitulos] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function buscarAnilist(search, type) {
    if (!search) return [];
    try {
      const data = await request(anilistEndpoint, anilistQuery, { search, type });
      return data.Page.media;
    } catch {
      return [];
    }
  }

  async function buscarManhua(search) {
    if (!search) return [];
    try {
      const url = `${mangaDexEndpoint}/manga?limit=10&title=${encodeURIComponent(
        search
      )}&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic&includes[]=cover_art&availableTranslatedLanguage[]=en&order[relevance]=desc`;

      const res = await fetch(url);
      const json = await res.json();

      return json.data.map((item) => {
        const attributes = item.attributes;
        const titleObj = attributes.title;
        const titleRomaji =
          titleObj.en || Object.values(titleObj)[0] || "Título indisponível";

        const coverRel = item.relationships.find((rel) => rel.type === "cover_art");
        const coverFile = coverRel?.attributes?.fileName;
        const coverUrl = coverFile
          ? `https://uploads.mangadex.org/covers/${item.id}/${coverFile}.256.jpg`
          : "";

        return {
          id: item.id,
          title: { romaji: titleRomaji },
          coverImage: { medium: coverUrl },
          episodes: null,
          chapters: attributes.chapterCount || null,
        };
      });
    } catch {
      return [];
    }
  }

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (busca.length < 2) {
        setSugestoes([]);
        setCriandoNovo(false);
        return;
      }

      setCriandoNovo(false);

      if (tipo === "MANHUA") {
        const resultados = await buscarManhua(busca);
        setSugestoes(resultados);
      } else {
        const resultados = await buscarAnilist(busca, tipo);
        setSugestoes(resultados);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [busca, tipo]);

  const handleSelecionar = (item) => {
    setSelecionado(item);
    setSugestoes([]);
    setBusca(item.title.romaji);
    setCriandoNovo(false);
    setCapituloAtual("");
    setStatus("Em andamento");
  };

  const handleImagemChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNovaImagemFile(file);
      setNovaImagemPreview(URL.createObjectURL(file));
    } else {
      setNovaImagemFile(null);
      setNovaImagemPreview(null);
    }
  };

  const handleCriarNovoClick = () => {
    setCriandoNovo(true);
    setNovoTitulo(busca);
    setNovaImagemFile(null);
    setNovaImagemPreview(null);
    setNovoTotalCapitulos("");
    setNovoStatus("Em andamento");
    setNovoCapituloAtual("");
    setSelecionado(null);
  };

  const resetSearchState = () => {
    setSelecionado(null);
    setSugestoes([]);
    setBusca("");
    setCriandoNovo(false);
    setCapituloAtual("");
    setStatus("Em andamento");
    setDiaNovosCapitulos("");
  };

  async function handleEnviar() {
    if (!criandoNovo && !selecionado) {
      toast.info("Escolha uma obra ou crie um novo registro.");
      return;
    }

    if (criandoNovo && !novoTitulo.trim()) {
      toast.info("Informe um título para continuar.");
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    const nome = criandoNovo ? novoTitulo : selecionado.title.romaji;
    const totalCapitulos = criandoNovo
      ? novoTotalCapitulos
        ? Number(novoTotalCapitulos)
        : ""
      : selecionado.chapters || selecionado.episodes || "";
    const capAtualEnviar = criandoNovo
      ? novoCapituloAtual
        ? Number(novoCapituloAtual)
        : ""
      : capituloAtual
        ? Number(capituloAtual)
        : "";
    const statusAtual = criandoNovo ? novoStatus : status;

    formData.append("Nome", nome);
    formData.append("TotalCapitulos", totalCapitulos);
    formData.append("CapituloAtual", capAtualEnviar);
    formData.append("Status", statusAtual);
    formData.append("DiaNovoCapitulo", diaNovosCapitulos);

    if (criandoNovo && novaImagemFile) {
      formData.append("ImagemUpload", novaImagemFile);
    } else if (selecionado?.coverImage?.medium) {
      formData.append("imagemUrl", selecionado.coverImage.medium);
    }

    try {
      const res = await api.post("/MediaDex/criar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 200) {
        toast.success("Cadastro realizado com sucesso.");
        setTimeout(() => {
          window.location.reload();
        }, 900);
      } else {
        toast.error("Erro no servidor.");
      }
    } catch {
      toast.error("Erro no servidor.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <section className="page-surface fade-slide-in p-5 sm:p-7">
          <p className="section-tag">Coleção</p>
          <h1 className="section-title">Acompanhar Anime, Mangá e Manhua</h1>
          <p className="section-subtitle">
            Busque uma obra e registre progresso. Se não existir, crie manualmente com
            capa e dados personalizados.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="ui-label">Tipo</label>
              <select
                className="ui-select"
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value);
                  resetSearchState();
                }}
              >
                <option value="ANIME">Anime</option>
                <option value="MANGA">Mangá</option>
                <option value="MANHUA">Manhua</option>
              </select>
            </div>

            <div className="relative">
              <label className="ui-label">Busca</label>
              <input
                type="text"
                placeholder={`Digite o nome do ${tipo.toLowerCase()}...`}
                className="ui-input"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setSelecionado(null);
                  setCriandoNovo(false);
                  setCapituloAtual("");
                  setStatus("Em andamento");
                }}
              />

              {sugestoes.length > 0 && (
                <ul className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-500/40 bg-[rgba(8,16,32,0.97)] p-1 shadow-2xl">
                  {sugestoes.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => handleSelecionar(item)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-cyan-300/15"
                      >
                        <img
                          src={item.coverImage.medium}
                          alt={item.title.romaji}
                          className="h-14 w-10 rounded-md object-cover"
                        />
                        <span className="text-sm text-slate-100">{item.title.romaji}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {sugestoes.length === 0 && busca.length >= 2 && !selecionado && !criandoNovo && (
            <button onClick={handleCriarNovoClick} className="ui-link mt-4 text-sm" type="button">
              Não encontrou? Clique para cadastrar manualmente.
            </button>
          )}
        </section>

        {criandoNovo && (
          <section className="page-surface fade-slide-in space-y-4 border border-cyan-300/40 p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-slate-50">Novo {tipo.toLowerCase()}</h2>

            <div>
              <label className="ui-label">Título</label>
              <input
                type="text"
                className="ui-input"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
              />
            </div>

            <div>
              <label className="ui-label">Imagem</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImagemChange}
                id="upload-image"
                className="hidden"
              />

              <label
                htmlFor="upload-image"
                className="ui-button-secondary inline-block cursor-pointer px-4 py-2 text-sm"
              >
                Selecionar imagem
              </label>

              {novaImagemPreview && (
                <img
                  src={novaImagemPreview}
                  alt="Preview"
                  className="mt-3 h-36 w-24 rounded-md border border-slate-500/40 object-cover"
                />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="ui-label">Total de capítulos</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Desconhecido"
                  className="ui-input"
                  value={novoTotalCapitulos}
                  onChange={(e) => setNovoTotalCapitulos(e.target.value)}
                />
              </div>

              <div>
                <label className="ui-label">Capítulo atual</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  className="ui-input"
                  value={novoCapituloAtual}
                  onChange={(e) => setNovoCapituloAtual(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="ui-label">Dia de novos capítulos</label>
                <select
                  className="ui-select"
                  value={diaNovosCapitulos}
                  onChange={(e) => setDiaNovosCapitulos(e.target.value)}
                >
                  <option value="">Selecione (opcional)</option>
                  {diasSemana.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="ui-label">Status</label>
                <select
                  className="ui-select"
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value)}
                >
                  {statusOptions.map((statusItem) => (
                    <option key={statusItem} value={statusItem}>
                      {statusItem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={handleEnviar} className="ui-button w-full" type="button">
                {isSaving ? "Salvando..." : `Salvar novo ${tipo.toLowerCase()}`}
              </button>
              <button
                onClick={() => setCriandoNovo(false)}
                className="ui-button-secondary w-full"
                type="button"
              >
                Cancelar
              </button>
            </div>
          </section>
        )}

        {selecionado && !criandoNovo && (
          <section className="page-surface fade-slide-in space-y-4 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <img
                src={selecionado.coverImage.medium}
                alt={selecionado.title.romaji}
                className="h-40 w-28 rounded-lg border border-slate-500/35 object-cover"
              />

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-50">
                  {selecionado.title.romaji}
                </h2>
                <p className="text-sm text-slate-300">
                  {tipo === "ANIME"
                    ? `Total de episódios: ${selecionado.episodes || "Desconhecido"}`
                    : `Total de capítulos: ${selecionado.chapters || "Desconhecido"}`}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="ui-label">Capítulo atual</label>
                <input
                  type="number"
                  className="ui-input"
                  value={capituloAtual}
                  onChange={(e) => setCapituloAtual(e.target.value)}
                />
              </div>

              <div>
                <label className="ui-label">Dia de novos capítulos</label>
                <select
                  className="ui-select"
                  value={diaNovosCapitulos}
                  onChange={(e) => setDiaNovosCapitulos(e.target.value)}
                >
                  <option value="">Selecione (opcional)</option>
                  {diasSemana.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="ui-label">Status</label>
              <select
                className="ui-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statusOptions.map((statusItem) => (
                  <option key={statusItem} value={statusItem}>
                    {statusItem}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={handleEnviar} className="ui-button w-full" type="button">
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
