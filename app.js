const SAMPLE = `# Скрипты приветствия для сервера
welcome:
  type: world
  debug: false
  events:
    on player joins:
    - narrate "<&a>Добро пожаловать на сервер, <player.name>!"
    - wait 1s
    - narrate "<&7>Рады видеть тебя снова."
    on player first joins:
    - narrate "<&6>Это твое первое подключение!"
    - playeffect effect:VILLAGER_YES

spawn_portal:
  type: world
  events:
    on player steps on emerald_block:
    - narrate "<&b>Телепортируем..."
    - wait 1s
    - teleport <player> <location[world,0,80,0]>
`;

const state = {
  source: SAMPLE,
  filename: "пример.dsc",
  files: [{ id: "example", filename: "пример.dsc", source: SAMPLE, activeScript: 0, isExample: true, commandStates: [] }],
  activeFileIndex: 0,
  scripts: [],
  activeScript: 0,
  selectedLine: null,
  activeGroupIndex: 0,
  draggedLine: null,
  draggedCommand: null,
  clipboard: null,
  contextTarget: null,
  flagsCollapsed: false,
  zoom: 100,
  mode: "blocks",
  dirty: false,
  persistenceEnabled: false,
  saveErrorShown: false,
  toastTimer: null
};

const $ = (selector) => document.querySelector(selector);
const canvasContent = $("#canvas-content");
const codeEditor = $("#code-editor");
const workspaceStorageKey = "denizenBlocks.workspace.v1";
const consentStorageKey = "denizenBlocks.storageConsent.v1";
const itemTextureIds = new Set(window.DENIZEN_ITEM_TEXTURES || []);
const blockTextureNames = Array.isArray(window.DENIZEN_BLOCK_TEXTURES) ? window.DENIZEN_BLOCK_TEXTURES : [];
const blockTextureSuffix = /_(?:top|bottom|side|front|back|particle|inventory|on|off|open|closed|lit|unlit|powered|unpowered|north|south|east|west|up|down|inner|outer|overlay|stage\d+|still|flow|dot|cross|line|\d+)$/i;
const blockTextureOptions = blockTextureNames.map((texture) => {
  let material = texture;
  for (let count = 0; count < 5; count++) {
    const base = material.replace(blockTextureSuffix, "");
    if (base === material) break;
    material = base;
  }
  return { texture, material };
});
const denizenEvents = Array.isArray(window.DENIZEN_EVENTS) ? window.DENIZEN_EVENTS : [];
const denizenCommands = Array.isArray(window.DENIZEN_COMMANDS) ? window.DENIZEN_COMMANDS : [];
const itemDatalist = $("#item-textures");
const blockPickerModal = $("#block-picker-modal");
const blockPickerSearch = $("#block-picker-search");
const blockPickerGrid = $("#block-picker-grid");
const blockPickerCount = $("#block-picker-count");
let blockPickerSelection = null;
let blockPickerCurrentMaterial = "";
let blockPickerKind = "block";
const commandCategoryLabels = {
  core: "Основные",
  entity: "Сущности",
  file: "Файлы",
  image: "Изображения",
  item: "Предметы",
  npc: "NPC",
  player: "Игрок",
  queue: "Очереди",
  server: "Сервер",
  world: "Мир",
  depenizen: "Depenizen",
  external: "Внешние"
};
const commandTemplates = {
  actionbar: 'actionbar "Короткое сообщение"',
  adjust: "adjust <player> walk_speed:0.2",
  announce: 'announce "Сообщение для всех"',
  define: "define message Привет, игрок!",
  flag: "flag player visited:true",
  foreach: "foreach <server.online_players> as:player:",
  give: "give <player> diamond 1",
  if: "if <условие>:",
  narrate: 'narrate "Привет, игрок!"',
  playeffect: "playeffect effect:VILLAGER_YES",
  playsound: "playsound sound:entity.player.levelup",
  repeat: "repeat 3:",
  spawn: "spawn armor_stand <player.location>",
  teleport: "teleport <player> <location[world,0,80,0]>",
  title: 'title <player> title:"Заголовок"',
  wait: "wait 1s",
  yaml: "yaml create id:example"
};
for (const itemId of itemTextureIds) {
  const option = document.createElement("option");
  option.value = itemId;
  itemDatalist.append(option);
}

function persistWorkspace() {
  if (!state.persistenceEnabled) return;
  syncActiveFile();
  const snapshot = {
    version: 2,
    files: state.files.map((file) => ({
      id: file.id,
      filename: file.filename,
      source: file.source,
      activeScript: file.activeScript,
      isExample: file.isExample === true,
      commandStates: Array.isArray(file.commandStates) ? file.commandStates : []
    })),
    activeFileIndex: state.activeFileIndex,
    selectedLine: state.selectedLine,
    activeGroupIndex: state.activeGroupIndex,
    zoom: state.zoom,
    mode: state.mode,
    flagsCollapsed: state.flagsCollapsed
  };
  try {
    localStorage.setItem(workspaceStorageKey, JSON.stringify(snapshot));
    state.saveErrorShown = false;
    $("#save-status").textContent = "Автосохранено на этом устройстве";
  } catch (error) {
    console.error("Не удалось сохранить проект в локальном хранилище.", error);
    $("#save-status").textContent = "Ошибка автосохранения";
    if (!state.saveErrorShown) {
      showToast("Не удалось сохранить проект в браузере");
      state.saveErrorShown = true;
    }
  }
}

function restoreWorkspace() {
  try {
    const saved = localStorage.getItem(workspaceStorageKey);
    if (!saved) return;
    const snapshot = JSON.parse(saved);
    if (!snapshot) {
      console.warn("Сохранённый проект имеет неподдерживаемый формат.");
      return;
    }
    if (snapshot.version === 2 && Array.isArray(snapshot.files)) {
      state.files = snapshot.files.filter((file) =>
        file && typeof file.filename === "string" && typeof file.source === "string"
      ).map((file, index) => ({
        id: typeof file.id === "string" ? file.id : `restored-${index}`,
        filename: file.filename,
        source: file.source,
        activeScript: Number.isInteger(file.activeScript) ? Math.max(0, file.activeScript) : 0,
        isExample: file.isExample === true,
        commandStates: Array.isArray(file.commandStates)
          ? file.commandStates.filter((entry) => entry && Number.isInteger(entry.line) && (entry.mode === "auto" || entry.mode === "manual"))
          : []
      }));
      if (!state.files.length) {
        console.warn("Сохранённый проект не содержит доступных файлов.");
        return;
      }
      state.activeFileIndex = Number.isInteger(snapshot.activeFileIndex)
        ? Math.max(0, Math.min(state.files.length - 1, snapshot.activeFileIndex))
        : 0;
      const file = state.files[state.activeFileIndex];
      state.source = file.source;
      state.filename = file.filename;
      state.activeScript = file.activeScript;
    } else if (snapshot.version === 1 && typeof snapshot.source === "string") {
      state.source = snapshot.source;
      if (typeof snapshot.filename === "string") state.filename = snapshot.filename;
      state.activeScript = Number.isInteger(snapshot.activeScript) ? Math.max(0, snapshot.activeScript) : 0;
      state.files = [{ id: "migrated", filename: state.filename, source: state.source, activeScript: state.activeScript, commandStates: [] }];
      state.activeFileIndex = 0;
    } else {
      console.warn("Сохранённый проект имеет неподдерживаемый формат.");
      return;
    }
    if (Number.isInteger(snapshot.selectedLine)) state.selectedLine = snapshot.selectedLine;
    if (Number.isInteger(snapshot.activeGroupIndex)) state.activeGroupIndex = Math.max(0, snapshot.activeGroupIndex);
    if (Number.isFinite(snapshot.zoom)) state.zoom = Math.max(70, Math.min(140, snapshot.zoom));
    if (snapshot.mode === "blocks" || snapshot.mode === "code") state.mode = snapshot.mode;
    if (typeof snapshot.flagsCollapsed === "boolean") state.flagsCollapsed = snapshot.flagsCollapsed;
  } catch (error) {
    console.error("Не удалось восстановить сохранённый проект.", error);
    showToast("Не удалось прочитать автосохранённый проект");
  }
}

function activeFile() {
  return state.files[state.activeFileIndex] || null;
}

function syncActiveFile() {
  const file = activeFile();
  if (!file) return;
  file.filename = state.filename;
  file.source = state.source;
  file.activeScript = state.activeScript;
  if (state.source !== SAMPLE) file.isExample = false;
}

function initializePersistence() {
  try {
    const consent = localStorage.getItem(consentStorageKey);
    if (consent === "granted") {
      state.persistenceEnabled = true;
      restoreWorkspace();
    } else {
      $("#save-status").textContent = consent === "denied" ? "Автосохранение отключено" : "Автосохранение не включено";
      if (consent !== "denied") $("#privacy-notice").hidden = false;
    }
  } catch (error) {
    console.error("Локальное хранилище браузера недоступно.", error);
    $("#save-status").textContent = "Автосохранение недоступно";
  }
}

