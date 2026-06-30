# Школа бокса МЕТЕОР

Статический сайт школы бокса по структуре архивного `step.ez.uz`.

## Основные страницы

- `index.html` - главная
- `about.html` - о нас
- `prices.html` - цены
- `photos.html` - фото
- `videos.html` - видео
- `competitions.html` - соревнования
- `training.html` - тренировки
- `schedule.html` - расписание
- `beginners.html` - уроки начинающим
- `reviews.html` - отзывы
- `articles.html` - статьи
- `contacts.html` - контакты
- `admin.html` - инструкция администратора

## Добавление видео Rutube

Видео редактируются в одном файле:

```text
content/videos.js
```

Подробная инструкция:

- на сайте: `admin.html`
- в репозитории: `ADMIN_GUIDE.md`

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
