(() => {
  const languages = {
    ru: { flag: "russia.png", name: "Русский", title: "Denizen Blocks — редактор сценариев" },
    en: { flag: "united_kingdom.png", name: "English", title: "Denizen Blocks — Script Editor" },
    de: { flag: "germany.png", name: "Deutsch", title: "Denizen Blocks — Skript-Editor" },
    pl: { flag: "poland.png", name: "Polski", title: "Denizen Blocks — edytor skryptów" },
    es: { flag: "spain.png", name: "Español", title: "Denizen Blocks — editor de scripts" },
    uk: { flag: "ukraine.png", name: "Українська", title: "Denizen Blocks — редактор сценаріїв" }
  };
  const rows = [
    ["ПРОЕКТ", "PROJECT", "PROJEKT", "PROJEKT", "PROYECTO", "ПРОЄКТ"],
    ["Новый проект", "New project", "Neues Projekt", "Nowy projekt", "Nuevo proyecto", "Новий проєкт"],
    ["Все изменения сохранены", "All changes saved", "Alle Änderungen gespeichert", "Wszystkie zmiany zapisane", "Todos los cambios guardados", "Усі зміни збережено"],
    ["Открыть файлы", "Open files", "Dateien öffnen", "Otwórz pliki", "Abrir archivos", "Відкрити файли"],
    ["Скачать .dsc", "Download .dsc", ".dsc herunterladen", "Pobierz .dsc", "Descargar .dsc", "Завантажити .dsc"],
    ["РАБОЧАЯ ОБЛАСТЬ", "WORKSPACE", "ARBEITSBEREICH", "OBSZAR ROBOCZY", "ÁREA DE TRABAJO", "РОБОЧА ОБЛАСТЬ"],
    ["Мои скрипты", "My scripts", "Meine Skripte", "Moje skrypty", "Mis scripts", "Мої сценарії"],
    ["Создать новый проект", "Create a new project", "Neues Projekt erstellen", "Utwórz nowy projekt", "Crear un proyecto nuevo", "Створити новий проєкт"],
    ["ФАЙЛЫ И СКРИПТЫ", "FILES AND SCRIPTS", "DATEIEN UND SKRIPTE", "PLIKI I SKRYPTY", "ARCHIVOS Y SCRIPTS", "ФАЙЛИ ТА СЦЕНАРІЇ"],
    ["Скрипты", "Scripts", "Skripte", "Skrypty", "Scripts", "Сценарії"],
    ["Работает локально", "Runs locally", "Läuft lokal", "Działa lokalnie", "Funciona localmente", "Працює локально"],
    ["Файл не отправляется на сервер", "Your file is not sent to a server", "Die Datei wird nicht an einen Server gesendet", "Plik nie jest wysyłany na serwer", "El archivo no se envía al servidor", "Файл не надсилається на сервер"],
    ["Настройки сохранения", "Storage settings", "Speichereinstellungen", "Ustawienia zapisu", "Ajustes de almacenamiento", "Налаштування збереження"],
    ["Проект", "Project", "Projekt", "Projekt", "Proyecto", "Проєкт"],
    ["Редактор блоков", "Block editor", "Block-Editor", "Edytor bloków", "Editor de bloques", "Редактор блоків"],
    ["Режим редактора", "Editor mode", "Editor-Modus", "Tryb edytora", "Modo del editor", "Режим редактора"],
    ["Блоки", "Blocks", "Blöcke", "Bloki", "Bloques", "Блоки"],
    ["Код", "Code", "Code", "Kod", "Código", "Код"],
    ["Уменьшить масштаб", "Zoom out", "Verkleinern", "Pomniejsz", "Alejar", "Зменшити масштаб"],
    ["Увеличить масштаб", "Zoom in", "Vergrößern", "Powiększ", "Acercar", "Збільшити масштаб"],
    ["Отпустите файлы, чтобы открыть", "Drop files to open", "Dateien zum Öffnen ablegen", "Upuść pliki, aby otworzyć", "Suelta archivos para abrirlos", "Відпустіть файли, щоб відкрити"],
    ["Можно выбрать несколько .dsc", "You can select multiple .dsc files", "Sie können mehrere .dsc-Dateien auswählen", "Możesz wybrać kilka plików .dsc", "Puedes seleccionar varios archivos .dsc", "Можна вибрати кілька файлів .dsc"],
    ["Исходный код Denizen", "Denizen source code", "Denizen-Quellcode", "Kod źródłowy Denizen", "Código fuente de Denizen", "Вихідний код Denizen"],
    ["Здесь появятся ваши блоки", "Your blocks will appear here", "Deine Blöcke erscheinen hier", "Tutaj pojawią się Twoje bloki", "Tus bloques aparecerán aquí", "Тут з’являться ваші блоки"],
    ["Откройте один или несколько .dsc-файлов или начните с примера Denizen.", "Open one or more .dsc files or start with the Denizen example.", "Öffne eine oder mehrere .dsc-Dateien oder beginne mit dem Denizen-Beispiel.", "Otwórz jeden lub więcej plików .dsc albo zacznij od przykładu Denizen.", "Abre uno o varios archivos .dsc o empieza con el ejemplo de Denizen.", "Відкрийте один або кілька файлів .dsc або почніть із прикладу Denizen."],
    ["Загрузить файлы", "Upload files", "Dateien laden", "Wczytaj pliki", "Cargar archivos", "Завантажити файли"],
    ["колесо", "wheel", "Rad", "kółko", "rueda", "коліщатко"],
    ["масштаб", "zoom", "Zoom", "powiększenie", "zoom", "масштаб"],
    ["меню", "menu", "Menü", "menu", "menú", "меню"],
    ["ИНСПЕКТОР", "INSPECTOR", "INSPEKTOR", "INSPEKTOR", "INSPECTOR", "ІНСПЕКТОР"],
    ["Свойства блока", "Block properties", "Blockeigenschaften", "Właściwości bloku", "Propiedades del bloque", "Властивості блоку"],
    ["Дополнительные настройки", "More settings", "Weitere Einstellungen", "Więcej ustawień", "Más ajustes", "Додаткові налаштування"],
    ["КОМАНДЫ", "COMMANDS", "BEFEHLE", "KOMENDY", "COMANDOS", "КОМАНДИ"],
    ["Добавить команду", "Add command", "Befehl hinzufügen", "Dodaj komendę", "Añadir comando", "Додати команду"],
    ["Категория команд", "Command category", "Befehlskategorie", "Kategoria komend", "Categoría de comandos", "Категорія команд"],
    ["Найти команду...", "Find a command...", "Befehl suchen...", "Szukaj komendy...", "Buscar comando...", "Знайти команду..."],
    ["Щелчок добавит команду после выбранного блока. Синтаксис выбранной команды появится в инспекторе.", "Click to add a command after the selected block. Its syntax will appear in the inspector.", "Klicke, um einen Befehl nach dem ausgewählten Block hinzuzufügen. Die Syntax erscheint im Inspektor.", "Kliknij, aby dodać komendę za wybranym blokiem. Jej składnia pojawi się w inspektorze.", "Haz clic para añadir un comando después del bloque seleccionado. Su sintaxis aparecerá en el inspector.", "Натисніть, щоб додати команду після вибраного блоку. Її синтаксис з’явиться в інспекторі."],
    ["СОБЫТИЯ", "EVENTS", "EREIGNISSE", "ZDARZENIA", "EVENTOS", "ПОДІЇ"],
    ["Добавить событие", "Add event", "Ereignis hinzufügen", "Dodaj zdarzenie", "Añadir evento", "Додати подію"],
    ["Категория событий", "Event category", "Ereigniskategorie", "Kategoria zdarzeń", "Categoría de eventos", "Категорія подій"],
    ["Найти событие...", "Find an event...", "Ereignis suchen...", "Szukaj zdarzenia...", "Buscar evento...", "Знайти подію..."],
    ["Выберите категорию или введите поиск. Щелчок по событию добавит его в активный скрипт.", "Choose a category or search. Click an event to add it to the active script.", "Wähle eine Kategorie oder suche. Klicke auf ein Ereignis, um es dem aktiven Skript hinzuzufügen.", "Wybierz kategorię lub wyszukaj. Kliknij zdarzenie, aby dodać je do aktywnego skryptu.", "Elige una categoría o busca. Haz clic en un evento para añadirlo al script activo.", "Виберіть категорію або введіть запит. Натисніть подію, щоб додати її до активного сценарію."],
    ["Копировать блок", "Copy block", "Block kopieren", "Kopiuj blok", "Copiar bloque", "Копіювати блок"],
    ["Вставить после блока", "Paste after block", "Nach dem Block einfügen", "Wklej za blokiem", "Pegar después del bloque", "Вставити після блоку"],
    ["Удалить блок", "Delete block", "Block löschen", "Usuń blok", "Eliminar bloque", "Видалити блок"],
    ["МАТЕРИАЛЫ MINECRAFT", "MINECRAFT MATERIALS", "MINECRAFT-MATERIALIEN", "MATERIAŁY MINECRAFT", "MATERIALES DE MINECRAFT", "МАТЕРІАЛИ MINECRAFT"],
    ["Выберите блок", "Select a block", "Block auswählen", "Wybierz blok", "Selecciona un bloque", "Виберіть блок"],
    ["Закрыть список блоков", "Close block list", "Blockliste schließen", "Zamknij listę bloków", "Cerrar lista de bloques", "Закрити список блоків"],
    ["Найти блок или текстуру…", "Find a block or texture…", "Block oder Textur suchen…", "Szukaj bloku lub tekstury…", "Buscar bloque o textura…", "Знайти блок або текстуру…"],
    ["Поиск блока", "Search blocks", "Blöcke suchen", "Szukaj bloków", "Buscar bloques", "Пошук блоків"],
    ["Текстуры блоков", "Block textures", "Blocktexturen", "Tekstury bloków", "Texturas de bloques", "Текстури блоків"],
    ["Автосохранение проекта", "Project autosave", "Automatisches Speichern des Projekts", "Automatyczny zapis projektu", "Guardado automático del proyecto", "Автозбереження проєкту"],
    ["Для восстановления после перезагрузки сайт сохраняет .dsc и настройки в локальном хранилище браузера на этом устройстве, а не в cookie-файлах. Содержимое проекта никуда не отправляется.", "To restore your work after a reload, the site stores .dsc files and settings in this browser on this device, not in cookies. Project contents are never sent anywhere.", "Damit du nach einem Neuladen weitermachen kannst, speichert die Website .dsc-Dateien und Einstellungen lokal in diesem Browser, nicht in Cookies. Projektinhalte werden nirgendwohin gesendet.", "Aby przywrócić pracę po ponownym załadowaniu, strona zapisuje pliki .dsc i ustawienia lokalnie w tej przeglądarce, a nie w plikach cookie. Zawartość projektu nigdzie nie jest wysyłana.", "Para restaurar el trabajo tras recargar, el sitio guarda los archivos .dsc y los ajustes en este navegador, no en cookies. El contenido del proyecto no se envía a ningún sitio.", "Щоб відновити роботу після перезавантаження, сайт зберігає файли .dsc і налаштування локально в цьому браузері, а не в cookie. Вміст проєкту нікуди не надсилається."],
    ["Разрешить сохранение", "Allow saving", "Speichern erlauben", "Zezwól na zapis", "Permitir guardado", "Дозволити збереження"],
    ["Не сохранять", "Don't save", "Nicht speichern", "Nie zapisuj", "No guardar", "Не зберігати"],
    ["Переименовать проект", "Rename project", "Projekt umbenennen", "Zmień nazwę projektu", "Renombrar proyecto", "Перейменувати проєкт"],
    ["Удалить проект", "Delete project", "Projekt löschen", "Usuń projekt", "Eliminar proyecto", "Видалити проєкт"],
    ["Удалить скрипт", "Delete script", "Skript löschen", "Usuń skrypt", "Eliminar script", "Видалити сценарій"],
    ["Сохранить название", "Save name", "Namen speichern", "Zapisz nazwę", "Guardar nombre", "Зберегти назву"],
    ["Сохранить название проекта", "Save project name", "Projektnamen speichern", "Zapisz nazwę projektu", "Guardar nombre del proyecto", "Зберегти назву проєкту"],
    ["Отменить переименование", "Cancel rename", "Umbenennen abbrechen", "Anuluj zmianę nazwy", "Cancelar cambio de nombre", "Скасувати перейменування"],
    ["Отменить переименование проекта", "Cancel project rename", "Projektumbenennung abbrechen", "Anuluj zmianę nazwy projektu", "Cancelar cambio de nombre del proyecto", "Скасувати перейменування проєкту"],
    ["Флаги в скрипте", "Script flags", "Skript-Flags", "Flagi skryptu", "Flags del script", "Прапорці сценарію"],
    ["Развернуть список флагов", "Expand flags list", "Flag-Liste erweitern", "Rozwiń listę flag", "Expandir lista de flags", "Розгорнути список прапорців"],
    ["Свернуть список флагов", "Collapse flags list", "Flag-Liste einklappen", "Zwiń listę flag", "Contraer lista de flags", "Згорнути список прапорців"],
    ["Команды и параметры из активного скрипта; результат зависит от условий и состояния сервера.", "Commands and values from the active script; results depend on conditions and server state.", "Befehle und Werte aus dem aktiven Skript; das Ergebnis hängt von Bedingungen und Serverstatus ab.", "Komendy i wartości z aktywnego skryptu; wynik zależy od warunków i stanu serwera.", "Comandos y valores del script activo; el resultado depende de las condiciones y del estado del servidor.", "Команди та параметри активного сценарію; результат залежить від умов і стану сервера."],
    ["Команд flag в этом скрипте нет", "No flag commands in this script", "Keine Flag-Befehle in diesem Skript", "Brak komend flag w tym skrypcie", "Este script no tiene comandos flag", "У цьому сценарії немає команд flag"],
    ["Проверка активного файла", "Active file validation", "Prüfung der aktiven Datei", "Walidacja aktywnego pliku", "Validación del archivo activo", "Перевірка активного файлу"],
    ["Статическая проверка структуры; работу на сервере и аддоны проверить здесь нельзя.", "Static structure check; server behavior and addons can't be checked here.", "Statische Strukturprüfung; Serververhalten und Add-ons können hier nicht geprüft werden.", "Statyczne sprawdzanie struktury; działania serwera i dodatków nie można tu sprawdzić.", "Comprobación estática de la estructura; aquí no se puede verificar el servidor ni los complementos.", "Статична перевірка структури; роботу сервера та додатків тут перевірити неможливо."],
    ["Явных структурных ошибок не найдено.", "No obvious structural errors found.", "Keine offensichtlichen Strukturfehler gefunden.", "Nie znaleziono oczywistych błędów struktury.", "No se encontraron errores estructurales evidentes.", "Очевидних структурних помилок не знайдено."],
    ["Выберите категорию", "Select a category", "Kategorie auswählen", "Wybierz kategorię", "Selecciona una categoría", "Виберіть категорію"],
    ["Команды не найдены", "No commands found", "Keine Befehle gefunden", "Nie znaleziono komend", "No se encontraron comandos", "Команд не знайдено"],
    ["Каталог команд не загружен", "Command catalog not loaded", "Befehlsverzeichnis nicht geladen", "Katalog komend nie został wczytany", "Catálogo de comandos no cargado", "Каталог команд не завантажено"],
    ["Выберите категорию или введите название события.", "Select a category or enter an event name.", "Wähle eine Kategorie oder gib einen Ereignisnamen ein.", "Wybierz kategorię lub wpisz nazwę zdarzenia.", "Selecciona una categoría o escribe el nombre de un evento.", "Виберіть категорію або введіть назву події."],
    ["События не найдены", "No events found", "Keine Ereignisse gefunden", "Nie znaleziono zdarzeń", "No se encontraron eventos", "Подій не знайдено"],
    ["Список событий не загружен", "Event list not loaded", "Ereignisliste nicht geladen", "Lista zdarzeń nie została wczytana", "Lista de eventos no cargada", "Список подій не завантажено"],
    ["В скрипте пока нет событий или команд. Добавьте элемент из каталога.", "There are no events or commands in this script yet. Add one from the catalog.", "Dieses Skript enthält noch keine Ereignisse oder Befehle. Füge einen Eintrag aus dem Verzeichnis hinzu.", "W tym skrypcie nie ma jeszcze zdarzeń ani komend. Dodaj element z katalogu.", "Este script aún no tiene eventos ni comandos. Añade uno del catálogo.", "У сценарії ще немає подій чи команд. Додайте елемент із каталогу."],
    ["Выбрать блок", "Select block", "Block auswählen", "Wybierz blok", "Seleccionar bloque", "Вибрати блок"],
    ["Удалить событие", "Delete event", "Ereignis löschen", "Usuń zdarzenie", "Eliminar evento", "Видалити подію"],
    ["Свойства события", "Event properties", "Ereigniseigenschaften", "Właściwości zdarzenia", "Propiedades del evento", "Властивості події"],
    ["Перетащить блок", "Drag block", "Block ziehen", "Przeciągnij blok", "Arrastrar bloque", "Перетягнути блок"],
    ["Параметры команды", "Command parameters", "Befehlsparameter", "Parametry komendy", "Parámetros del comando", "Параметри команди"],
    ["Описание и пример", "Description and example", "Beschreibung und Beispiel", "Opis i przykład", "Descripción y ejemplo", "Опис і приклад"],
    ["Пример", "Example", "Beispiel", "Przykład", "Ejemplo", "Приклад"],
    ["Открыть официальную карточку ↗", "Open official reference ↗", "Offizielle Referenz öffnen ↗", "Otwórz oficjalną dokumentację ↗", "Abrir referencia oficial ↗", "Відкрити офіційну довідку ↗"],
    ["Параметры команды вручную", "Command parameters (manual)", "Befehlsparameter (manuell)", "Parametry komendy (ręcznie)", "Parámetros del comando (manual)", "Параметри команди вручну"],
    ["Заполнять параметры автоматически", "Fill parameters automatically", "Parameter automatisch ausfüllen", "Wypełniaj parametry automatycznie", "Rellenar parámetros automáticamente", "Заповнювати параметри автоматично"],
    ["Блок добавлен", "Block added", "Block hinzugefügt", "Dodano blok", "Bloque añadido", "Блок додано"],
    ["Блок вставлен", "Block pasted", "Block eingefügt", "Wklejono blok", "Bloque pegado", "Блок вставлено"],
    ["Блок скопирован", "Block copied", "Block kopiert", "Skopiowano blok", "Bloque copiado", "Блок скопійовано"],
    ["Блок удалён", "Block deleted", "Block gelöscht", "Usunięto blok", "Bloque eliminado", "Блок видалено"],
    ["Не удалось определить место вставки", "Couldn't determine where to paste", "Einfügeposition konnte nicht bestimmt werden", "Nie można ustalić miejsca wklejenia", "No se pudo determinar dónde pegar", "Не вдалося визначити місце вставлення"],
    ["Сначала создайте или откройте скрипт", "Create or open a script first", "Erstelle oder öffne zuerst ein Skript", "Najpierw utwórz lub otwórz skrypt", "Primero crea o abre un script", "Спочатку створіть або відкрийте сценарій"],
    ["Автосохранено на этом устройстве", "Autosaved on this device", "Auf diesem Gerät automatisch gespeichert", "Automatycznie zapisano na tym urządzeniu", "Guardado automáticamente en este dispositivo", "Автоматично збережено на цьому пристрої"],
    ["Ошибка автосохранения", "Autosave error", "Fehler beim automatischen Speichern", "Błąd automatycznego zapisu", "Error de guardado automático", "Помилка автозбереження"],
    ["Есть несохранённые изменения", "Unsaved changes", "Nicht gespeicherte Änderungen", "Niezapisane zmiany", "Hay cambios sin guardar", "Є незбережені зміни"],
    ["Файл скачан", "File downloaded", "Datei heruntergeladen", "Plik pobrany", "Archivo descargado", "Файл завантажено"],
    ["Автосохранение отключено", "Autosave disabled", "Automatisches Speichern deaktiviert", "Automatyczny zapis wyłączony", "Guardado automático desactivado", "Автозбереження вимкнено"],
    ["Автосохранение не включено", "Autosave not enabled", "Automatisches Speichern nicht aktiviert", "Automatyczny zapis nie jest włączony", "Guardado automático no activado", "Автозбереження не ввімкнено"],
    ["Автосохранение недоступно", "Autosave unavailable", "Automatisches Speichern nicht verfügbar", "Automatyczny zapis niedostępny", "Guardado automático no disponible", "Автозбереження недоступне"],
    ["Не удалось сохранить проект в браузере", "Couldn't save the project in the browser", "Projekt konnte nicht im Browser gespeichert werden", "Nie udało się zapisać projektu w przeglądarce", "No se pudo guardar el proyecto en el navegador", "Не вдалося зберегти проєкт у браузері"],
    ["Не удалось прочитать автосохранённый проект", "Couldn't read the autosaved project", "Automatisch gespeichertes Projekt konnte nicht gelesen werden", "Nie udało się odczytać automatycznie zapisanego projektu", "No se pudo leer el proyecto guardado automáticamente", "Не вдалося прочитати автоматично збережений проєкт"],
    ["Не удалось загрузить выбранные файлы.", "Couldn't load the selected files.", "Die ausgewählten Dateien konnten nicht geladen werden.", "Nie udało się wczytać wybranych plików.", "No se pudieron cargar los archivos seleccionados.", "Не вдалося завантажити вибрані файли."],
    ["Не удалось прочитать выбранные файлы", "Couldn't read the selected files", "Die ausgewählten Dateien konnten nicht gelesen werden", "Nie udało się odczytać wybranych plików", "No se pudieron leer los archivos seleccionados", "Не вдалося прочитати вибрані файли"],
    ["Файл пуст.", "File is empty.", "Datei ist leer.", "Plik jest pusty.", "El archivo está vacío.", "Файл порожній."],
    ["Имя файла не поддерживается", "Unsupported file name", "Dateiname wird nicht unterstützt", "Nieobsługiwana nazwa pliku", "Nombre de archivo no compatible", "Непідтримувана назва файлу"],
    ["Событие обработано", "Event handled", "Ereignis verarbeitet", "Obsłużono zdarzenie", "Evento procesado", "Подію оброблено"],
    ["Основные", "Core", "Grundlegend", "Podstawowe", "Básicos", "Основні"],
    ["Сущности", "Entities", "Entitäten", "Encje", "Entidades", "Сутності"],
    ["Файлы", "Files", "Dateien", "Pliki", "Archivos", "Файли"],
    ["Изображения", "Images", "Bilder", "Obrazy", "Imágenes", "Зображення"],
    ["Предметы", "Items", "Gegenstände", "Przedmioty", "Objetos", "Предмети"],
    ["Игрок", "Player", "Spieler", "Gracz", "Jugador", "Гравець"],
    ["Очереди", "Queues", "Warteschlangen", "Kolejki", "Colas", "Черги"],
    ["Сервер", "Server", "Server", "Serwer", "Servidor", "Сервер"],
    ["Мир", "World", "Welt", "Świat", "Mundo", "Світ"],
    ["Внешние", "External", "Extern", "Zewnętrzne", "Externos", "Зовнішні"],
    ["Действие", "Action", "Aktion", "Działanie", "Acción", "Дія"],
    ["Управление", "Control", "Steuerung", "Sterowanie", "Control", "Керування"],
    ["Переменная", "Variable", "Variable", "Zmienna", "Variable", "Змінна"],
    ["Сообщение", "Message", "Nachricht", "Wiadomość", "Mensaje", "Повідомлення"],
    ["Блок (MaterialTag)", "Block (MaterialTag)", "Block (MaterialTag)", "Blok (MaterialTag)", "Bloque (MaterialTag)", "Блок (MaterialTag)"],
    ["Предмет (ItemTag)", "Item (ItemTag)", "Gegenstand (ItemTag)", "Przedmiot (ItemTag)", "Objeto (ItemTag)", "Предмет (ItemTag)"],
    ["Материал предмета или блока", "Item or block material", "Material des Gegenstands oder Blocks", "Materiał przedmiotu lub bloku", "Material del objeto o bloque", "Матеріал предмета або блоку"],
    ["Фильтр по блоку", "Block filter", "Blockfilter", "Filtr bloków", "Filtro de bloque", "Фільтр за блоком"],
    ["Нажмите, чтобы выбрать блок", "Click to select a block", "Klicken, um einen Block auszuwählen", "Kliknij, aby wybrać blok", "Haz clic para seleccionar un bloque", "Натисніть, щоб вибрати блок"],
    ["например, diamond_sword или oak_log", "e.g. diamond_sword or oak_log", "z. B. diamond_sword oder oak_log", "np. diamond_sword lub oak_log", "por ejemplo, diamond_sword u oak_log", "наприклад, diamond_sword або oak_log"],
    ["Для этой команды нет синтаксиса Meta; используйте ручной ввод.", "No Meta syntax is available for this command; use manual input.", "Für diesen Befehl ist keine Meta-Syntax verfügbar; verwende die manuelle Eingabe.", "Ta komenda nie ma składni Meta; użyj ręcznego wprowadzania.", "Este comando no tiene sintaxis Meta; usa la entrada manual.", "Для цієї команди немає синтаксису Meta; скористайтеся ручним введенням."],
    ["Название проекта не может быть пустым", "Project name can't be empty", "Der Projektname darf nicht leer sein", "Nazwa projektu nie może być pusta", "El nombre del proyecto no puede estar vacío", "Назва проєкту не може бути порожньою"],
    ["В названии есть недопустимые символы", "The name contains invalid characters", "Der Name enthält ungültige Zeichen", "Nazwa zawiera niedozwolone znaki", "El nombre contiene caracteres no válidos", "Назва містить неприпустимі символи"],
    ["Проект с таким именем уже есть", "A project with this name already exists", "Ein Projekt mit diesem Namen existiert bereits", "Projekt o tej nazwie już istnieje", "Ya existe un proyecto con ese nombre", "Проєкт із такою назвою вже існує"],
    ["Файл пуст.", "File is empty.", "Datei ist leer.", "Plik jest pusty.", "El archivo está vacío.", "Файл порожній."],
    ["Не найдены контейнеры скриптов верхнего уровня.", "No top-level script containers found.", "Keine Skriptcontainer auf oberster Ebene gefunden.", "Nie znaleziono kontenerów skryptów najwyższego poziomu.", "No se encontraron contenedores de scripts de nivel superior.", "Не знайдено контейнерів сценаріїв верхнього рівня."],
    ["Табуляция в начале строки может нарушить YAML-отступы.", "A leading tab may break YAML indentation.", "Ein Tab am Zeilenanfang kann die YAML-Einrückung beschädigen.", "Tabulator na początku wiersza może zepsuć wcięcia YAML.", "Un tabulador al inicio puede romper la indentación YAML.", "Табуляція на початку рядка може порушити відступи YAML."],
    ["У команды списка отсутствует имя команды.", "A list command is missing its command name.", "Einem Listenbefehl fehlt der Befehlsname.", "Komenda listy nie ma nazwy.", "Falta el nombre de un comando de lista.", "У команди списку відсутня назва команди."],
    ["Заголовок события должен заканчиваться двоеточием.", "An event header must end with a colon.", "Ein Ereigniskopf muss mit einem Doppelpunkt enden.", "Nagłówek zdarzenia musi kończyć się dwukropkiem.", "El encabezado de un evento debe terminar en dos puntos.", "Заголовок події має закінчуватися двокрапкою."],
    ["Проверьте парность двойных кавычек в этой строке.", "Check that the double quotes are paired on this line.", "Prüfe, ob die doppelten Anführungszeichen in dieser Zeile paarweise vorkommen.", "Sprawdź, czy cudzysłowy są sparowane w tym wierszu.", "Comprueba que las comillas dobles estén emparejadas en esta línea.", "Перевірте парність подвійних лапок у цьому рядку."],
    ["Остался шаблонный текст — заполните параметры блока.", "Template text remains — fill in the block parameters.", "Vorlagentext ist noch vorhanden — fülle die Blockparameter aus.", "Pozostał tekst szablonu — uzupełnij parametry bloku.", "Queda texto de plantilla: completa los parámetros del bloque.", "Залишився шаблонний текст — заповніть параметри блоку."],
    ["Установить: true", "Set: true", "Setzen: true", "Ustaw: true", "Establecer: true", "Встановити: true"],
    ["Увеличить на 1", "Increase by 1", "Um 1 erhöhen", "Zwiększ o 1", "Aumentar en 1", "Збільшити на 1"],
    ["Уменьшить на 1", "Decrease by 1", "Um 1 verringern", "Zmniejsz o 1", "Disminuir en 1", "Зменшити на 1"],
    ["Удалить флаг", "Remove flag", "Flag entfernen", "Usuń flagę", "Eliminar flag", "Видалити прапорець"],
    ["Вариант команды", "Command variant", "Befehlsvariante", "Wariant komendy", "Variante del comando", "Варіант команди"],
    ["Заполняйте поля отдельно. В файл команда записывается одной строкой; необязательные параметры включаются переключателем.", "Fill in each field separately. The command is written as one line in the file; optional parameters are enabled with the toggle.", "Fülle jedes Feld einzeln aus. Der Befehl wird im Dateiinhalt einzeilig gespeichert; optionale Parameter werden über den Schalter aktiviert.", "Wypełniaj pola osobno. Komenda jest zapisywana w pliku w jednym wierszu; opcjonalne parametry włączysz przełącznikiem.", "Completa cada campo por separado. El comando se escribe en una línea; los parámetros opcionales se activan con el interruptor.", "Заповнюйте поля окремо. Команда записується у файл одним рядком; необов’язкові параметри вмикаються перемикачем."],
    ["Свойство custom_data добавляется в matcher предмета. Устаревший raw_nbt не используется.", "The custom_data property is added to the item matcher. The deprecated raw_nbt is not used.", "Die Eigenschaft custom_data wird dem Item-Matcher hinzugefügt. Das veraltete raw_nbt wird nicht verwendet.", "Właściwość custom_data jest dodawana do matchera przedmiotu. Przestarzałe raw_nbt nie jest używane.", "La propiedad custom_data se añade al matcher del objeto. No se usa raw_nbt, que está obsoleto.", "Властивість custom_data додається до matcher предмета. Застарілий raw_nbt не використовується."],
    ["custom_data должен быть MapTag в фигурных скобках", "custom_data must be a MapTag inside curly braces", "custom_data muss ein MapTag in geschweiften Klammern sein", "custom_data musi być MapTagiem w nawiasach klamrowych", "custom_data debe ser un MapTag entre llaves", "custom_data має бути MapTag у фігурних дужках"],
    ["custom_data доступен только для предметов", "custom_data is only available for items", "custom_data ist nur für Gegenstände verfügbar", "custom_data jest dostępne tylko dla przedmiotów", "custom_data solo está disponible para objetos", "custom_data доступний лише для предметів"],
    ["Это событие не поддерживает фильтр предмета", "This event doesn't support an item filter", "Dieses Ereignis unterstützt keinen Gegenstandsfilter", "To zdarzenie nie obsługuje filtra przedmiotów", "Este evento no admite un filtro de objeto", "Ця подія не підтримує фільтр предмета"],
    ["Браузер не разрешил локальное сохранение", "The browser didn't allow local storage", "Der Browser hat lokale Speicherung nicht zugelassen", "Przeglądarka nie zezwoliła na zapis lokalny", "El navegador no permitió el almacenamiento local", "Браузер не дозволив локальне збереження"],
    ["Не удалось включить локальное автосохранение.", "Couldn't enable local autosave.", "Lokales automatisches Speichern konnte nicht aktiviert werden.", "Nie udało się włączyć lokalnego automatycznego zapisu.", "No se pudo activar el guardado automático local.", "Не вдалося ввімкнути локальне автозбереження."],
    ["Не удалось сохранить выбор для локального хранения.", "Couldn't save the local storage preference.", "Die Einstellung für lokale Speicherung konnte nicht gespeichert werden.", "Nie udało się zapisać ustawienia lokalnego zapisu.", "No se pudo guardar la preferencia de almacenamiento local.", "Не вдалося зберегти налаштування локального сховища."],
    ["Не удалось удалить локальную копию проекта", "Couldn't delete the local project copy", "Die lokale Projektkopie konnte nicht gelöscht werden", "Nie udało się usunąć lokalnej kopii projektu", "No se pudo eliminar la copia local del proyecto", "Не вдалося видалити локальну копію проєкту"],
    ["Файл .dsc скачан", ".dsc file downloaded", ".dsc-Datei heruntergeladen", "Pobrano plik .dsc", "Archivo .dsc descargado", "Файл .dsc завантажено"],
    ["Автосохранение включено", "Autosave enabled", "Automatisches Speichern aktiviert", "Automatyczny zapis włączony", "Guardado automático activado", "Автозбереження ввімкнено"],
    ["Загрузить один или несколько файлов .dsc", "Upload one or more .dsc files", "Eine oder mehrere .dsc-Dateien laden", "Wczytaj jeden lub więcej plików .dsc", "Cargar uno o varios archivos .dsc", "Завантажте один або кілька файлів .dsc"],
    ["Выберите файл .dsc", "Select a .dsc file", "Wähle eine .dsc-Datei aus", "Wybierz plik .dsc", "Selecciona un archivo .dsc", "Виберіть файл .dsc"],
    ["Показывает игроку короткое сообщение над панелью быстрого доступа.", "Shows the player a short message above the hotbar.", "Zeigt dem Spieler eine kurze Nachricht über der Schnellzugriffsleiste.", "Wyświetla graczowi krótką wiadomość nad paskiem szybkiego dostępu.", "Muestra al jugador un mensaje breve sobre la barra rápida.", "Показує гравцеві коротке повідомлення над панеллю швидкого доступу."],
    ["Отправляет сообщение всем игрокам или указанной аудитории.", "Sends a message to all players or a specified audience.", "Sendet eine Nachricht an alle Spieler oder eine angegebene Zielgruppe.", "Wysyła wiadomość do wszystkich graczy lub wskazanej grupy.", "Envía un mensaje a todos los jugadores o a un público específico.", "Надсилає повідомлення всім гравцям або вказаній аудиторії."],
    ["Создаёт локальную переменную для использования в текущем скрипте.", "Creates a local variable for use in the current script.", "Erstellt eine lokale Variable zur Verwendung im aktuellen Skript.", "Tworzy zmienną lokalną do użycia w bieżącym skrypcie.", "Crea una variable local para usar en el script actual.", "Створює локальну змінну для використання в поточному сценарії."],
    ["Сохраняет значение-флаг на объекте, например на игроке или NPC.", "Stores a flag value on an object, such as a player or NPC.", "Speichert einen Flag-Wert auf einem Objekt, etwa einem Spieler oder NPC.", "Zapisuje wartość flagi na obiekcie, np. graczu lub NPC.", "Guarda un valor de flag en un objeto, como un jugador o un NPC.", "Зберігає значення прапорця на об’єкті, наприклад гравцеві або NPC."],
    ["Выдаёт предмет или другой объект указанному игроку.", "Gives an item or another object to the specified player.", "Gibt dem angegebenen Spieler einen Gegenstand oder ein anderes Objekt.", "Daje wskazanemu graczowi przedmiot lub inny obiekt.", "Entrega un objeto u otro elemento al jugador indicado.", "Видає предмет або інший об’єкт указаному гравцеві."],
    ["Проверяет условие; вложенные команды выполняются только при истинном результате.", "Checks a condition; nested commands run only when it evaluates to true.", "Prüft eine Bedingung; verschachtelte Befehle werden nur ausgeführt, wenn sie wahr ist.", "Sprawdza warunek; zagnieżdżone komendy wykonują się tylko, gdy warunek jest prawdziwy.", "Comprueba una condición; los comandos anidados solo se ejecutan si es verdadera.", "Перевіряє умову; вкладені команди виконуються, лише якщо вона істинна."],
    ["Отправляет текстовое сообщение игроку или другой цели.", "Sends a text message to a player or another target.", "Sendet eine Textnachricht an einen Spieler oder ein anderes Ziel.", "Wysyła wiadomość tekstową do gracza lub innego celu.", "Envía un mensaje de texto a un jugador u otro objetivo.", "Надсилає текстове повідомлення гравцеві або іншій цілі."],
    ["Проигрывает визуальный эффект в указанном месте или у цели.", "Plays a visual effect at the specified location or on a target.", "Spielt einen visuellen Effekt am angegebenen Ort oder bei einem Ziel ab.", "Odtwarza efekt wizualny we wskazanym miejscu lub przy celu.", "Reproduce un efecto visual en la ubicación indicada o sobre un objetivo.", "Відтворює візуальний ефект у вказаному місці або біля цілі."],
    ["Проигрывает звук для указанного игрока или в заданном месте.", "Plays a sound for the specified player or at a given location.", "Spielt einen Ton für den angegebenen Spieler oder an einem Ort ab.", "Odtwarza dźwięk dla wskazanego gracza lub w określonym miejscu.", "Reproduce un sonido para el jugador indicado o en una ubicación.", "Відтворює звук для вказаного гравця або в заданому місці."],
    ["Повторяет вложенные команды заданное количество раз.", "Repeats the nested commands a specified number of times.", "Wiederholt die verschachtelten Befehle eine festgelegte Anzahl von Malen.", "Powtarza zagnieżdżone komendy określoną liczbę razy.", "Repite los comandos anidados un número determinado de veces.", "Повторює вкладені команди задану кількість разів."],
    ["Запускает задачу Denizen с указанными настройками.", "Runs a Denizen task with the specified settings.", "Führt eine Denizen-Aufgabe mit den angegebenen Einstellungen aus.", "Uruchamia zadanie Denizen z podanymi ustawieniami.", "Ejecuta una tarea de Denizen con los ajustes indicados.", "Запускає завдання Denizen із заданими параметрами."],
    ["Создаёт сущность в заданной точке мира.", "Spawns an entity at the specified world location.", "Erstellt eine Entität an der angegebenen Position in der Welt.", "Tworzy encję we wskazanym miejscu w świecie.", "Genera una entidad en la ubicación indicada del mundo.", "Створює сутність у заданій точці світу."],
    ["Перемещает сущность или игрока в указанное место.", "Moves an entity or player to the specified location.", "Teleportiert eine Entität oder einen Spieler an den angegebenen Ort.", "Przenosi encję lub gracza we wskazane miejsce.", "Teletransporta una entidad o un jugador a la ubicación indicada.", "Переміщує сутність або гравця у вказане місце."],
    ["Показывает игроку заголовок и, при необходимости, подзаголовок.", "Shows a title and, optionally, a subtitle to the player.", "Zeigt dem Spieler einen Titel und optional einen Untertitel.", "Wyświetla graczowi tytuł i opcjonalnie podtytuł.", "Muestra un título y, opcionalmente, un subtítulo al jugador.", "Показує гравцеві заголовок і, за потреби, підзаголовок."],
    ["Приостанавливает текущую очередь на заданный промежуток времени.", "Pauses the current queue for the specified duration.", "Hält die aktuelle Warteschlange für die angegebene Dauer an.", "Wstrzymuje bieżącą kolejkę na określony czas.", "Pausa la cola actual durante el tiempo indicado.", "Призупиняє поточну чергу на заданий проміжок часу."],
    ["Загружает, изменяет или сохраняет YAML-данные.", "Loads, modifies, or saves YAML data.", "Lädt, ändert oder speichert YAML-Daten.", "Wczytuje, modyfikuje lub zapisuje dane YAML.", "Carga, modifica o guarda datos YAML.", "Завантажує, змінює або зберігає YAML-дані."],
    ["Изменяет свойство объекта через механизм Denizen.", "Changes an object's property using a Denizen mechanism.", "Ändert eine Objekteigenschaft über einen Denizen-Mechanismus.", "Zmienia właściwość obiektu za pomocą mechanizmu Denizen.", "Cambia una propiedad del objeto mediante un mecanismo de Denizen.", "Змінює властивість об’єкта за допомогою механізму Denizen."],
    ["Задаёт ветку, выполняемую, если предыдущее условие if ложно.", "Defines a branch that runs if the preceding if condition is false.", "Definiert einen Zweig, der ausgeführt wird, wenn die vorherige if-Bedingung falsch ist.", "Określa gałąź wykonywaną, gdy poprzedni warunek if jest fałszywy.", "Define una rama que se ejecuta si la condición if anterior es falsa.", "Визначає гілку, що виконується, якщо попередня умова if хибна."],
    ["Меняет механизм указанного объекта или значение определения. Подходит для настройки свойств сущностей, предметов и других поддерживаемых объектов.", "Changes a mechanism on the specified object or a definition value. Use it to configure properties of entities, items, and other supported objects.", "Ändert einen Mechanismus des angegebenen Objekts oder einen Definitionswert. Damit lassen sich Eigenschaften von Entitäten, Gegenständen und anderen unterstützten Objekten konfigurieren.", "Zmienia mechanizm wskazanego obiektu lub wartość definicji. Służy do konfigurowania właściwości encji, przedmiotów i innych obsługiwanych obiektów.", "Cambia un mecanismo del objeto indicado o el valor de una definición. Permite configurar propiedades de entidades, objetos y otros elementos compatibles.", "Змінює механізм указаного об’єкта або значення визначення. Дає змогу налаштовувати властивості сутностей, предметів та інших підтримуваних об’єктів."],
    ["Добавляет, меняет или удаляет флаг на объекте; действие и значение задаются после имени флага. Флаг можно ограничить временем жизни через expire.", "Adds, changes, or removes a flag on an object; specify the action and value after the flag name. Use expire to set the flag's lifetime.", "Fügt ein Flag zu einem Objekt hinzu, ändert oder entfernt es; Aktion und Wert folgen auf den Flag-Namen. Mit expire lässt sich die Lebensdauer festlegen.", "Dodaje, zmienia lub usuwa flagę obiektu; działanie i wartość podaje się po nazwie flagi. Parametr expire ustawia czas jej życia.", "Añade, cambia o elimina un flag de un objeto; indica la acción y el valor después del nombre. Usa expire para limitar su duración.", "Додає, змінює або видаляє прапорець об’єкта; дію та значення вказують після назви прапорця. Параметр expire задає час його дії."],
    ["Перезагружает скрипты, конфигурацию, сохранённые данные или заметки Denizen. Обычный вариант scripts перезагружает скрипты.", "Reloads scripts, configuration, saved data, or Denizen notes. The standard scripts option reloads scripts.", "Lädt Skripte, Konfiguration, gespeicherte Daten oder Denizen-Notizen neu. Die Standardoption scripts lädt Skripte neu.", "Ponownie wczytuje skrypty, konfigurację, zapisane dane lub notatki Denizen. Standardowa opcja scripts wczytuje skrypty ponownie.", "Recarga scripts, configuración, datos guardados o notas de Denizen. La opción habitual scripts recarga los scripts.", "Перезавантажує сценарії, конфігурацію, збережені дані або нотатки Denizen. Стандартний варіант scripts перезавантажує сценарії."],
    ["Переходит к указанному шагу текущего или выбранного скрипта с возможной задержкой. Обычно применяется внутри пошаговых сценариев.", "Jumps to a specified step in the current or selected script, optionally after a delay. Commonly used in step-based scripts.", "Springt mit optionaler Verzögerung zu einem angegebenen Schritt des aktuellen oder ausgewählten Skripts. Wird häufig in schrittweisen Skripten verwendet.", "Przechodzi do wskazanego kroku bieżącego lub wybranego skryptu, opcjonalnie z opóźnieniem. Zwykle używane w skryptach etapowych.", "Salta a un paso indicado del script actual o seleccionado, opcionalmente con retraso. Se usa normalmente en scripts por etapas.", "Переходить до вказаного кроку поточного або вибраного сценарію, за потреби із затримкою. Зазвичай використовується в покрокових сценаріях."],
    ["Отправляет диагностическое сообщение выбранного типа в журнал Denizen. Имя и формат позволяют пометить или оформить запись.", "Sends a diagnostic message of the selected type to the Denizen log. The name and format can label or style the entry.", "Sendet eine Diagnosemeldung des gewählten Typs an das Denizen-Protokoll. Name und Format können den Eintrag kennzeichnen oder formatieren.", "Wysyła komunikat diagnostyczny wybranego typu do dziennika Denizen. Nazwa i format pozwalają oznaczyć lub sformatować wpis.", "Envía un mensaje de diagnóstico del tipo seleccionado al registro de Denizen. El nombre y el formato permiten etiquetar o dar estilo a la entrada.", "Надсилає діагностичне повідомлення вибраного типу до журналу Denizen. Назва та формат дають змогу позначити або оформити запис."],
    ["Приостанавливает текущую очередь на длительность; можно указать отдельную очередь или режим отсчёта времени.", "Pauses the current queue for a duration; you can specify another queue or a time-counting mode.", "Hält die aktuelle Warteschlange für eine bestimmte Dauer an; optional lassen sich eine andere Warteschlange oder ein Zeitmodus angeben.", "Wstrzymuje bieżącą kolejkę na określony czas; można wskazać inną kolejkę lub tryb odmierzania czasu.", "Pausa la cola actual durante un tiempo; se puede indicar otra cola o un modo de cómputo.", "Призупиняє поточну чергу на певний час; можна вказати іншу чергу або режим відліку часу."]
  ];
  const phraseTranslations = Object.fromEntries(rows.map((row) => [row[0], Object.fromEntries(["ru", "en", "de", "pl", "es", "uk"].map((code, index) => [code, row[index]]))]));
  const storageKey = "denizenBlocks.language.v1";
  const originalText = new WeakMap();
  const renderedText = new WeakMap();
  const originalAttributes = new WeakMap();
  const renderedAttributes = new WeakMap();
  let currentLanguage = "ru";

  function translateText(text, language) {
    const trimmed = text.trim();
    const leading = text.match(/^\s*/)[0];
    const trailing = text.match(/\s*$/)[0];
    const phrases = phraseTranslations[trimmed];
    if (phrases) return `${leading}${phrases[language] || trimmed}${trailing}`;
    let match = trimmed.match(/^Все события \((\d+)\)$/);
    if (match) return `${leading}${({ ru: "Все события", en: "All events", de: "Alle Ereignisse", pl: "Wszystkie zdarzenia", es: "Todos los eventos", uk: "Усі події" })[language]} (${match[1]})${trailing}`;
    match = trimmed.match(/^Все команды \((\d+)\)$/);
    if (match) return `${leading}${({ ru: "Все команды", en: "All commands", de: "Alle Befehle", pl: "Wszystkie komendy", es: "Todos los comandos", uk: "Усі команди" })[language]} (${match[1]})${trailing}`;
    match = trimmed.match(/^Ошибки: (\d+) · замечания: (\d+)$/);
    if (match) return `${leading}${({ ru: "Ошибки", en: "Errors", de: "Fehler", pl: "Błędy", es: "Errores", uk: "Помилки" })[language]}: ${match[1]} · ${({ ru: "замечания", en: "warnings", de: "Hinweise", pl: "ostrzeżenia", es: "avisos", uk: "зауваження" })[language]}: ${match[2]}${trailing}`;
    match = trimmed.match(/^строка (\d+):\s*$/);
    if (match) return `${leading}${({ ru: "строка", en: "line", de: "Zeile", pl: "wiersz", es: "línea", uk: "рядок" })[language]} ${match[1]}: ${trailing}`;
    match = trimmed.match(/^И ещё замечаний: (\d+)$/);
    if (match) return `${leading}${({ ru: "И ещё замечаний", en: "And more warnings", de: "Weitere Hinweise", pl: "Więcej ostrzeżeń", es: "Más avisos", uk: "І ще зауважень" })[language]}: ${match[1]}${trailing}`;
    match = trimmed.match(/^(\d+) скрипт(а|ов)?$/);
    if (match) {
      const count = Number(match[1]);
      const noun = {
        ru: `скрипт${match[2] || ""}`,
        en: count === 1 ? "script" : "scripts",
        de: count === 1 ? "Skript" : "Skripte",
        pl: count === 1 ? "skrypt" : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? "skrypty" : "skryptów",
        es: count === 1 ? "script" : "scripts",
        uk: count % 10 === 1 && count % 100 !== 11 ? "сценарій" : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? "сценарії" : "сценаріїв"
      }[language];
      return `${leading}${match[1]} ${noun}${trailing}`;
    }
    match = trimmed.match(/^(\d+) текстур · выберите текстуру, чтобы задать MaterialTag$/);
    if (match) return `${leading}${match[1]} ${({ ru: "текстур · выберите текстуру, чтобы задать MaterialTag", en: "textures · select one to set the MaterialTag", de: "Texturen · wähle eine aus, um den MaterialTag festzulegen", pl: "tekstur · wybierz, aby ustawić MaterialTag", es: "texturas · selecciona una para establecer el MaterialTag", uk: "текстур · виберіть, щоб задати MaterialTag" })[language]}${trailing}`;
    match = trimmed.match(/^Проект переименован: (.+)$/);
    if (match) return `${leading}${({ ru: "Проект переименован", en: "Project renamed", de: "Projekt umbenannt", pl: "Zmieniono nazwę projektu", es: "Proyecto renombrado", uk: "Проєкт перейменовано" })[language]}: ${match[1]}${trailing}`;
    match = trimmed.match(/^Проект «(.+)» удалён$/);
    if (match) return `${leading}${({ ru: "Проект", en: "Project", de: "Projekt", pl: "Projekt", es: "Proyecto", uk: "Проєкт" })[language]} «${match[1]}» ${({ ru: "удалён", en: "deleted", de: "gelöscht", pl: "usunięto", es: "eliminado", uk: "видалено" })[language]}${trailing}`;
    match = trimmed.match(/^Скрипт «(.+)» удалён$/);
    if (match) return `${leading}${({ ru: "Скрипт", en: "Script", de: "Skript", pl: "Skrypt", es: "Script", uk: "Сценарій" })[language]} «${match[1]}» ${({ ru: "удалён", en: "deleted", de: "gelöscht", pl: "usunięto", es: "eliminado", uk: "видалено" })[language]}${trailing}`;
    match = trimmed.match(/^Событие «(.+)» удалено$/);
    if (match) return `${leading}${({ ru: "Событие", en: "Event", de: "Ereignis", pl: "Zdarzenie", es: "Evento", uk: "Подію" })[language]} «${match[1]}» ${({ ru: "удалено", en: "deleted", de: "gelöscht", pl: "usunięto", es: "eliminado", uk: "видалено" })[language]}${trailing}`;
    match = trimmed.match(/^Добавлено событие: (.+)$/);
    if (match) return `${leading}${({ ru: "Добавлено событие", en: "Event added", de: "Ereignis hinzugefügt", pl: "Dodano zdarzenie", es: "Evento añadido", uk: "Додано подію" })[language]}: ${match[1]}${trailing}`;
    match = trimmed.match(/^Загружено файлов: (\d+)$/);
    if (match) return `${leading}${({ ru: "Загружено файлов", en: "Files loaded", de: "Dateien geladen", pl: "Wczytano plików", es: "Archivos cargados", uk: "Завантажено файлів" })[language]}: ${match[1]}${trailing}`;
    match = trimmed.match(/^Пропущено файлов неподдерживаемого формата: (\d+)$/);
    if (match) return `${leading}${({ ru: "Пропущено файлов неподдерживаемого формата", en: "Unsupported files skipped", de: "Nicht unterstützte Dateien übersprungen", pl: "Pominięto plików o nieobsługiwanym formacie", es: "Archivos con formato no compatible omitidos", uk: "Пропущено файлів непідтримуваного формату" })[language]}: ${match[1]}${trailing}`;
    return text;
  }

  function translateNode(node) {
    const current = node.nodeValue;
    if (renderedText.has(node) && current !== renderedText.get(node)) originalText.set(node, current);
    else if (!originalText.has(node)) originalText.set(node, current);
    const localized = translateText(originalText.get(node), currentLanguage);
    if (localized !== current) node.nodeValue = localized;
    renderedText.set(node, localized);
  }

  function translateAttribute(element, attribute) {
    const value = element.getAttribute(attribute);
    if (value === null) return;
    let originals = originalAttributes.get(element);
    let rendered = renderedAttributes.get(element);
    if (!originals) {
      originals = new Map();
      rendered = new Map();
      originalAttributes.set(element, originals);
      renderedAttributes.set(element, rendered);
    }

    if (rendered.has(attribute) && value !== rendered.get(attribute)) originals.set(attribute, value);
    else if (!originals.has(attribute)) originals.set(attribute, value);
    const localized = translateText(originals.get(attribute), currentLanguage);
    if (localized !== value) element.setAttribute(attribute, localized);
    rendered.set(attribute, localized);
  }

  function describeEvent(category, name) {
    const categories = {
      en: { Player: "player", Entity: "entity", Block: "block", Item: "item", NPC: "NPC", Server: "server", World: "world", Vehicle: "vehicle" },
      de: { Player: "Spieler", Entity: "Entität", Block: "Block", Item: "Gegenstand", NPC: "NPC", Server: "Server", World: "Welt", Vehicle: "Fahrzeug" },
      pl: { Player: "gracza", Entity: "encji", Block: "bloku", Item: "przedmiotu", NPC: "NPC", Server: "serwera", World: "świata", Vehicle: "pojazdu" },
      es: { Player: "jugador", Entity: "entidad", Block: "bloque", Item: "objeto", NPC: "NPC", Server: "servidor", World: "mundo", Vehicle: "vehículo" },
      uk: { Player: "гравця", Entity: "сутності", Block: "блоку", Item: "предмета", NPC: "NPC", Server: "сервера", World: "світу", Vehicle: "транспорту" }
    };
    const templates = {
      en: (type, event) => `The ${type} event triggers when “${event}” occurs. Run commands in its handler and use the event header to set trigger conditions.`,
      de: (type, event) => `Das Ereignis für ${type} wird ausgelöst, wenn „${event}“ eintritt. Führe Befehle im Handler aus und lege die Auslösebedingungen im Ereigniskopf fest.`,
      pl: (type, event) => `Zdarzenie dotyczące ${type} uruchamia się, gdy wystąpi „${event}”. W jego obsłudze można wykonywać komendy, a nagłówkiem zdarzenia określać warunki uruchomienia.`,
      es: (type, event) => `El evento de ${type} se activa cuando ocurre «${event}». Ejecuta comandos en su controlador y define las condiciones de activación en el encabezado del evento.`,
      uk: (type, event) => `Подія для ${type} спрацьовує, коли відбувається «${event}». У її обробнику можна виконувати команди, а в заголовку події задавати умови запуску.`
    };
    const type = (categories[currentLanguage] && categories[currentLanguage][category]) || category.toLowerCase();
    return templates[currentLanguage](type, name);
  }

  function translateTree(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      translateNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) {
      ["aria-label", "title", "placeholder"].forEach((attribute) => translateAttribute(root, attribute));
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translateNode(node);
  }

  function applyLanguage(language, persist = true) {
    if (!Object.prototype.hasOwnProperty.call(languages, language)) return;
    currentLanguage = language;
    document.documentElement.lang = language;
    document.title = languages[language].title;
    const flag = document.getElementById("selected-language-flag");
    const picker = document.getElementById("language-picker");
    if (flag) flag.src = `assets/languages/${languages[language].flag}`;
    if (picker) picker.querySelector("summary").setAttribute("aria-label", `${({ ru: "Выбрать язык", en: "Choose language", de: "Sprache auswählen", pl: "Wybierz język", es: "Elegir idioma", uk: "Вибрати мову" })[language]}: ${languages[language].name}`);
    document.querySelectorAll(".language-option").forEach((option) => {
      const selected = option.dataset.language === language;
      option.setAttribute("aria-selected", String(selected));
      if (selected) option.setAttribute("aria-current", "true");
      else option.removeAttribute("aria-current");
    });
    translateTree(document.body);
    document.dispatchEvent(new CustomEvent("denizen-language-change", { detail: { language } }));
    if (persist) {
      try {
        localStorage.setItem(storageKey, language);
      } catch (error) {
        console.warn("Could not save the selected language.", error);
      }
    }
  }

  document.querySelectorAll(".language-option").forEach((option) => {
    option.addEventListener("click", () => {
      applyLanguage(option.dataset.language);
      document.getElementById("language-picker").open = false;
    });
  });
  document.querySelectorAll(".language-welcome-option").forEach((option) => {
    option.addEventListener("click", () => {
      applyLanguage(option.dataset.firstLanguage);
      document.getElementById("language-welcome").hidden = true;
    });
  });
  document.addEventListener("click", (event) => {
    const picker = document.getElementById("language-picker");
    if (picker && !picker.contains(event.target)) picker.open = false;
  });

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === "characterData") translateNode(record.target);
      else {
        record.addedNodes.forEach((node) => translateTree(node));
        if (record.type === "attributes") translateAttribute(record.target, record.attributeName);
      }
    });
  });
  observer.observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["aria-label", "title", "placeholder"] });

  let storedLanguage = "ru";
  let hasSavedLanguage = false;
  try {
    const savedLanguage = localStorage.getItem(storageKey);
    if (savedLanguage && Object.prototype.hasOwnProperty.call(languages, savedLanguage)) {
      storedLanguage = savedLanguage;
      hasSavedLanguage = true;
    }
  } catch (error) {
    console.warn("Could not read the saved language.", error);
  }
  document.getElementById("language-welcome").hidden = hasSavedLanguage;
  window.DenizenI18n = {
    get language() { return currentLanguage; },
    translate: (text) => translateText(text, currentLanguage),
    describeEvent
  };
  applyLanguage(storedLanguage, false);
})();