function parseScripts(source) {
  const lines = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const starts = [];
  lines.forEach((line, index) => {
    const match = line.match(/^([A-Za-z0-9_][\w -]*):\s*(?:#.*)?$/);
    if (match) starts.push({ name: match[1].trim(), start: index });
  });
  return starts.map((entry, index) => {
    const end = index + 1 < starts.length ? starts[index + 1].start : lines.length;
    return { name: entry.name, start: entry.start, end, lines: lines.slice(entry.start, end) };
  });
}

function countCommands(script) {
  return script.lines.filter((line) => /^\s+-\s+/.test(line)).length;
}

function getGroups(script) {
  const groups = [];
  let current = null;
  script.lines.forEach((line, localIndex) => {
    const commandMatch = line.match(/^(\s*)-\s+(.*)$/);
    if (commandMatch) {
      if (!current) {
        current = { name: "Команды", indent: commandMatch[1].length, headerIndex: null, items: [] };
        groups.push(current);
      }
      current.items.push({ localIndex, indent: commandMatch[1], command: commandMatch[2] });
      return;
    }
    const keyMatch = line.match(/^(\s*)([^#\s].*):\s*(?:#.*)?$/);
    if (keyMatch && line.trim() !== `${script.name}:`) {
      const indent = keyMatch[1].length;
      if (current && indent <= current.indent) current = null;
      if (!current || indent > current.indent) {
        current = { name: keyMatch[2].trim(), indent, headerIndex: localIndex, items: [] };
        groups.push(current);
      } else {
        current = { name: keyMatch[2].trim(), indent, headerIndex: localIndex, items: [] };
        groups.push(current);
      }
    }
  });
  return groups.filter((group) => group.items.length || (group.indent >= 4 && group.headerIndex !== null));
}

function commandType(command) {
  const name = (command.trim().split(/\s+/)[0] || "").replace(/:$/, "").toLowerCase();
  if (["narrate", "announce", "title", "actionbar"].includes(name)) return { type: "chat", label: "Сообщение", icon: "◉" };
  if (["playeffect", "playsound", "teleport", "spawn", "give"].includes(name)) return { type: "action", label: "Действие", icon: "✦" };
  if (["wait", "if", "else", "endif", "foreach", "repeat", "run"].includes(name)) return { type: "control", label: "Управление", icon: "◷" };
  if (["flag", "define", "yaml", "adjust"].includes(name)) return { type: "variable", label: "Переменная", icon: "⚑" };
  return { type: "generic", label: "Команда", icon: "›" };
}

function getCommandName(command) {
  return (command.trim().split(/\s+/)[0] || "command").replace(/:$/, "");
}

function getCommandParameters(command) {
  const rawName = command.trim().split(/\s+/)[0] || "";
  return command.slice(rawName.length).trimStart();
}

function buildCommand(name, parameters, original) {
  const value = parameters.trimEnd();
  const colon = opensBlock(original) && !value.endsWith(":") ? ":" : "";
  return `${name}${value ? ` ${value}` : ""}${colon}`;
}

function splitMetaSyntax(text, separators) {
  const parts = [];
  let start = 0;
  let square = 0, round = 0, angle = 0, curly = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === "<") angle++;
    else if (character === ">" && angle) angle--;
    else if (!angle) {
      if (character === "[") square++;
      else if (character === "]" && square) square--;
      else if (character === "(") round++;
      else if (character === ")" && round) round--;
      else if (character === "{") curly++;
      else if (character === "}" && curly) curly--;
      else if (!square && !round && !curly && separators.includes(character)) {
        if (character === "|" && /^\s*\.\s*\.\s*\./.test(text.slice(index + 1))) continue;
        if (character === "|" && text[index - 1] === "|") continue;
        parts.push(text.slice(start, index).trim());
        start = index + 1;
      }
    }
  }
  parts.push(text.slice(start).trim());
  return parts.filter(Boolean);
}

function extractMetaGroups(syntax) {
  const groups = [];
  const stack = [];
  let start = -1;
  let angle = 0;
  for (let index = 0; index < syntax.length; index++) {
    const character = syntax[index];
    if (character === "<") {
      angle++;
      continue;
    }
    if (character === ">" && angle) {
      angle--;
      continue;
    }
    if (angle) continue;
    if (character === "[" || character === "(") {
      if (!stack.length) start = index;
      stack.push(character);
    } else if ((character === "]" || character === ")") && stack.length) {
      stack.pop();
      if (!stack.length && start >= 0) {
        groups.push({
          optional: syntax[start] === "(",
          raw: syntax.slice(start + 1, index).trim()
        });
        start = -1;
      }
    }
  }
  return groups;
}

function hasUngroupedMetaContent(syntax) {
  let depth = 0;
  let angle = 0;
  let ungrouped = "";
  for (const character of syntax) {
    if (character === "<") angle++;
    else if (character === ">" && angle) angle--;
    else if (!angle && (character === "[" || character === "(")) depth++;
    else if (!angle && (character === "]" || character === ")") && depth) depth--;
    else if (!depth) ungrouped += character;
  }
  return Boolean(ungrouped.trim());
}

function parseMetaBranch(raw) {
  const fields = [];
  const pattern = /<([^<>]+)>/g;
  let match;
  while ((match = pattern.exec(raw))) {
    const before = raw.slice(0, match.index);
    const keyMatch = before.match(/([A-Za-z_][\w-]*)\s*:\s*$/);
    const after = raw.slice(pattern.lastIndex);
    const defaultMatch = after.match(/^\s*\{([^}]+)\}/);
    const placeholder = match[1].trim();
    const optionValues = placeholder.split("/").map((value) => value.trim());
    const options = optionValues.length > 1 && optionValues.every((value) => /^(?:\{[^{}]+\}|[A-Za-z0-9_#.-]+)$/.test(value))
      ? optionValues.map((value) => value.replace(/^\{|\}$/g, ""))
      : null;
    const placeholderDefault = optionValues.find((value) => /^\{[^{}]+\}$/.test(value));
    fields.push({
      key: keyMatch ? keyMatch[1] : "",
      label: keyMatch ? keyMatch[1] : placeholder,
      hidden: /^commands?$/i.test(placeholder),
      options,
      defaultValue: defaultMatch ? defaultMatch[1].trim() : placeholderDefault ? placeholderDefault.slice(1, -1) : options ? options[0] : ""
    });
  }
  return { raw, fields, label: fields.filter((field) => !field.hidden).map((field) => field.label).join(", ") || raw };
}

function parseCommandMetaSyntax(commandName) {
  const entry = denizenCommands.find((item) => item.id === commandName.toLowerCase());
  if (!entry || !entry.syntax) return null;
  const escapedCommandName = commandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const syntax = entry.syntax.replace(new RegExp(`^${escapedCommandName}\\s+`, "i"), "");
  const variants = splitMetaSyntax(syntax, "/").map((raw) => ({
    raw,
    label: raw.replace(/<([^<>]+)>/g, "$1").replace(/[\[\](){}]/g, "").replace(/\s*:\s*/g, ":").replace(/\s+/g, " ").trim(),
    groups: extractMetaGroups(raw).map((group) => {
      const branches = splitMetaSyntax(group.raw, "/|").map(parseMetaBranch);
      return {
        optional: group.optional,
        raw: group.raw,
        branches,
        label: branches[0] ? branches[0].label : "Параметр"
      };
    })
  })).filter((variant) => variant.groups.length);
  if (variants.some((variant) =>
    hasUngroupedMetaContent(variant.raw) ||
    variant.groups.some((group) =>
      /[\[\]()]/.test(group.raw) || group.branches.some((branch) => branch.fields.some((field) => field.hidden))
    )
  )) return null;
  return variants.length ? { variants } : null;
}

function createCommandEditorState(line, commandName, schema, mode, parameters) {
  return {
    line,
    commandName: commandName.toLowerCase(),
    mode,
    variant: 0,
    groups: schema
      ? schema.variants.map((variant) => variant.groups.map((group) => ({
        enabled: !group.optional,
        branch: 0,
        values: group.branches.map((branch) => branch.fields.map((field) => field.defaultValue))
      })))
      : [],
    manualParameters: parameters || "",
    extraParameters: ""
  };
}

function ensureCommandEditorState(editorState, schema) {
  if (!schema) {
    editorState.mode = "manual";
    return;
  }
  if (!Array.isArray(editorState.groups)) editorState.groups = [];
  schema.variants.forEach((variant, variantIndex) => {
    if (!Array.isArray(editorState.groups[variantIndex])) editorState.groups[variantIndex] = [];
    variant.groups.forEach((group, groupIndex) => {
      const current = editorState.groups[variantIndex][groupIndex];
      if (!current || typeof current !== "object") {
        editorState.groups[variantIndex][groupIndex] = {
          enabled: !group.optional,
          branch: 0,
          values: group.branches.map((branch) => branch.fields.map((field) => field.defaultValue))
        };
        return;
      }
      if (!Array.isArray(current.values)) current.values = [];
      group.branches.forEach((branch, branchIndex) => {
        if (!Array.isArray(current.values[branchIndex])) {
          current.values[branchIndex] = branch.fields.map((field) => field.defaultValue);
        } else {
          branch.fields.forEach((field, fieldIndex) => {
            if (typeof current.values[branchIndex][fieldIndex] !== "string") {
              current.values[branchIndex][fieldIndex] = field.defaultValue;
            }
          });
        }
      });
      if (!Number.isInteger(current.branch) || current.branch < 0 || current.branch >= group.branches.length) current.branch = 0;
      if (typeof current.enabled !== "boolean") current.enabled = !group.optional;
    });
  });
  if (!Number.isInteger(editorState.variant) || editorState.variant < 0 || editorState.variant >= schema.variants.length) editorState.variant = 0;
  if (typeof editorState.manualParameters !== "string") editorState.manualParameters = "";
  if (typeof editorState.extraParameters !== "string") editorState.extraParameters = "";
}

function getCommandEditorState(line, command) {
  const file = activeFile();
  if (!file) return { state: null, schema: null };
  if (!Array.isArray(file.commandStates)) file.commandStates = [];
  const commandName = getCommandName(command).toLowerCase();
  const schema = parseCommandMetaSyntax(commandName);
  let editorState = file.commandStates.find((entry) => entry.line === line);
  if (editorState && editorState.commandName !== commandName) {
    file.commandStates = file.commandStates.filter((entry) => entry !== editorState);
    editorState = null;
  }
  if (!editorState) {
    const parameters = getCommandParameters(command);
    const mode = schema && !parameters.trim() ? "auto" : "manual";
    editorState = createCommandEditorState(line, commandName, schema, mode, parameters);
    file.commandStates.push(editorState);
  } else {
    editorState.line = line;
    editorState.commandName = commandName;
  }
  ensureCommandEditorState(editorState, schema);
  return { state: editorState, schema };
}

function shiftCommandEditorStates(file, start, removedCount, insertedCount) {
  if (!file || !Array.isArray(file.commandStates)) return;
  const end = start + removedCount;
  file.commandStates = file.commandStates.flatMap((entry) => {
    if (entry.line < start) return [entry];
    if (entry.line < end) return [];
    return [{ ...entry, line: entry.line + insertedCount - removedCount }];
  });
}

function moveCommandEditorStates(file, start, count, destination) {
  if (!file || !Array.isArray(file.commandStates)) return;
  file.commandStates = file.commandStates.map((entry) => {
    if (entry.line >= start && entry.line < start + count) {
      return { ...entry, line: destination + entry.line - start };
    }
    const afterRemoval = entry.line < start ? entry.line : entry.line - count;
    return { ...entry, line: afterRemoval >= destination ? afterRemoval + count : afterRemoval };
  });
}

function opensBlock(command) {
  return /^(?:if|else|foreach|repeat|while)\b.*:\s*$/i.test(command.trim());
}

function buildCommandTree(group) {
  const roots = [];
  const stack = [];
  group.items.forEach((item) => {
    const node = { ...item, indentSize: item.indent.length, children: [] };
    while (stack.length && node.indentSize <= stack[stack.length - 1].indentSize) stack.pop();
    if (stack.length) stack[stack.length - 1].children.push(node);
    else roots.push(node);
    if (opensBlock(node.command)) stack.push(node);
  });
  return roots;
}

function activeScript() {
  return state.scripts[state.activeScript] || null;
}

function render() {
  state.activeFileIndex = Math.max(0, Math.min(state.files.length - 1, state.activeFileIndex));
  state.scripts = parseScripts(state.source);
  if (state.activeScript >= state.scripts.length) state.activeScript = Math.max(0, state.scripts.length - 1);
  syncActiveFile();
  renderSidebar();
  renderCanvas();
  renderInspector();
  renderActiveFlags(true);
  renderValidation();
  codeEditor.value = state.source;
  $("#project-name").textContent = state.filename.replace(/\.[^.]+$/, "") || "Новый проект";
  $("#file-name").textContent = state.filename;
  $("#file-detail").textContent = `${state.scripts.length} скрипт${pluralSuffix(state.scripts.length)}`;
  const totalScripts = state.files.reduce((total, file, index) => {
    const source = index === state.activeFileIndex ? state.source : file.source;
    return total + parseScripts(source).length;
  }, 0);
  $("#script-count").textContent = String(totalScripts).padStart(2, "0");
  $("#current-script-name").textContent = activeScript()?.name || "пустой проект";
  $("#empty-state").hidden = state.scripts.length > 0;
  const codeMode = state.mode === "code";
  $("#canvas-wrap").classList.toggle("code-mode", codeMode);
  $("#blocks-view-button").classList.toggle("active", !codeMode);
  $("#code-view-button").classList.toggle("active", codeMode);
  $("#blocks-view-button").setAttribute("aria-pressed", String(!codeMode));
  $("#code-view-button").setAttribute("aria-pressed", String(codeMode));
  $("#zoom-label").textContent = `${state.zoom}%`;
  persistWorkspace();
}

function pluralSuffix(amount) {
  const n = amount % 10, n100 = amount % 100;
  if (n === 1 && n100 !== 11) return "";
  if (n >= 2 && n <= 4 && (n100 < 12 || n100 > 14)) return "а";
  return "ов";
}

function renderSidebar() {
  const list = $("#script-list");
  list.replaceChildren();
  state.files.forEach((file, fileIndex) => {
    const group = document.createElement("section");
    group.className = `file-group${fileIndex === state.activeFileIndex ? " active" : ""}`;
    const fileScripts = parseScripts(fileIndex === state.activeFileIndex ? state.source : file.source);
    const heading = document.createElement("div");
    heading.className = "file-group-heading";
    const fileButton = document.createElement("button");
    fileButton.type = "button";
    fileButton.className = "file-group-button";
    fileButton.innerHTML = `<span class="file-group-glyph">▱</span><span class="file-group-name"></span><span class="file-group-count"></span>`;
    fileButton.children[1].textContent = file.filename;
    fileButton.children[2].textContent = String(fileScripts.length);
    fileButton.title = file.filename;
    fileButton.addEventListener("click", () => selectFile(fileIndex, file.activeScript));
    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.className = "file-group-action";
    renameButton.textContent = "✎";
    renameButton.title = "Переименовать проект";
    renameButton.setAttribute("aria-label", `Переименовать проект ${file.filename}`);
    renameButton.addEventListener("click", (event) => {
      event.stopPropagation();
      beginProjectRename(fileIndex, heading);
    });
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "file-group-action file-project-delete";
    deleteButton.textContent = "×";
    deleteButton.title = "Удалить проект";
    deleteButton.setAttribute("aria-label", `Удалить проект ${file.filename}`);
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteProject(fileIndex);
    });
    heading.append(fileButton, renameButton, deleteButton);
    group.append(heading);

    const scripts = document.createElement("div");
    scripts.className = "file-script-list";
    fileScripts.forEach((script, scriptIndex) => {
      const row = document.createElement("div");
      row.className = "script-row";
      const button = document.createElement("button");
      button.type = "button";
      button.className = `script-item${fileIndex === state.activeFileIndex && scriptIndex === state.activeScript ? " active" : ""}`;
      button.innerHTML = `<span class="script-glyph">◇</span><span></span><span class="script-amount"></span>`;
      button.children[1].textContent = script.name;
      button.children[2].textContent = String(countCommands(script));
      button.addEventListener("click", () => selectFile(fileIndex, scriptIndex));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "script-delete";
      remove.textContent = "×";
      remove.title = "Удалить скрипт";
      remove.setAttribute("aria-label", `Удалить скрипт ${script.name}`);
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        deleteScript(fileIndex, scriptIndex);
      });
      row.append(button, remove);
      scripts.append(row);
    });
    group.append(scripts);
    list.append(group);
  });
}

function beginProjectRename(fileIndex, heading) {
  const file = state.files[fileIndex];
  if (!file) return;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "file-rename-input";
  input.value = file.filename.replace(/\.(?:dsc|yml|yaml)$/i, "");
  input.setAttribute("aria-label", `Новое название проекта ${file.filename}`);

  const save = document.createElement("button");
  save.type = "button";
  save.className = "file-group-action file-rename-save";
  save.textContent = "✓";
  save.title = "Сохранить название";
  save.setAttribute("aria-label", "Сохранить название проекта");

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "file-group-action";
  cancel.textContent = "↶";
  cancel.title = "Отменить переименование";
  cancel.setAttribute("aria-label", "Отменить переименование проекта");

  heading.replaceChildren(input, save, cancel);
  const cancelRename = () => renderSidebar();
  const saveRename = () => {
    if (!renameProject(fileIndex, input.value)) {
      input.focus();
      return;
    }
    render();
    showToast(`Проект переименован: ${state.files[fileIndex].filename}`);
  };
  save.addEventListener("click", saveRename);
  cancel.addEventListener("click", cancelRename);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveRename();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelRename();
    }
  });
  input.focus();
  input.select();
}

function renameProject(fileIndex, requestedName) {
  syncActiveFile();
  const file = state.files[fileIndex];
  if (!file) return false;
  const extension = (file.filename.match(/\.(?:dsc|yml|yaml)$/i) || [".dsc"])[0];
  const name = requestedName.trim().replace(/\.(?:dsc|yml|yaml)$/i, "").trim();
  if (!name) {
    showToast("Название проекта не может быть пустым");
    return false;
  }
  if (/[\\/:*?"<>|\u0000-\u001f]/.test(name)) {
    showToast("В названии есть недопустимые символы");
    return false;
  }
  const filename = `${name}${extension}`;
  if (state.files.some((candidate, index) => index !== fileIndex && candidate.filename.toLowerCase() === filename.toLowerCase())) {
    showToast("Проект с таким именем уже есть");
    return false;
  }

  file.filename = filename;
  if (fileIndex === state.activeFileIndex) state.filename = filename;
  markDirty();
  return true;
}

function deleteProject(fileIndex) {
  syncActiveFile();
  const file = state.files[fileIndex];
  if (!file) return;
  if (!window.confirm(`Удалить проект «${file.filename}» из панели? Его содержимое будет удалено из локального списка.`)) return;

  const activeFileIndex = state.activeFileIndex;
  state.files.splice(fileIndex, 1);
  if (!state.files.length) {
    state.files.push({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      filename: "новый_проект.dsc",
      source: "",
      activeScript: 0,
      isExample: false,
      commandStates: []
    });
  }

  if (fileIndex <= activeFileIndex) {
    state.activeFileIndex = fileIndex < activeFileIndex ? activeFileIndex - 1 : Math.min(fileIndex, state.files.length - 1);
    const active = state.files[state.activeFileIndex];
    state.source = active.source;
    state.filename = active.filename;
    state.scripts = parseScripts(state.source);
    state.activeScript = Math.max(0, Math.min(state.scripts.length - 1, active.activeScript));
    state.selectedLine = null;
    state.activeGroupIndex = 0;
  }

  hideBlockContextMenu();
  markDirty();
  render();
  showToast(`Проект «${file.filename}» удалён`);
}

function deleteScript(fileIndex, scriptIndex) {
  syncActiveFile();
  const file = state.files[fileIndex];
  if (!file) return;
  const scripts = parseScripts(file.source);
  const target = scripts[scriptIndex];
  if (!target) return;

  const lines = file.source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  lines.splice(target.start, target.end - target.start);
  shiftCommandEditorStates(file, target.start, target.end - target.start, 0);
  file.source = lines.join("\n");

  if (file.activeScript > scriptIndex) file.activeScript--;
  const remainingScripts = parseScripts(file.source);
  file.activeScript = Math.max(0, Math.min(remainingScripts.length - 1, file.activeScript));

  if (fileIndex === state.activeFileIndex) {
    state.source = file.source;
    state.activeScript = file.activeScript;
    state.selectedLine = null;
    state.activeGroupIndex = 0;
    markDirty();
    render();
  } else {
    renderSidebar();
    markDirty();
  }
  showToast(`Скрипт «${target.name}» удалён`);
}

function removeEventGroup(script, group) {
  if (!script || group.headerIndex === null) return;
  const start = script.start + group.headerIndex;
  const lastItem = group.items[group.items.length - 1];
  const end = lastItem ? script.start + lastItem.localIndex + 1 : start + 1;
  const lines = state.source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  lines.splice(start, end - start);
  shiftCommandEditorStates(activeFile(), start, end - start, 0);
  state.source = lines.join("\n");
  state.selectedLine = null;
  markDirty();
  render();
  showToast(`Событие «${group.name}» удалено`);
}

function selectFile(fileIndex, scriptIndex) {
  if (!state.files[fileIndex]) return;
  syncActiveFile();
  state.activeFileIndex = fileIndex;
  const file = state.files[fileIndex];
  state.source = file.source;
  state.filename = file.filename;
  state.scripts = parseScripts(state.source);
  state.activeScript = Number.isInteger(scriptIndex)
    ? Math.max(0, Math.min(state.scripts.length - 1, scriptIndex))
    : Math.max(0, Math.min(state.scripts.length - 1, file.activeScript || 0));
  state.selectedLine = null;
  hideBlockContextMenu();
  state.activeGroupIndex = 0;
  state.dirty = false;
  state.mode = "blocks";
  render();
}

function getScriptFlags(script) {
  const flags = [];
  if (!script) return [];
  script.lines.forEach((line, localIndex) => {
    const match = line.match(/^\s*-\s+flag\s+(\S+)\s+(.+?)\s*$/i);
    if (!match) return;
    const target = match[1];
    const spec = match[2].replace(/\s+expire:\S+(?:\s+.*)?$/i, "").trim();
    const flagMatch = spec.match(/^([^:\s]+)(?::(.*))?$/);
    if (!flagMatch) return;
    const name = flagMatch[1];
    const rawValue = flagMatch[2];
    const action = rawValue === undefined
      ? null
      : rawValue.match(/^(\+\+|--|!|\+|-|\*|\/|->|<-|\|)(?::(.*))?$/);
    const actionValue = action && action[2] ? action[2].trim() : "";
    const actionArgument = actionValue || "(значение не указано)";
    const actionLabels = {
      "++": "Увеличить на 1",
      "--": "Уменьшить на 1",
      "!": "Удалить флаг",
      "+": `Добавить: ${actionArgument}`,
      "-": `Вычесть: ${actionArgument}`,
      "*": `Умножить на: ${actionArgument}`,
      "/": `Разделить на: ${actionArgument}`,
      "->": `Добавить в список: ${actionArgument}`,
      "<-": `Удалить из списка: ${actionArgument}`,
      "|": `Разделить значение списка: ${actionArgument}`
    };
    const value = action
      ? actionLabels[action[1]]
      : rawValue === undefined
        ? "Установить: true"
        : `Установить: ${rawValue.trim()}`;
    flags.push({ target, name, value, line: script.start + localIndex + 1 });
  });
  return flags;
}

function renderActiveFlags(expandWithFlags = false) {
  const panel = $("#active-flags-panel");
  panel.replaceChildren();
  const flags = getScriptFlags(activeScript());
  if (expandWithFlags && flags.length) state.flagsCollapsed = false;
  panel.classList.toggle("collapsed", state.flagsCollapsed);
  const header = document.createElement("div");
  header.className = "workspace-panel-heading";
  const title = document.createElement("strong");
  title.textContent = "Флаги в скрипте";
  const count = document.createElement("span");
  count.textContent = String(flags.length);
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "flags-toggle";
  toggle.setAttribute("aria-expanded", String(!state.flagsCollapsed));
  toggle.setAttribute("aria-label", state.flagsCollapsed ? "Развернуть список флагов" : "Свернуть список флагов");
  toggle.textContent = state.flagsCollapsed ? "▸" : "▾";
  toggle.addEventListener("click", () => {
    state.flagsCollapsed = !state.flagsCollapsed;
    renderActiveFlags();
    persistWorkspace();
  });
  header.append(title, count, toggle);
  panel.append(header);
  if (state.flagsCollapsed) return;
  const note = document.createElement("p");
  note.className = "workspace-panel-note";
  note.textContent = "Команды и параметры из активного скрипта; результат зависит от условий и состояния сервера.";
  panel.append(note);
  if (!flags.length) {
    const empty = document.createElement("p");
    empty.className = "flag-empty";
    empty.textContent = "Команд flag в этом скрипте нет";
    panel.append(empty);
    return;
  }
  const list = document.createElement("div");
  list.className = "active-flag-list";
  flags.forEach((flag) => {
    const row = document.createElement("div");
    row.className = "active-flag-row";
    const key = document.createElement("span");
    key.className = "active-flag-key";
    key.textContent = `${flag.target} · ${flag.name}`;
    const value = document.createElement("span");
    value.className = "active-flag-value";
    value.textContent = flag.value;
    value.title = `Строка ${flag.line}`;
    row.append(key, value);
    list.append(row);
  });
  panel.append(list);
}

function validateSource(source) {
  const lines = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const scripts = parseScripts(source);
  const issues = [];
  const addIssue = (severity, line, message) => issues.push({ severity, line, message });
  if (!source.trim()) addIssue("error", 1, "Файл пуст.");
  if (!scripts.length && source.trim()) addIssue("error", 1, "Не найдены контейнеры скриптов верхнего уровня.");

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (/^\t+/.test(line)) addIssue("error", lineNumber, "Табуляция в начале строки может нарушить YAML-отступы.");
    if (/^\s*-\s*$/.test(line)) addIssue("error", lineNumber, "У команды списка отсутствует имя команды.");
    const command = line.match(/^\s*-\s+(.*)$/);
    if (command) {
      const commandText = command[1].trim();
      const control = commandText.match(/^(if|else|foreach|repeat|while)\b/i);
      if (control && !commandText.endsWith(":")) {
        addIssue("error", lineNumber, `После ${control[1]} нужно поставить двоеточие.`);
      }
      if (/<условие>|новое сообщение/i.test(commandText)) {
        addIssue("warning", lineNumber, "Остался шаблонный текст — заполните параметры блока.");
      }
    }
    const eventHeader = line.match(/^\s{4,}(?:on|after|before)\b.*$/i);
    const codeLine = line.replace(/\s+#.*$/, "").trimEnd();
    if (eventHeader && !codeLine.endsWith(":")) {
      addIssue("error", lineNumber, "Заголовок события должен заканчиваться двоеточием.");
    }
    if (!line.trimStart().startsWith("#") && hasUnclosedDoubleQuote(line)) {
      addIssue("warning", lineNumber, "Проверьте парность двойных кавычек в этой строке.");
    }
  });

  scripts.forEach((script) => {
    const typeLine = script.lines.find((line) => /^\s{2}type:\s*\S+/i.test(line));
    const scriptType = typeLine ? typeLine.match(/^\s{2}type:\s*(\S+)/i)[1].toLowerCase() : "";
    const hasEvents = script.lines.some((line) => /^\s{2}events:\s*$/i.test(line));
    const hasType = Boolean(typeLine);
    if (!hasType) addIssue("warning", script.start + 1, `У скрипта «${script.name}» не найдено свойство type.`);
    if (hasEvents && scriptType && scriptType !== "world") {
      addIssue("warning", script.start + 1, `События обычно размещают в скрипте type: world, сейчас указан type: ${scriptType}.`);
    }
    getGroups(script).forEach((group) => {
      if (group.headerIndex !== null && group.indent >= 4 && !group.items.length) {
        addIssue("warning", script.start + group.headerIndex + 1, `У события «${group.name}» пока нет команд.`);
      }
      const inspectTree = (nodes) => nodes.forEach((node) => {
        if (opensBlock(node.command) && !node.children.length) {
          addIssue("warning", script.start + node.localIndex + 1, `У блока «${getCommandName(node.command)}» нет вложенных команд.`);
        }
        inspectTree(node.children);
      });
      inspectTree(buildCommandTree(group));
    });
  });
  return issues;
}

