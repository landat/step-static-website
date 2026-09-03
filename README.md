# Школа бокса МЕТЕОР

Статический сайт школы бокса МЕТЕОР для публикации на GitHub Pages.

## Основные страницы

- `index.html` - главная
- `about.html` - о нас
- `prices.html` - цены
- `photos.html` - фото
- `training.html` - тренировки
- `schedule.html` - расписание
- `beginners.html` - уроки начинающим и видео
- `reviews.html` - перенаправление со старого раздела отзывов на фото
- `contacts.html` - контакты

## Видео

Видео первого урока хранится в одном файле:

```text
content/videos.js
```

Сейчас `beginners.html` показывает первый ролик из массива `METEOR_VIDEOS` в карточке урока 1. Видео хранится локально в `assets/videos`. Чтобы заменить его, загрузите новый MP4 в эту папку и измените путь `src` в первом объекте `content/videos.js`.

## Материалы для новичков

Карточки материалов на странице `beginners.html` редактируются в файле:

```text
content/beginners.js
```

Файлы для скачивания или открытия, например PDF и изображения, можно загружать в папку:

```text
assets/materials/
```

После загрузки файла укажите путь к нему в поле `url`, например `assets/materials/stance.pdf`.

Подробная инструкция:

- в репозитории: `ADMIN_GUIDE.md`

## Карта и аналитика

- Карта на странице `contacts.html` вставлена через iframe-виджет Яндекс.Карт без API key.
- Аналитика подключается в `assets/site.js` через GoatCounter: `https://step-static-website.goatcounter.com/count`.
- Скрипт аналитики не использует cookies и не загружается на `localhost` или при открытии файлов через `file:`.

## Управление содержимым

Файл `content/site.json` содержит объявление с расписанием, новости и список фотографий. Для редактирования без кода подключён Pages CMS через `.pages.yml`.

Администратору нужно открыть `https://app.pagescms.org`, войти через GitHub, выбрать репозиторий и открыть «Главная страница». Подробные шаги находятся в `ADMIN_GUIDE.md`.

## Локальная проверка

```powershell
npm run dev
```

После запуска открыть:

```text
http://localhost:8080/
```

## Деплой

Сайт опубликован через GitHub Pages из ветки `main`, путь `/`.

После любого изменения в GitHub и нажатия `Commit changes` GitHub Pages автоматически передеплоит сайт.

Публичный адрес:

```text
https://landat.github.io/step-static-website/
```
