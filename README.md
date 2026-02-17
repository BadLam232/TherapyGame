# Внутренний путь (Telegram Mini App MVP)

MVP-игра на Phaser 3 + TypeScript для Telegram Mini App.

## Стек

- Vite + TypeScript
- Phaser 3
- Telegram WebApp (`ready()`, `expand()`, haptics)

## Запуск

```bash
npm install
npm run assets:generate
npm run dev
```

> Если ассеты уже сгенерированы (в этом репозитории они уже есть), `assets:generate` можно пропустить.

## Сцены

- `BootScene` — загрузка ассетов и генерация runtime-текстур
- `HubScene` — сюжетный ввод, выбор уровней, прогресс
- `Level1SuppressionScene` — лабиринт + дыхание/раскрытие пути
- `Level2IrritationScene` — 3 полосы, свайп и нейтрализация раздражителей
- `Level3TraumaScene` — сортировка карточек в корзины
- `Level4AcceptanceScene` — выбор «Принять» vs «Исправить»
- `Level5RecoveryScene` — 5 узлов пути + 10-секундные сборы ресурсов
- `TransformScene` — трансформация после прохождения уровня
- `ResultsScene` — итог и шаринг результата

## Прогресс

Прогресс хранится в `localStorage` через модуль:

- `src/game/modules/progress.ts`

Сохраняется:

- пройденные уровни
- лучший счёт по каждому уровню
- общий счёт
- этапы трансформации

## Ассеты

Плейсхолдеры находятся в:

- `public/assets/levels/level1/{back,mid,front}.png`
- ... до `level5`
- `public/assets/characters/stage0.png` ... `stage5.png`

Инструкции по замене реальными рендерами:

- `public/assets/README.md`

Опциональный видео-оверлей на уровень:

- `public/assets/levels/levelX/overlay.mp4`

## Telegram

Интеграция реализована в:

- `src/game/modules/telegram.ts`

Используются:

- `ready()`
- `expand()`
- haptic feedback (если доступен)
- шаринг результата через Telegram link / native share / clipboard fallback

## Дисклеймер

`Игра метафорическая, не является диагностикой или лечением.`