function hasUnclosedDoubleQuote(line) {
  let insideQuote = false;
  let escaped = false;
  for (const character of line) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === "\"") insideQuote = !insideQuote;
  }
  return insideQuote;
}

function renderValidation() {
  const panel = $("#validation-panel");
  panel.replaceChildren();
  const issues = validateSource(state.source);
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const header = document.createElement("div");
  header.className = "workspace-panel-heading";
  const title = document.createElement("strong");
  title.textContent = "Проверка активного файла";
  const count = document.createElement("span");
  count.className = errors ? "validation-count has-errors" : "validation-count";
  const warnings = issues.length - errors;
  count.textContent = `Ошибки: ${errors} · замечания: ${warnings}`;
  header.append(title, count);
  panel.append(header);
  const note = document.createElement("p");
  note.className = "workspace-panel-note";
  note.textContent = "Статическая проверка структуры; работу на сервере и аддоны проверить здесь нельзя.";
  panel.append(note);
  if (!issues.length) {
    const success = document.createElement("p");
    success.className = "validation-empty";
    success.textContent = "Явных структурных ошибок не найдено.";
    panel.append(success);
    return;
  }
  const list = document.createElement("ul");
  list.className = "validation-issues";
  issues.slice(0, 10).forEach((issue) => {
    const item = document.createElement("li");
    item.className = issue.severity === "error" ? "validation-error" : "validation-warning";
    const location = document.createElement("strong");
    location.textContent = `строка ${issue.line}: `;
    item.append(location, document.createTextNode(issue.message));
    list.append(item);
  });
  if (issues.length > 10) {
    const more = document.createElement("li");
    more.className = "validation-more";
    more.textContent = `И ещё замечаний: ${issues.length - 10}`;
    list.append(more);
  }
  panel.append(list);
}

function initializeEventPalette() {
  const categorySelect = $("#event-category-filter");
  categorySelect.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "Выберите категорию";
  categorySelect.append(allOption);
  const allCategoriesOption = document.createElement("option");
  allCategoriesOption.value = "*";
  allCategoriesOption.textContent = `Все события (${denizenEvents.length})`;
  categorySelect.append(allCategoriesOption);
  const categories = [...new Set(denizenEvents.map((event) => event.category).filter(Boolean))];
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  });
  categorySelect.addEventListener("change", renderEventPalette);
  $("#event-search").addEventListener("input", renderEventPalette);
  renderEventPalette();
}

function initializeCommandPalette() {
  const categorySelect = $("#command-category-filter");
  categorySelect.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = `Все команды (${denizenCommands.length})`;
  categorySelect.append(allOption);
  const categories = [...new Set(denizenCommands.map((command) => command.category))];
  categories.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = commandCategoryLabels[value] || value;
    categorySelect.append(option);
  });
  categorySelect.addEventListener("change", renderCommandPalette);
  $("#command-search").addEventListener("input", renderCommandPalette);
  renderCommandPalette();
}

function renderCommandPalette() {
  const category = $("#command-category-filter").value;
  const query = $("#command-search").value.trim().toLowerCase();
  const filtered = denizenCommands.filter((entry) => {
    const categoryMatches = !category || entry.category === category;
    const text = `${entry.name} ${entry.id} ${entry.syntax} ${commandCategoryLabels[entry.category] || entry.category}`.toLowerCase();
    return categoryMatches && text.includes(query);
  });
  const list = $("#command-options");
  list.replaceChildren();
  $("#command-count").textContent = filtered.length === denizenCommands.length
    ? String(filtered.length)
    : `${filtered.length}/${denizenCommands.length}`;
  filtered.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    const info = commandType(entry.id);
    const command = entry.id;
    button.className = `block-option option-${info.type}`;
    button.dataset.command = command;
    button.draggable = true;
    button.title = `${commandCategoryLabels[entry.category] || entry.category} · ${entry.syntax || entry.name}`;
    const glyph = document.createElement("span");
    glyph.className = "option-glyph";
    glyph.textContent = info.icon;
    const label = document.createElement("span");
    const strong = document.createElement("strong");
    strong.textContent = entry.name;
    const small = document.createElement("small");
    small.textContent = entry.syntax || (commandCategoryLabels[entry.category] || entry.category);
    label.append(strong, small);
    const plus = document.createElement("span");
    plus.className = "option-plus";
    plus.textContent = "+";
    button.append(glyph, label, plus);
    button.addEventListener("dragstart", (event) => {
      state.draggedCommand = command;
      state.draggedLine = null;
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("text/plain", command);
    });
    button.addEventListener("dragend", clearDragState);
    button.addEventListener("click", () => addPaletteCommand(command));
    list.append(button);
  });
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "event-empty";
    empty.textContent = denizenCommands.length ? "Команды не найдены" : "Каталог команд не загружен";
    list.append(empty);
  }
}

function renderEventPalette() {
  const category = $("#event-category-filter").value;
  const query = $("#event-search").value.trim().toLowerCase();
  const list = $("#event-options");
  const browsing = Boolean(category || query);
  if (!browsing) {
    list.replaceChildren();
    $("#event-count").textContent = String(denizenEvents.length);
    const empty = document.createElement("p");
    empty.className = "event-empty";
    empty.textContent = "Выберите категорию или введите название события.";
    list.append(empty);
    return;
  }
  const filteredEvents = denizenEvents.filter((event) => {
    const categoryMatches = !category || category === "*" || event.category === category;
    const text = `${event.name} ${event.pattern} ${event.example}`.toLowerCase();
    return categoryMatches && (!query || text.includes(query));
  });
  list.replaceChildren();
  $("#event-count").textContent = `${filteredEvents.length}/${denizenEvents.length}`;
  if (!filteredEvents.length) {
    const empty = document.createElement("p");
    empty.className = "event-empty";
    empty.textContent = denizenEvents.length ? "События не найдены" : "Список событий не загружен";
    list.append(empty);
    return;
  }
  filteredEvents.forEach((event) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "event-option";
    button.title = `${event.category} · ${event.pattern}`;
    const name = document.createElement("span");
    name.className = "event-option-name";
    name.textContent = event.name;
    const categoryLabel = document.createElement("small");
    categoryLabel.textContent = event.category;
    const add = document.createElement("span");
    add.className = "event-option-add";
    add.textContent = "+";
    button.append(name, categoryLabel, add);
    button.addEventListener("click", () => addEventToActiveScript(event));
    list.append(button);
  });
}

function addEventToActiveScript(eventEntry) {
  const script = activeScript();
  if (!script) {
    showToast("Сначала создайте или откройте скрипт");
    return;
  }
  const example = typeof eventEntry.example === "string" && /^(on|after|before)\s+.+:$/i.test(eventEntry.example)
    ? eventEntry.example
    : `on ${eventEntry.name}:`;
  const lines = state.source.replace(/\r\n/g, "\n").split("\n");
  const eventsLine = script.lines.findIndex((line) => /^\s*events:\s*$/.test(line));
  const groups = getGroups(script).filter((group) => group.headerIndex !== null && group.indent >= 4);
  let insertionIndex = script.end;
  const insertion = [`    ${example}`, '    - narrate "Событие обработано"'];
  if (eventsLine < 0) {
    while (insertionIndex > script.start && lines[insertionIndex - 1].trim() === "") insertionIndex--;
    insertion.unshift("  events:");
  } else if (groups.length) {
    const lastGroup = groups[groups.length - 1];
    insertionIndex = lastGroup.items.length
      ? subtreeEnd(lastGroup, script, lastGroup.items[lastGroup.items.length - 1])
      : script.start + lastGroup.headerIndex + 1;
  } else {
    insertionIndex = script.start + eventsLine + 1;
  }
  shiftCommandEditorStates(activeFile(), insertionIndex, 0, insertion.length);
  lines.splice(insertionIndex, 0, ...insertion);
  state.source = lines.join("\n");
  state.scripts = parseScripts(state.source);
  state.selectedLine = insertionIndex + insertion.length - 1;
  state.activeGroupIndex = Math.max(0, getGroups(activeScript()).length - 1);
  state.mode = "blocks";
  markDirty();
  render();
  showToast(`Добавлено событие: ${eventEntry.name}`);
}

function renderCanvas() {
  canvasContent.replaceChildren();
  canvasContent.style.setProperty("--block-scale", String(state.zoom / 100));
  const script = activeScript();
  if (!script) return;

  const title = document.createElement("div");
  title.className = "script-title";
  title.innerHTML = `<span class="title-glyph">◇</span><span></span><span class="type-pill">SCRIPT</span>`;
  title.children[1].textContent = script.name;
  canvasContent.append(title);

  const groups = getGroups(script);
  if (!groups.length) {
    const empty = document.createElement("div");
    empty.className = "canvas-empty";
    empty.textContent = "В скрипте пока нет событий или команд. Добавьте элемент из каталога.";
    canvasContent.append(empty);
    return;
  }
  groups.forEach((group, groupIndex) => {
    const card = document.createElement("section");
    card.className = "event-card";
    const header = document.createElement("div");
    header.className = "event-head";
    const eventLine = group.headerIndex === null ? "" : script.lines[group.headerIndex];
    const eventGlobalIndex = group.headerIndex === null ? null : script.start + group.headerIndex;
    const eventEntry = findEventDocumentationEntry(group.name, eventLine);
    const blockInfo = eventGlobalIndex === null
      ? null
      : getEventBlockInfo(eventEntry, group.name, eventLine, eventGlobalIndex);
    const eventItem = getEventItemInfo(eventLine);
    const icons = [];
    if (blockInfo) {
      const selectedMaterial = blockInfo.material === "block" ? "" : blockInfo.material;
      icons.push(createEventMaterialPickerIcon("block", selectedMaterial, group.name, (material) => {
        updateEventBlock(eventGlobalIndex, group.name, eventEntry, material);
      }));
    }
    if (supportsItemMatcher(group.name, eventLine, eventEntry)) {
      const selectedItem = eventItem.textureType === "item" ? eventItem.material : "";
      icons.push(createEventMaterialPickerIcon("item", selectedItem, group.name, (material) => {
        updateEventItem(eventGlobalIndex, group.name, material, eventEntry);
      }));
    }
    if (!icons.length) {
      const icon = eventItem.texture
        ? document.createElement("img")
        : document.createElement("span");
      icon.className = "event-icon";
      if (eventItem.texture) {
        icon.src = `textures/${eventItem.textureType}/${encodeURIComponent(eventItem.texture)}.png`;
        icon.alt = eventItem.texture;
        icon.addEventListener("error", () => {
          const fallback = document.createElement("span");
          fallback.className = "event-icon";
          fallback.textContent = "⚡";
          icon.replaceWith(fallback);
        }, { once: true });
      } else {
        icon.textContent = "⚡";
      }
      icons.push(icon);
    }
    const label = document.createElement("span");
    label.textContent = group.name;
    const tag = document.createElement("span");
    tag.className = "event-tag";
    tag.textContent = "EVENT";
    header.append(...icons, label, tag);
    if (group.headerIndex !== null) {
      const removeEvent = document.createElement("button");
      removeEvent.type = "button";
      removeEvent.className = "event-remove";
      removeEvent.textContent = "×";
      removeEvent.title = "Удалить событие";
      removeEvent.setAttribute("aria-label", `Удалить событие ${group.name}`);
      removeEvent.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        removeEventGroup(script, group);
      });
      header.append(removeEvent);
      header.dataset.line = String(eventGlobalIndex);
      header.classList.toggle("selected", state.selectedLine === eventGlobalIndex);
      header.tabIndex = 0;
      header.setAttribute("role", "group");
      header.setAttribute("aria-label", `Свойства события ${group.name}`);
      const selectEvent = () => selectLine(eventGlobalIndex, groupIndex);
      header.addEventListener("click", selectEvent);
      header.addEventListener("keydown", (event) => {
        if (event.target !== header) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectEvent();
        }
      });
    }
    card.append(header);

    const body = document.createElement("div");
    body.className = "event-body";
    const tree = buildCommandTree(group);
    tree.forEach((node) => body.append(renderCommandNode(node, group, groupIndex, script)));

    const add = document.createElement("button");
    add.type = "button";
    add.className = "add-block-inline";
    add.textContent = "+ Добавить блок вне условия";
    add.addEventListener("click", () => addCommand(group, "narrate Новое сообщение", { root: true }));
    add.addEventListener("dragover", acceptAnyDrop);
    add.addEventListener("drop", (event) => {
      if (!state.draggedCommand && state.draggedLine === null) return;
      event.preventDefault();
      event.stopPropagation();
      if (state.draggedCommand) addCommand(group, state.draggedCommand, { root: true });
      else moveCommand(group, state.draggedLine, null, false, null, true);
      clearDragState();
    });
    body.append(add);
    card.append(body);
    card.dataset.group = String(groupIndex);
    canvasContent.append(card);
  });
}

