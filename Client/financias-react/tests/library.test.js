import test from "node:test";
import assert from "node:assert/strict";
import {
  completedMedia,
  mergeVisibleOrder,
  filterLibrary,
  integer,
  mediaPayload,
  nextProgress,
  paginate,
  progress,
  releasesToday,
  todayWeekday,
  validateMedia,
} from "../src/utils/library.js";

const anime = {
  id: "1",
  nome: "Ação 2",
  tipoMidia: "Anime",
  status: "Em andamento",
  capituloAtual: "3",
  totalCapitulos: "12",
  diaNovoCapitulo: "Sábado",
};
const manga = {
  id: "2",
  nome: "Árvore",
  tipoMidia: "Mangá",
  status: "Finalizado",
  capituloAtual: "10",
  totalCapitulos: "10",
  diaNovoCapitulo: "Sábado",
};
const unknown = {
  id: "3",
  nome: "Zebra",
  tipoMidia: "Série",
  status: "Em andamento",
  capituloAtual: "",
  totalCapitulos: null,
  diaNovoCapitulo: "Terça-feira",
};
const data = [unknown, manga, anime];

test("search ignores accents, casing and outer whitespace", () => {
  assert.deepEqual(
    filterLibrary(data, { search: " ACAO " }).map((item) => item.id),
    ["1"],
  );
  assert.deepEqual(
    filterLibrary(data, { search: "ARVORE" }).map((item) => item.id),
    ["2"],
  );
});

test("search, status, type, weekday and today's releases compose", () => {
  assert.deepEqual(
    filterLibrary(
      data,
      {
        search: "a",
        status: "Em andamento",
        type: "anime",
        day: "sabado",
        todayOnly: true,
      },
      "sábado",
    ).map((item) => item.id),
    ["1"],
  );
  assert.equal(
    filterLibrary(data, { status: "Finalizado", todayOnly: true }, "sábado")
      .length,
    0,
  );
  assert.equal(
    filterLibrary(data, { type: "Anime", day: "Terça-feira" }).length,
    0,
  );
});

test("undefined type and day are filterable", () => {
  const items = [...data, { id: "4", nome: "Sem dados" }];
  assert.deepEqual(
    filterLibrary(items, { type: "undefined", day: "undefined" }).map(
      (item) => item.id,
    ),
    ["4"],
  );
});

test("sorts titles naturally in Portuguese without mutating input", () => {
  const items = [
    { nome: "Volume 10" },
    { nome: "Volume 2" },
    { nome: "Árvore" },
  ];
  assert.deepEqual(
    filterLibrary(items).map((item) => item.nome),
    ["Árvore", "Volume 2", "Volume 10"],
  );
  assert.deepEqual(
    filterLibrary(items, { sort: "title-desc" }).map((item) => item.nome),
    ["Volume 10", "Volume 2", "Árvore"],
  );
  assert.equal(items[0].nome, "Volume 10");
});

test("unknown percentages always sort last in both directions", () => {
  assert.deepEqual(
    filterLibrary(data, { sort: "progress-desc" }).map((item) => item.id),
    ["2", "1", "3"],
  );
  assert.deepEqual(
    filterLibrary(data, { sort: "progress-asc" }).map((item) => item.id),
    ["1", "2", "3"],
  );
});

test("progress handles zero, missing totals and legacy overflows", () => {
  assert.deepEqual(progress(anime), { current: 3, total: 12, percent: 25 });
  assert.equal(progress({ totalCapitulos: "0" }).percent, null);
  assert.equal(progress({}).percent, null);
  assert.equal(
    progress({ capituloAtual: "20", totalCapitulos: "10" }).percent,
    100,
  );
});

test("pagination clamps after deletion and handles empty libraries", () => {
  const items = Array.from({ length: 50 }, (_, id) => ({
    id,
    nome: `Obra ${id}`,
  }));
  assert.equal(paginate(items, 1).items.length, 24);
  assert.equal(paginate(items, 2).items[0].id, 24);
  assert.equal(paginate(items, 3).items.length, 2);
  assert.equal(paginate(items.slice(0, 24), 3).page, 1);
  assert.deepEqual(paginate([], 4), { page: 1, totalPages: 1, items: [] });
});

test("filtering and sorting happen before pagination", () => {
  const items = Array.from({ length: 60 }, (_, index) => ({
    ...anime,
    id: index,
    nome: `Obra ${index}`,
    tipoMidia: index % 2 ? "Mangá" : "Anime",
  }));
  const result = paginate(
    filterLibrary(items, { type: "Mangá", sort: "title-desc" }),
    2,
  );
  assert.equal(result.items.length, 6);
  assert.equal(result.items[0].id, 11);
});

test("today uses Sao Paulo date across the UTC midnight boundary", () => {
  assert.equal(todayWeekday(new Date("2026-11-01T01:30:00Z")), "sábado");
  assert.equal(todayWeekday(new Date("2026-11-01T03:30:00Z")), "domingo");
  assert.equal(releasesToday(anime, "sábado"), true);
  assert.equal(releasesToday(manga, "sábado"), false);
});

test("+1 calculates the next value without mutating its input", () => {
  assert.equal(nextProgress(unknown), "1");
  assert.equal(nextProgress(anime), "4");
  const last = { ...anime, capituloAtual: "11" };
  assert.equal(nextProgress(last), "12");
  assert.equal(last.status, "Em andamento");
});

