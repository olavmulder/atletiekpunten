const BASE_TEAM_EVENTS = [
  { key: "sprint", girlsId: "60m", boysId: "80m", girlsLabel: "60m", boysLabel: "80m", type: "track", limit: 3, count: 2 },
  { key: "hurdles", girlsId: "60mh", boysId: "80mh", girlsLabel: "60mH", boysLabel: "80mH", type: "track", limit: 3, count: 2 },
  { key: "1000m", girlsId: "1000m", boysId: "1000m", girlsLabel: "1000m", boysLabel: "1000m", type: "track", limit: 3, count: 2 },
  { key: "600m", girlsId: "600m", boysId: "600m", girlsLabel: "600m", boysLabel: "600m", type: "track", limit: 3, count: 2 },
  { key: "hoog", girlsId: "hoog", boysId: "hoog", girlsLabel: "Hoog", boysLabel: "Hoog", type: "field", limit: 2, count: 1 },
  { key: "ver", girlsId: "ver", boysId: "ver", girlsLabel: "Ver", boysLabel: "Ver", type: "field", limit: 2, count: 1 },
  { key: "kogel", girlsId: "kogel", boysId: "kogel", girlsLabel: "Kogel", boysLabel: "Kogel", type: "field", limit: 2, count: 1 },
  { key: "speer", girlsId: "speer", boysId: "speer", girlsLabel: "Speer", boysLabel: "Speer", type: "field", limit: 2, count: 1 },
  { key: "discus", girlsId: "discus", boysId: "discus", girlsLabel: "Discus", boysLabel: "Discus", type: "field", limit: 2, count: 1 },
];

const TEAM_VARIANTS = Object.freeze({
  u14_girls: {
    label: "U14 meisjes",
    relayEventId: "4x60m",
    relayLabel: "4x60m",
    events: BASE_TEAM_EVENTS.map((event) => ({
      id: event.girlsId,
      label: event.girlsLabel,
      type: event.type,
      limit: event.limit,
      count: event.count,
    })),
  },
  u14_boys: {
    label: "U14 jongens",
    relayEventId: "4x80m",
    relayLabel: "4x80m",
    events: BASE_TEAM_EVENTS.map((event) => ({
      id: event.boysId,
      label: event.boysLabel,
      type: event.type,
      limit: event.limit,
      count: event.count,
    })),
  },
});

const ATHLETE_ROW_COUNT = 10;
const ATHLETE_EVENT_LIMIT = 3;
const EXPORT_TYPE = "atletiekpunten-team-setup";
const DEFAULT_VARIANT = "u14_girls";

const athleteRowsBody = document.getElementById("athlete-rows");
const eventSummaryCards = document.getElementById("event-summary-cards");
const teamSetupHead = document.getElementById("team-setup-head");
const teamSetupFoot = document.getElementById("team-setup-foot");
const teamTotalPoints = document.getElementById("team-total-points");
const relayPoints = document.getElementById("relay-points");
const teamNameInput = document.getElementById("team-name");
const relayTeamName = document.getElementById("relay-team-name");
const relayInput = document.getElementById("relay-input");
const relayHeaderLabel = document.getElementById("relay-header-label");
const variantSelect = document.getElementById("team-variant");
const exportButton = document.getElementById("export-team-data");
const exportExcelButton = document.getElementById("export-team-excel");
const importButton = document.getElementById("import-team-data");
const importFileInput = document.getElementById("import-team-file");

let currentVariantKey = variantSelect && TEAM_VARIANTS[variantSelect.value]
  ? variantSelect.value
  : DEFAULT_VARIANT;

function getCurrentVariant() {
  return TEAM_VARIANTS[currentVariantKey];
}

function getCurrentTeamEvents() {
  return getCurrentVariant().events;
}

function getCurrentRelayEventId() {
  return getCurrentVariant().relayEventId;
}

function getCurrentRelayLabel() {
  return getCurrentVariant().relayLabel;
}

function getAssignmentLimitTotal() {
  return getCurrentTeamEvents().reduce((sum, event) => sum + event.limit, 0);
}

function getVariantForEventId(eventId) {
  const foundVariant = Object.entries(TEAM_VARIANTS).find(([, variant]) =>
    variant.events.some((event) => event.id === eventId) || variant.relayEventId === eventId
  );

  return foundVariant ? foundVariant[0] : DEFAULT_VARIANT;
}

