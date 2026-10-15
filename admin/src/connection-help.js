// An anonymous read probe: never collect tokens or retry a save automatically.
export function setupConnectionHelp() {
  const sidebar = document.getElementById("section-sidebar");
  const root = document.getElementById("nc-root");
  if (!sidebar || !root) return;
  const details = document.createElement("details");
  details.className = "connection-help";
  details.innerHTML = `
    <summary>Если не сохраняется</summary>
    <p>NetworkError означает, что браузер не получил доступный ответ. По этому сообщению нельзя определить, где возник сбой.</p>
    <ol>
      <li>Не закрывайте и не обновляйте вкладку. Скопируйте изменённые тексты в заметки; сохраните исходные файлы у себя.</li>
      <li>Проверьте соединение кнопкой ниже. Открывающийся github.com ещё не означает доступность API.</li>
      <li>При недоступности API попробуйте другую сеть, например мобильный интернет, и повторите проверку в этой вкладке.</li>
      <li>Когда связь восстановится, проверьте опубликованный результат в другой вкладке: запрос мог успеть выполниться. При необходимости повторите сохранение.</li>
    </ol>
    <button type="button">Проверить соединение с GitHub</button>
    <p class="connection-result" role="status"></p>
    <p>Проверка проверяет только чтение публичного репозитория. Она не проверяет токен, права на запись и загрузку файлов. Если ошибка повторяется, сообщите время, браузер, что сохраняли и результат проверки. Токен никому не отправляйте.</p>
    <a href="https://www.githubstatus.com/" target="_blank" rel="noopener">Статус GitHub ↗</a>`;
  const result = details.querySelector(".connection-result");
  const button = details.querySelector("button");
  button.addEventListener("click", async () => {
    button.disabled = true;
    result.textContent = "Проверяем доступ к API GitHub…";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch("https://api.github.com/repos/landat/step-static-website", {
        credentials: "omit", cache: "no-store", signal: controller.signal,
      });
      result.textContent = response.ok
        ? "API GitHub доступен для чтения. Это не подтверждает успешное сохранение или права на запись."
        : `API GitHub ответил HTTP ${response.status}. Связь есть, но проверка чтения не прошла. Сохранение не проверялось.`;
    } catch {
      result.textContent = "Не удалось получить ответ от API GitHub за время проверки. Возможны проблемы сети, браузера или сервиса. Попробуйте другую сеть; не обновляйте несохранённую форму.";
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
    }
  });
  sidebar.append(details);
  new MutationObserver(() => {
    const notices = root.querySelectorAll('[role="alert"], [role="status"]');
    if ([...notices].some((notice) => /NetworkError|Failed to fetch|Network request failed/i.test(notice.textContent))) details.open = true;
  }).observe(root, { childList: true, subtree: true, characterData: true });
}