function renderCommandNode(node, group, groupIndex, script) {
  const globalIndex = script.start + node.localIndex;
  const info = commandType(node.command);
  const commandEditor = getCommandEditorState(globalIndex, node.command);
  const container = opensBlock(node.command);
  const wrapper = document.createElement("div");
  wrapper.className = `block-node${container ? " block-container" : ""}`;
  wrapper.dataset.line = String(globalIndex);
  wrapper.dataset.indent = String(node.indentSize);
  wrapper.dataset.group = String(groupIndex);

  const block = document.createElement("div");
  block.className = `block block-${info.type}${state.selectedLine === globalIndex ? " selected" : ""}`;
  block.dataset.line = String(globalIndex);
  const handle = document.createElement("button");
  handle.type = "button";
  handle.className = "drag-handle";
  handle.draggable = true;
  handle.textContent = "⠿";
  handle.title = "Перетащить блок";
  handle.setAttribute("aria-label", "Перетащить блок");
  handle.addEventListener("dragstart", (event) => {
    state.draggedLine = globalIndex;
    state.draggedCommand = null;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(globalIndex));
    wrapper.classList.add("dragging");
  });
  handle.addEventListener("dragend", () => {
    wrapper.classList.remove("dragging");
    clearDragState();
  });

  const glyph = document.createElement("span");
  glyph.className = "block-icon";
  glyph.textContent = info.icon;
  const materialInfo = getShowfakeMaterialInfo(node.command);
  if (materialInfo) {
    const materialPreview = materialInfo.texture
      ? document.createElement("img")
      : document.createElement("span");
    materialPreview.className = materialInfo.texture ? "block-material-preview" : "block-material-placeholder";
    materialPreview.title = `Материал блока: ${materialInfo.material}`;
    if (materialInfo.texture) {
      materialPreview.src = materialInfo.texture;
      materialPreview.alt = "";
      materialPreview.addEventListener("error", () => {
        const fallback = document.createElement("span");
        fallback.className = "block-material-placeholder";
        fallback.textContent = "▦";
        fallback.title = materialPreview.title;
        materialPreview.replaceWith(fallback);
      }, { once: true });
    } else {
      materialPreview.textContent = "▦";
    }
    block.append(handle, glyph, materialPreview);
  } else {
    block.append(handle, glyph);
  }
  const commandLabel = document.createElement("span");
  commandLabel.className = "block-label";
  commandLabel.textContent = getCommandName(node.command);
  const input = document.createElement("input");
  input.className = "block-input";
  input.value = getCommandParameters(node.command);
  input.readOnly = commandEditor.state.mode === "auto";
  input.setAttribute("aria-readonly", String(input.readOnly));
  if (input.readOnly) input.title = "Поле заблокировано в авто-режиме. Заполните аргументы в панели свойств";
  input.setAttribute("aria-label", `Параметры команды ${commandLabel.textContent}`);
  input.addEventListener("focus", () => selectLine(globalIndex, groupIndex));
  input.addEventListener("input", () => {
    if (commandEditor.state.mode === "auto") {
      input.value = getCommandParameters(state.source.replace(/\r\n/g, "\n").split("\n")[globalIndex] || node.command);
      return;
    }
    commandEditor.state.manualParameters = input.value;
    const command = buildCommand(commandLabel.textContent, input.value, node.command);
    updateLine(globalIndex, `${node.indent}- ${command}`);
  });
  input.addEventListener("click", () => selectLine(globalIndex, groupIndex));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove-block";
  remove.textContent = "×";
  remove.setAttribute("aria-label", "Удалить блок");
  remove.title = "Удалить блок";
  remove.addEventListener("click", () => removeLine(globalIndex));
  block.addEventListener("click", (event) => {
    if (event.target !== input && event.target !== remove && event.target !== handle) selectLine(globalIndex, groupIndex);
  });
  wrapper.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    selectLine(globalIndex, groupIndex);
    showBlockContextMenu(event, globalIndex, groupIndex);
  });

  wrapper.addEventListener("dragover", (event) => {
    if (!state.draggedCommand && state.draggedLine === null) return;
    event.preventDefault();
    event.stopPropagation();
    wrapper.classList.remove("drop-before", "drop-after");
    wrapper.classList.add(event.clientY < wrapper.getBoundingClientRect().top + wrapper.getBoundingClientRect().height / 2 ? "drop-before" : "drop-after");
  });
  wrapper.addEventListener("dragleave", (event) => {
    if (!wrapper.contains(event.relatedTarget)) wrapper.classList.remove("drop-before", "drop-after");
  });
  wrapper.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const after = event.clientY >= wrapper.getBoundingClientRect().top + wrapper.getBoundingClientRect().height / 2;
    wrapper.classList.remove("drop-before", "drop-after");
    if (state.draggedCommand) {
      addCommand(group, state.draggedCommand, { targetLine: globalIndex, after });
    } else if (state.draggedLine !== null) {
      moveCommand(group, state.draggedLine, globalIndex, after);
    }
    clearDragState();
  });
  block.append(commandLabel, input, remove);
  wrapper.append(block);

  if (container) {
    const nested = document.createElement("div");
    nested.className = "nested-blocks";
    nested.dataset.parentLine = String(globalIndex);
    node.children.forEach((child) => nested.append(renderCommandNode(child, group, groupIndex, script)));
    const addChild = document.createElement("button");
    addChild.type = "button";
    addChild.className = "add-block-inline";
    addChild.textContent = "+ Добавить внутрь";
    addChild.addEventListener("click", () => addCommand(group, "narrate Новое сообщение", { parentLine: globalIndex }));
    addChild.addEventListener("dragover", acceptAnyDrop);
    addChild.addEventListener("drop", (event) => {
      if (!state.draggedCommand && state.draggedLine === null) return;
      event.preventDefault();
      event.stopPropagation();
      if (state.draggedCommand) addCommand(group, state.draggedCommand, { parentLine: globalIndex });
      else moveCommand(group, state.draggedLine, null, false, globalIndex);
      clearDragState();
    });
    nested.addEventListener("dragover", (event) => {
      if (!state.draggedCommand && state.draggedLine === null) return;
      event.preventDefault();
      event.stopPropagation();
      nested.classList.add("drop-target-active");
    });
    nested.addEventListener("dragleave", (event) => {
      if (!nested.contains(event.relatedTarget)) nested.classList.remove("drop-target-active");
    });
    nested.addEventListener("drop", (event) => {
      if (event.target.closest(".block-node") || (!state.draggedCommand && state.draggedLine === null)) return;
      event.preventDefault();
      event.stopPropagation();
      nested.classList.remove("drop-target-active");
      if (state.draggedCommand) addCommand(group, state.draggedCommand, { parentLine: globalIndex });
      else moveCommand(group, state.draggedLine, null, false, globalIndex);
      clearDragState();
    });
    nested.append(addChild);
    wrapper.append(nested);
  }
  return wrapper;
}

function acceptAnyDrop(event) {
  if (!state.draggedCommand && state.draggedLine === null) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = state.draggedCommand ? "copy" : "move";
}

function clearDragState() {
  state.draggedLine = null;
  state.draggedCommand = null;
  canvasContent.querySelectorAll(".drop-before, .drop-after, .drop-target-active").forEach((element) => {
    element.classList.remove("drop-before", "drop-after", "drop-target-active");
  });
}

function animateBlockMove(lineIndex, previousRect) {
  const block = canvasContent.querySelector(`.block-node[data-line="${lineIndex}"]`);
  if (!block) return;
  block.classList.remove("block-arrival");
  if (previousRect) {
    const nextRect = block.getBoundingClientRect();
    const scale = state.zoom / 100;
    const x = (previousRect.left - nextRect.left) / scale;
    const y = (previousRect.top - nextRect.top) / scale;
    block.style.transition = "none";
    block.style.transform = `translate(${x}px, ${y}px)`;
    void block.offsetWidth;
    block.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "transform") return;
      block.style.transition = "";
      block.style.transform = "";
    }, { once: true });
    requestAnimationFrame(() => {
      block.style.transition = "transform 260ms cubic-bezier(.2,.8,.2,1)";
      block.style.transform = "translate(0, 0)";
    });
  } else {
    block.classList.add("block-arrival");
  }
}

function getEventItemInfo(line) {
  if (!line) return { matcher: "", material: "", texture: "", textureType: "", customData: "" };
  const switchMatch = line.match(/\bwith:([^\s]+)/i);
  let matcher = switchMatch ? switchMatch[1].replace(/:$/, "") : "";
  let material = matcher ? matcher.split("[", 1)[0] : "";
  material = material.replace(/^(?:minecraft:|m@)/i, "");
  if (/^<[^>]+>$/.test(material)) material = "";
  if (!material) {
    const ignoredWords = new Set(["item", "block", "entity", "player", "npc", "world"]);
    const candidates = line.match(/[a-z][a-z0-9_]*(?:\[[^\]]+\])?/gi) || [];
    const found = candidates.find((candidate) => {
      const id = candidate.split("[", 1)[0].replace(/^minecraft:/i, "").toLowerCase();
      return !ignoredWords.has(id) && itemTextureIds.has(id);
    });
    if (found) {
      matcher = found;
      material = found.split("[", 1)[0];
    }
  }
  if (!material) {
    const blockMatch = line.match(/\b(?:breaks|places|steps on|stands on|walks over)\s+((?:minecraft:)?[a-z][a-z0-9_]*)/i);
    if (blockMatch) {
      matcher = blockMatch[1];
      material = blockMatch[1];
    }
  }
  material = material.replace(/^minecraft:/i, "").toLowerCase();
  const customDataMatch = matcher.match(/\[custom_data=(\{[^]*?\})\]/i) || line.match(/\[custom_data=(\{[^]*?\})\]/i);
  const ignoredWords = new Set(["item", "block", "entity", "player", "npc", "world"]);
  const validMaterial = /^[a-z0-9_.-]+$/.test(material);
  const textureType = itemTextureIds.has(material) ? "item" : validMaterial && !ignoredWords.has(material) && material !== "air" ? "block" : "";
  return {
    matcher,
    material,
    texture: textureType ? material : "",
    textureType,
    customData: customDataMatch ? customDataMatch[1] : ""
  };
}

function getBlockTextureForMaterial(material) {
  const id = String(material || "").replace(/^(?:minecraft:|m@)/i, "").toLowerCase();
  const option = blockTextureOptions.find((entry) => entry.texture === id)
    || blockTextureOptions.find((entry) => entry.material === id);
  return option ? option.texture : "";
}

function createEventMaterialPickerIcon(type, material, eventName, onSelect) {
  const icon = document.createElement("button");
  icon.type = "button";
  icon.className = "event-icon event-icon-picker";
  icon.title = type === "block" ? "Выбрать блок" : "Выбрать предмет";
  icon.setAttribute("aria-label", `${icon.title} для события ${eventName}`);
  const id = String(material || "").replace(/^(?:minecraft:|m@)/i, "").toLowerCase();
  const texture = type === "block"
    ? getBlockTextureForMaterial(id)
    : itemTextureIds.has(id) ? id : "";
  if (texture) {
    const image = document.createElement("img");
    image.src = `textures/${type}/${encodeURIComponent(texture)}.png`;
    image.alt = "";
    image.addEventListener("error", () => { image.hidden = true; });
    icon.append(image);
  } else {
    icon.textContent = type === "block" ? "▧" : "◇";
  }
  icon.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openMaterialTexturePicker(type, id, onSelect);
  });
  return icon;
}

function supportsBlockSelector(eventEntry, eventName) {
  if (eventEntry && eventEntry.category === "Block") return true;
  const details = `${eventName} ${eventEntry ? `${eventEntry.name} ${eventEntry.pattern}` : ""}`;
  return /\bblock\b/i.test(details);
}