function translateEventId(eventId, targetVariantKey) {
  const sourceVariantKey = getVariantForEventId(eventId);
  const sourceVariant = TEAM_VARIANTS[sourceVariantKey];
  const targetVariant = TEAM_VARIANTS[targetVariantKey];

  if (!sourceVariant || !targetVariant) {
    return eventId;
  }

  if (sourceVariant.relayEventId === eventId) {
    return targetVariant.relayEventId;
  }

  const eventIndex = sourceVariant.events.findIndex((event) => event.id === eventId);
  if (eventIndex === -1) {
    return eventId;
  }

  return targetVariant.events[eventIndex].id;
}

function createEmptyAthleteState() {
  return {
    name: "",
    performances: {},
  };
}

function buildEmptyState(variantKey = currentVariantKey) {
  return {
    version: 1,
    type: EXPORT_TYPE,
    variant: variantKey,
    teamName: "",
    relay: {
      value: "",
    },
    athletes: Array.from({ length: ATHLETE_ROW_COUNT }, () => createEmptyAthleteState()),
  };
}

function remapStateToVariant(state, targetVariantKey) {
  const normalizedState = normalizeImportedState(state);
  const remappedState = buildEmptyState(targetVariantKey);

  remappedState.teamName = normalizedState.teamName;
  remappedState.relay.value = normalizedState.relay.value;
  remappedState.athletes = normalizedState.athletes.map((athlete) => {
    const mappedAthlete = createEmptyAthleteState();
    mappedAthlete.name = athlete.name;

    Object.entries(athlete.performances).forEach(([eventId, value]) => {
      const targetEventId = translateEventId(eventId, targetVariantKey);
      mappedAthlete.performances[targetEventId] = value;
    });

    return mappedAthlete;
  });

  return remappedState;
}

function normalizeImportedState(rawState) {
  const variantKey = TEAM_VARIANTS[rawState?.variant] ? rawState.variant : DEFAULT_VARIANT;
  const baseState = buildEmptyState(variantKey);

  baseState.teamName = typeof rawState?.teamName === "string" ? rawState.teamName : "";
  baseState.relay.value = typeof rawState?.relay?.value === "string"
    ? rawState.relay.value
    : typeof rawState?.relayValue === "string"
      ? rawState.relayValue
      : "";

  const athletes = Array.isArray(rawState?.athletes) ? rawState.athletes : [];
  for (let index = 0; index < ATHLETE_ROW_COUNT; index += 1) {
    const athlete = athletes[index];
    if (!athlete || typeof athlete !== "object") {
      continue;
    }

    baseState.athletes[index] = createEmptyAthleteState();
    baseState.athletes[index].name = typeof athlete.name === "string" ? athlete.name : "";

    const performances = athlete.performances && typeof athlete.performances === "object"
      ? athlete.performances
      : {};
    Object.entries(performances).forEach(([eventId, value]) => {
      if (typeof value === "string") {
        baseState.athletes[index].performances[eventId] = value;
      }
    });
  }

  return baseState;
}

function readCurrentState() {
  const state = buildEmptyState(currentVariantKey);
  state.teamName = teamNameInput.value;
  state.relay.value = relayInput.value;

  for (let index = 0; index < ATHLETE_ROW_COUNT; index += 1) {
    const nameInput = document.querySelector(`[data-athlete-name="${index}"]`);
    state.athletes[index].name = nameInput ? nameInput.value : "";

    getCurrentTeamEvents().forEach((event) => {
      const input = document.querySelector(`[data-athlete-index="${index}"][data-event="${event.id}"]`);
      if (input && input.value !== "") {
        state.athletes[index].performances[event.id] = input.value;
      }
    });
  }

  return state;
}

function renderTableStructure() {
  const headCells = getCurrentTeamEvents()
    .map((event) => `<th scope="col">${event.label}</th>`)
    .join("");
  teamSetupHead.innerHTML = `
    <tr>
      <th scope="col" class="name-col">Atleet</th>
      ${headCells}
      <th scope="col" class="assignment-col">Totaal</th>
    </tr>
  `;

  const footerCells = getCurrentTeamEvents()
    .map((event) => `<td data-summary="${event.id}">0 / ${event.limit}</td>`)
    .join("");
  teamSetupFoot.innerHTML = `
    <tr class="table-light">
      <th scope="row">Totaal</th>
      ${footerCells}
      <td id="assigned-total">0 / ${getAssignmentLimitTotal()}</td>
    </tr>
  `;
}

