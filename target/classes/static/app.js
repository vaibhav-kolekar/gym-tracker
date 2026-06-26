const apiUrl = "/api/exercises";
const form = document.querySelector("#exerciseForm");
const formMessage = document.querySelector("#formMessage");
const exerciseList = document.querySelector("#exerciseList");
const search = document.querySelector("#search");
const cancelEdit = document.querySelector("#cancelEdit");
const formTitle = document.querySelector("#formTitle");
const totalLogs = document.querySelector("#totalLogs");
const totalVolume = document.querySelector("#totalVolume");
const lastWorkout = document.querySelector("#lastWorkout");
const suggestionsUrl = `${apiUrl}/suggestions`;

let exercises = [];
let suggestionsLoaded = false;

const today = new Date().toISOString().slice(0, 10);
document.querySelector("#performedOn").value = today;

function getFormData() {
  const data = Object.fromEntries(new FormData(form).entries());
  return {
    name: data.name.trim(),
    muscleGroup: data.muscleGroup.trim(),
    weightKg: Number(data.weightKg),
    repetitions: Number(data.repetitions),
    sets: Number(data.sets || 1),
    performedOn: data.performedOn,
    notes: data.notes.trim()
  };
}

function setMessage(text, isError = false) {
  formMessage.textContent = text;
  formMessage.classList.toggle("error", isError);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatNumber(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

function calculateVolume(exercise) {
  return Number(exercise.weightKg) * Number(exercise.repetitions) * Number(exercise.sets || 1);
}

function renderSummary() {
  totalLogs.textContent = exercises.length;
  totalVolume.textContent = formatNumber(exercises.reduce((sum, exercise) => sum + calculateVolume(exercise), 0));
  lastWorkout.textContent = exercises.length ? formatDate(exercises[0].performedOn) : "-";
}

function renderExercises() {
  const term = search.value.trim().toLowerCase();
  const filtered = exercises.filter((exercise) => {
    const haystack = `${exercise.name} ${exercise.muscleGroup || ""}`.toLowerCase();
    return haystack.includes(term);
  });

  if (!filtered.length) {
    exerciseList.innerHTML = `<p class="empty">${term ? "No matching exercises found." : "No workouts yet. Add your first set."}</p>`;
    renderSummary();
    return;
  }

  exerciseList.innerHTML = filtered.map((exercise) => {
    const volume = calculateVolume(exercise);
    return `
      <article class="entry">
        <div class="entry-top">
          <div>
            <h3>${escapeHtml(exercise.name)}</h3>
            <span class="entry-date">${formatDate(exercise.performedOn)}</span>
          </div>
          <div class="entry-actions">
            <button class="ghost" type="button" data-action="edit" data-id="${exercise.id}">Edit</button>
            <button class="ghost danger" type="button" data-action="delete" data-id="${exercise.id}">Delete</button>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><strong>${formatNumber(exercise.weightKg)} kg</strong><small>weight</small></div>
          <div class="stat"><strong>${exercise.repetitions}</strong><small>reps</small></div>
          <div class="stat"><strong>${exercise.sets}</strong><small>sets</small></div>
          <div class="stat"><strong>${formatNumber(volume)}</strong><small>kg volume</small></div>
        </div>
        ${exercise.muscleGroup ? `<p class="notes"><strong>Muscle:</strong> ${escapeHtml(exercise.muscleGroup)}</p>` : ""}
        ${exercise.notes ? `<p class="notes">${escapeHtml(exercise.notes)}</p>` : ""}
      </article>
    `;
  }).join("");
  renderSummary();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadExercises() {
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error("Could not load workouts");
  }
  exercises = await response.json();
  renderExercises();
}

function updateDatalist(id, values) {
  const list = document.querySelector(`#${id}`);
  list.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}"></option>`).join("");
}

async function loadSuggestions(forceRefresh = false) {
  if (suggestionsLoaded && !forceRefresh) {
    return;
  }

  const response = await fetch(suggestionsUrl);
  if (!response.ok) {
    throw new Error("Could not load workout suggestions");
  }

  const suggestions = await response.json();
  updateDatalist("nameSuggestions", suggestions.names || []);
  updateDatalist("muscleGroupSuggestions", suggestions.muscleGroups || []);
  updateDatalist("weightSuggestions", suggestions.weightKg || []);
  updateDatalist("repetitionSuggestions", suggestions.repetitions || []);
  updateDatalist("setSuggestions", suggestions.sets || []);
  suggestionsLoaded = true;
}

function resetForm() {
  form.reset();
  document.querySelector("#exerciseId").value = "";
  document.querySelector("#performedOn").value = today;
  document.querySelector("#sets").value = "1";
  formTitle.textContent = "Add exercise";
  cancelEdit.classList.add("hidden");
}

async function saveExercise(event) {
  event.preventDefault();
  const id = document.querySelector("#exerciseId").value;
  const method = id ? "PUT" : "POST";
  const url = id ? `${apiUrl}/${id}` : apiUrl;

  setMessage("Saving...");
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(getFormData())
  });

  if (!response.ok) {
    const errors = await response.json().catch(() => ({}));
    setMessage(Object.values(errors)[0] || "Unable to save workout.", true);
    return;
  }

  resetForm();
  setMessage(id ? "Workout updated." : "Workout saved.");
  await loadExercises();
  await loadSuggestions(true);
}

function startEdit(id) {
  const exercise = exercises.find((item) => item.id === id);
  if (!exercise) {
    return;
  }
  document.querySelector("#exerciseId").value = exercise.id;
  document.querySelector("#name").value = exercise.name;
  document.querySelector("#muscleGroup").value = exercise.muscleGroup || "";
  document.querySelector("#weightKg").value = exercise.weightKg;
  document.querySelector("#repetitions").value = exercise.repetitions;
  document.querySelector("#sets").value = exercise.sets;
  document.querySelector("#performedOn").value = exercise.performedOn;
  document.querySelector("#notes").value = exercise.notes || "";
  formTitle.textContent = "Edit exercise";
  cancelEdit.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteExercise(id) {
  const response = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
  if (!response.ok) {
    setMessage("Unable to delete workout.", true);
    return;
  }
  setMessage("Workout deleted.");
  await loadExercises();
  await loadSuggestions(true);
}

form.addEventListener("submit", saveExercise);
search.addEventListener("input", renderExercises);
cancelEdit.addEventListener("click", () => {
  resetForm();
  setMessage("");
});

exerciseList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  const id = Number(button.dataset.id);
  if (button.dataset.action === "edit") {
    startEdit(id);
  }
  if (button.dataset.action === "delete") {
    await deleteExercise(id);
  }
});

form.querySelectorAll("input[list]").forEach((input) => {
  input.addEventListener("focus", () => {
    loadSuggestions().catch(() => {
      setMessage("Could not load previous workout values.", true);
    });
  });
});

loadExercises().catch(() => {
  exerciseList.innerHTML = `<p class="empty">Could not load workouts. Check that the server is running.</p>`;
});

loadSuggestions().catch(() => {
  // Keep the form usable even if suggestions fail to load.
});
