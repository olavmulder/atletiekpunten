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

const ATLETIEK_NU_EVENT_ALIASES = Object.freeze({
  "60m": ["60 meter", "60m"],
  "80m": ["80 meter", "80m"],
  "1000m": ["1000 meter", "1000m"],
  "600m": ["600 meter", "600m"],
  "60mh": ["60 meter horden", "60m horden", "60mh"],
  "80mh": ["80 meter horden", "80m horden", "80mh"],
  hoog: ["hoogspringen", "hoogspringen"],
  ver: ["verspringen"],
  kogel: ["kogelstoten"],
  speer: ["speerwerpen"],
  discus: ["discuswerpen"],
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
const relayAthletes = document.getElementById("relay-athletes");
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
  return getCurrentTeamEvents().reduce((sum, event) => sum + event.limit, 0) + 4;
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
    profileUrl: "",
    selectedEvents: {},
    performances: {},
    relay: false,
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
    mappedAthlete.profileUrl = athlete.profileUrl;
    mappedAthlete.relay = athlete.relay;

    Object.entries(athlete.selectedEvents || {}).forEach(([eventId, selected]) => {
      const targetEventId = translateEventId(eventId, targetVariantKey);
      mappedAthlete.selectedEvents[targetEventId] = Boolean(selected);
    });

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
    baseState.athletes[index].profileUrl = typeof athlete.profileUrl === "string" ? athlete.profileUrl : "";
    baseState.athletes[index].selectedEvents = athlete.selectedEvents && typeof athlete.selectedEvents === "object"
      ? { ...athlete.selectedEvents }
      : {};
    baseState.athletes[index].relay = Boolean(athlete.relay);

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

  const selectedRelayIndexes = new Set(getSelectedRelayIndexesFromSelectors());

  for (let index = 0; index < ATHLETE_ROW_COUNT; index += 1) {
    const nameInput = document.querySelector(`[data-athlete-name="${index}"]`);
    const profileInput = document.querySelector(`[data-athlete-profile="${index}"]`);
    state.athletes[index].name = nameInput ? nameInput.value : "";
    state.athletes[index].profileUrl = profileInput ? profileInput.value : "";
    state.athletes[index].relay = selectedRelayIndexes.has(index);

    getCurrentTeamEvents().forEach((event) => {
      const selectedInput = document.querySelector(`[data-selected-event="${index}-${event.id}"]`);
      const input = document.querySelector(`[data-athlete-index="${index}"][data-event="${event.id}"]`);
      state.athletes[index].selectedEvents[event.id] = selectedInput ? selectedInput.checked : false;
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
      <td id="relay-assigned-total">0 / 4</td>
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
          <label class="team-event-toggle">
            <input
              type="checkbox"
              class="form-check-input team-event-selected-input"
              data-selected-event="${index}-${event.id}"
            >
            <span>Inzet</span>
          </label>
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
          <div class="team-name-stack">
            <input
              type="text"
              class="form-control form-control-sm athlete-name-input"
              data-athlete-name="${index}"
              placeholder="Atleet ${index + 1}"
            >
            <div class="team-profile-row">
              <input
                type="text"
                class="form-control form-control-sm athlete-profile-input"
                data-athlete-profile="${index}"
                placeholder="Atletiek.nu URL of ID"
              >
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm athlete-profile-import"
                data-import-profile="${index}"
              >
                PR
              </button>
            </div>
            <div class="team-profile-status text-muted" data-profile-status="${index}"></div>
          </div>
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
  createRelaySelectors();
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
    const profileInput = document.querySelector(`[data-athlete-profile="${index}"]`);
    if (nameInput) {
      nameInput.value = athlete.name;
    }
    if (profileInput) {
      profileInput.value = athlete.profileUrl;
    }

    Object.entries(athlete.performances).forEach(([eventId, value]) => {
      const input = document.querySelector(`[data-athlete-index="${index}"][data-event="${eventId}"]`);
      if (input) {
        input.value = value;
      }
    });

    Object.entries(athlete.selectedEvents || {}).forEach(([eventId, selected]) => {
      const selectedInput = document.querySelector(`[data-selected-event="${index}-${eventId}"]`);
      if (selectedInput) {
        selectedInput.checked = Boolean(selected);
      }
    });
  });

  applyRelaySelectorsFromState(normalizedState);

  updateTeamSetup();
}

function getAthleteName(index) {
  const input = document.querySelector(`[data-athlete-name="${index}"]`);
  const fallbackName = `Atleet ${Number(index) + 1}`;
  return input && input.value.trim() !== "" ? input.value.trim() : fallbackName;
}

function getProfileStatusNode(index) {
  return document.querySelector(`[data-profile-status="${index}"]`);
}

function setProfileStatus(index, message, tone = "muted") {
  const statusNode = getProfileStatusNode(index);
  if (!statusNode) {
    return;
  }

  statusNode.textContent = message;
  statusNode.className = "team-profile-status";

  if (tone === "danger") {
    statusNode.classList.add("text-danger");
  } else if (tone === "success") {
    statusNode.classList.add("text-success");
  } else {
    statusNode.classList.add("text-muted");
  }
}

function normalizeAtletiekNuProfileUrl(input) {
  const trimmedInput = input.trim();
  if (trimmedInput === "") {
    return "";
  }

  const idMatch = trimmedInput.match(/(?:atleet\/(?:profiel|main)\/)?(\d{4,})/i);
  if (idMatch) {
    return `https://www.atletiek.nu/atleet/main/${idMatch[1]}/`;
  }

  try {
    const parsedUrl = new URL(trimmedInput);
    const parsedIdMatch = parsedUrl.pathname.match(/atleet\/(?:profiel|main)\/(\d{4,})/i);
    if (parsedIdMatch) {
      return `https://www.atletiek.nu/atleet/main/${parsedIdMatch[1]}/`;
    }
  } catch (error) {
    return "";
  }

  return "";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeImportedPerformance(value, eventId) {
  const trimmedValue = value.trim();
  if (trimmedValue === "") {
    return "";
  }

  if (eventId.match(/^(4x)?\d{1,9}m[hH]?$/)) {
    return trimmedValue
      .replace(/\s*h$/i, "")
      .replace(/,/g, ".");
  }

  return trimmedValue.replace(/,/g, ".");
}

function chooseBetterImportedPerformance(eventId, currentValue, candidateValue) {
  if (currentValue === "") {
    return candidateValue;
  }

  if (!validateInput(eventId, currentValue) || !validateInput(eventId, candidateValue)) {
    return currentValue;
  }

  const currentParsed = parseSingleInput(eventId, currentValue);
  const candidateParsed = parseSingleInput(eventId, candidateValue);

  if (!Number.isFinite(currentParsed) || !Number.isFinite(candidateParsed)) {
    return currentValue;
  }

  if (eventId.match(/^(4x)?\d{1,9}m[hH]?$/)) {
    return candidateParsed < currentParsed ? candidateValue : currentValue;
  }

  return candidateParsed > currentParsed ? candidateValue : currentValue;
}

function mapAtletiekNuLabelToEventId(label) {
  const normalizedLabel = label.trim().toLowerCase();

  return Object.entries(ATLETIEK_NU_EVENT_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => normalizedLabel.startsWith(alias))
  )?.[0] || null;
}

function extractRecordsFromHtml(htmlText) {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(htmlText, "text/html");
  const heading = Array.from(documentNode.querySelectorAll("h1, h2, h3, h4, a, button")).find((node) =>
    node.textContent.trim().toLowerCase() === "persoonlijke records"
  );

  const candidateTables = [];
  if (heading) {
    let currentNode = heading.parentElement || heading;
    while (currentNode && currentNode.nextElementSibling) {
      currentNode = currentNode.nextElementSibling;
      if (/^H[1-6]$/.test(currentNode.tagName)) {
        break;
      }
      if (currentNode.matches("table")) {
        candidateTables.push(currentNode);
      }
      candidateTables.push(...currentNode.querySelectorAll("table"));
      if (candidateTables.length > 0) {
        break;
      }
    }
  }

  const tablesToParse = candidateTables.length > 0
    ? candidateTables
    : Array.from(documentNode.querySelectorAll("table"));
  const records = {};

  tablesToParse.forEach((table) => {
    table.querySelectorAll("tr").forEach((row) => {
      const cells = Array.from(row.querySelectorAll("th, td"))
        .map((cell) => cell.textContent.replace(/\s+/g, " ").trim())
        .filter((value) => value !== "");

      if (cells.length < 2) {
        return;
      }

      const eventId = mapAtletiekNuLabelToEventId(cells[0]);
      if (!eventId) {
        return;
      }

      const normalizedPerformance = normalizeImportedPerformance(cells[1], eventId);
      if (!validateInput(eventId, normalizedPerformance)) {
        return;
      }

      records[eventId] = chooseBetterImportedPerformance(eventId, records[eventId] || "", normalizedPerformance);
    });
  });

  return records;
}

function extractRecordsFromMirrorText(text) {
  const records = {};

  Object.entries(ATLETIEK_NU_EVENT_ALIASES).forEach(([eventId, aliases]) => {
    aliases.forEach((alias) => {
      const pattern = new RegExp(
        `${escapeRegExp(alias)}(?:\\n[^\\n|]+)?\\s*\\|\\s*([^|\\n]+)`,
        "gi"
      );

      let match;
      while ((match = pattern.exec(text)) !== null) {
        const normalizedPerformance = normalizeImportedPerformance(match[1], eventId);
        if (!validateInput(eventId, normalizedPerformance)) {
          continue;
        }

        records[eventId] = chooseBetterImportedPerformance(eventId, records[eventId] || "", normalizedPerformance);
      }
    });
  });

  return records;
}

async function fetchAtletiekNuRecords(profileUrl) {
  try {
    const directResponse = await fetch(profileUrl);
    if (directResponse.ok) {
      const htmlText = await directResponse.text();
      const htmlRecords = extractRecordsFromHtml(htmlText);
      if (Object.keys(htmlRecords).length > 0) {
        return htmlRecords;
      }
    }
  } catch (error) {
    console.warn("Direct Atletiek.nu fetch mislukt, probeer fallback.", error);
  }

  const proxyUrl = `https://r.jina.ai/http://${profileUrl.replace(/^https?:\/\//i, "")}`;
  const proxyResponse = await fetch(proxyUrl);
  if (!proxyResponse.ok) {
    throw new Error("Kon het Atletiek.nu-profiel niet ophalen.");
  }

  const mirrorText = await proxyResponse.text();
  const mirrorRecords = extractRecordsFromMirrorText(mirrorText);
  if (Object.keys(mirrorRecords).length === 0) {
    throw new Error("Geen bruikbare PR's gevonden op dit profiel.");
  }

  return mirrorRecords;
}

async function importAthleteProfile(index) {
  const profileInput = document.querySelector(`[data-athlete-profile="${index}"]`);
  const importButton = document.querySelector(`[data-import-profile="${index}"]`);
  if (!profileInput || !importButton) {
    return;
  }

  const normalizedProfileUrl = normalizeAtletiekNuProfileUrl(profileInput.value);
  if (normalizedProfileUrl === "") {
    setProfileStatus(index, "Voer een geldig Atletiek.nu-profiel of ID in.", "danger");
    return;
  }

  profileInput.value = normalizedProfileUrl;
  importButton.disabled = true;
  setProfileStatus(index, "PR's ophalen...", "muted");

  try {
    const records = await fetchAtletiekNuRecords(normalizedProfileUrl);
    let importedCount = 0;

    getCurrentTeamEvents().forEach((event) => {
      const importedValue = records[event.id];
      const selectedInput = document.querySelector(`[data-selected-event="${index}-${event.id}"]`);
      if (!selectedInput || !selectedInput.checked || !importedValue) {
        return;
      }

      const input = document.querySelector(`[data-athlete-index="${index}"][data-event="${event.id}"]`);
      if (!input) {
        return;
      }

      input.value = importedValue;
      importedCount += 1;
    });

    if (importedCount === 0) {
      setProfileStatus(index, "Geen matchende PR's voor deze onderdelen gevonden.", "danger");
    } else {
      setProfileStatus(index, `${importedCount} PR's ingevuld. Je kunt ze nog aanpassen.`, "success");
      updateTeamSetup();
    }
  } catch (error) {
    setProfileStatus(index, error.message || "Importeren mislukt.", "danger");
  } finally {
    importButton.disabled = false;
  }
}

function updateRelayName() {
  const teamName = teamNameInput.value.trim();
  relayTeamName.textContent = teamName === "" ? "Team naam" : teamName;
}

function createRelaySelectors() {
  const selectorMarkup = Array.from({ length: 4 }, (_, index) => `
    <select class="form-select form-select-sm relay-athlete-select" data-relay-slot="${index}">
      <option value="">Kies atleet ${index + 1}</option>
    </select>
  `).join("");

  relayAthletes.innerHTML = selectorMarkup;
  refreshRelaySelectorOptions();
}

function getRelaySelectorNodes() {
  return Array.from(document.querySelectorAll(".relay-athlete-select"));
}

function getSelectedRelayIndexesFromSelectors() {
  return getRelaySelectorNodes()
    .map((select) => {
      if (select.value === "") {
        return null;
      }
      return Number(select.value);
    })
    .filter((value) => Number.isInteger(value));
}

function refreshRelaySelectorOptions() {
  const selectors = getRelaySelectorNodes();
  const currentSelections = selectors.map((select) => select.value);

  selectors.forEach((select, selectorIndex) => {
    const options = [`<option value="">Kies atleet ${selectorIndex + 1}</option>`];

    for (let athleteIndex = 0; athleteIndex < ATHLETE_ROW_COUNT; athleteIndex += 1) {
      const athleteName = getAthleteName(athleteIndex);
      options.push(`<option value="${athleteIndex}">${athleteName}</option>`);
    }

    select.innerHTML = options.join("");
    select.value = currentSelections[selectorIndex] || "";
  });
}

function applyRelaySelectorsFromState(state) {
  const relayIndexes = state.athletes
    .map((athlete, index) => athlete.relay ? index : null)
    .filter((value) => value !== null)
    .slice(0, 4);

  getRelaySelectorNodes().forEach((select, index) => {
    select.value = relayIndexes[index] != null ? String(relayIndexes[index]) : "";
  });
}

function getSelectedRelayAthletes() {
  return getSelectedRelayIndexesFromSelectors().map((index) => ({
    index,
    name: getAthleteName(index),
  }));
}

function collectSelectedEventAssignments() {
  const assignments = [];

  for (let athleteIndex = 0; athleteIndex < ATHLETE_ROW_COUNT; athleteIndex += 1) {
    getCurrentTeamEvents().forEach((event) => {
      const selectedInput = document.querySelector(`[data-selected-event="${athleteIndex}-${event.id}"]`);
      if (selectedInput && selectedInput.checked) {
        assignments.push({
          athleteIndex,
          eventId: event.id,
        });
      }
    });
  }

  return assignments;
}

function updateRelaySelectionSummary(selectedRelayAthletes) {
  const selectedIndexes = selectedRelayAthletes.map((athlete) => athlete.index);
  const hasDuplicates = new Set(selectedIndexes).size !== selectedIndexes.length;

  relayAthletes.classList.toggle("text-danger", hasDuplicates);

  const relayAssignedTotal = document.getElementById("relay-assigned-total");
  relayAssignedTotal.textContent = `${selectedRelayAthletes.length} / 4`;
  relayAssignedTotal.classList.toggle("text-danger", hasDuplicates);
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

function updateAthleteTotals(entries, selectedRelayAthletes) {
  const selectedAssignments = collectSelectedEventAssignments();
  const relayAthleteIndexes = new Set(selectedRelayAthletes.map((athlete) => athlete.index));

  for (let index = 0; index < ATHLETE_ROW_COUNT; index += 1) {
    const athleteEntries = selectedAssignments.filter((entry) => Number(entry.athleteIndex) === index);
    const relayCount = relayAthleteIndexes.has(index) ? 1 : 0;
    const totalNode = document.querySelector(`[data-athlete-total="${index}"]`);
    const totalEvents = athleteEntries.length + relayCount;
    totalNode.textContent = `${totalEvents} / ${ATHLETE_EVENT_LIMIT}`;
    totalNode.classList.toggle("text-danger", totalEvents > ATHLETE_EVENT_LIMIT);
  }
}

function updateEventSummaries(entries, selectedRelayAthletes) {
  let totalPoints = 0;
  const selectedAssignments = collectSelectedEventAssignments();
  let totalAssignments = 0;

  getCurrentTeamEvents().forEach((event) => {
    const eventAssignments = selectedAssignments.filter((entry) => entry.eventId === event.id);
    const eventEntries = entries
      .filter((entry) => entry.eventId === event.id)
      .sort((left, right) => right.points - left.points);

    const countedEntries = eventEntries.slice(0, event.count);

    countedEntries.forEach((entry) => {
      entry.input.classList.add("counted-performance");
      entry.pointsNode.classList.add("counted-performance");
    });

    const summaryNode = document.querySelector(`[data-summary="${event.id}"]`);
    summaryNode.textContent = `${eventAssignments.length} / ${event.limit}`;
    summaryNode.classList.toggle("text-danger", eventAssignments.length > event.limit);

    const cardCountNode = document.querySelector(`[data-count-for="${event.id}"]`);
    cardCountNode.textContent = `${eventAssignments.length} / ${event.limit}`;

    const listNode = document.querySelector(`[data-list-for="${event.id}"]`);
    listNode.innerHTML = countedEntries.length === 0
      ? "Nog geen geldige prestaties"
      : countedEntries.map((entry) => `<div><strong>${entry.athleteName}</strong>: ${entry.value} (${entry.points} p)</div>`).join("");

    const eventPoints = countedEntries.reduce((sum, entry) => sum + entry.points, 0);
    document.querySelector(`[data-team-points-for="${event.id}"]`).textContent = eventPoints;

    totalPoints += eventPoints;
    totalAssignments += eventAssignments.length;
  });

  const assignedTotal = document.getElementById("assigned-total");
  assignedTotal.textContent = `${totalAssignments + selectedRelayAthletes.length} / ${getAssignmentLimitTotal()}`;

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
  const selectedRelayAthletes = getSelectedRelayAthletes();
  updateRelaySelectionSummary(selectedRelayAthletes);
  updateAthleteTotals(entries, selectedRelayAthletes);
  const basePoints = updateEventSummaries(entries, selectedRelayAthletes);
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

  const athleteHeader = ["index", "name", "profileUrl", ...variant.events.flatMap((event) => [`selected_${event.id}`, event.id]), "relay"];
  const athleteRows = state.athletes.map((athlete, index) => [
    index + 1,
    athlete.name,
    athlete.profileUrl,
    ...variant.events.flatMap((event) => [
      Boolean(athlete.selectedEvents[event.id]),
      athlete.performances[event.id] || "",
    ]),
    athlete.relay,
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

  const profileColumnIndex = headerRow.findIndex((value) => String(value) === "profileUrl");
  const relayColumnIndex = headerRow.findIndex((value) => String(value) === "relay");
  const firstEventColumnIndex = profileColumnIndex === -1 ? 2 : profileColumnIndex + 1;
  const eventColumns = headerRow
    .slice(firstEventColumnIndex, relayColumnIndex === -1 ? undefined : relayColumnIndex)
    .map((value) => String(value));

  for (let index = 1; index < athleteRows.length && index <= ATHLETE_ROW_COUNT; index += 1) {
    const row = athleteRows[index];
    if (!Array.isArray(row)) {
      continue;
    }

    state.athletes[index - 1].name = typeof row[1] === "string" ? row[1] : row[1] == null ? "" : String(row[1]);
    if (profileColumnIndex !== -1) {
      const profileValue = row[profileColumnIndex];
      state.athletes[index - 1].profileUrl = typeof profileValue === "string" ? profileValue : profileValue == null ? "" : String(profileValue);
    }
    if (relayColumnIndex !== -1) {
      const relayValue = row[relayColumnIndex];
      state.athletes[index - 1].relay = relayValue === true || String(relayValue).toLowerCase() === "true";
    }

    eventColumns.forEach((columnName, columnIndex) => {
      const cellValue = row[columnIndex + firstEventColumnIndex];
      if (cellValue === "" || cellValue == null) {
        return;
      }

      if (columnName.startsWith("selected_")) {
        const eventId = columnName.replace(/^selected_/, "");
        state.athletes[index - 1].selectedEvents[eventId] = cellValue === true || String(cellValue).toLowerCase() === "true";
        return;
      }

      state.athletes[index - 1].performances[columnName] = String(cellValue);
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
    event.target.matches(".team-event-selected-input") ||
    event.target.matches(".athlete-name-input") ||
    event.target.matches(".athlete-profile-input") ||
    event.target.matches("#relay-input") ||
    event.target.matches("#team-name")
  ) {
    refreshRelaySelectorOptions();
    updateTeamSetup();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches(".relay-athlete-select")) {
    updateTeamSetup();
  }
});

document.addEventListener("click", (event) => {
  if (event.target.matches(".athlete-profile-import")) {
    importAthleteProfile(event.target.dataset.importProfile);
  }
});

applyState(buildEmptyState(currentVariantKey));