function createAthleteRows() {
  const rows = [];

  for (let index = 0; index < ATHLETE_ROW_COUNT; index += 1) {
    const cells = getCurrentTeamEvents().map((event) => `
      <td>
        <div class="team-cell">
          <input
            type="text"
            class="form-control form-control-sm team-performance-input"
            data-athlete-index="${index}"
            data-event="${event.id}"
            placeholder="${event.type === "track" ? "0:00.00" : "0.00"}"
          >
          <div class="team-points" data-points-for="${index}-${event.id}">-</div>
        </div>
      </td>
    `).join("");

    rows.push(`
      <tr data-athlete-row="${index}">
        <th scope="row">
          <input
            type="text"
            class="form-control form-control-sm athlete-name-input"
            data-athlete-name="${index}"
            placeholder="Atleet ${index + 1}"
          >
        </th>
        ${cells}
        <td class="fw-semibold" data-athlete-total="${index}">0 / ${ATHLETE_EVENT_LIMIT}</td>
      </tr>
    `);
  }

  athleteRowsBody.innerHTML = rows.join("");
}

function createSummaryCards() {
  const cards = getCurrentTeamEvents().map((event) => `
    <div class="col-md-6 col-xl-4">
      <div class="summary-card h-100" data-card-for="${event.id}">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h3 class="h6 mb-1">${event.label}</h3>
            <p class="text-muted mb-2">${event.type === "track" ? "Beste 2 tellen" : "Beste 1 telt"}</p>
          </div>
          <span class="badge text-bg-light" data-count-for="${event.id}">0 / ${event.limit}</span>
        </div>
        <div class="summary-list" data-list-for="${event.id}">Nog geen geldige prestaties</div>
        <div class="summary-points mt-3">Meegetelde punten: <strong data-team-points-for="${event.id}">0</strong></div>
      </div>
    </div>
  `).join("");

  eventSummaryCards.innerHTML = cards;
}

function renderVariantLayout() {
  relayHeaderLabel.textContent = getCurrentRelayLabel();
  renderTableStructure();
  createAthleteRows();
  createSummaryCards();
}

function applyState(rawState) {
  const normalizedState = normalizeImportedState(rawState);
  currentVariantKey = normalizedState.variant;
  variantSelect.value = currentVariantKey;
  renderVariantLayout();

  teamNameInput.value = normalizedState.teamName;
  relayInput.value = normalizedState.relay.value;

  normalizedState.athletes.forEach((athlete, index) => {
    const nameInput = document.querySelector(`[data-athlete-name="${index}"]`);
    if (nameInput) {
      nameInput.value = athlete.name;
    }

    Object.entries(athlete.performances).forEach(([eventId, value]) => {
      const input = document.querySelector(`[data-athlete-index="${index}"][data-event="${eventId}"]`);
      if (input) {
        input.value = value;
      }
    });
  });

  updateTeamSetup();
}

function getAthleteName(index) {
  const input = document.querySelector(`[data-athlete-name="${index}"]`);
  const fallbackName = `Atleet ${Number(index) + 1}`;
  return input && input.value.trim() !== "" ? input.value.trim() : fallbackName;
}

function updateRelayName() {
  const teamName = teamNameInput.value.trim();
  relayTeamName.textContent = teamName === "" ? "Team naam" : teamName;
}

function collectValidEntries() {
  const entries = [];

  document.querySelectorAll(".team-performance-input").forEach((input) => {
    const eventId = input.dataset.event;
    const athleteIndex = input.dataset.athleteIndex;
    const value = input.value.trim();
    const pointsNode = document.querySelector(`[data-points-for="${athleteIndex}-${eventId}"]`);

    input.classList.remove("is-invalid", "is-valid", "counted-performance");
    pointsNode.textContent = "-";
    pointsNode.classList.remove("counted-performance");

    if (value === "") {
      return;
    }

    if (!validateInput(eventId, value)) {
      input.classList.add("is-invalid");
      pointsNode.textContent = "Invalid";
      return;
    }

    const performance = parseSingleInput(eventId, value);
    const points = calculatePointsForEvent(eventId, performance, category.U14_U16);

    if (!Number.isFinite(points)) {
      input.classList.add("is-invalid");
      pointsNode.textContent = "Invalid";
      return;
    }

    input.classList.add("is-valid");
    pointsNode.textContent = points;

    entries.push({
      athleteIndex,
      athleteName: getAthleteName(athleteIndex),
      eventId,
      value,
      points,
      input,
      pointsNode,
    });
  });

  return entries;
}

