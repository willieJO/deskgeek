import { useState, useEffect } from "react";
import { request, gql } from "graphql-request";
import api from "../utils/api";
import { toast } from "react-toastify";

const anilistEndpoint = "https://graphql.anilist.co";
const tvMazeEndpoint = "https://api.tvmaze.com";
const wikipediaPtEndpoint = "https://pt.wikipedia.org/w/api.php";
const wikipediaEnEndpoint = "https://en.wikipedia.org/w/api.php";
const fallbackCover = "https://placehold.co/120x168?text=No+Image&font=roboto";

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

const tipoOptions = [
  { value: "ANIME", label: "Anime" },
  { value: "MANGA", label: "Mangá" },
  { value: "MANHUA", label: "Manhua" },
  { value: "SERIE", label: "Série" },
  { value: "FILME", label: "Filme" },
];

function getTipoLabel(tipo) {
  return tipoOptions.find((item) => item.value === tipo)?.label || "Mídia";
}

function isTipoEpisodio(tipo) {
  return tipo === "ANIME" || tipo === "SERIE";
}

function isTipoFilme(tipo) {
  return tipo === "FILME";
}

function getLabelsByTipo(tipo) {
  if (isTipoEpisodio(tipo)) {
    return {
      totalLabel: "Total de episódios",
      atualLabel: "Episódio atual",
      diaLabel: "Dia de novos episódios",
    };
  }

  if (isTipoFilme(tipo)) {
    return {
      totalLabel: "Total",
      atualLabel: "",
      diaLabel: "Dia de lançamento",
    };
  }

  return {
    totalLabel: "Total de capítulos",
    atualLabel: "Capítulo atual",
    diaLabel: "Dia de novos capítulos",
  };
}

function toOptionalNumber(value) {
  const raw = String(value ?? "").trim();
  if (raw === "") return "";

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : "";
}

function normalizeCover(url) {
  return url || fallbackCover;
}

function buildMangadexCoverProxyUrl(mangaId, fileName) {
  if (!mangaId || !fileName) return "";
  const apiBaseUrl = String(api?.defaults?.baseURL || "").replace(/\/$/, "");
  const mangaIdEncoded = encodeURIComponent(String(mangaId));
  const fileNameEncoded = encodeURIComponent(String(fileName));

  if (!apiBaseUrl) {
    return `/api/MediaDex/mangadex/cover/${mangaIdEncoded}/${fileNameEncoded}`;
  }

  return `${apiBaseUrl}/MediaDex/mangadex/cover/${mangaIdEncoded}/${fileNameEncoded}`;
}

