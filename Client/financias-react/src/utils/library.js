export const STATUSES = ["Em andamento", "Finalizado", "Inativo"];
export const MEDIA_TYPES = ["Anime", "Mangá", "Manhua", "Série", "Filme"];
export const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
export const PAGE_SIZE = 24;

export function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

export function integer(value) {
  if (String(value ?? "").trim() === "") return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

export function progress(item) {
  const current = integer(item.capituloAtual) ?? 0;
  const total = integer(item.totalCapitulos);
  return {
    current,
    total,
    percent: total > 0 ? Math.min(100, (current / total) * 100) : null,
  };
}

export function todayWeekday(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
  }).format(date);
}

export function releasesToday(item, today = todayWeekday()) {
  return (
    normalize(item.status) === normalize(STATUSES[0]) &&
    normalize(item.diaNovoCapitulo) === normalize(today)
  );
}

export function completedMedia(item) {
  const current = integer(item.capituloAtual);
  const total = integer(item.totalCapitulos);
  return total > 0 && current !== null && current >= total
    ? { ...item, status: "Finalizado" }
    : item;
}

// Reordering a filtered selection keeps hidden works in their original slots.
export function mergeVisibleOrder(allIds, visibleIds) {
  const visible = new Set(visibleIds);
  if (
    visible.size !== visibleIds.length ||
    visibleIds.some((id) => !allIds.includes(id))
  )
    throw new Error("Seleção de obras inválida.");
  let next = 0;
  return allIds.map((id) => (visible.has(id) ? visibleIds[next++] : id));
}

export function nextProgress(item) {
  if (
    normalize(item.status) !== normalize(STATUSES[0]) ||
    normalize(item.tipoMidia) === "filme"
  )
    return null;
  const current = integer(item.capituloAtual);
  const total = integer(item.totalCapitulos);
  if (String(item.capituloAtual ?? "").trim() && current === null) return null;
  if (String(item.totalCapitulos ?? "").trim() && total === null) return null;
  const next = (current ?? 0) + 1;
  if (!Number.isSafeInteger(next) || (total !== null && next > total))
    return null;
  return String(next);
}

export function filterLibrary(
  data,
  {
    search = "",
    status = "",
    type = "",
    day = "",
    todayOnly = false,
    sort = "manual",
  } = {},
  today = todayWeekday(),
) {
  const query = normalize(search);
  const result = data.filter(
    (item) =>
      normalize(item.nome).includes(query) &&
      (!status || normalize(item.status) === normalize(status)) &&
      (!type ||
        (type === "undefined"
          ? !item.tipoMidia
          : normalize(item.tipoMidia) === normalize(type))) &&
      (!day ||
        (day === "undefined"
          ? !item.diaNovoCapitulo
          : normalize(item.diaNovoCapitulo) === normalize(day))) &&
      (!todayOnly || releasesToday(item, today)),
  );
  const collator = new Intl.Collator("pt-BR", {
    sensitivity: "base",
    numeric: true,
  });
  return result.sort((a, b) => {
    const byTitle = collator.compare(a.nome || "", b.nome || "");
    if (sort === "manual") {
      const orderA = integer(a.ordemPersonalizada) ?? Number.MAX_SAFE_INTEGER;
      const orderB = integer(b.ordemPersonalizada) ?? Number.MAX_SAFE_INTEGER;
      return (
        orderA - orderB ||
        byTitle ||
        collator.compare(String(a.id || ""), String(b.id || ""))
      );
    }
    if (sort.startsWith("progress")) {
      const pa = progress(a).percent;
      const pb = progress(b).percent;
      if (pa === null || pb === null)
        return pa === pb ? byTitle : pa === null ? 1 : -1;
      return (sort === "progress-desc" ? pb - pa : pa - pb) || byTitle;
    }
    return sort === "title-desc" ? -byTitle : byTitle;
  });
}

export function paginate(items, requestedPage = 1) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.max(1, Math.min(totalPages, requestedPage));
  return {
    page,
    totalPages,
    items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  };
}

export function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function validateMedia(item) {
  if (!String(item.nome ?? "").trim()) return "Informe o nome da obra.";
  for (const [field, label] of [
    ["totalCapitulos", "Total"],
    ["capituloAtual", "Progresso atual"],
  ]) {
    if (String(item[field] ?? "").trim() && integer(item[field]) === null)
      return `${label} deve ser um número inteiro maior ou igual a zero.`;
  }
  const { current, total } = progress(item);
  if (total !== null && current > total)
    return "O progresso atual não pode ultrapassar o total.";
  const url = String(item.urlMidia ?? "").trim();
  if (url && (!validHttpUrl(url) || url.length > 2048))
    return "Informe um link HTTP/HTTPS válido com até 2048 caracteres.";
  return "";
}

// Empty strings explicitly clear optional fields; null means preserve in the API.
export function mediaPayload(item) {
  return {
    ...Object.fromEntries(
      [
        "nome",
        "tipoMidia",
        "status",
        "totalCapitulos",
        "capituloAtual",
        "diaNovoCapitulo",
        "imagemDirectory",
        "imagemUrl",
        "urlMidia",
      ].map((field) => [field, String(item[field] ?? "").trim()]),
    ),
    notificarLancamentos: item.notificarLancamentos ?? true,
  };
}