function updateAthleteTotals(entries) {
  for (let index = 0; index < ATHLETE_ROW_COUNT; index += 1) {
    const athleteEntries = entries.filter((entry) => Number(entry.athleteIndex) === index);
    const totalNode = document.querySelector(`[data-athlete-total="${index}"]`);
    totalNode.textContent = `${athleteEntries.length} / ${ATHLETE_EVENT_LIMIT}`;
    totalNode.classList.toggle("text-danger", athleteEntries.length > ATHLETE_EVENT_LIMIT);
  }
}

function updateEventSummaries(entries) {
  let totalPoints = 0;
  let totalAssignments = 0;

  getCurrentTeamEvents().forEach((event) => {
    const eventEntries = entries
      .filter((entry) => entry.eventId === event.id)
      .sort((left, right) => right.points - left.points);

    const countedEntries = eventEntries.slice(0, event.count);

    countedEntries.forEach((entry) => {
      entry.input.classList.add("counted-performance");
      entry.pointsNode.classList.add("counted-performance");
    });

    const summaryNode = document.querySelector(`[data-summary="${event.id}"]`);
    summaryNode.textContent = `${eventEntries.length} / ${event.limit}`;
    summaryNode.classList.toggle("text-danger", eventEntries.length > event.limit);

    const cardCountNode = document.querySelector(`[data-count-for="${event.id}"]`);
    cardCountNode.textContent = `${eventEntries.length} / ${event.limit}`;

    const listNode = document.querySelector(`[data-list-for="${event.id}"]`);
    listNode.innerHTML = countedEntries.length === 0
      ? "Nog geen geldige prestaties"
      : countedEntries.map((entry) => `<div><strong>${entry.athleteName}</strong>: ${entry.value} (${entry.points} p)</div>`).join("");

    const eventPoints = countedEntries.reduce((sum, entry) => sum + entry.points, 0);
    document.querySelector(`[data-team-points-for="${event.id}"]`).textContent = eventPoints;

    totalPoints += eventPoints;
    totalAssignments += eventEntries.length;
  });

  const assignedTotal = document.getElementById("assigned-total");
  assignedTotal.textContent = `${totalAssignments} / ${getAssignmentLimitTotal()}`;

  return totalPoints;
}

function updateRelayPoints() {
  const eventId = getCurrentRelayEventId();
  const value = relayInput.value.trim();
  relayInput.classList.remove("is-invalid", "is-valid", "counted-performance");

  if (value === "") {
    relayPoints.textContent = "0";
    return 0;
  }

  if (!validateInput(eventId, value)) {
    relayInput.classList.add("is-invalid");
    relayPoints.textContent = "Invalid";
    return 0;
  }

  const performance = parseSingleInput(eventId, value);
  const points = calculatePointsForEvent(eventId, performance, category.U14_U16);

  if (!Number.isFinite(points)) {
    relayInput.classList.add("is-invalid");
    relayPoints.textContent = "Invalid";
    return 0;
  }

  relayInput.classList.add("is-valid", "counted-performance");
  relayPoints.textContent = String(points);
  return points;
}

function updateTeamSetup() {
  updateRelayName();

  const entries = collectValidEntries();
  updateAthleteTotals(entries);
  const basePoints = updateEventSummaries(entries);
  const relayTeamPoints = updateRelayPoints();

  teamTotalPoints.textContent = String(basePoints + relayTeamPoints);
}

