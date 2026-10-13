// Mock ApiClient backed by localStorage. Research runs are simulated from their start time
// (not timers), so a page refresh mid-run picks up exactly where it left off.
import type { ApiClient, CreateProjectInput, Project, ResearchRun } from "../../types/models";
import { seedState, STEP_LABELS, type MockState } from "../../mocks/projects";
import { generateResults } from "../../mocks/results";

const STORAGE_KEY = "seo-mock:v1";
const STEP_MS = 3000; // each of the 4 steps takes 3s → ~12s per run
const LATENCY_MS = 350;

let memoryState: MockState | null = null; // fallback when localStorage is unavailable

function load(): MockState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockState;
  } catch {
    if (memoryState) return memoryState;
  }
  const state = memoryState ?? seedState();
  save(state);
  return state;
}

function save(state: MockState) {
  memoryState = state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* in-memory only */
  }
}

/** Advances RUNNING runs based on elapsed time and finalises completed ones. */
function advanceRuns(state: MockState): MockState {
  const now = Date.now();
  for (const run of state.runs) {
    if (run.status !== "RUNNING") continue;
    const elapsed = now - new Date(run.startedAt).getTime();
    const total = STEP_MS * STEP_LABELS.length;
    const doneSteps = Math.floor(elapsed / STEP_MS);
    run.progress = Math.min(100, Math.round((elapsed / total) * 100));
    run.steps = STEP_LABELS.map((s, i) => ({
      ...s,
      status: i < doneSteps ? "DONE" : i === doneSteps ? "RUNNING" : "PENDING",
    }));
    if (elapsed >= total) {
      run.status = "COMPLETED";
      run.progress = 100;
      run.completedAt = new Date(new Date(run.startedAt).getTime() + total).toISOString();
      run.steps = run.steps.map((s) => ({ ...s, status: "DONE" }));
      const project = state.projects.find((p) => p.id === run.projectId);
      if (project) {
        project.status = "COMPLETED";
        project.updatedAt = run.completedAt;
        if (!state.results.some((r) => r.runId === run.id)) {
          state.results.push(generateResults(project, run.id, run.completedAt));
        }
      }
    }
  }
  save(state);
  return state;
}

function current(): MockState {
  return advanceRuns(load());
}

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), LATENCY_MS));

const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function findProject(state: MockState, id: string): Project {
  const project = state.projects.find((p) => p.id === id);
  if (!project) throw new Error(`Project "${id}" not found.`);
  return project;
}

export const mockClient: ApiClient = {
  async listProjects() {
    const projects = [...current().projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return delay(projects);
  },

  async getProject(id) {
    return delay(findProject(current(), id));
  },

  async createProject(input: CreateProjectInput) {
    const state = current();
    const now = new Date().toISOString();
    const project: Project = { ...input, id: newId("p"), status: "DRAFT", createdAt: now, updatedAt: now };
    state.projects.push(project);
    save(state);
    return delay(project);
  },

  async listRuns(projectId) {
    const runs = current()
      .runs.filter((r) => r.projectId === projectId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    return delay(runs);
  },

  async startResearch(projectId) {
    const state = current();
    const project = findProject(state, projectId);
    const active = state.runs.find((r) => r.projectId === projectId && r.status === "RUNNING");
    if (active) return delay(active);

    const now = new Date().toISOString();
    const run: ResearchRun = {
      id: newId("r"),
      projectId,
      status: "RUNNING",
      progress: 0,
      steps: STEP_LABELS.map((s, i) => ({ ...s, status: i === 0 ? "RUNNING" : "PENDING" })),
      startedAt: now,
    };
    state.runs.push(run);
    project.status = "RUNNING";
    project.latestRunId = run.id;
    project.updatedAt = now;
    save(state);
    return delay(run);
  },

  async getRun(runId) {
    const run = current().runs.find((r) => r.id === runId);
    if (!run) throw new Error(`Research run "${runId}" not found.`);
    return delay(run);
  },

  async getResults(runId) {
    const results = current().results.find((r) => r.runId === runId);
    if (!results) throw new Error("Results are not available for this run yet.");
    return delay(results);
  },
};

/** Clears local mock data and restores the demo seed. */
export function resetMockData() {
  memoryState = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