function getEventBlockInfo(eventEntry, eventName, line, globalIndex) {
  if (!supportsBlockSelector(eventEntry, eventName)) return null;
  const header = line
    .replace(/^\s*(?:on|after|before)\s+/i, "")
    .replace(/\s+(?:with|in|cause|location_flagged|flagged|permission|type):[^\s:]+/gi, "")
    .replace(/:\s*(?:#.*)?$/, "")
    .trim();
  const tokens = header.match(/[a-z][a-z0-9_]*/gi) || [];
  const staticWords = new Set(
    `${eventEntry ? `${eventEntry.name} ${eventEntry.pattern}` : eventName}`
      .toLowerCase()
      .match(/[a-z][a-z0-9_]*/g) || []
  );
  const material = tokens.find((token) => !staticWords.has(token.toLowerCase())) || "";
  const hasBlockSlot = Boolean(eventEntry && (
    /<\s*(?:block|material)\s*>/i.test(eventEntry.pattern)
    || (/^player places block$/i.test(eventEntry.name) && /<\s*item\s*>/i.test(eventEntry.pattern))
  ));
  if ((!material || material === "block") && Number.isInteger(globalIndex)) {
    const sourceLines = state.source.replace(/\r\n/g, "\n").split("\n");
    const eventIndent = (line.match(/^\s*/) || [""])[0];
    const wrapperPrefix = `${eventIndent}    - if <context.location.material> == `;
    const condition = (sourceLines[globalIndex + 1] || "").startsWith(wrapperPrefix)
      ? sourceLines[globalIndex + 1].slice(wrapperPrefix.length).match(/^([a-z0-9_.-]+):\s*$/i)
      : null;
    if (condition) material = condition[1];
  }
  return {
    material: material || (/\bblock\b/i.test(header) ? "block" : ""),
    hasMaterialSlot: hasBlockSlot,
    header
  };
}

function getShowfakeMaterialInfo(command) {
  const match = command.match(/^showfake\s+(\S+)/i);
  if (!match) return null;
  const material = match[1];
  const id = material
    .replace(/^(?:minecraft:|m@)/i, "")
    .split("[", 1)[0]
    .toLowerCase();
  const texture = /^[a-z0-9_.-]+$/.test(id) && id !== "air"
    ? `textures/block/${encodeURIComponent(id)}.png`
    : "";
  return { material, texture };
}

function supportsItemMatcher(eventName, line, eventEntry) {
  if (/\bwith:/i.test(line)) return true;
  const details = `${eventName} ${eventEntry ? `${eventEntry.name} ${eventEntry.pattern}` : ""}`;
  if (/\bitem\b/i.test(details)) return true;
  const normalizedName = eventName.replace(/^(?:on|after|before)\s+/i, "");
  if (/^player (?:right|left) clicks (?:block|entity)\b/i.test(normalizedName)) return true;
  if (supportsBlockSelector(eventEntry, eventName)) return false;
  return Boolean(getEventItemInfo(line).material);
}

function addDocumentation(panel, description, example, searchTerm, section) {
  const card = document.createElement("section");
  card.className = "documentation-card";
  const title = document.createElement("strong");
  title.textContent = "Описание и пример";
  const text = document.createElement("p");
  text.textContent = window.DenizenI18n ? window.DenizenI18n.translate(description) : description;
  const exampleLabel = document.createElement("span");
  exampleLabel.className = "documentation-label";
  exampleLabel.textContent = "Пример";
  const code = document.createElement("pre");
  code.textContent = example;
  const link = document.createElement("a");
  const docsPath = section
    ? `/Docs/${section}/${encodeURIComponent(searchTerm)}`
    : `/Docs/Search/${encodeURIComponent(searchTerm)}`;
  link.href = `https://meta.denizenscript.com${docsPath}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Открыть официальную карточку ↗";
  card.append(title, text, exampleLabel, code, link);
  panel.append(card);
}

function eventPatternMatches(eventName, pattern) {
  const variants = pattern.split(/\r?\n/).map((variant) => variant.trim()).filter(Boolean);
  return variants.some((variant) => {
    const source = variant
      .replace(/<[^<>]+>/g, "\\S+")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/\b([a-z][a-z0-9_-]*)\s*\|\s*([a-z][a-z0-9_-]*)\b/gi, "\u0001$1|$2\u0002");
    let expression = "";
    for (let index = 0; index < source.length; index++) {
      const character = source[index];
      if (character === "\\") {
        expression += source.slice(index, index + 3);
        index += 2;
      } else if (character === "\u0001") {
        expression += "(?:";
      } else if (character === "\u0002") {
        expression += ")";
      } else if (character === "(") {
        expression += "(?:";
      } else if (character === ")") {
        expression += ")?";
      } else if (character === "|") {
        expression += "|";
      } else if (/\s/.test(character)) {
        if (!expression.endsWith("\\s+")) expression += "\\s+";
      } else if (/[.*+?^${}()|[\]\\]/.test(character)) {
        expression += `\\${character}`;
      } else {
        expression += character;
      }
    }
    try {
      return new RegExp(`^(?:${expression})$`, "i").test(eventName);
    } catch (error) {
      console.error("Не удалось разобрать шаблон события Meta.", error);
      return false;
    }
  });
}

function eventPatternSpecificity(eventName, pattern) {
  const eventWords = new Set(eventName.toLowerCase().match(/[a-z][a-z0-9_]*/g) || []);
  return Math.max(0, ...pattern.split(/\r?\n/).map((variant) => {
    const staticWords = variant
      .replace(/<[^<>]+>/g, " ")
      .replace(/\([^)]*\)/g, " ")
      .match(/[a-z][a-z0-9_]*/gi) || [];
    return staticWords.reduce((score, word) => score + Number(eventWords.has(word.toLowerCase())), 0);
  }));
}

function findEventDocumentationEntry(eventName, eventLine) {
  const baseName = eventName
    .replace(/^(?:on|after|before)\s+/i, "")
    .replace(/\s+(?:with|type|in|flagged|permission):.*$/i, "")
    .trim()
    .toLowerCase();
  const line = eventLine.trim().toLowerCase();
  const exactEntry = denizenEvents.find((entry) => entry.name.toLowerCase() === baseName);
  if (exactEntry) return exactEntry;
  const exactExample = denizenEvents.find((entry) => entry.example && entry.example.trim().toLowerCase() === line);
  if (exactExample) return exactExample;
  const matchingEntries = denizenEvents
    .filter((entry) => entry.pattern && eventPatternMatches(baseName, entry.pattern))
    .sort((left, right) =>
      eventPatternSpecificity(baseName, right.pattern) - eventPatternSpecificity(baseName, left.pattern)
    );
  return matchingEntries[0]
    || denizenEvents.find((entry) => {
      const sample = (entry.example || "")
        .replace(/^(?:on|after|before)\s+/i, "")
        .replace(/:\s*$/, "")
        .trim()
        .toLowerCase();
      return sample === baseName;
    })
    || null;
}

const eventPhraseTranslations = {
  "bell rings": "звонит колокол",
  "block being built on block": "блок возводится на другом блоке",
  "player joins": "игрок подключается к серверу",
  "player quits": "игрок отключается от сервера",
  "player breaks block": "игрок ломает блок",
  "player places block": "игрок устанавливает блок",
  "player right clicks": "игрок нажимает правой кнопкой мыши",
  "player left clicks": "игрок нажимает левой кнопкой мыши",
  "player clicks": "игрок нажимает кнопку мыши",
  "player dies": "игрок погибает",
  "player chats": "игрок отправляет сообщение в чат",
  "player changes world": "игрок переходит в другой мир",
  "entity dies": "сущность погибает",
  "entity spawns": "сущность появляется в мире",
  "entity damaged": "сущность получает урон",
  "npc damaged": "NPC получает урон",
  "server starts": "сервер запускается",
  "server stops": "сервер останавливается"
};

const eventWordTranslations = {
  added: "добавлен",
  arrow: "стрела",
  ability: "способность",
  air: "воздух",
  absorbs: "поглощает",
  activates: "активируется",
  arikeys: "AriKeys",
  advancement: "достижение",
  after: "после",
  arena: "арена",
  armor: "броня",
  automatic: "автоматически",
  back: "назад",
  balance: "баланс",
  barter: "обмен",
  being: "происходит",
  bell: "колокол",
  bigdoors: "BigDoors",
  biome: "биом",
  brewing: "варка зелий",
  built: "построен",
  bungee: "BungeeCord",
  because: "из-за",
  bed: "кровать",
  begins: "начинается",
  area: "область",
  attack: "атакует",
  attacks: "атакует",
  block: "блок",
  book: "книга",
  breaks: "ломает",
  burns: "горит",
  casts: "накладывает",
  changes: "изменяется",
  chat: "чат",
  chestshop: "ChestShop",
  clicks: "нажимает",
  closes: "закрывается",
  claim: "приват",
  clears: "очищает",
  collides: "сталкивается",
  command: "команда",
  completes: "завершается",
  creates: "создаёт",
  created: "создан",
  crafts: "создаёт",
  crackshot: "CrackShot",
  damage: "урон",
  damaged: "получает урон",
  damages: "наносит урон",
  death: "смерть",
  destroy: "уничтожает",
  destroyed: "уничтожен",
  deleted: "удалён",
  despawns: "исчезает",
  discord: "Discord",
  dies: "погибает",
  disguise: "маскировка",
  dispenses: "выдаёт",
  drops: "выбрасывает",
  dragon: "дракон",
  effect: "эффект",
  egg: "яйцо",
  ends: "заканчивается",
  entity: "сущность",
  enters: "входит",
  equips: "экипирует",
  event: "событие",
  experience: "опыт",
  explodes: "взрывается",
  explosion: "взрыв",
  exits: "выходит",
  falls: "падает",
  for: "для",
  forms: "формы",
  furnace: "печь",
  from: "из",
  gamemode: "режим игры",
  goes: "переходит",
  generates: "создаёт",
  gp: "GriefPrevention",
  grows: "растёт",
  hanging: "подвесной объект",
  hits: "попадает",
  horse: "лошадь",
  into: "в",
  inventory: "инвентарь",
  ignites: "поджигает",
  item: "предмет",
  jobs: "профессии",
  job: "профессия",
  joins: "подключается",
  jumps: "прыгает",
  key: "ключ",
  killed: "убит",
  kills: "убивает",
  launched: "запущен",
  leaves: "покидает",
  left: "левой кнопкой",
  level: "уровень",
  levels: "уровни",
  liquid: "жидкость",
  loads: "загружается",
  loot: "добыча",
  lowers: "снижает",
  location: "место",
  magicspells: "MagicSpells",
  mcmmo: "mcMMO",
  mob: "моб",
  mobarena: "MobArena",
  mobarenea: "MobArena",
  modified: "изменён",
  mythicmob: "MythicMob",
  message: "сообщение",
  moves: "перемещается",
  on: "при",
  opens: "открывается",
  picks: "подбирает",
  piston: "поршень",
  plotsquared: "PlotSquared",
  plotsquaredplot: "участок PlotSquared",
  portal: "портал",
  potion: "зелье",
  prepares: "подготавливается",
  projectile: "снаряд",
  pvparena: "PvPArena",
  quests: "квесты",
  quest: "квест",
  raid: "рейд",
  raises: "повышает",
  receives: "получает",
  recipe: "рецепт",
  reason: "причина",
  reload: "перезагрузка",
  residence: "регион Residence",
  scripts: "скрипты",
  shears: "ножницы",
  sheep: "овца",
  shop: "магазин",
  sign: "табличка",
  skill: "навык",
  skillapi: "SkillAPI",
  skyblock: "SkyBlock",
  spell: "заклинание",
  spreads: "распространяется",
  stand: "стойка",
  state: "состояние",
  takes: "забирает",
  targets: "цели",
  time: "время",
  toggles: "переключается",
  town: "город",
  towny: "Towny",
  trade: "торговля",
  tries: "пытается",
  unloads: "выгружается",
  up: "вверх",
  user: "пользователь",
  uses: "использует",
  vault: "Vault",
  vehicle: "транспорт",
  villager: "житель",
  water: "вода",
  weapon: "оружие",
  cause: "причина",
  chunk: "чанк",
  change: "изменяет",
  primes: "активирует",
  creeper: "крипер",
  xp: "опыт",
  bucket: "ведро",
  flying: "летит",
  selects: "выбирает",
  lectern: "кафедра",
  hatching: "вылупляется",
  the: "",
  first: "первый",
  anvil: "наковальня",
  craft: "создаёт",
  packet: "пакет",
  list: "список",
  ping: "ping",
  splash: "всплеск",
  splashes: "разбрызгивает",
  finishes: "завершается",
  wave: "волна",
  entities: "сущности",
  pressed: "нажата",
  released: "отпущена",
  network: "сеть",
  landmine: "мина",
  reloading: "перезагружается",
  fires: "выстреливает",
  earns: "зарабатывает",
  libsdisguises: "LibsDisguises",
  song: "песня",
  shopkeeper: "торговец",
  claims: "приватизирует",
  plot: "участок",
  proxy: "прокси",
  sentinel: "Sentinel",
  island: "остров",
  mythickeys: "MythicKeys",
  channel: "канал",
  reaction: "реакция",
  removed: "удалён",
  thread: "ветка",
  cooks: "готовит",
  smelts: "переплавляет",
  fades: "исчезает",
  dispense: "выдача",
  brews: "варит",
  fueled: "заправлен",
  cauldron: "котёл",
  crafter: "верстак",
  farmland: "пашня",
  moisture: "влажность",
  smelting: "плавка",
  decay: "разрушение",
  lava: "лава",
  noteblock: "нотный блок",
  plays: "воспроизводит",
  note: "нота",
  extends: "выдвигается",
  retracts: "втягивается",
  tnt: "TNT",
  displays: "отображает",
  physics: "физика",
  redstone: "редстоун",
  recalculated: "пересчитан",
  sponge: "губка",
  console: "консоль",
  output: "вывод",
  custom: "пользовательский",
  delta: "дельта",
  hourly: "ежечасно",
  minutely: "ежеминутно",
  secondly: "ежесекундно",
  redis: "Redis",
  pubsub: "публикация и подписка",
  loaded: "загружен",
  system: "система",
  hh: "чч",
  mm: "мм",
  webserver: "веб-сервер",
  web: "веб",
  request: "запрос",
  error: "ошибка",
  exception: "исключение",
  tick: "тик",
  powered: "запитан",
  ender_dragon: "эндер-дракон",
  phase: "фаза",
  breeds: "размножается",
  food: "еда",
  pose: "поза",
  combusts: "загорается",
  heals: "лечит",
  interacts: "взаимодействует",
  effects: "эффекты",
  resurrected: "воскрешён",
  shoots: "стреляет",
  bow: "лук",
  tamed: "приручён",
  teleports: "телепортируется",
  gliding: "планирует",
  swimming: "плывёт",
  transforms: "превращается",
  unleashed: "освобождён",
  bottle: "бутылка",
  firework: "фейерверк",
  bursts: "взрывается",
  pig: "свинья",
  zapped: "перемещён",
  piglin: "пиглин",
  regrows: "отрастает",
  wool: "шерсть",
  slime: "слизень",
  splits: "разделяется",
  spawner: "спавнер",
  acquires: "получает",
  profession: "профессия",
  replenishes: "пополняет",
  cloud: "облако",
  applies: "применяет",
  dyed: "окрашен",
  color: "цвет",
  enchanted: "зачарован",
  merges: "объединяется",
  formed: "сформирован",
  stuck: "застрял",
  navigation: "навигация",
  breaking: "ломает",
  riptide: "тягун",
  animates: "анимирует",
  animation: "анимация",
  held: "удерживается",
  main: "основная",
  hand: "рука",
  click_type: "тип нажатия",
  consumes: "потребляет",
  discovers: "обнаруживает",
  drags: "перетаскивает",
  edits: "редактирует",
  empties: "опустошает",
  fills: "заполняет",
  fishes: "ловит рыбу",
  while: "пока",
  hears: "слышит",
  sound: "звук",
  input: "ввод",
  kicked: "выгнан",
  leashes: "привязывает",
  locale: "язык",
  mends: "чинит",
  enchant: "зачарование",
  commands: "команды",
  tablist: "список игроков",
  update: "обновление",
  respawns: "возрождается",
  scrolls: "прокручивает",
  their: "их",
  hotbar: "панель быстрого доступа",
  stonecutter: "камнерез",
  smiths: "куёт",
  stands: "стойка",
  material: "материал",
  statistic: "статистика",
  increments: "увеличивается",
  steers: "управляет",
  damaging: "наносит урон",
  swaps: "меняет местами",
  items: "предметы",
  throws: "бросает",
  sneaking: "крадётся",
  sprinting: "бежит",
  triggers: "запускает",
  over: "над",
  notable: "заметка",
  resource: "ресурс",
  pack: "пакет",
  status: "статус",
  sends: "отправляет",
  chooses: "выбирает",
  start: "запуск",
  tab: "вкладка",
  complete: "завершён",
  bukkit: "Bukkit",
  prestart: "до запуска",
  shutdown: "остановка",
  generic: "общий",
  lightning: "молния",
  strikes: "ударяет",
  lingering: "оседающее",
  structure: "структура",
  plant: "растение",
  naturally: "естественно",
  thunder: "гром",
  weather: "погода",
  rains: "идёт дождь",
  initializes: "инициализируется",
  saves: "сохраняет",
  clientizen: "Clientizen",
  bought: "куплен",
  expires: "истекает",
  rented: "арендован",
  resold: "перепродан",
  sold: "продан",
  door: "дверь",
  switches: "переключается",
  connects: "подключается",
  transaction: "транзакция",
  triggered: "запускается",
  firing: "стрельба",
  attachment: "прикрепление",
  zooms: "приближает",
  scope: "прицел",
  essentials: "Essentials",
  money: "деньги",
  disguises: "маскирует",
  undisguise: "снять маскировку",
  undisguises: "снимает маскировку",
  learns: "изучает",
  gains: "получает",
  down: "вниз",
  challenge: "испытание",
  mode: "режим",
  enabled: "включён",
  afk: "не у компьютера",
  jailed: "заключён",
  muted: "заглушён",
  clear: "очистить",
  stage: "этап",
  downgrades: "понижает уровень",
  unlocks: "открывает",
  upgrades: "улучшает",
  reset: "сброс",
  votifier: "Votifier",
  vote: "голос",
  gpclaim: "приват GriefPrevention",
  shopkeepers: "торговцы",
  trading: "торговля",
  application: "приложение",
  slash: "слэш-команда",
  clicked: "нажата",
  autocomplete: "автодополнение",
  received: "получено",
  modal: "форма",
  submitted: "отправлено",
  selection: "выбор",
  used: "использован",
  nickname: "никнейм",
  role: "роль",
  archived: "архивирован",
  unknown: "неизвестный",
  crossbow: "арбалет",
  pathfinds: "ищет путь",
  teleported: "телепортирован",
  orbs: "сферы опыта",
  merge: "объединение",
  gamerule: "правило игры",
  beacon: "маяк",
  applied: "применён",
  boosts: "ускоряет",
  elytra: "элитры",
  framed: "помещён в рамку",
  client: "клиент",
  options: "параметры",
  deep: "глубоко",
  sleeps: "спит",
  page: "страница",
  granted: "выдано",
  criterion: "критерий",
  slot: "слот",
  names: "имена",
  fake: "поддельный",
  loom: "ткацкий станок",
  pattern: "узор",
  sets: "устанавливает",
  shield: "щит",
  spectates: "наблюдает",
  spectating: "режим наблюдателя",
  trades: "торгует",
  merchant: "торговец",
  resources: "ресурсы",
  reloaded: "перезагружен",
  skeleton: "скелет",
  trap: "ловушка",
  target: "цель",
  hit: "попал",
  warden: "хранитель",
  anger: "гнев",
  knocks: "отбрасывает",
  helmet: "шлем",
  chestplate: "нагрудник",
  leggings: "поножи",
  boots: "ботинки",
  unload: "выгрузить",
  tracks: "отслеживает",
  untracks: "перестаёт отслеживать",
  npc: "NPC",
  player: "игрок",
  places: "устанавливает",
  quits: "отключается",
  right: "правой кнопкой",
  server: "сервер",
  starts: "запускается",
  stops: "останавливается",
  world: "мир",
  script: "скрипт",
  spawns: "появляется",
  steps: "ступает",
  walks: "идёт",
  with: "с",
  to: "в",
  by: "у",
  in: "в",
  at: "в",
  when: "когда"
};

const eventCategoryLabels = {
  Block: "блоков",
  Core: "базовых событий",
  Depenizen: "интеграций с плагинами",
  Discord: "Discord",
  Entity: "сущностей",
  Item: "предметов",
  NPC: "NPC",
  Paper: "Paper API",
  Player: "игроков",
  Server: "сервера",
  Vehicle: "транспорта",
  World: "мира"
};

function getEventDescription(eventName, eventEntry, eventDoc) {
  const language = window.DenizenI18n ? window.DenizenI18n.language : "ru";
  if (eventDoc && eventDoc.description && (language === "ru" || (language === "en" && !/[А-Яа-яЁё]/.test(eventDoc.description)))) {
    return eventDoc.description;
  }
  const source = (eventEntry && eventEntry.name || eventName)
    .replace(/^(?:on|after|before)\s+/i, "")
    .replace(/<([^<>]+)>/g, "$1")
    .trim()
    .toLowerCase();
  const exact = eventPhraseTranslations[source];
  const phrase = source
    .replace(/\bbeing built on\b/g, "возводится на")
    .replace(/\bsteps on\b/g, "ступает на")
    .replace(/\bsteps\b/g, "идёт");
  const translated = exact || phrase.replace(/[a-z][a-z0-9_]*/gi, (word) => eventWordTranslations[word.toLowerCase()] || word);
  const category = eventEntry && eventCategoryLabels[eventEntry.category] || "Denizen";
  if (language !== "ru" && window.DenizenI18n) {
    return window.DenizenI18n.describeEvent(eventEntry && eventEntry.category || "Denizen", source);
  }
  return `Событие категории «${category}» срабатывает, когда происходит «${translated}». В обработчике можно выполнять команды, а заголовком события задавать условия запуска.`;
}

const commandDescriptions = {
  actionbar: "Показывает игроку короткое сообщение над панелью быстрого доступа.",
  announce: "Отправляет сообщение всем игрокам или указанной аудитории.",
  define: "Создаёт локальную переменную для использования в текущем скрипте.",
  flag: "Сохраняет значение-флаг на объекте, например на игроке или NPC.",
  give: "Выдаёт предмет или другой объект указанному игроку.",
  if: "Проверяет условие; вложенные команды выполняются только при истинном результате.",
  narrate: "Отправляет текстовое сообщение игроку или другой цели.",
  playeffect: "Проигрывает визуальный эффект в указанном месте или у цели.",
  playsound: "Проигрывает звук для указанного игрока или в заданном месте.",
  repeat: "Повторяет вложенные команды заданное количество раз.",
  run: "Запускает задачу Denizen с указанными настройками.",
  spawn: "Создаёт сущность в заданной точке мира.",
  teleport: "Перемещает сущность или игрока в указанное место.",
  title: "Показывает игроку заголовок и, при необходимости, подзаголовок.",
  wait: "Приостанавливает текущую очередь на заданный промежуток времени.",
  yaml: "Загружает, изменяет или сохраняет YAML-данные.",
  adjust: "Изменяет свойство объекта через механизм Denizen.",
  else: "Задаёт ветку, выполняемую, если предыдущее условие if ложно."
};

const commandExamples = {
  give: "- give iron_sword"
};

const commandCategoryDescriptions = {
  core: "базовых команд и данных Denizen",
  entity: "сущностей и их поведения",
  file: "файлов и хранимых данных",
  image: "изображений",
  item: "предметов и инвентарей",
  npc: "NPC и их поведения",
  player: "игрока и его интерфейса",
  queue: "очередей выполнения",
  server: "сервера",
  world: "мира и его объектов",
  depenizen: "интеграции с внешними плагинами",
  external: "внешних интеграций"
};

const commandDescriptionRules = [
  [/^(?:adjust|set|modify|reset|clear|define|flag|yaml)/, "изменяет, сохраняет или очищает данные и свойства объектов."],
  [/^(?:give|take|drop|equip|inventory|item|fakeitem|fakeequip)/, "управляет предметами, экипировкой или инвентарём."],
  [/^(?:teleport|walk|fly|push|look|rotate|mount|leash|follow|shoot)/, "перемещает сущности или задаёт их движение и направление."],
  [/^(?:spawn|create|despawn|remove|kill|hurt|heal|feed|burn|attack)/, "создаёт, изменяет или удаляет сущности и влияет на их состояние."],
  [/^(?:play|sound|music|effect|particle)/, "воспроизводит звуки, музыку или визуальные эффекты."],
  [/^(?:narrate|announce|actionbar|title|sidebar|tablist|chat|toast)/, "показывает игрокам текст, уведомления или элементы интерфейса."],
  [/^(?:file|webget|webserver|mongo|redis|sql|log)/, "обменивается данными с файлами, сетью или внешними хранилищами."],
  [/^(?:if|else|foreach|repeat|while|wait|run|stop|queue)/, "управляет условиями, повторениями или ходом выполнения скрипта."],
  [/^(?:npc|assignment|trigger|anchor|trait|engage|disengage)/, "управляет NPC, их настройками и взаимодействиями."]
];

function getCommandDescription(commandMeta, commandName) {
  const name = commandName.toLowerCase();
  if (commandDescriptions[name]) return commandDescriptions[name];
  const category = commandMeta && commandMeta.category;
  const categoryText = commandCategoryDescriptions[category] || "возможностей Denizen";
  const rule = commandDescriptionRules.find(([pattern]) => pattern.test(name));
  const action = rule ? rule[1] : `выполняет операцию с объектами категории «${categoryText}».`;
  return `Команда «${commandMeta ? commandMeta.name : commandName}» ${action} Относится к ${categoryText}.`;
}

function getMetaExampleValue(field) {
  if (field.options && field.options.length) return field.defaultValue || field.options[0];
  const hint = `${field.key} ${field.label}`.toLowerCase();
  if (/\b(?:player|entity|npc|object|target|damager|source)\b/.test(hint)) return "<player>";
  if (/\b(?:location|origin|destination|position|area)\b/.test(hint)) return "<player.location>";
  if (/\b(?:item|material|block|slot-matcher|matcher)\b/.test(hint)) return /\bblock\b/.test(hint) ? "stone" : "iron_sword";
  if (/\b(?:duration|time|delay|timeout)\b/.test(hint)) return "1s";
  if (/\b(?:text|message|title|reason|description|prompt)\b/.test(hint)) return "Пример текста";
  if (/\b(?:#|quantity|amount|count|number|level|slot|radius|width|height|progress|speed)\b/.test(hint)) return "1";
  if (/\b(?:boolean|bool|state|enabled|visible)\b/.test(hint)) return "true";
  if (/\b(?:name|script|id|key|permission|format|type|color|sound|effect|mechanism)\b/.test(hint)) return "example";
  return field.defaultValue || "example";
}

function generateMetaCommandExample(commandMeta) {
  if (!commandMeta || !commandMeta.syntax) return `- ${commandMeta ? commandMeta.id : "command"}`;
  const schema = parseCommandMetaSyntax(commandMeta.id);
  if (schema) {
    const editorState = createCommandEditorState(0, commandMeta.id, schema, "auto", "");
    const variantIndex = 0;
    const variant = schema.variants[variantIndex];
    const hasRequiredGroups = variant.groups.some((group) => !group.optional);
    let optionalExampleAdded = false;
    variant.groups.forEach((group, groupIndex) => {
      const groupState = editorState.groups[variantIndex][groupIndex];
      if (group.optional) {
        if (hasRequiredGroups || optionalExampleAdded) return;
        groupState.enabled = true;
        optionalExampleAdded = true;
      }
      const branch = group.branches[groupState.branch];
      branch.fields.forEach((field, fieldIndex) => {
        groupState.values[groupState.branch][fieldIndex] = getMetaExampleValue(field);
      });
    });
    return `- ${compileAutoCommand(commandMeta.id, schema, editorState)}`;
  }

  const escapedId = commandMeta.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const syntax = commandMeta.syntax.replace(new RegExp(`^${escapedId}\\s+`, "i"), "");
  const firstVariant = splitMetaSyntax(syntax, "/")[0] || syntax;
  const groups = extractMetaGroups(firstVariant);
  const hasRequiredGroups = groups.some((group) => !group.optional);
  const selectedGroups = groups.filter((group, index) => !group.optional || (!hasRequiredGroups && index === 0));
  const parameters = selectedGroups.map((group) => {
    const branch = parseMetaBranch(splitMetaSyntax(group.raw, "/|")[0] || group.raw);
    const values = branch.fields.map(getMetaExampleValue);
    return compileMetaBranch(branch, values)
      .replace(/[\[\]()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }).filter(Boolean).join(" ");
  return `- ${buildCommand(commandMeta.id, parameters, commandMeta.id)}`;
}

function getCommandExample(commandName, commandMeta) {
  const name = commandName.toLowerCase();
  if (commandExamples[name]) return commandExamples[name];
  if (commandTemplates[name]) return `- ${commandTemplates[name]}`;
  return generateMetaCommandExample(commandMeta);
}

function renderMaterialPickerOptions(currentMaterial) {
  const search = blockPickerSearch.value.trim().toLowerCase();
  const allOptions = blockPickerKind === "item"
    ? Array.from(itemTextureIds, (texture) => ({ texture, material: texture }))
    : blockTextureOptions;
  const options = allOptions.filter((option) =>
    !search || option.texture.includes(search) || option.material.includes(search)
  );
  const materialName = blockPickerKind === "item" ? "ItemTag" : "MaterialTag";
  blockPickerCount.textContent = `${options.length} текстур · выберите текстуру, чтобы задать ${materialName}`;
  const fragment = document.createDocumentFragment();
  if (!options.length) {
    const empty = document.createElement("div");
    empty.className = "block-picker-empty";
    empty.textContent = "Текстуры по этому запросу не найдены";
    fragment.append(empty);
  } else {
    options.forEach((option) => {
      const button = document.createElement("button");
      button.className = "block-texture-option";
      button.type = "button";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(option.material === currentMaterial));
      button.dataset.material = option.material;
      button.dataset.texture = option.texture;
      button.title = `${option.texture} → ${option.material}`;
      const image = document.createElement("img");
      image.src = `textures/${blockPickerKind}/${encodeURIComponent(option.texture)}.png`;
      image.alt = "";
      image.loading = "lazy";
      image.addEventListener("error", () => { image.hidden = true; });
      const label = document.createElement("span");
      label.textContent = option.texture;
      button.append(image, label);
      fragment.append(button);
    });
  }
  blockPickerGrid.replaceChildren(fragment);
}

function openMaterialTexturePicker(kind, currentMaterial, onSelect) {
  blockPickerKind = kind;
  blockPickerSelection = onSelect;
  blockPickerCurrentMaterial = currentMaterial;
  const materialName = kind === "item" ? "предмет" : "блок";
  $("#block-picker-title").textContent = `Выберите ${materialName}`;
  $("#block-picker-close").setAttribute("aria-label", `Закрыть список ${materialName}ов`);
  blockPickerSearch.placeholder = `Найти ${materialName} или текстуру…`;
  blockPickerSearch.setAttribute("aria-label", `Поиск ${materialName}а`);
  blockPickerGrid.setAttribute("aria-label", `Текстуры ${kind === "item" ? "предметов" : "блоков"}`);
  blockPickerSearch.value = "";
  renderMaterialPickerOptions(currentMaterial);
  blockPickerModal.hidden = false;
  blockPickerSearch.focus();
}

function openBlockTexturePicker(currentMaterial, onSelect) {
  openMaterialTexturePicker("block", currentMaterial, onSelect);
}

function closeBlockTexturePicker() {
  blockPickerModal.hidden = true;
  blockPickerSelection = null;
}

function renderEventInspector(panel, script, globalIndex, eventName, eventLine) {
  const normalizedName = eventName.replace(/^(?:on|after|before)\s+/i, "");
  const eventEntry = findEventDocumentationEntry(eventName, eventLine);
  const eventDoc = eventEntry && window.DENIZEN_EVENT_DOCS
    ? window.DENIZEN_EVENT_DOCS[eventEntry.name]
    : null;
  const top = document.createElement("div");
  top.className = "property-type";
  top.innerHTML = `<span class="property-color"></span><strong>Событие</strong><span>EVENT</span>`;
  top.children[0].style.background = "#8062e6";
  top.children[1].textContent = eventName;
  const indent = (eventLine.match(/^\s*/) || ["    "])[0];
  const exampleHeader = (eventEntry && eventEntry.example || eventLine.trim()).split(/\r?\n/)[0].trim();
  const example = `${indent}${exampleHeader}\n${indent}- debug "Событие обработано"`;
  const description = getEventDescription(eventName, eventEntry, eventDoc);
  panel.append(top);
  const eventDocName = eventEntry
    ? eventEntry.name
    : normalizedName.replace(/\s+(?:with|type|in|flagged|permission):.*$/i, "").trim();
  addDocumentation(panel, description, example, eventDocName, "Events");
  const blockInfo = getEventBlockInfo(eventEntry, eventName, eventLine, globalIndex);
  if (blockInfo) {
    const form = document.createElement("div");
    form.className = "event-item-form event-block-form";
    const label = document.createElement("label");
    label.className = "property-label";
    label.textContent = "Фильтр по блоку";
    const button = document.createElement("button");
    button.className = "event-block-picker";
    button.type = "button";
    const selectedMaterial = blockInfo.material === "block" ? "" : blockInfo.material;
    const texture = getBlockTextureForMaterial(selectedMaterial);
    const image = document.createElement("img");
    image.alt = "";
    image.hidden = !texture;
    if (texture) image.src = `textures/block/${encodeURIComponent(texture)}.png`;
    image.addEventListener("error", () => { image.hidden = true; });
    const fallback = document.createElement("span");
    fallback.className = "event-block-picker-fallback";
    fallback.textContent = "▧";
    fallback.hidden = Boolean(texture);
    const name = document.createElement("span");
    name.className = "event-block-picker-name";
    name.textContent = selectedMaterial || "Нажмите, чтобы выбрать блок";
    button.append(image, fallback, name);
    button.addEventListener("click", () => {
      openBlockTexturePicker(selectedMaterial, (material) => {
        updateEventBlock(globalIndex, eventName, eventEntry, material);
      });
    });
    form.append(label, button);
    panel.append(form);
  }
  if (!supportsItemMatcher(eventName, eventLine, eventEntry)) return;

  const itemInfo = getEventItemInfo(eventLine);
  const form = document.createElement("div");
  form.className = "event-item-form";
  const itemLabel = document.createElement("label");
  itemLabel.className = "property-label";
  itemLabel.textContent = itemInfo.textureType === "block" ? "Блок (MaterialTag)" : "Предмет (ItemTag)";
  const itemRow = document.createElement("div");
  itemRow.className = "item-input-row";
  const preview = document.createElement("img");
  preview.className = "item-preview";
  preview.alt = "";
  preview.hidden = !itemInfo.texture;
  if (itemInfo.texture) preview.src = `textures/${itemInfo.textureType}/${encodeURIComponent(itemInfo.texture)}.png`;
  preview.addEventListener("error", () => { preview.hidden = true; });
  const itemInput = document.createElement("input");
  itemInput.className = "property-value";
  itemInput.value = itemInfo.material;
  itemInput.placeholder = "например, diamond_sword или oak_log";
  itemInput.setAttribute("list", "item-textures");
  itemInput.setAttribute("aria-label", "Материал предмета или блока");
  const updatePreview = () => {
    const id = itemInput.value.trim().replace(/^minecraft:/i, "").toLowerCase();
    const textureType = itemTextureIds.has(id) ? "item" : "block";
    preview.hidden = !id;
    if (id) preview.src = `textures/${textureType}/${encodeURIComponent(id)}.png`;
    itemLabel.textContent = textureType === "item" ? "Предмет (ItemTag)" : "Блок (MaterialTag)";
    const showCustomData = textureType === "item";
    nbtLabel.hidden = !showCustomData;
    nbtInput.hidden = !showCustomData;
    help.hidden = !showCustomData;
  };
  itemInput.addEventListener("input", updatePreview);
  itemRow.append(preview, itemInput);

  const nbtLabel = document.createElement("label");
  nbtLabel.className = "property-label";
  nbtLabel.textContent = "NBT custom_data (MapTag, необязательно)";
  const nbtInput = document.createElement("textarea");
  nbtInput.className = "property-value item-nbt";
  nbtInput.rows = 3;
  nbtInput.value = itemInfo.customData;
  nbtInput.placeholder = "{plugin_id:some_value}";
  nbtInput.setAttribute("aria-label", "NBT custom_data");
  const help = document.createElement("p");
  help.className = "property-help";
  help.textContent = "Свойство custom_data добавляется в matcher предмета. Устаревший raw_nbt не используется.";
  const showCustomData = itemInfo.textureType !== "block";
  nbtLabel.hidden = !showCustomData;
  nbtInput.hidden = !showCustomData;
  help.hidden = !showCustomData;
  const commitItemFilter = () => {
    const material = itemInput.value.trim().replace(/^minecraft:/i, "").toLowerCase();
    const customData = nbtInput.value.trim();
    if (!/^[a-z0-9_.-]+$/.test(material)) {
      showToast("Укажите материал предмета или блока");
      return;
    }
    if (customData && !itemTextureIds.has(material)) {
      showToast("custom_data доступен только для предметов");
      return;
    }
    if (customData && !/^\{[\s\S]*\}$/.test(customData)) {
      showToast("custom_data должен быть MapTag в фигурных скобках");
      return;
    }
    const matcher = `${material}${customData ? `[custom_data=${customData}]` : ""}`;
    updateEventItem(globalIndex, eventName, matcher, eventEntry);
  };
  itemInput.addEventListener("change", commitItemFilter);
  nbtInput.addEventListener("change", commitItemFilter);
  form.append(itemLabel, itemRow, nbtLabel, nbtInput, help);
  panel.append(form);
}

function updateEventItem(globalIndex, eventName, matcher, eventEntry) {
  const lines = state.source.replace(/\r\n/g, "\n").split("\n");
  let line = lines[globalIndex];
  const normalizedName = eventName.replace(/^(?:on|after|before)\s+/i, "");
  const hasItemSlot = eventEntry && /<\s*item\s*>/i.test(eventEntry.pattern);
  if (/<\s*item\s*>/i.test(line)) {
    line = line.replace(/<\s*item\s*>/ig, matcher);
  } else if (hasItemSlot && /\bitem\b/i.test(line)) {
    line = line.replace(/\bitem\b/ig, matcher);
  } else if (/\bwith:/i.test(line)) {
    line = line.replace(/\bwith:[^\s]+/i, `with:${matcher}`);
  } else if (/^player (?:right|left) clicks (?:block|entity)\b/i.test(normalizedName)) {
    const colon = line.lastIndexOf(":");
    if (colon < 0) {
      showToast("Не удалось определить заголовок события");
      return;
    }
    line = `${line.slice(0, colon)} with:${matcher}:${line.slice(colon + 1)}`;
  } else {
    const current = getEventItemInfo(line).matcher;
    if (current) {
      line = line.replace(current, matcher);
    } else if (supportsItemMatcher(eventName, line, eventEntry)) {
      const colon = line.lastIndexOf(":");
      if (colon < 0) {
        showToast("Не удалось определить заголовок события");
        return;
      }
      line = `${line.slice(0, colon)} with:${matcher}${line.slice(colon)}`;
    } else {
      showToast("Это событие не поддерживает фильтр предмета");
      return;
    }
  }
  lines[globalIndex] = line;
  state.source = lines.join("\n");
  markDirty();
  render();
  showToast("Материал события обновлён");
}

function buildEventBlockSource(source, globalIndex, eventName, eventEntry, material) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const line = lines[globalIndex];
  if (!line || !/^[a-z0-9_.-]+$/i.test(material)) return null;
  const indent = (line.match(/^\s*/) || [""])[0];
  const commandIndent = `${indent}    `;
  const wrapperPrefix = `${commandIndent}- if <context.location.material> == `;
  const wrapperLine = lines[globalIndex + 1] || "";
  const wrapperMatch = wrapperLine.startsWith(wrapperPrefix)
    ? wrapperLine.slice(wrapperPrefix.length).match(/^([a-z0-9_.-]+):\s*$/i)
    : null;
  const blockInfo = getEventBlockInfo(eventEntry, eventName, line);
  const supportsMaterialSlot = blockInfo && blockInfo.hasMaterialSlot;
  let updatedLine = line;

  if (wrapperMatch) {
    lines[globalIndex + 1] = `${wrapperPrefix}${material}:`;
  } else if (supportsMaterialSlot && blockInfo.material === "block") {
    updatedLine = line.replace(/\bblock\b/i, material);
  } else if (supportsMaterialSlot && blockInfo.material) {
    const escaped = blockInfo.material.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    updatedLine = line.replace(new RegExp(`\\b${escaped}\\b`, "i"), material);
  } else {
    let end = globalIndex + 1;
    while (end < lines.length) {
      const current = lines[end];
      if (!current.trim()) {
        end++;
        continue;
      }
      const currentIndent = (current.match(/^\s*/) || [""])[0].length;
      if (currentIndent <= indent.length) break;
      end++;
    }
    for (let index = globalIndex + 1; index < end; index++) {
      if (lines[index].trim()) lines[index] = `    ${lines[index]}`;
    }
    lines.splice(globalIndex + 1, 0, `${wrapperPrefix}${material}:`);
  }

  lines[globalIndex] = updatedLine;
  return lines.join("\n");
}

function updateEventBlock(globalIndex, eventName, eventEntry, material) {
  const source = buildEventBlockSource(state.source, globalIndex, eventName, eventEntry, material);
  if (source === null) {
    showToast("Не удалось применить выбранный блок");
    return;
  }
  state.source = source;
  markDirty();
  render();
  showToast(`Фильтр по блоку: ${material}`);
}

function formatMetaFieldValue(field, value) {
  const text = String(value || "").trim();
  if (!text || field.hidden || !/^(?:text|title|message|reason|description)$/i.test(field.label)) return text;
  if (/^(?:"[\s\S]*"|'[\s\S]*')$/.test(text) || /^<[^>]+>$/.test(text)) return text;
  return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function compileMetaBranch(branch, values) {
  let fieldIndex = 0;
  let output = branch.raw.replace(/<([^<>]+)>(?:\s*\{[^{}]+\})?/g, () => {
    const field = branch.fields[fieldIndex];
    const value = values[fieldIndex];
    fieldIndex++;
    return field ? formatMetaFieldValue(field, value) : "";
  });
  output = output
    .replace(/\|\s*(?=(?:\.\s*){2,})/g, " ")
    .replace(/(?:\.\s*){2,}/g, " ")
    .replace(/\{([^{}]+)\}/g, "$1")
    .replace(/[()]/g, " ")
    .replace(/\[\s*\]/g, "")
    .replace(/\b([A-Za-z_][\w-]*):(?=\s|$)/g, " ")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ")
    .trim();
  return output;
}

function compileAutoCommand(commandName, schema, editorState) {
  const variantIndex = Math.max(0, Math.min(schema.variants.length - 1, editorState.variant));
  const variant = schema.variants[variantIndex];
  const groupStates = editorState.groups[variantIndex] || [];
  const parameters = [];
  variant.groups.forEach((group, groupIndex) => {
    const groupState = groupStates[groupIndex];
    if (!groupState || (group.optional && !groupState.enabled)) return;
    const branchIndex = Math.max(0, Math.min(group.branches.length - 1, groupState.branch));
    const branch = group.branches[branchIndex];
    const values = groupState.values[branchIndex] || [];
    const value = compileMetaBranch(branch, values);
    if (value) parameters.push(value);
  });
  if (editorState.extraParameters.trim()) parameters.push(editorState.extraParameters.trim());
  return buildCommand(commandName, parameters.join(" "), `${commandName}:`);
}

function updateAutoCommand(lineIndex, commandName, schema, editorState) {
  const parameters = compileAutoCommand(commandName, schema, editorState);
  const lines = state.source.replace(/\r\n/g, "\n").split("\n");
  const indent = (lines[lineIndex].match(/^\s*/) || [""])[0];
  updateLine(lineIndex, `${indent}- ${parameters}`);
}

function renderCommandParameterEditor(panel, script, globalIndex, command, commandMeta) {
  const { state: editorState, schema } = getCommandEditorState(globalIndex, command);
  const commandName = getCommandName(command);
  if (schema) {
    const toggleLabel = document.createElement("label");
    toggleLabel.className = "command-auto-toggle";
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = editorState.mode === "auto";
    toggle.setAttribute("aria-label", "Заполнять параметры автоматически");
    const toggleText = document.createElement("span");
    toggleText.textContent = "Заполнять параметры автоматически";
    toggleLabel.append(toggle, toggleText);
    toggle.addEventListener("change", () => {
      const currentLine = state.source.replace(/\r\n/g, "\n").split("\n")[globalIndex] || "";
      const currentCommand = (currentLine.match(/^\s*-\s+(.*)$/) || [null, command])[1];
      if (toggle.checked) {
        editorState.extraParameters = getCommandParameters(currentCommand);
        editorState.mode = "auto";
      } else {
        editorState.manualParameters = getCommandParameters(currentCommand);
        editorState.mode = "manual";
      }
      const defaults = createCommandEditorState(globalIndex, commandName, schema, "auto", "");
      editorState.groups = defaults.groups;
      editorState.variant = 0;
      markDirty();
      render();
    });
    panel.append(toggleLabel);
  }

  if (editorState.mode === "auto" && schema) {
    const hint = document.createElement("p");
    hint.className = "property-help";
    hint.textContent = "Заполняйте поля отдельно. В файл команда записывается одной строкой; необязательные параметры включаются переключателем.";
    panel.append(hint);

    if (schema.variants.length > 1) {
      const variantLabel = document.createElement("label");
      variantLabel.className = "property-label";
      variantLabel.textContent = "Вариант команды";
      const variantSelect = document.createElement("select");
      variantSelect.className = "property-value parameter-select";
      schema.variants.forEach((variant, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = variant.label || `Вариант ${index + 1}`;
        variantSelect.append(option);
      });
      variantSelect.value = String(editorState.variant);
      variantSelect.addEventListener("change", () => {
        editorState.variant = Number(variantSelect.value);
        updateAutoCommand(globalIndex, commandName, schema, editorState);
        render();
      });
      panel.append(variantLabel, variantSelect);
    }

    const variantIndex = editorState.variant;
    const variant = schema.variants[variantIndex];
    const groupStates = editorState.groups[variantIndex];
    variant.groups.forEach((group, groupIndex) => {
      const groupState = groupStates[groupIndex];
      const branchIndex = groupState.branch;
      const branch = group.branches[branchIndex];
      const visibleFields = branch.fields.filter((field) => !field.hidden);
      if (!visibleFields.length && !group.optional && !branch.raw.replace(/<[^<>]+>/g, "").trim()) return;

      const section = document.createElement("section");
      section.className = "command-parameter-group";
      const heading = document.createElement("div");
      heading.className = "command-parameter-heading";
      if (group.optional) {
        const includeLabel = document.createElement("label");
        includeLabel.className = "command-optional-toggle";
        const include = document.createElement("input");
        include.type = "checkbox";
        include.checked = groupState.enabled;
        const includeText = document.createElement("span");
        includeText.textContent = `Добавить: ${group.label || `параметр ${groupIndex + 1}`}`;
        includeLabel.append(include, includeText);
        include.addEventListener("change", () => {
          groupState.enabled = include.checked;
          updateAutoCommand(globalIndex, commandName, schema, editorState);
        });
        heading.append(includeLabel);
      } else {
        const title = document.createElement("strong");
        title.textContent = `Обязательный: ${group.label || `параметр ${groupIndex + 1}`}`;
        heading.append(title);
      }

      if (group.branches.length > 1) {
        const branchSelect = document.createElement("select");
        branchSelect.className = "property-value parameter-select";
        group.branches.forEach((optionBranch, index) => {
          const option = document.createElement("option");
          option.value = String(index);
          option.textContent = optionBranch.label || `Вариант ${index + 1}`;
          branchSelect.append(option);
        });
        branchSelect.value = String(branchIndex);
        branchSelect.addEventListener("change", () => {
          groupState.branch = Number(branchSelect.value);
          updateAutoCommand(globalIndex, commandName, schema, editorState);
          render();
        });
        section.append(heading, branchSelect);
      } else {
        section.append(heading);
      }

      visibleFields.forEach((field, fieldIndex) => {
        const values = groupState.values[branchIndex];
        const label = document.createElement("label");
        label.className = "command-parameter-field";
        const name = document.createElement("span");
        name.textContent = field.label || `Аргумент ${fieldIndex + 1}`;
        const input = field.options ? document.createElement("select") : document.createElement("input");
        input.className = `property-value${field.options ? " parameter-select" : ""}`;
        if (field.options) {
          field.options.forEach((optionValue) => {
            const option = document.createElement("option");
            option.value = optionValue;
            option.textContent = optionValue;
            input.append(option);
          });
          input.value = values[fieldIndex] || field.defaultValue || field.options[0];
        } else {
          input.value = values[fieldIndex] || "";
          input.placeholder = field.defaultValue ? `по умолчанию: ${field.defaultValue}` : `Введите ${field.label || "значение"}`;
        }
        input.setAttribute("aria-label", `Аргумент ${field.label || fieldIndex + 1}`);
        input.addEventListener(field.options ? "change" : "input", () => {
          values[fieldIndex] = input.value;
          updateAutoCommand(globalIndex, commandName, schema, editorState);
        });
        label.append(name, input);
        section.append(label);
      });
      panel.append(section);
    });

    if (editorState.extraParameters.trim()) {
      const extraLabel = document.createElement("label");
      extraLabel.className = "command-parameter-field";
      const name = document.createElement("span");
      name.textContent = "Остальные параметры (сохранены из ручного режима)";
      const extraInput = document.createElement("textarea");
      extraInput.className = "property-value command-extra-parameters";
      extraInput.rows = 2;
      extraInput.value = editorState.extraParameters;
      extraInput.addEventListener("input", () => {
        editorState.extraParameters = extraInput.value;
        updateAutoCommand(globalIndex, commandName, schema, editorState);
      });
      extraLabel.append(name, extraInput);
      panel.append(extraLabel);
    }
  } else {
    const label = document.createElement("label");
    label.className = "property-label";
    label.textContent = "Параметры команды вручную";
    const input = document.createElement("textarea");
    input.className = "property-value command-manual-parameters";
    input.rows = 4;
    input.value = editorState.manualParameters || getCommandParameters(command);
    input.setAttribute("aria-label", "Параметры команды вручную");
    input.addEventListener("input", () => {
      editorState.manualParameters = input.value;
      const currentLine = state.source.replace(/\r\n/g, "\n").split("\n")[globalIndex] || "";
      const indent = (currentLine.match(/^\s*/) || [""])[0];
      updateLine(globalIndex, `${indent}- ${buildCommand(commandName, input.value, command)}`);
    });
    panel.append(label, input);
    if (!schema) {
      const unsupported = document.createElement("p");
      unsupported.className = "property-help";
      unsupported.textContent = commandMeta && commandMeta.syntax
        ? "Синтаксис команды содержит вложенные конструкции; используйте ручной ввод, чтобы сохранить его без искажений."
        : "Для этой команды нет синтаксиса Meta; используйте ручной ввод.";
      panel.append(unsupported);
    }
  }

  const help = document.createElement("p");
  help.className = "property-help";
  help.textContent = `Команда ${commandName} — часть события «${findEventName(script, globalIndex)}». Изменения применяются сразу.`;
  panel.append(help);
  if (commandMeta && commandMeta.syntax) {
    const syntax = document.createElement("p");
    syntax.className = "property-help";
    syntax.textContent = `Синтаксис Meta: ${commandMeta.syntax}`;
    panel.append(syntax);
  }
}

function renderInspector() {
  const panel = $("#inspector-content");
  panel.replaceChildren();
  const script = activeScript();
  const globalIndex = state.selectedLine;
  if (!script || globalIndex === null || globalIndex < script.start || globalIndex >= script.end) {
    const empty = document.createElement("div");
    empty.className = "inspector-empty";
    empty.innerHTML = `<div class="empty-glyph">◇</div><div>Выберите блок, чтобы<br>посмотреть его свойства</div>`;
    panel.append(empty);
    return;
  }
  const line = state.source.replace(/\r\n/g, "\n").split("\n")[globalIndex] || "";
  const match = line.match(/^\s*-\s+(.*)$/);
  if (!match) {
    const eventMatch = line.match(/^\s{4,}([^#\s].*):\s*(?:#.*)?$/);
    if (eventMatch) {
      renderEventInspector(panel, script, globalIndex, eventMatch[1].trim(), line);
      return;
    }
    state.selectedLine = null;
    renderInspector();
    return;
  }
  const command = match[1];
  const info = commandType(command);
  const commandName = getCommandName(command);
  const commandId = commandName.toLowerCase();
  const commandMeta = denizenCommands.find((entry) => entry.id === commandId);
  const commandDoc = window.DENIZEN_COMMAND_DOCS ? window.DENIZEN_COMMAND_DOCS[commandId] : null;
  const top = document.createElement("div");
  top.className = "property-type";
  top.innerHTML = `<span class="property-color"></span><strong></strong><span></span>`;
  top.children[0].style.background = colorForType(info.type);
  top.children[1].textContent = info.label;
  top.children[2].textContent = commandName;
  panel.append(top);
  renderCommandParameterEditor(panel, script, globalIndex, command, commandMeta);
  addDocumentation(
    panel,
    commandDoc && commandDoc.description || getCommandDescription(commandMeta, commandName),
    commandDoc && commandDoc.example || getCommandExample(commandName, commandMeta),
    commandName,
    "Commands"
  );
}

function colorForType(type) {
  return ({ chat: "#9c58d1", action: "#398db3", control: "#cf8138", variable: "#508d5d", generic: "#626b81" })[type];
}

function findEventName(script, globalIndex) {
  const lines = state.source.replace(/\r\n/g, "\n").split("\n");
  for (let i = globalIndex; i >= script.start; i--) {
    const match = lines[i].match(/^\s{4,}(?!-)([^#\s].*):\s*$/);
    if (match) return match[1].trim();
  }
  return script.name;
}

function selectLine(index, groupIndex) {
  const previous = state.selectedLine;
  state.selectedLine = index;
  if (groupIndex !== undefined) state.activeGroupIndex = groupIndex;
  if (previous !== null) {
    const previousBlock = canvasContent.querySelector(`.block[data-line="${previous}"], .event-head[data-line="${previous}"]`);
    if (previousBlock) previousBlock.classList.remove("selected");
  }
  const selectedBlock = canvasContent.querySelector(`.block[data-line="${index}"], .event-head[data-line="${index}"]`);
  if (selectedBlock) selectedBlock.classList.add("selected");
  renderInspector();
  persistWorkspace();
}

function updateLine(index, replacement) {
  const lines = state.source.replace(/\r\n/g, "\n").split("\n");
  lines[index] = replacement;
  state.source = lines.join("\n");
  state.scripts = parseScripts(state.source);
  const commandMatch = replacement.match(/^\s*-\s+(.*)$/);
  const block = canvasContent.querySelector(`.block[data-line="${index}"]`);
  if (commandMatch && block) {
    const command = commandMatch[1];
    const label = block.querySelector(".block-label");
    const input = block.querySelector(".block-input");
    if (label) label.textContent = getCommandName(command);
    if (input) input.value = getCommandParameters(command);
  }
  renderSidebar();
  codeEditor.value = state.source;
  markDirty();
}

function removeLine(index) {
  const script = activeScript();
  const lines = state.source.replace(/\r\n/g, "\n").split("\n");
  const group = getGroups(script).find((candidate) => candidate.items.some((item) => script.start + item.localIndex === index));
  const itemIndex = group ? group.items.findIndex((item) => script.start + item.localIndex === index) : -1;
  let end = index + 1;
  if (group && itemIndex >= 0) {
    const indentSize = group.items[itemIndex].indent.length;
    for (let i = itemIndex + 1; i < group.items.length && group.items[i].indent.length > indentSize; i++) {
      end = script.start + group.items[i].localIndex + 1;
    }
  }
  lines.splice(index, end - index);
  shiftCommandEditorStates(activeFile(), index, end - index, 0);
  state.source = lines.join("\n");
  state.selectedLine = null;
  markDirty();
  render();
  showToast("Блок удалён");
}

function findGroupItem(group, script, globalLine) {
  return group.items.find((item) => script.start + item.localIndex === globalLine);
}

function subtreeEnd(group, script, item) {
  const itemIndex = group.items.indexOf(item);
  let end = script.start + item.localIndex + 1;
  for (let i = itemIndex + 1; i < group.items.length && group.items[i].indent.length > item.indent.length; i++) {
    end = script.start + group.items[i].localIndex + 1;
  }
  return end;
}

function showBlockContextMenu(event, line, groupIndex) {
  const menu = $("#block-context-menu");
  state.contextTarget = { line, groupIndex };
  $("#context-paste").disabled = !state.clipboard;
  menu.hidden = false;
  const width = menu.offsetWidth;
  const height = menu.offsetHeight;
  menu.style.left = `${Math.max(8, Math.min(event.clientX, window.innerWidth - width - 8))}px`;
  menu.style.top = `${Math.max(8, Math.min(event.clientY, window.innerHeight - height - 8))}px`;
}

function hideBlockContextMenu() {
  $("#block-context-menu").hidden = true;
  state.contextTarget = null;
}

function copyCommandBlock(lineIndex) {
  const script = activeScript();
  if (!script) return false;
  const group = getGroups(script).find((candidate) => findGroupItem(candidate, script, lineIndex));
  const item = group && findGroupItem(group, script, lineIndex);
  if (!group || !item) return false;
  const lines = state.source.replace(/\r\n/g, "\n").split("\n");
  const end = subtreeEnd(group, script, item);
  state.clipboard = {
    lines: lines.slice(lineIndex, end),
    indent: item.indent.length
  };
  $("#context-paste").disabled = false;
  showToast("Блок скопирован");
  return true;
}

function pasteCommandBlock(lineIndex, groupIndex) {
  const script = activeScript();
  if (!script || !state.clipboard) return;
  const groups = getGroups(script);
  const group = groups[groupIndex];
  if (!group) {
    showToast("Не удалось определить место вставки");
    return;
  }
  const target = findGroupItem(group, script, lineIndex);
  const lines = state.source.replace(/\r\n/g, "\n").split("\n");
  let insertionIndex;
  let targetIndent;
  if (target) {
    insertionIndex = subtreeEnd(group, script, target);
    targetIndent = target.indent.length;
  } else if (group.items.length) {
    const last = group.items[group.items.length - 1];
    insertionIndex = subtreeEnd(group, script, last);
    targetIndent = Math.min(...group.items.map((item) => item.indent.length));
  } else {
    insertionIndex = group.headerIndex === null
      ? script.end
      : script.start + group.headerIndex + 1;
    targetIndent = group.indent || 4;
  }

  const indentDelta = targetIndent - state.clipboard.indent;
  const pasted = state.clipboard.lines.map((line) => line.replace(/^(\s*)(?=\S)/, (match, spaces) => (
    `${" ".repeat(Math.max(0, spaces.length + indentDelta))}`
  )));
  shiftCommandEditorStates(activeFile(), insertionIndex, 0, pasted.length);
  lines.splice(insertionIndex, 0, ...pasted);
  state.source = lines.join("\n");
  state.selectedLine = insertionIndex;
  state.activeGroupIndex = groupIndex;
  hideBlockContextMenu();
  markDirty();
  render();
  animateBlockMove(insertionIndex, null);
  showToast("Блок вставлен");
}

function moveCommand(group, fromLine, targetLine, after, parentLine, toRoot) {
  const script = activeScript();
  const groups = getGroups(script);
  const sourceGroup = groups.find((candidate) => candidate.items.some((item) => script.start + item.localIndex === fromLine));
  const sourceItem = sourceGroup ? findGroupItem(sourceGroup, script, fromLine) : null;
  const targetItem = findGroupItem(group, script, targetLine);
  const parentItem = parentLine === null || parentLine === undefined ? null : findGroupItem(group, script, parentLine);
  if (!sourceItem || (targetLine !== null && !targetItem)) {
    return;
  }
  if (parentLine !== null && parentLine !== undefined && (!parentItem || !opensBlock(parentItem.command))) return;
  const movingNode = canvasContent.querySelector(`.block-node[data-line="${fromLine}"]`);
  const previousRect = movingNode ? movingNode.getBoundingClientRect() : null;
  const start = fromLine;
  const end = subtreeEnd(sourceGroup, script, sourceItem);
  const sourceIndent = sourceItem.indent.length;
  const targetIndent = parentItem
    ? parentItem.indent.length + 2
    : targetItem
      ? targetItem.indent.length
      : (group.items.length ? Math.min(...group.items.map((item) => item.indent.length)) : group.indent || 4);
  let destination = parentItem
    ? subtreeEnd(group, script, parentItem)
    : targetItem
      ? (after ? subtreeEnd(group, script, targetItem) : targetLine)
      : (toRoot || group.items.length
        ? (group.items.length ? subtreeEnd(group, script, group.items[group.items.length - 1]) : script.start + (group.headerIndex || 0) + 1)
        : script.start + (group.headerIndex || 0) + 1);
  if (destination >= start && destination <= end) return;

  const lines = state.source.replace(/\r\n/g, "\n").split("\n");
  const moving = lines.splice(start, end - start);
  const indentDelta = targetIndent - sourceIndent;
  if (indentDelta !== 0) {
    for (let i = 0; i < moving.length; i++) {
      moving[i] = moving[i].replace(/^(\s*)-\s+/, (match, spaces) => `${" ".repeat(Math.max(0, spaces.length + indentDelta))}${match.slice(spaces.length)}`);
    }
  }
  if (destination > start) destination -= moving.length;
  moveCommandEditorStates(activeFile(), start, moving.length, destination);
  lines.splice(destination, 0, ...moving);
  state.source = lines.join("\n");
  state.selectedLine = destination;
  state.activeGroupIndex = groups.indexOf(group);
  markDirty();
  render();
  animateBlockMove(destination, previousRect);
}

function addCommand(group, command, placement) {
  const script = activeScript();
  if (!script) {
    showToast("Сначала создайте или откройте скрипт");
    return;
  }
  const lines = state.source.replace(/\r\n/g, "\n").split("\n");
  let insertionIndex = script.end;
  const baseIndent = group.items.length ? Math.min(...group.items.map((item) => item.indent.length)) : 4;
  let indent = " ".repeat(baseIndent);
  const parentItem = placement && placement.parentLine !== undefined ? findGroupItem(group, script, placement.parentLine) : null;
  const targetItem = placement && placement.targetLine !== undefined ? findGroupItem(group, script, placement.targetLine) : null;

  if (parentItem && opensBlock(parentItem.command)) {
    insertionIndex = subtreeEnd(group, script, parentItem);
    indent = `${parentItem.indent}  `;
  } else if (targetItem) {
    insertionIndex = placement.after ? subtreeEnd(group, script, targetItem) : script.start + targetItem.localIndex;
    indent = targetItem.indent;
  } else if (group.items.length) {
    const last = group.items[group.items.length - 1];
    insertionIndex = script.start + last.localIndex + 1;
    indent = " ".repeat(baseIndent);
  } else if (group.headerIndex !== null) {
    insertionIndex = script.start + group.headerIndex + 1;
    indent = " ".repeat(group.indent);
  } else {
    const eventsLine = script.lines.findIndex((line) => /^\s*events:\s*$/.test(line));
    insertionIndex = script.end;
    while (insertionIndex > script.start && lines[insertionIndex - 1].trim() === "") insertionIndex--;
    const scaffold = eventsLine >= 0 ? ["    on player joins:"] : ["  events:", "    on player joins:"];
    shiftCommandEditorStates(activeFile(), insertionIndex, 0, scaffold.length);
    lines.splice(insertionIndex, 0, ...scaffold);
    insertionIndex += scaffold.length;
    indent = "    ";
  }
  const commandText = parseCommandMetaSyntax(command) ? command : (commandTemplates[command] || command);
  shiftCommandEditorStates(activeFile(), insertionIndex, 0, 1);
  lines.splice(insertionIndex, 0, `${indent}- ${commandText}`);
  state.source = lines.join("\n");
  state.selectedLine = insertionIndex;
  markDirty();
  render();
  animateBlockMove(insertionIndex, null);
  showToast("Блок добавлен");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("visible"), 2100);
}

function addPaletteCommand(command) {
  const script = activeScript();
  if (!script) {
    showToast("Сначала создайте или откройте скрипт");
    return;
  }
  const groups = getGroups(script);
  const group = groups[state.activeGroupIndex] || groups[0] || { name: "Команды", indent: 4, headerIndex: null, items: [] };
  const selected = findGroupItem(group, script, state.selectedLine);
  if (selected && opensBlock(selected.command)) {
    addCommand(group, command, { parentLine: state.selectedLine });
  } else if (selected) {
    addCommand(group, command, { targetLine: state.selectedLine, after: true });
  } else {
    addCommand(group, command, { root: true });
  }
}

function markDirty() {
  state.dirty = true;
  syncActiveFile();
  renderActiveFlags(true);
  renderValidation();
  if (state.persistenceEnabled) persistWorkspace();
  else $("#save-status").textContent = "Есть несохранённые изменения";
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ filename: file.name, source: String(reader.result || "") });
    reader.onerror = () => reject(new Error(`Не удалось прочитать файл «${file.name}»`));
    reader.readAsText(file);
  });
}

function loadFiles(fileList) {
  const selectedFiles = Array.from(fileList || []);
  if (!selectedFiles.length) return;
  const supported = selectedFiles.filter((file) => /\.(dsc|yml|yaml)$/i.test(file.name));
  const rejectedCount = selectedFiles.length - supported.length;
  if (rejectedCount) showToast(`Пропущено файлов неподдерживаемого формата: ${rejectedCount}`);
  if (!supported.length) return;

  Promise.all(supported.map(readFileAsText)).then((loadedFiles) => {
    syncActiveFile();
    const example = activeFile();
    if (state.files.length === 1 && example && example.isExample && state.source === SAMPLE && !state.dirty) {
      state.files = [];
      state.activeFileIndex = -1;
    }
    loadedFiles.forEach((file, index) => {
      state.files.push({
        id: `file-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        filename: file.filename,
        source: file.source,
        activeScript: 0,
        isExample: false,
        commandStates: []
      });
    });
    const firstLoadedIndex = state.files.length - loadedFiles.length;
    selectFile(firstLoadedIndex + loadedFiles.length - 1, 0);
    state.dirty = false;
    render();
    const amount = loadedFiles.length;
    showToast(`Загружено файлов: ${amount}`);
  }).catch((error) => {
    console.error("Не удалось загрузить выбранные файлы.", error);
    showToast(error.message || "Не удалось прочитать выбранные файлы");
  });
}

