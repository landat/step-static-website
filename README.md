# STEP static website

Пятистраничный сайт-визитка спортивного клуба по мотивам архивного образца.

## Страницы

- `index.html` - главная
- `about.html` - о клубе
- `training.html` - тренировки и цены
- `reviews.html` - фото и отзывы
- `contacts.html` - контакты и заявка

## Локальная проверка

Самый простой вариант: открыть `index.html` в браузере.

Если установлен Node.js:

```powershell
npm run dev
```

Если установлен Python:

```powershell
python -m http.server 8080
```

## Установка среды на Windows

```powershell
winget install Git.Git
winget install OpenJS.NodeJS.LTS
winget install GitHub.cli
winget install Microsoft.VisualStudioCode
```

После установки открыть новый PowerShell и проверить:

```powershell
git --version
node -v
npm -v
gh --version
```

## Публикация на GitHub Pages

### Вариант через GitHub CLI

```powershell
gh auth login
gh repo create step-static-website --public --source . --remote origin --push
```

После push открыть репозиторий на GitHub: `Settings` -> `Pages` -> `Build and deployment` -> `GitHub Actions`.

### Вариант через существующий репозиторий

В папке сайта выполнить:

```powershell
git init
git add .
git commit -m "Initial static site"
git branch -M main
git remote add origin https://github.com/USER/REPOSITORY.git
git push -u origin main
```

Workflow `.github/workflows/pages.yml` опубликует сайт после push в `main`.

## Что заменить перед реальным запуском

- телефон, адрес, Telegram и email на странице `contacts.html`;
- цены и расписание в `training.html`;
- отзывы и фото в `reviews.html`;
- изображение `assets/hero-gym.png` на реальные фото клуба, если они есть.