test("+1 rejects totals exceeded, invalid data, films and inactive records", () => {
  assert.equal(nextProgress({ ...anime, capituloAtual: "12" }), null);
  assert.equal(nextProgress({ ...anime, totalCapitulos: "0" }), null);
  for (const value of ["-1", "2.5", "abc"]) {
    assert.equal(nextProgress({ ...anime, capituloAtual: value }), null);
    assert.equal(nextProgress({ ...anime, totalCapitulos: value }), null);
  }
  assert.equal(nextProgress({ ...anime, tipoMidia: "Filme" }), null);
  assert.equal(nextProgress({ ...anime, status: "Inativo" }), null);
  assert.equal(nextProgress(manga), null);
});

test("edit validation accepts zero and optional numeric fields", () => {
  assert.equal(
    validateMedia({ nome: "Teste", capituloAtual: "0", totalCapitulos: "0" }),
    "",
  );
  assert.equal(validateMedia({ nome: "Teste", totalCapitulos: "" }), "");
  assert.equal(integer("0"), 0);
  assert.equal(integer(""), null);
});

test("edit validation rejects blank titles, negative/fractional numbers and excess progress", () => {
  assert.match(validateMedia({ nome: "  " }), /nome/);
  assert.match(validateMedia({ ...anime, totalCapitulos: "1.5" }), /inteiro/);
  assert.match(validateMedia({ ...anime, capituloAtual: "-1" }), /inteiro/);
  assert.match(validateMedia({ ...anime, capituloAtual: "13" }), /ultrapassar/);
});

test("personal links must be HTTP(S), with the API's length limit", () => {
  assert.equal(
    validateMedia({ ...anime, urlMidia: "https://example.com/watch" }),
    "",
  );
  assert.match(
    validateMedia({ ...anime, urlMidia: "javascript:alert(1)" }),
    /HTTP/,
  );
  assert.match(
    validateMedia({
      ...anime,
      urlMidia: "https://example.com/" + "a".repeat(2048),
    }),
    /2048/,
  );
});

test("serialization sends numeric strings and explicit clearing without leaking server fields", () => {
  const payload = mediaPayload({
    ...anime,
    capituloAtual: 0,
    totalCapitulos: 12,
    urlMidia: null,
    userId: "private",
  });
  assert.equal(payload.capituloAtual, "0");
  assert.equal(payload.totalCapitulos, "12");
  assert.equal(payload.urlMidia, "");
  assert.equal(payload.imagemUrl, "");
  assert.equal(payload.userId, undefined);
  assert.equal(
    Object.entries(payload)
      .filter(([key]) => key !== "notificarLancamentos")
      .every(([, value]) => typeof value === "string"),
    true,
  );
});

test("email preference keeps false in edits and defaults to true for legacy records", () => {
  assert.equal(
    mediaPayload({ ...anime, notificarLancamentos: false })
      .notificarLancamentos,
    false,
  );
  assert.equal(mediaPayload(anime).notificarLancamentos, true);
});

test("reaching a known total finalizes without mutating other fields", () => {
  const last = {
    ...anime,
    capituloAtual: "11",
    notificarLancamentos: false,
    ordemPersonalizada: 5,
  };
  const updated = completedMedia({
    ...last,
    capituloAtual: nextProgress(last),
  });
  assert.equal(updated.status, "Finalizado");
  assert.equal(updated.notificarLancamentos, false);
  assert.equal(updated.ordemPersonalizada, 5);
  assert.equal(last.status, "Em andamento");
  assert.equal(filterLibrary([updated], { status: "Em andamento" }).length, 0);
  assert.equal(
    completedMedia({ ...anime, capituloAtual: "20" }).status,
    "Finalizado",
  );
  for (const total of [null, "", "0", "invalid"])
    assert.equal(
      completedMedia({ ...anime, totalCapitulos: total }).status,
      "Em andamento",
    );
  assert.equal(
    completedMedia({ ...anime, capituloEsperadoAtual: 12 }).status,
    "Em andamento",
  );
});

test("personal order sorts before pagination and appends unsorted works", () => {
  const items = Array.from({ length: 50 }, (_, id) => ({
    id: String(id),
    nome: `Obra ${id}`,
    ordemPersonalizada: 49 - id,
  }));
  const sorted = filterLibrary([...items, { id: "new", nome: "A nova obra" }]);
  assert.equal(sorted[0].id, "49");
  assert.equal(paginate(sorted, 2).items[0].id, "25");
  assert.equal(sorted.at(-1).id, "new");
  assert.equal(filterLibrary(items, { sort: "title-asc" })[0].id, "0");
  assert.equal(items[0].ordemPersonalizada, 49);
});

test("reordering filtered works retains hidden positions across all pages", () => {
  assert.deepEqual(
    mergeVisibleOrder(["a", "hidden", "b", "hidden2", "c"], ["c", "a", "b"]),
    ["c", "hidden", "a", "hidden2", "b"],
  );
  const all = Array.from({ length: 60 }, (_, id) => String(id));
  assert.deepEqual(
    mergeVisibleOrder(all, [...all].reverse()),
    [...all].reverse(),
  );
  assert.throws(() => mergeVisibleOrder(["a"], ["a", "a"]));
  assert.throws(() => mergeVisibleOrder(["a"], ["missing"]));
});