function downloadFile() {
  const blob = new Blob([state.source], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = state.filename.replace(/\.(dsc|yml|yaml)$/i, "") + ".dsc";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  state.dirty = false;
  persistWorkspace();
  if (!state.persistenceEnabled) $("#save-status").textContent = "Файл скачан";
  showToast("Файл .dsc скачан");
}

function setMode(mode) {
  state.mode = mode;
  const codeMode = mode === "code";
  $("#canvas-wrap").classList.toggle("code-mode", codeMode);
  $("#blocks-view-button").classList.toggle("active", !codeMode);
  $("#code-view-button").classList.toggle("active", codeMode);
  $("#blocks-view-button").setAttribute("aria-pressed", String(!codeMode));
  $("#code-view-button").setAttribute("aria-pressed", String(codeMode));
  if (codeMode) {
    codeEditor.value = state.source;
    codeEditor.focus();
  } else {
    render();
  }
  persistWorkspace();
}

$("#upload-button").addEventListener("click", () => $("#file-input").click());
$("#empty-upload-button").addEventListener("click", () => $("#file-input").click());
$("#file-input").addEventListener("change", (event) => {
  loadFiles(event.target.files);
  event.target.value = "";
});
$("#download-button").addEventListener("click", downloadFile);
$("#blocks-view-button").addEventListener("click", () => setMode("blocks"));
$("#code-view-button").addEventListener("click", () => setMode("code"));
codeEditor.addEventListener("input", () => {
  state.source = codeEditor.value;
  const file = activeFile();
  if (file) file.commandStates = [];
  state.scripts = parseScripts(state.source);
  renderSidebar();
  markDirty();
});
codeEditor.addEventListener("blur", () => {
  if (state.mode === "code") render();
});
$("#new-project-button").addEventListener("click", () => {
  syncActiveFile();
  state.files.push({
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    filename: "новый_скрипт.dsc",
    source: "new_script:\n  type: world\n  events:\n    on player joins:\n    - narrate \"Привет, мир!\"\n",
    activeScript: 0,
    isExample: false,
    commandStates: []
  });
  selectFile(state.files.length - 1, 0);
  markDirty();
  render();
  showToast("Создан новый скрипт");
});
$("#zoom-in").addEventListener("click", () => setZoom(state.zoom + 10));
$("#zoom-out").addEventListener("click", () => setZoom(state.zoom - 10));
function setZoom(value) {
  state.zoom = Math.max(70, Math.min(140, value));
  $("#zoom-label").textContent = `${state.zoom}%`;
  canvasContent.style.setProperty("--block-scale", String(state.zoom / 100));
  persistWorkspace();
}
$("#canvas-wrap").addEventListener("wheel", (event) => {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault();
    setZoom(state.zoom + (event.deltaY < 0 ? 5 : -5));
  }
}, { passive: false });

