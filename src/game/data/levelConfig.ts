import { SceneKeys } from '../scenes/SceneKeys';

export const LEVEL_META = [
  { id: 1, key: SceneKeys.LEVEL1, title: 'Подавление', subtitle: 'Лабиринт дыхания' },
  { id: 2, key: SceneKeys.LEVEL2, title: 'Раздражение', subtitle: 'Бег по полосам' },
  { id: 3, key: SceneKeys.LEVEL3, title: 'Травма', subtitle: 'Сортировка карт' },
  { id: 4, key: SceneKeys.LEVEL4, title: 'Самопринятие', subtitle: 'Выбор отражения' },
  { id: 5, key: SceneKeys.LEVEL5, title: 'Восстановление', subtitle: 'Путь ресурсов' },
] as const;

export const DEVIL_FEATURES = [
  'Рога защиты',
  'Шипованная броня',
  'Колючий хвост',
  'Маска ярости',
  'Цепи самоосуждения',
];

export const HUMAN_FEATURES = [
  'Тёплый взгляд',
  'Открытые ладони',
  'Ровное дыхание',
  'Мягкий голос',
  'Устойчивая походка',
];

export const HUB_INTRO =
  'Я иду по внутреннему ландшафту: моя тень не враг, а проводник к форме, в которой я дышу свободнее.';

export const DISCLAIMER = 'Игра метафорическая, не является диагностикой или лечением.';
