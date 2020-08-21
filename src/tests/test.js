"use strict";

QUnit.test('Основные требования', function (assert) {
  assert.expect(4);
  assert.ok($, 'JQuery загружен');
  assert.ok($.fn.multiRange, 'Расширение загружено корректно');
  assert.ok($.fn.multiRange.propertys, 'Значения по умолчанию выставлены');
  assert.propEqual($.fn.multiRange.propertys, {
    toffeeSize: 0,
    multirange: false,
    popup: false,
    scale: false,
    direction: 'right'
  }, 'Значения по умолчанию корректны');
});
QUnit.test('Неверные параметры', function (assert) {
  assert.expect(2);
  var $fixture = $('#qunit-fixture');
  assert.throws(function () {
    $fixture.multiRange({
      toffeeSize: '16'
    });
  }, /Плагин неверно инициализирован/, 'Неправильное объявление плагина');
  var $fixture = $('#qunit-fixture > input');
  assert.throws(function () {
    $fixture.multiRange({
      toffeeSize: '16',
      feacture: "lolilop"
    });
  }, /Передаваемого свойства .*? не существует/, 'Вызов неправильного свойства');
});
QUnit.test('Инициализация', function (assert) {
  assert.expect(5);
  var $fixture = $('#qunit-fixture > input');
  var $fixtureInitialized = $('#qunit-fixture > input').multiRange({
    toffeeSize: '16'
  });
  assert.ok($fixtureInitialized, 'Плагин инициализирован');
  assert.notEqual($fixtureInitialized.data('controller'), {}, 'Пространство имён определено');
  assert.strictEqual($fixture.length, $fixtureInitialized.length, 'Цепочка сохраняется');
  assert.deepEqual($fixture, $fixtureInitialized, 'Возврат того же объекта');
  assert.throws(function () {
    $fixture.multiRange({
      toffeeSize: '16'
    });
  }, /Плагин уже был инициализирован/, 'Расширение уже проинициализированно на элементе');
});
QUnit.test('Подписчики', function (assert) {
  assert.expect(2);
  var fixture = $('#qunit-fixture > input').multiRange({}).data('controller');
  var model = Object.keys(fixture._model.listeners);
  assert.deepEqual(fixture.listeners, {}, 'Шаблон Pub-Sub подключен');
  assert.strictEqual(isMethod(model), undefined, 'Методы  модели определены');

  function isMethod(listener) {
    var methods = ["addClass", "addElement", "moveRange", "updatePopup", "updateRange"];
    return listener.find((v, i) => {
      return !methods.includes(v);
    });
  }
});
QUnit.test('Вид', function (assert) {
  assert.expect(3);
  var range = $('#qunit-fixture > input');
  var fixture = $('#qunit-fixture > input').multiRange({
    toffeeSize: '16'
  });
  var newElement = $('<div class="newClass"></div>');
  var thumb = $('.thumb');

  fixture.data('controller')._view.addElement({
    current: range,
    add: newElement
  });

  fixture.data('controller')._view.addClass({
    element: range,
    add: 'newClass'
  });

  fixture.data('controller')._view.updateRange({
    el: thumb,
    pos: ['60%', '100%']
  });

  assert.ok(range.next().is(newElement), 'Новый элемент добавляется');
  assert.ok(range.hasClass('newClass'), 'Класс добавляется');
  assert.strictEqual(thumb.css('--start') + thumb.css('--stop'), 'calc(60%)calc(100%)', 'Свойства left и right ползунка обновляются');
});