$("#context-copy").addEventListener("click", () => {
  const target = state.contextTarget;
  if (target) copyCommandBlock(target.line);
  hideBlockContextMenu();
});
$("#context-paste").addEventListener("click", () => {
  const target = state.contextTarget;
  if (target) pasteCommandBlock(target.line, target.groupIndex);
});
$("#context-delete").addEventListener("click", () => {
  const target = state.contextTarget;
  hideBlockContextMenu();
  if (target) removeLine(target.line);
});
$("#block-picker-close").addEventListener("click", closeBlockTexturePicker);
blockPickerModal.addEventListener("click", (event) => {
  if (event.target === blockPickerModal.querySelector(".block-picker-backdrop")) closeBlockTexturePicker();
});
blockPickerSearch.addEventListener("input", () => renderMaterialPickerOptions(blockPickerCurrentMaterial));
blockPickerGrid.addEventListener("click", (event) => {
  const option = event.target.closest(".block-texture-option");
  if (!option || !blockPickerSelection) return;
  const material = option.dataset.material;
  const onSelect = blockPickerSelection;
  closeBlockTexturePicker();
  onSelect(material);
});
document.addEventListener("click", (event) => {
  if (!$("#block-context-menu").contains(event.target)) hideBlockContextMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!blockPickerModal.hidden) {
      closeBlockTexturePicker();
      return;
    }
    hideBlockContextMenu();
  }
  if (!(event.ctrlKey || event.metaKey)) return;
  if (event.target.closest("input, textarea, select, [contenteditable='true']")) return;
  const key = event.key.toLowerCase();
  if (key === "c" && state.selectedLine !== null && copyCommandBlock(state.selectedLine)) {
    event.preventDefault();
  } else if (key === "v" && state.clipboard && state.selectedLine !== null) {
    event.preventDefault();
    pasteCommandBlock(state.selectedLine, state.activeGroupIndex);
  }
});

