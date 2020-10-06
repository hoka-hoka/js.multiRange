# Multirange Plugin

![Build Status](https://travis-ci.com/hoka-hoka/multirange.svg?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/hoka-hoka/multirange/badge.svg?targetFile=package.json)](https://snyk.io/test/github/hoka-hoka/multirange?targetFile=package.json)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/hoka-hoka/multirange/master.svg?style=flat-square)](https://codecov.io/gh/hoka-hoka/multirange/)

Multirange.js - это крошечный плагин javascript для создания ползунков. Он полностью настраивается и не требует зависимостей. Вы можете использовать его в качестве ползунка с двумя "ирисками" для изменения числовых диапазонов.
[Демо](https://hoka-hoka.github.io/js.multiRange/ "Необязательная подсказка")

См. [Документация](https://github.com/hoka-hoka/multirange/wiki) для получения описания общей структуры приложения, а также UML-диаграммы. 

### Монтаж

1. Клонирование репозитория
```
git clone https://github.com/hoka-hoka/multirange.git
```
2. Установка пакетов NPM
```
npm install
```
3. Выполнение тестов в командной строке
```
npm run test
```
4. Сборка проекта
```
npm run build
```

### Пример HTML
При использовании плагина с опцией `multirange` в значении атрибута `value` указывается начальное и конечное положение ползунков. Помимо специальных свойств плагин сохраняет поддержку атрибута step, для установки значения шага.
```
<input class="range user__class" type="range" value="40,60" min="0" max="100" data-rotate="true" data-scale="true" data-multirange="multirange" data-popup="true" step="6">
```
### Опции

|    Атрибуты     |  Значения   |        Описание         |
|-----------------|:-----------:|:------------------------|
| data-multirange | multirange  | Добавить вторую "ириску"|
| data-direction  | left, right | Изменить направление    |
| data-popup      | false, true | Добавить popup          |
| data-rotate     | false, true | Развернуть по вертикале |
| data-scale      | false, true | Добавить шкалу          |

### API
Для корректрировки расчёта движения ползунка рекомендуется при вызове функции плагина указать параметр `toffeeSize`, которые определяет размер "ириски" в `px`.
```
window.addEventListener('load', () => {
  var range1 = $('.r1').multiRange({
     toffeeSize: '12' 
  })
}
```
Параметры можно передать объектом в саму функцию плагина при его инициализации.
```
window.addEventListener('load', () => {
  var range1 = $('.r1').multiRange({ 
    toffeeSize: '16' 
    multirange: 'multirange',
    popup: true
 });
```
### Дорожная карта
См. [открытые проблемы](https://github.com/hoka-hoka/multirange/issues) для получения списка предлагаемых функций (и известных проблем).
### Лицензия
Распространяется по лицензии MIT. См. `LICENSE`.

### Связаться с нами
Ссылка на проект: [https://github.com/hoka-hoka/multirange](https://github.com/hoka-hoka/multirange)

Почта: sff1.tpu.ru



