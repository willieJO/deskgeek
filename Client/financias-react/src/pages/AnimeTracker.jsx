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

  async function buscarAnilist(search, type) {
    if (!search) return [];
    try {
      const data = await request(anilistEndpoint, anilistQuery, {
        search,
        type,
      });
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

      const manhuaList = json.data.map((item) => {
        const attributes = item.attributes;
        const titleObj = attributes.title;
        const titleRomaji =
          titleObj.en || Object.values(titleObj)[0] || "Título indisponível";

        const coverRel = item.relationships.find(
          (rel) => rel.type === "cover_art"
        );
        const coverFile = coverRel?.attributes?.fileName;
        const coverUrl = coverFile
          ? `https://uploads.mangadex.org/covers/${item.id}/${coverFile}.256.jpg`
          : "";

        const chapters = attributes.chapterCount || null;

        return {
          id: item.id,
          title: { romaji: titleRomaji },
          coverImage: { medium: coverUrl },
          episodes: null,
          chapters,
        };
      });

      return manhuaList;
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
  };

  async function handleEnviar() {
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
    formData.append("DiaNovoCapitulo", diaNovosCapitulos)
    if (criandoNovo && novaImagemFile) {
      formData.append("ImagemUpload", novaImagemFile);
    } else if (selecionado?.coverImage?.medium) {
      formData.append("imagemUrl", selecionado.coverImage.medium);
    }
    try {
      const res = await api.post("/MediaDex/criar", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
  },
});
      if (res.status == 200) {
          toast.success("Cadastro realizado com sucesso");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
      } else {
        toast.error("Erro no servidor");
      }
    } catch (err) {
      toast.error("Erro no servidor");
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center px-4">
      <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-xl p-6 w-full max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold">Acompanhar Anime/Mangá/Manhua</h1>
        {sugestoes.length === 0 &&
            busca.length >= 2 &&
            !selecionado &&
            !criandoNovo && (
              <button
                className="mt-2 text-purple-500 underline"
                onClick={handleCriarNovoClick}
              >
                Não encontrou? Crie o seu!
              </button>
            )}
        <div>
          <label className="block mb-1 font-medium">Tipo</label>
          <select
            className="w-full p-3 bg-[#2c2c2c] text-white border border-gray-600 rounded"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              setSelecionado(null);
              setSugestoes([]);
              setBusca("");
              setCriandoNovo(false);
              setCapituloAtual("");
              setStatus("Em andamento");
            }}
          >
            <option value="ANIME">Anime</option>
            <option value="MANGA">Mangá</option>
            <option value="MANHUA">Manhua</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={`Digite o nome do ${tipo.toLowerCase()}...`}
            className="w-full p-3 bg-[#2c2c2c] text-white border border-gray-600 rounded"
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
            <ul className="absolute z-10 w-full mt-1 bg-[#2c2c2c] border border-gray-600 rounded max-h-60 overflow-y-auto">
              {sugestoes.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleSelecionar(item)}
                  className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-purple-600"
                >
                  <img
                    src={item.coverImage.medium}
                    alt={item.title.romaji}
                    className="w-10 h-14 object-cover rounded"
                  />
                  <span>{item.title.romaji}</span>
                </li>
              ))}
            </ul>
          )}

          
        </div>

        {/* Formulário para criar novo item */}
        {criandoNovo && (
          <div className="space-y-4 border border-purple-600 rounded p-4 mt-4">
            <h2 className="text-xl font-semibold">
              Criar novo {tipo.toLowerCase()}
            </h2>

            <div>
              <label className="block mb-1 font-medium">Título</label>
              <input
                type="text"
                className="w-full p-3 bg-[#2c2c2c] text-white border border-gray-600 rounded"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Imagem (Enviar)</label>

              {/* input escondido */}
              <input
                type="file"
                accept="image/*"
                onChange={handleImagemChange} 
                id="upload-image"
                className="hidden"
              />

              <label
                htmlFor="upload-image"
                className="cursor-pointer inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded"
              >
                Selecionar Imagem
              </label>

              {novaImagemPreview && (
                <img
                  src={novaImagemPreview}
                  alt="Preview"
                  className="mt-2 w-24 h-auto rounded border border-gray-600"
                />
              )}
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Total de capítulos (opcional)
              </label>
              <input
                type="number"
                min={0}
                placeholder="Desconhecido"
                className="w-full p-3 bg-[#2c2c2c] text-white border border-gray-600 rounded"
                value={novoTotalCapitulos}
                onChange={(e) => setNovoTotalCapitulos(e.target.value)}
              />
            </div>

            {/* NOVO campo capítulo atual */}
            <div>
              <label className="block mb-1 font-medium">Capítulo atual</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                className="w-full p-3 bg-[#2c2c2c] text-white border border-gray-600 rounded"
                value={novoCapituloAtual}
                onChange={(e) => setNovoCapituloAtual(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Dia de novos capítulos</label>
              <select
                className="w-full p-3 bg-[#2c2c2c] text-white border border-gray-600 rounded"
                value={diaNovosCapitulos}
                onChange={(e) => {
                  setDiaNovosCapitulos(e.target.value);
                }}
              >
                <option value="">Selecione um dia (opcional)</option>
                <option value="Domingo">Domingo</option>
                <option value="Segunda-feira">Segunda-feira</option>
                <option value="Terça-feira">Terça-feira</option>
                <option value="Quarta-feira">Quarta-feira</option>
                <option value="Quinta-feira">Quinta-feira</option>
                <option value="Sexta-feira">Sexta-feira</option>
                <option value="Sábado">Sábado</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Status</label>
              <select
                className="w-full p-3 bg-[#2c2c2c] text-white border border-gray-600 rounded"
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value)}
              >
                <option>Em andamento</option>
                <option>Finalizado</option>
                <option>Inativo</option>
              </select>
            </div>

            <button
              onClick={handleEnviar}
              className="w-full bg-purple-600 hover:bg-purple-700 transition-colors py-3 rounded-lg font-semibold"
            >
              Salvar novo {tipo.toLowerCase()}
            </button>

            <button
              onClick={() => setCriandoNovo(false)}
              className="w-full mt-2 bg-gray-700 hover:bg-gray-800 transition-colors py-2 rounded font-semibold"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Detalhes do selecionado */}
        {selecionado && !criandoNovo && (
          <div className="space-y-4 mt-4">
            <div className="flex gap-4 items-start">
              <img
                src={selecionado.coverImage.medium}
                alt={selecionado.title.romaji}
                className="w-28 rounded"
              />
              <div>
                <h2 className="text-xl font-semibold">{selecionado.title.romaji}</h2>
                <p className="text-sm text-gray-400">
                  {tipo === "ANIME"
                    ? `Total de episódios: ${selecionado.episodes || "Desconhecido"}`
                    : `Total de capítulos: ${selecionado.chapters || "Desconhecido"}`}
                </p>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium">Capítulo atual</label>
              <input
                type="number"
                className="w-full p-3 bg-[#2c2c2c] text-white border border-gray-600 rounded"
                value={capituloAtual}
                onChange={(e) => setCapituloAtual(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Dia de novos capítulos</label>
              <select
                className="w-full p-3 bg-[#2c2c2c] text-white border border-gray-600 rounded"
                value={diaNovosCapitulos}
                onChange={(e) => {
                  setDiaNovosCapitulos(e.target.value);
                }}
              >
                <option value="">Selecione um dia (opcional)</option>
                <option value="Domingo">Domingo</option>
                <option value="Segunda-feira">Segunda-feira</option>
                <option value="Terça-feira">Terça-feira</option>
                <option value="Quarta-feira">Quarta-feira</option>
                <option value="Quinta-feira">Quinta-feira</option>
                <option value="Sexta-feira">Sexta-feira</option>
                <option value="Sábado">Sábado</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Status</label>
              <select
                className="w-full p-3 bg-[#2c2c2c] text-white border border-gray-600 rounded"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Em andamento</option>
                <option>Finalizado</option>
                <option>Inativo</option>
              </select>
            </div>

            <button
              onClick={handleEnviar}
              className="w-full bg-purple-600 hover:bg-purple-700 transition-colors py-3 rounded-lg font-semibold"
            >
              Salvar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