function downloadState() {
  const state = readCurrentState();
  const exportData = JSON.stringify(state, null, 2);
  const blob = new Blob([exportData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  link.href = url;
  link.download = `teamsetup-${state.variant}-${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function stateToWorkbook(state) {
  const workbook = XLSX.utils.book_new();
  const variant = TEAM_VARIANTS[state.variant] || TEAM_VARIANTS[DEFAULT_VARIANT];
  const metaRows = [
    ["type", EXPORT_TYPE],
    ["version", state.version],
    ["variant", state.variant],
    ["variantLabel", variant.label],
    ["teamName", state.teamName],
    ["relayEvent", variant.relayEventId],
    ["relayLabel", variant.relayLabel],
    ["relayValue", state.relay.value],
  ];

  const athleteHeader = ["index", "name", ...variant.events.map((event) => event.id)];
  const athleteRows = state.athletes.map((athlete, index) => [
    index + 1,
    athlete.name,
    ...variant.events.map((event) => athlete.performances[event.id] || ""),
  ]);

  const metaSheet = XLSX.utils.aoa_to_sheet(metaRows);
  const athleteSheet = XLSX.utils.aoa_to_sheet([athleteHeader, ...athleteRows]);

  XLSX.utils.book_append_sheet(workbook, metaSheet, "meta");
  XLSX.utils.book_append_sheet(workbook, athleteSheet, "athletes");

  return workbook;
}

function downloadExcelState() {
  if (typeof XLSX === "undefined") {
    window.alert("Excel export is niet beschikbaar.");
    return;
  }

  const state = readCurrentState();
  const workbook = stateToWorkbook(state);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  XLSX.writeFile(workbook, `teamsetup-${state.variant}-${timestamp}.xlsx`);
}

function worksheetToRows(worksheet) {
  return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
}

function workbookToState(workbook) {
  const metaSheet = workbook.Sheets.meta;
  const athleteSheet = workbook.Sheets.athletes;

  if (!metaSheet || !athleteSheet) {
    throw new Error("Excelbestand mist het tabblad 'meta' of 'athletes'.");
  }

  const metaRows = worksheetToRows(metaSheet);
  const athleteRows = worksheetToRows(athleteSheet);
  const meta = {};

  metaRows.forEach((row) => {
    if (row.length >= 2 && row[0] !== "") {
      meta[String(row[0])] = row[1];
    }
  });

  const variantKey = TEAM_VARIANTS[String(meta.variant)] ? String(meta.variant) : DEFAULT_VARIANT;
  const state = buildEmptyState(variantKey);
  state.teamName = typeof meta.teamName === "string" ? meta.teamName : "";
  state.relay.value = typeof meta.relayValue === "string" ? meta.relayValue : "";

  const headerRow = athleteRows[0];
  if (!Array.isArray(headerRow) || headerRow.length < 2) {
    throw new Error("Excelbestand heeft geen geldige athletes-header.");
  }

  const eventColumns = headerRow.slice(2).map((value) => String(value));

  for (let index = 1; index < athleteRows.length && index <= ATHLETE_ROW_COUNT; index += 1) {
    const row = athleteRows[index];
    if (!Array.isArray(row)) {
      continue;
    }

    state.athletes[index - 1].name = typeof row[1] === "string" ? row[1] : row[1] == null ? "" : String(row[1]);

    eventColumns.forEach((eventId, columnIndex) => {
      const cellValue = row[columnIndex + 2];
      if (cellValue === "" || cellValue == null) {
        return;
      }
      state.athletes[index - 1].performances[eventId] = String(cellValue);
    });
  }

  return state;
}

function importStateFromFile(file) {
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const fileName = file.name.toLowerCase();
      const isExcelFile = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

      if (isExcelFile) {
        if (typeof XLSX === "undefined") {
          throw new Error("Excel import is niet beschikbaar.");
        }

        const workbook = XLSX.read(reader.result, { type: "array" });
        applyState(workbookToState(workbook));
      } else {
        const parsed = JSON.parse(reader.result);
        if (parsed?.type && parsed.type !== EXPORT_TYPE) {
          throw new Error("Dit bestand hoort niet bij de team setup export.");
        }

        applyState(parsed);
      }
    } catch (error) {
      window.alert(error.message || "Kon het bestand niet importeren.");
    } finally {
      importFileInput.value = "";
    }
  });

  reader.addEventListener("error", () => {
    window.alert("Kon het bestand niet lezen.");
    importFileInput.value = "";
  });

  if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
    reader.readAsArrayBuffer(file);
    return;
  }

  reader.readAsText(file);
}

variantSelect.addEventListener("change", (event) => {
  const currentState = readCurrentState();
  const remappedState = remapStateToVariant(currentState, event.target.value);
  applyState(remappedState);
});

exportButton.addEventListener("click", () => {
  downloadState();
});

exportExcelButton.addEventListener("click", () => {
  downloadExcelState();
});

importButton.addEventListener("click", () => {
  importFileInput.click();
});

importFileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) {
    importStateFromFile(file);
  }
});

document.addEventListener("input", (event) => {
  if (
    event.target.matches(".team-performance-input") ||
    event.target.matches(".athlete-name-input") ||
    event.target.matches("#relay-input") ||
    event.target.matches("#team-name")
  ) {
    updateTeamSetup();
  }
});

applyState(buildEmptyState(currentVariantKey));