const dropOverlay = $("#drop-overlay");
window.addEventListener("dragover", (event) => {
  event.preventDefault();
  if (Array.from(event.dataTransfer.types).includes("Files")) dropOverlay.classList.add("visible");
});
window.addEventListener("dragleave", (event) => {
  if (event.relatedTarget === null) dropOverlay.classList.remove("visible");
});
window.addEventListener("drop", (event) => {
  event.preventDefault();
  if (event.dataTransfer.files.length) {
    dropOverlay.classList.remove("visible");
    loadFiles(event.dataTransfer.files);
  }
});

$("#storage-accept").addEventListener("click", () => {
  try {
    localStorage.setItem(consentStorageKey, "granted");
    state.persistenceEnabled = true;
    $("#privacy-notice").hidden = true;
    persistWorkspace();
    showToast("Автосохранение включено");
  } catch (error) {
    console.error("Не удалось включить локальное автосохранение.", error);
    state.persistenceEnabled = false;
    $("#save-status").textContent = "Автосохранение недоступно";
    showToast("Браузер не разрешил локальное сохранение");
  }
});
$("#storage-decline").addEventListener("click", () => {
  try {
    localStorage.setItem(consentStorageKey, "denied");
    localStorage.removeItem(workspaceStorageKey);
  } catch (error) {
    console.error("Не удалось сохранить выбор для локального хранения.", error);
    showToast("Не удалось удалить локальную копию проекта");
  }
  state.persistenceEnabled = false;
  $("#privacy-notice").hidden = true;
  $("#save-status").textContent = "Автосохранение отключено";
});
$("#storage-settings").addEventListener("click", () => {
  $("#privacy-notice").hidden = false;
});
window.addEventListener("pagehide", persistWorkspace);

document.addEventListener("denizen-language-change", render);

initializePersistence();
initializeEventPalette();
initializeCommandPalette();
render();
