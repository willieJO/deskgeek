import MediaCover from "../components/MediaCover";
import { bestAniListCover } from "../utils/coverImages";
import EmailReminderToggle from "../components/EmailReminderToggle";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Library, Search, Sparkles } from "lucide-react";
import fallbackCover from "../assets/media-placeholder.svg";
import { useState, useEffect } from "react";
import { request, gql } from "graphql-request";
import api from "../utils/api";
import ButtonSpinner from "../components/ButtonSpinner";
import { toast } from "react-toastify";

const anilistEndpoint = "https://graphql.anilist.co";
const tvMazeEndpoint = "https://api.tvmaze.com";
const wikipediaPtEndpoint = "https://pt.wikipedia.org/w/api.php";
const wikipediaEnEndpoint = "https://en.wikipedia.org/w/api.php";

const anilistQuery = gql`
  query ($search: String, $type: MediaType) {
    Page(perPage: 10) {
      media(search: $search, type: $type) {
        id
        title {
          romaji
        }
        coverImage {
          extraLarge
          large
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
  const navigate = useNavigate();
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

  useEffect(
    () => () => {
      if (novaImagemPreview) URL.revokeObjectURL(novaImagemPreview);
    },
    [novaImagemPreview],
  );
  const [novoTotalCapitulos, setNovoTotalCapitulos] = useState("");
  const [novoStatus, setNovoStatus] = useState("Em andamento");
  const [novoCapituloAtual, setNovoCapituloAtual] = useState("");
  const [diaNovosCapitulos, setDiaNovosCapitulos] = useState("");
  const [urlMidia, setUrlMidia] = useState("");
  const [notificarLancamentos, setNotificarLancamentos] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  async function buscarAnilist(search, type) {
    if (!search) return [];
    try {
      const data = await request(anilistEndpoint, anilistQuery, {
        search,
        type,
      });
      return data.Page.media.map((item) => ({
        id: item.id,
        title: { romaji: item.title?.romaji || "Título indisponível" },
        coverUrl: normalizeCover(bestAniListCover(item.coverImage)),
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
          .map((entry) => [entry.id, entry?.attributes?.fileName]),
      );

      return (json?.data || []).map((item) => {
        const attributes = item.attributes || {};
        const titleObj = attributes.title || {};
        const titleRomaji =
          titleObj.en || Object.values(titleObj)[0] || "Título indisponível";

        const coverRel = (item.relationships || []).find(
          (rel) => rel.type === "cover_art",
        );
        const coverFile =
          coverRel?.attributes?.fileName || includedCoverMap.get(coverRel?.id);
        const coverUrl = coverFile
          ? buildMangadexCoverProxyUrl(item.id, coverFile)
          : "";

        return {
          id: item.id,
          title: { romaji: titleRomaji },
          coverUrl: normalizeCover(coverUrl),
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
      const res = await fetch(
        `${tvMazeEndpoint}/search/shows?q=${encodeURIComponent(search)}`,
      );
      const json = await res.json();

      return (json || []).slice(0, 10).map((item) => {
        const show = item.show || {};
        return {
          id: show.id,
          title: { romaji: show.name || "Série sem nome" },
          coverUrl: normalizeCover(show.image?.original || show.image?.medium),
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
          term,
        )}&gsrlimit=10&prop=pageimages|info&piprop=thumbnail&pithumbsize=600&inprop=url`;

      const mapWikiPages = (json) => {
        const pages = Object.values(json?.query?.pages || {});
        if (!pages.length) return [];

        return pages
          .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
          .map((item) => ({
            id: item.pageid,
            title: { romaji: item.title || "Filme sem nome" },
            coverUrl: normalizeCover(item.thumbnail?.source || ""),
            episodes: null,
            chapters: null,
            total: 1,
            runtime: null,
          }));
      };

      const resPt = await fetch(
        buildWikiUrl(wikipediaPtEndpoint, `${search} filme`),
      );
      const jsonPt = await resPt.json();
      const ptResultados = mapWikiPages(jsonPt);
      if (ptResultados.length > 0) {
        return ptResultados;
      }

      const resEn = await fetch(
        buildWikiUrl(wikipediaEnEndpoint, `${search} film`),
      );
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
    let ativo = true;

    const delayDebounce = setTimeout(async () => {
      if (busca.length < 2) {
        if (ativo) {
          setSugestoes([]);
          setCriandoNovo(false);
          setIsSearching(false);
        }
        return;
      }

      if (ativo) {
        setCriandoNovo(false);
        setIsSearching(true);
      }

      try {
        let resultados = [];

        if (tipo === "MANHUA") {
          resultados = await buscarManhua(busca);
        } else if (tipo === "SERIE") {
          resultados = await buscarSeries(busca);
        } else if (tipo === "FILME") {
          resultados = await buscarFilmes(busca);
        } else {
          resultados = await buscarAnilist(busca, tipo);
        }

        if (ativo) {
          setSugestoes(resultados);
        }
      } finally {
        if (ativo) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      ativo = false;
      clearTimeout(delayDebounce);
    };
  }, [busca, tipo]);

  const handleSelecionar = (item) => {
    setSelecionado(item);
    setUltimaSelecaoValida(item);
    setSugestoes([]);
    setBusca(item.title.romaji);
    setCriandoNovo(false);
    setCapituloAtual("");
    setStatus("Em andamento");
    setUrlMidia("");
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
    setUrlMidia("");
  };

  const resetSearchState = () => {
    setNotificarLancamentos(true);
    setSelecionado(null);
    setUltimaSelecaoValida(null);
    setSugestoes([]);
    setIsSearching(false);
    setBusca("");
    setCriandoNovo(false);
    setCapituloAtual("");
    setStatus("Em andamento");
    setDiaNovosCapitulos("");
    setUrlMidia("");
  };

  async function handleEnviar() {
    if (isSaving) return;

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
        itemSelecionado.total ??
        itemSelecionado.chapters ??
        itemSelecionado.episodes ??
        fallbackTotal;
      totalCapitulos = totalSelecionado ?? fallbackTotal;
    }

    const capAtualEnviar = criandoNovo
      ? toOptionalNumber(novoCapituloAtual)
      : toOptionalNumber(capituloAtual);

    const statusAtual = criandoNovo ? novoStatus : status;

    formData.append("NotificarLancamentos", String(notificarLancamentos));
    formData.append("Nome", nome);
    formData.append("TipoMidia", tipoLabel);
    formData.append("TotalCapitulos", String(totalCapitulos));
    formData.append(
      "CapituloAtual",
      capAtualEnviar === "" ? "" : String(capAtualEnviar),
    );
    formData.append("Status", statusAtual);
    formData.append(
      "DiaNovoCapitulo",
      isTipoFilme(tipo) ? "" : diaNovosCapitulos,
    );
    if (urlMidia.trim()) {
      formData.append("urlMidia", urlMidia.trim());
    }

    if (criandoNovo && novaImagemFile) {
      formData.append("ImagemUpload", novaImagemFile);
    } else if (
      itemSelecionado?.coverUrl &&
      itemSelecionado.coverUrl !== fallbackCover
    ) {
      formData.append("imagemUrl", itemSelecionado.coverUrl);
    }

    try {
      const res = await api.post("/MediaDex/criar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 200) {
        setUrlMidia("");
        toast.success("Cadastro realizado com sucesso.");
        navigate("/tabeladex");
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
    <div className="tracker-page">
      <div className="space-y-5">
        <div className="tracker-heading">
          <Link
            to="/tabeladex"
            className="ui-link inline-flex items-center gap-2 text-xs mb-6"
          >
            <ArrowLeft size={15} /> Voltar para biblioteca
          </Link>
          <p className="section-tag block">Descubra sua próxima história</p>
          <h1 className="section-title">
            Adicionar obra<span className="title-dot">.</span>
          </h1>
          <p className="section-subtitle">
            Anime, mangá, manhua, série ou filme. Seu próximo favorito tem lugar
            aqui.
          </p>
        </div>
        <section className="page-surface fade-slide-in p-5 sm:p-7">
          <h2 className="tracker-step">
            <span>01</span>
            <Search size={18} /> Encontre uma obra
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="ui-label" htmlFor="tracker-field-1">
                Tipo
              </label>
              <select
                id="tracker-field-1"
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
              <label className="ui-label" htmlFor="tracker-field-2">
                Busca
              </label>
              <input
                id="tracker-field-2"
                type="text"
                placeholder={`Digite o nome de ${getTipoLabel(tipo).toLowerCase()}...`}
                className="ui-input"
                value={busca}
                onChange={(e) => {
                  const novoValorBusca = e.target.value;
                  setBusca(novoValorBusca);

                  if (
                    itemSelecionado &&
                    novoValorBusca !== itemSelecionado.title.romaji
                  ) {
                    setSelecionado(null);
                    setUltimaSelecaoValida(null);
                  }

                  setCriandoNovo(false);
                  setCapituloAtual("");
                  setStatus("Em andamento");
                  setUrlMidia("");
                }}
              />

              {sugestoes.length > 0 && !itemSelecionado && !criandoNovo && (
                <ul className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-500/40 bg-slate-900 p-1 shadow-2xl">
                  {sugestoes.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => handleSelecionar(item)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-violet-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/50"
                      >
                        <MediaCover
                          src={normalizeCover(item.coverUrl)}
                          alt=""
                          className="h-14 w-10 rounded-md object-cover"
                        />
                        <span className="text-sm text-slate-100">
                          {item.title.romaji}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {isSearching && !itemSelecionado && !criandoNovo && (
                <p className="mt-2 text-sm text-slate-300">
                  Buscando sugestões...
                </p>
              )}
            </div>
          </div>

          {sugestoes.length === 0 &&
            busca.length >= 2 &&
            !itemSelecionado &&
            !criandoNovo && (
              <button
                onClick={handleCriarNovoClick}
                className="ui-link mt-4 text-sm"
                type="button"
              >
                Não encontrou? Clique para cadastrar manualmente.
              </button>
            )}
        </section>

        {!itemSelecionado && !criandoNovo && (
          <div className="tracker-hint">
            <Sparkles size={18} />
            <p>
              Escolha um tipo de mídia e busque pelo título. Você também pode
              cadastrar sua própria obra quando ela não aparecer nos resultados.
            </p>
          </div>
        )}

        {criandoNovo && (
          <section className="page-surface fade-slide-in space-y-4 border border-violet-300/40 p-5 sm:p-6">
            <h2 className="tracker-step">
              <span>02</span>
              <Library size={18} /> Personalize sua obra
            </h2>

            <div>
              <label className="ui-label" htmlFor="tracker-field-3">
                Título
              </label>
              <input
                id="tracker-field-3"
                type="text"
                className="ui-input"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
              />
            </div>

            <div>
              <label className="ui-label" htmlFor="tracker-field-4">
                URL para assistir/ler (opcional)
              </label>
              <input
                id="tracker-field-4"
                type="url"
                placeholder="https://..."
                className="ui-input"
                value={urlMidia}
                onChange={(e) => setUrlMidia(e.target.value)}
              />
            </div>

            <div>
              <span className="ui-label">Imagem</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImagemChange}
                id="upload-image"
                className="sr-only"
              />

              <label
                htmlFor="upload-image"
                className="ui-button-secondary inline-block cursor-pointer px-4 py-2 text-sm upload-button"
              >
                Selecionar imagem
              </label>
              <p className="mt-2 text-xs text-slate-400">
                O arquivo é enviado na resolução original, sem compressão.
                Prefira uma capa de boa resolução para manter a nitidez nos
                cards.
              </p>

              {novaImagemPreview && (
                <MediaCover
                  src={novaImagemPreview}
                  alt="Preview"
                  className="mt-3 h-36 w-24 rounded-md border border-slate-500/40 object-cover"
                />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="ui-label" htmlFor="tracker-field-6">
                  {labels.totalLabel}
                </label>
                <input
                  id="tracker-field-6"
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
                  <label className="ui-label" htmlFor="tracker-field-7">
                    {labels.atualLabel}
                  </label>
                  <input
                    id="tracker-field-7"
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
                  <label className="ui-label" htmlFor="tracker-field-8">
                    {labels.diaLabel}
                  </label>
                  <select
                    id="tracker-field-8"
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
                <label className="ui-label" htmlFor="tracker-field-9">
                  Status
                </label>
                <select
                  id="tracker-field-9"
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

            <EmailReminderToggle
              checked={notificarLancamentos}
              onChange={setNotificarLancamentos}
              disabled={isSaving}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleEnviar}
                className="ui-button w-full"
                type="button"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <ButtonSpinner />
                    Salvando...
                  </>
                ) : (
                  `Salvar novo ${getTipoLabel(tipo).toLowerCase()}`
                )}
              </button>
              <button
                onClick={() => setCriandoNovo(false)}
                className="ui-button-secondary w-full"
                type="button"
                disabled={isSaving}
              >
                Cancelar
              </button>
            </div>
          </section>
        )}

        {itemSelecionado && !criandoNovo && (
          <section className="page-surface fade-slide-in space-y-4 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <MediaCover
                src={normalizeCover(itemSelecionado.coverUrl)}
                alt={itemSelecionado.title.romaji}
                className="h-40 w-28 rounded-lg border border-slate-500/35 object-cover"
              />

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-50">
                  {itemSelecionado.title.romaji}
                </h2>
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
                  <label className="ui-label" htmlFor="tracker-field-10">
                    {labels.atualLabel}
                  </label>
                  <input
                    id="tracker-field-10"
                    type="number"
                    className="ui-input"
                    value={capituloAtual}
                    onChange={(e) => setCapituloAtual(e.target.value)}
                  />
                </div>
              )}

              {!isTipoFilme(tipo) && (
                <div>
                  <label className="ui-label" htmlFor="tracker-field-11">
                    {labels.diaLabel}
                  </label>
                  <select
                    id="tracker-field-11"
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
              <label className="ui-label" htmlFor="tracker-field-12">
                URL para assistir/ler (opcional)
              </label>
              <input
                id="tracker-field-12"
                type="url"
                placeholder="https://..."
                className="ui-input"
                value={urlMidia}
                onChange={(e) => setUrlMidia(e.target.value)}
              />
            </div>

            <div>
              <label className="ui-label" htmlFor="tracker-field-13">
                Status
              </label>
              <select
                id="tracker-field-13"
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

            <EmailReminderToggle
              checked={notificarLancamentos}
              onChange={setNotificarLancamentos}
              disabled={isSaving}
            />

            <button
              onClick={handleEnviar}
              className="ui-button w-full"
              type="button"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <ButtonSpinner />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