export default function MediaTracker() {
  const [tipo, setTipo] = useState("ANIME");
  const [busca, setBusca] = useState("");
  const [sugestoes, setSugestoes] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [ultimaSelecaoValida, setUltimaSelecaoValida] = useState(null);

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
      return data.Page.media.map((item) => ({
        id: item.id,
        title: { romaji: item.title?.romaji || "Título indisponível" },
        coverImage: { medium: normalizeCover(item.coverImage?.medium) },
        episodes: item.episodes,
        chapters: item.chapters,
        total: item.episodes ?? item.chapters ?? null,
        runtime: null,
      }));
    } catch {
      return [];
    }
  }

  async function buscarManhua(search) {
    if (!search) return [];
    try {
      const response = await api.get("/MediaDex/mangadex/search", {
        params: { title: search },
      });
      const json = response.data;
      const includedCoverMap = new Map(
        (json?.included || [])
          .filter((entry) => entry?.type === "cover_art")
          .map((entry) => [entry.id, entry?.attributes?.fileName])
      );

      return (json?.data || []).map((item) => {
        const attributes = item.attributes || {};
        const titleObj = attributes.title || {};
        const titleRomaji = titleObj.en || Object.values(titleObj)[0] || "Título indisponível";

        const coverRel = (item.relationships || []).find((rel) => rel.type === "cover_art");
        const coverFile = coverRel?.attributes?.fileName || includedCoverMap.get(coverRel?.id);
        const coverUrl = coverFile
          ? buildMangadexCoverProxyUrl(item.id, coverFile)
          : "";

        return {
          id: item.id,
          title: { romaji: titleRomaji },
          coverImage: { medium: normalizeCover(coverUrl) },
          episodes: null,
          chapters: attributes.chapterCount || null,
          total: attributes.chapterCount || null,
          runtime: null,
        };
      });
    } catch {
      return [];
    }
  }

  async function buscarSeries(search) {
    if (!search) return [];
    try {
      const res = await fetch(`${tvMazeEndpoint}/search/shows?q=${encodeURIComponent(search)}`);
      const json = await res.json();

      return (json || []).slice(0, 10).map((item) => {
        const show = item.show || {};
        return {
          id: show.id,
          title: { romaji: show.name || "Série sem nome" },
          coverImage: { medium: normalizeCover(show.image?.medium || show.image?.original) },
          episodes: null,
          chapters: null,
          total: null,
          runtime: show.averageRuntime || null,
        };
      });
    } catch {
      return [];
    }
  }

  async function buscarFilmes(search) {
    if (!search) return [];
    try {
      const buildWikiUrl = (endpoint, term) =>
        `${endpoint}?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(
          term
        )}&gsrlimit=10&prop=pageimages|info&piprop=thumbnail&pithumbsize=300&inprop=url`;

      const mapWikiPages = (json) => {
        const pages = Object.values(json?.query?.pages || {});
        if (!pages.length) return [];

        return pages
          .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
          .map((item) => ({
            id: item.pageid,
            title: { romaji: item.title || "Filme sem nome" },
            coverImage: { medium: normalizeCover(item.thumbnail?.source || "") },
            episodes: null,
            chapters: null,
            total: 1,
            runtime: null,
          }));
      };

      const resPt = await fetch(buildWikiUrl(wikipediaPtEndpoint, `${search} filme`));
      const jsonPt = await resPt.json();
      const ptResultados = mapWikiPages(jsonPt);
      if (ptResultados.length > 0) {
        return ptResultados;
      }

      const resEn = await fetch(buildWikiUrl(wikipediaEnEndpoint, `${search} film`));
      const jsonEn = await resEn.json();
      const enResultados = mapWikiPages(jsonEn);
      if (enResultados.length > 0) {
        return enResultados;
      }

      return [];
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
        setSugestoes(await buscarManhua(busca));
        return;
      }

      if (tipo === "SERIE") {
        setSugestoes(await buscarSeries(busca));
        return;
      }

      if (tipo === "FILME") {
        setSugestoes(await buscarFilmes(busca));
        return;
      }

      setSugestoes(await buscarAnilist(busca, tipo));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [busca, tipo]);

  const handleSelecionar = (item) => {
    setSelecionado(item);
    setUltimaSelecaoValida(item);
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
    setNovoTotalCapitulos(isTipoFilme(tipo) ? "1" : "");
    setNovoStatus("Em andamento");
    setNovoCapituloAtual("");
    setSelecionado(null);
    setUltimaSelecaoValida(null);
  };

  const resetSearchState = () => {
    setSelecionado(null);
    setUltimaSelecaoValida(null);
    setSugestoes([]);
    setBusca("");
    setCriandoNovo(false);
    setCapituloAtual("");
    setStatus("Em andamento");
    setDiaNovosCapitulos("");
  };

  async function handleEnviar() {
    const itemSelecionado = selecionado || ultimaSelecaoValida;

    if (!criandoNovo && !itemSelecionado) {
      toast.info("Escolha uma obra ou crie um novo registro.");
      return;
    }

    if (criandoNovo && !novoTitulo.trim()) {
      toast.info("Informe um título para continuar.");
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    const tipoLabel = getTipoLabel(tipo);
    const fallbackTotal = isTipoFilme(tipo) ? 1 : "";

    const nome = criandoNovo ? novoTitulo : itemSelecionado.title.romaji;

    let totalCapitulos = fallbackTotal;
    if (criandoNovo) {
      const novoTotalParsed = toOptionalNumber(novoTotalCapitulos);
      totalCapitulos = novoTotalParsed === "" ? fallbackTotal : novoTotalParsed;
    } else {
      const totalSelecionado =
        itemSelecionado.total ?? itemSelecionado.chapters ?? itemSelecionado.episodes ?? fallbackTotal;
      totalCapitulos = totalSelecionado ?? fallbackTotal;
    }

    const capAtualEnviar = criandoNovo
      ? toOptionalNumber(novoCapituloAtual)
      : toOptionalNumber(capituloAtual);

    const statusAtual = criandoNovo ? novoStatus : status;

    formData.append("Nome", nome);
    formData.append("TipoMidia", tipoLabel);
    formData.append("TotalCapitulos", String(totalCapitulos));
    formData.append("CapituloAtual", capAtualEnviar === "" ? "" : String(capAtualEnviar));
    formData.append("Status", statusAtual);
    formData.append("DiaNovoCapitulo", isTipoFilme(tipo) ? "" : diaNovosCapitulos);

    if (criandoNovo && novaImagemFile) {
      formData.append("ImagemUpload", novaImagemFile);
    } else if (
      itemSelecionado?.coverImage?.medium &&
      !String(itemSelecionado.coverImage.medium).includes("placehold.co")
    ) {
      formData.append("imagemUrl", itemSelecionado.coverImage.medium);
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

  const labels = getLabelsByTipo(tipo);
  const itemSelecionado = selecionado || ultimaSelecaoValida;

  return (
    <div className="app-shell">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <section className="page-surface fade-slide-in p-5 sm:p-7">
          <p className="section-tag">Coleção</p>
          <h1 className="section-title">Acompanhar Anime, Mangá, Manhua, Série e Filme</h1>
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
                {tipoOptions.map((tipoItem) => (
                  <option key={tipoItem.value} value={tipoItem.value}>
                    {tipoItem.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="ui-label">Busca</label>
              <input
                type="text"
                placeholder={`Digite o nome de ${getTipoLabel(tipo).toLowerCase()}...`}
                className="ui-input"
                value={busca}
                onChange={(e) => {
                  const novoValorBusca = e.target.value;
                  setBusca(novoValorBusca);

                  if (itemSelecionado && novoValorBusca !== itemSelecionado.title.romaji) {
                    setSelecionado(null);
                    setUltimaSelecaoValida(null);
                  }

                  setCriandoNovo(false);
                  setCapituloAtual("");
                  setStatus("Em andamento");
                }}
              />

              {sugestoes.length > 0 && !itemSelecionado && !criandoNovo && (
                <ul className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-500/40 bg-[rgba(8,16,32,0.97)] p-1 shadow-2xl">
                  {sugestoes.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => handleSelecionar(item)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-cyan-300/15"
                      >
                        <img
                          src={normalizeCover(item.coverImage?.medium)}
                          alt={item.title.romaji}
                          className="h-14 w-10 rounded-md object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = fallbackCover;
                          }}
                        />
                        <span className="text-sm text-slate-100">{item.title.romaji}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {sugestoes.length === 0 && busca.length >= 2 && !itemSelecionado && !criandoNovo && (
            <button onClick={handleCriarNovoClick} className="ui-link mt-4 text-sm" type="button">
              Não encontrou? Clique para cadastrar manualmente.
            </button>
          )}
        </section>

        {criandoNovo && (
          <section className="page-surface fade-slide-in space-y-4 border border-cyan-300/40 p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-slate-50">
              Novo {getTipoLabel(tipo).toLowerCase()}
            </h2>

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
                <label className="ui-label">{labels.totalLabel}</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Desconhecido"
                  className="ui-input"
                  value={novoTotalCapitulos}
                  onChange={(e) => setNovoTotalCapitulos(e.target.value)}
                />
              </div>

              {!isTipoFilme(tipo) && (
                <div>
                  <label className="ui-label">{labels.atualLabel}</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    className="ui-input"
                    value={novoCapituloAtual}
                    onChange={(e) => setNovoCapituloAtual(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {!isTipoFilme(tipo) && (
                <div>
                  <label className="ui-label">{labels.diaLabel}</label>
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
              )}

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
                {isSaving ? "Salvando..." : `Salvar novo ${getTipoLabel(tipo).toLowerCase()}`}
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

        {itemSelecionado && !criandoNovo && (
          <section className="page-surface fade-slide-in space-y-4 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <img
                src={normalizeCover(itemSelecionado.coverImage?.medium)}
                alt={itemSelecionado.title.romaji}
                className="h-40 w-28 rounded-lg border border-slate-500/35 object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackCover;
                }}
              />

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-50">{itemSelecionado.title.romaji}</h2>
                <p className="text-sm text-slate-300">
                  {isTipoEpisodio(tipo)
                    ? `Total de episódios: ${itemSelecionado.total ?? "Desconhecido"}`
                    : isTipoFilme(tipo)
                      ? `Duração: ${itemSelecionado.runtime || "Desconhecida"} min`
                      : `Total de capítulos: ${itemSelecionado.total ?? "Desconhecido"}`}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {!isTipoFilme(tipo) && (
                <div>
                  <label className="ui-label">{labels.atualLabel}</label>
                  <input
                    type="number"
                    className="ui-input"
                    value={capituloAtual}
                    onChange={(e) => setCapituloAtual(e.target.value)}
                  />
                </div>
              )}

              {!isTipoFilme(tipo) && (
                <div>
                  <label className="ui-label">{labels.diaLabel}</label>
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
              )}
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
