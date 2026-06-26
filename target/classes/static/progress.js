const apiUrl = "/api/exercises";
const compareMode = document.querySelector("#compareMode");
const compareValue = document.querySelector("#compareValue");
const metric = document.querySelector("#metric");
const filterMessage = document.querySelector("#filterMessage");
const trackedGroups = document.querySelector("#trackedGroups");
const chartPoints = document.querySelector("#chartPoints");
const latestDate = document.querySelector("#latestDate");
const chartLabel = document.querySelector("#chartLabel");
const latestMetric = document.querySelector("#latestMetric");
const latestMetricDate = document.querySelector("#latestMetricDate");
const bestMetric = document.querySelector("#bestMetric");
const bestMetricDate = document.querySelector("#bestMetricDate");
const deltaMetric = document.querySelector("#deltaMetric");
const deltaContext = document.querySelector("#deltaContext");
const chartCaption = document.querySelector("#chartCaption");
const sessionCount = document.querySelector("#sessionCount");
const averageMetric = document.querySelector("#averageMetric");
const trendMetric = document.querySelector("#trendMetric");
const historyWrapper = document.querySelector("#historyWrapper");
const progressChart = document.querySelector("#progressChart");

let exercises = [];

function setMessage(text, isError = false) {
  filterMessage.textContent = text;
  filterMessage.classList.toggle("error", isError);
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatMetric(value, metricKey) {
  if (value == null || Number.isNaN(value)) {
    return "-";
  }
  if (metricKey === "weightKg") {
    return `${formatNumber(value)} kg`;
  }
  if (metricKey === "volume") {
    return `${formatNumber(value)} kg`;
  }
  return formatNumber(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

function getMetricValue(exercise, metricKey) {
  if (metricKey === "volume") {
    return Number(exercise.weightKg) * Number(exercise.repetitions) * Number(exercise.sets || 1);
  }
  return Number(exercise[metricKey]);
}

function getCompareLabel(mode) {
  return mode === "muscleGroup" ? "Muscle group" : "Exercise name";
}

function getComparableOptions(mode) {
  const seen = new Set();
  return exercises
    .map((exercise) => (exercise[mode] || "").trim())
    .filter((value) => value && !seen.has(value) && seen.add(value))
    .sort((left, right) => left.localeCompare(right));
}

function populateCompareValues() {
  const options = getComparableOptions(compareMode.value);
  compareValue.innerHTML = options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  if (options.length) {
    compareValue.value = options[0];
    setMessage("");
  } else {
    setMessage("Add more workout history to unlock comparisons.", false);
  }
  trackedGroups.textContent = options.length;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getMatchingExercises() {
  const mode = compareMode.value;
  const value = compareValue.value;
  return exercises
    .filter((exercise) => (exercise[mode] || "").trim() === value)
    .sort((left, right) => left.performedOn.localeCompare(right.performedOn) || left.id - right.id);
}

function renderEmptyState(message) {
  chartLabel.textContent = "";
  latestMetric.textContent = "-";
  latestMetricDate.textContent = "";
  bestMetric.textContent = "-";
  bestMetricDate.textContent = "";
  deltaMetric.textContent = "-";
  deltaContext.textContent = "";
  chartCaption.textContent = "";
  sessionCount.textContent = "0";
  averageMetric.textContent = "-";
  trendMetric.textContent = "-";
  chartPoints.textContent = "0";
  latestDate.textContent = "-";
  progressChart.innerHTML = "";
  historyWrapper.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderHistory(items, metricKey) {
  historyWrapper.innerHTML = `
    <table class="history-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Weight</th>
          <th>Reps</th>
          <th>Sets</th>
          <th>${metricKey === "volume" ? "Volume" : "Selected metric"}</th>
        </tr>
      </thead>
      <tbody>
        ${items.slice().reverse().map((exercise) => `
          <tr>
            <td>${escapeHtml(formatDate(exercise.performedOn))}</td>
            <td>${escapeHtml(formatMetric(Number(exercise.weightKg), "weightKg"))}</td>
            <td>${escapeHtml(formatMetric(Number(exercise.repetitions), "repetitions"))}</td>
            <td>${escapeHtml(formatMetric(Number(exercise.sets), "sets"))}</td>
            <td>${escapeHtml(formatMetric(getMetricValue(exercise, metricKey), metricKey))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderChart(items, metricKey) {
  const width = 760;
  const height = 280;
  const padding = { top: 20, right: 18, bottom: 36, left: 42 };
  const values = items.map((exercise) => getMetricValue(exercise, metricKey));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  const points = values.map((value, index) => {
    const x = padding.left + (items.length === 1 ? usableWidth / 2 : (index / (items.length - 1)) * usableWidth);
    const y = padding.top + usableHeight - ((value - minValue) / range) * usableHeight;
    return { x, y, value, label: formatDate(items[index].performedOn) };
  });

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const horizontalGuides = 4;
  const guides = Array.from({ length: horizontalGuides + 1 }, (_, index) => {
    const value = minValue + ((horizontalGuides - index) / horizontalGuides) * range;
    const y = padding.top + (index / horizontalGuides) * usableHeight;
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#d7ded6" stroke-dasharray="4 4" />
      <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#617064">${escapeHtml(formatNumber(value))}</text>
    `;
  }).join("");

  const pointLabels = points.map((point, index) => `
    <text x="${point.x}" y="${height - 12}" text-anchor="middle" font-size="11" fill="#617064">
      ${escapeHtml(items[index].performedOn.slice(5))}
    </text>
  `).join("");

  const dots = points.map((point, index) => `
    <circle cx="${point.x}" cy="${point.y}" r="${index === points.length - 1 ? 6 : 4}" fill="${index === points.length - 1 ? "#1f7a5c" : "#4ea987"}" />
  `).join("");

  progressChart.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
    ${guides}
    <polyline fill="none" stroke="#1f7a5c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${polyline}"></polyline>
    ${dots}
    ${pointLabels}
  `;
}

function renderComparison() {
  const items = getMatchingExercises();
  const metricKey = metric.value;

  if (!items.length) {
    renderEmptyState("No matching workouts found yet for this filter.");
    return;
  }

  const latest = items[items.length - 1];
  const previousItems = items.slice(0, -1);
  const latestValue = getMetricValue(latest, metricKey);
  const previousValues = previousItems.map((exercise) => getMetricValue(exercise, metricKey));
  const previousBest = previousValues.length ? Math.max(...previousValues) : null;
  const allValues = items.map((exercise) => getMetricValue(exercise, metricKey));
  const overallAverage = allValues.reduce((sum, value) => sum + value, 0) / allValues.length;
  const previousAverage = previousValues.length
    ? previousValues.reduce((sum, value) => sum + value, 0) / previousValues.length
    : null;
  const previousLatest = previousValues.length ? previousValues[previousValues.length - 1] : null;
  const delta = previousLatest == null ? null : latestValue - previousLatest;

  chartLabel.textContent = `${getCompareLabel(compareMode.value)}: ${compareValue.value}`;
  latestMetric.textContent = formatMetric(latestValue, metricKey);
  latestMetricDate.textContent = formatDate(latest.performedOn);
  bestMetric.textContent = previousBest == null ? "First session" : formatMetric(previousBest, metricKey);
  bestMetricDate.textContent = previousBest == null
    ? "No earlier workout to compare"
    : formatDate(previousItems[previousValues.indexOf(previousBest)].performedOn);
  deltaMetric.textContent = delta == null ? "New baseline" : `${delta > 0 ? "+" : ""}${formatMetric(delta, metricKey)}`;
  deltaContext.textContent = delta == null
    ? "Save another session to see change."
    : `Compared with ${formatDate(previousItems[previousItems.length - 1].performedOn)}`;

  sessionCount.textContent = String(items.length);
  averageMetric.textContent = formatMetric(overallAverage, metricKey);
  trendMetric.textContent = previousAverage == null
    ? "Starting point"
    : latestValue >= previousAverage ? "Above average" : "Below average";

  chartPoints.textContent = String(items.length);
  latestDate.textContent = formatDate(latest.performedOn);
  chartCaption.textContent = `Showing ${metric.options[metric.selectedIndex].text.toLowerCase()} across ${items.length} session${items.length === 1 ? "" : "s"} for ${compareValue.value}.`;

  renderChart(items, metricKey);
  renderHistory(items, metricKey);
}

async function loadExercises() {
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error("Could not load workout history");
  }

  exercises = await response.json();
  populateCompareValues();
  if (!compareValue.value) {
    renderEmptyState("Add a few workouts first, then this page will chart your progress.");
    return;
  }
  renderComparison();
}

compareMode.addEventListener("change", () => {
  populateCompareValues();
  if (compareValue.value) {
    renderComparison();
  } else {
    renderEmptyState("No saved values are available for this comparison mode yet.");
  }
});

compareValue.addEventListener("change", renderComparison);
metric.addEventListener("change", renderComparison);

loadExercises().catch(() => {
  setMessage("Could not load workout history.", true);
  renderEmptyState("The progress page could not load workout data. Make sure the app is running.");
});
