const TEAM_EVENTS = [
  { id: "60m", label: "60m", type: "track", limit: 3, count: 2 },
  { id: "60mh", label: "60mH", type: "track", limit: 3, count: 2 },
  { id: "1000m", label: "1000m", type: "track", limit: 3, count: 2 },
  { id: "600m", label: "600m", type: "track", limit: 3, count: 2 },
  { id: "hoog", label: "Hoog", type: "field", limit: 2, count: 1 },
  { id: "ver", label: "Ver", type: "field", limit: 2, count: 1 },
  { id: "kogel", label: "Kogel", type: "field", limit: 2, count: 1 },
  { id: "speer", label: "Speer", type: "field", limit: 2, count: 1 },
  { id: "discus", label: "Discus", type: "field", limit: 2, count: 1 },
];

const ATHLETE_ROW_COUNT = 10;
const ATHLETE_EVENT_LIMIT = 3;

const athleteRowsBody = document.getElementById("athlete-rows");
const eventSummaryCards = document.getElementById("event-summary-cards");
const teamTotalPoints = document.getElementById("team-total-points");
const assignedTotal = document.getElementById("assigned-total");
const relayInput = document.querySelector(".relay-input");
const relayPoints = document.getElementById("relay-points");
const teamNameInput = document.getElementById("team-name");
const relayTeamName = document.getElementById("relay-team-name");

function createAthleteRows() {
  const rows = [];

  for (let index = 0; index < ATHLETE_ROW_COUNT; index += 1) {
    const cells = TEAM_EVENTS.map((event) => `
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
  const cards = TEAM_EVENTS.map((event) => `
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

function parsePerformance(eventId, value) {
  return parseSingleInput(eventId, value);
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

    const performance = parsePerformance(eventId, value);
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

  TEAM_EVENTS.forEach((event) => {
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

  assignedTotal.textContent = `${totalAssignments} / 18`;

  return totalPoints;
}

function updateRelayPoints() {
  const value = relayInput.value.trim();
  relayInput.classList.remove("is-invalid", "is-valid", "counted-performance");

  if (value === "") {
    relayPoints.textContent = "0";
    return 0;
  }

  if (!validateInput("4x60m", value)) {
    relayInput.classList.add("is-invalid");
    relayPoints.textContent = "Invalid";
    return 0;
  }

  const performance = parseSingleInput("4x60m", value);
  const points = calculatePointsForEvent("4x60m", performance, category.U14_U16);

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

createAthleteRows();
createSummaryCards();
updateTeamSetup();

document.addEventListener("input", (event) => {
  if (
    event.target.matches(".team-performance-input") ||
    event.target.matches(".athlete-name-input") ||
    event.target.matches(".relay-input") ||
    event.target.matches("#team-name")
  ) {
    updateTeamSetup();
  }
});
