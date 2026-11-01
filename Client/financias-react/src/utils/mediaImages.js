import fallbackCover from "../assets/media-placeholder.svg";
import api from "./api";

export function mediaImageSource(item) {
  if (item?.imagemUrl) return item.imagemUrl;
  if (item?.imagemDirectory)
    return api.getUri({ url: `/MediaDex/imagem/${item.imagemDirectory}` });
  return fallbackCover;
}
