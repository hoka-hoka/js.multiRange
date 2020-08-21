"use strict";

(function ($) {
  class eventEmitter {
    constructor() {
      this.listeners = {};
    }

    on(key, fn) {
      this.listeners[key] = (this.listeners[key] || []).concat(fn);
    }

    off(key, fn) {
      this.listeners[key] = (this.listeners[key] || []).filter(f => f !== fn);
    }

    emit(key, data) {
      (this.listeners[key] || []).forEach(function (fn) {
        fn(data);
      });
    }

  }

  class ListModel extends eventEmitter {
    constructor(options) {
      super();
      this.thumb = $('<div class="thumb">');
      this.popup = false;
      this.direction = 3;
      this.valueHight = 0;
      this.valueLow = 0;
      this._options = options;
      Object.keys(options).forEach(key => {
        this._options[key] = options[key];
      });
      this.current = this._options.range;

      if (!$(this.current).is('input.range[type="range"]')) {
        $.error(`Плагин неверно инициализирован (прим. <input type="range" class=range>`);
      }
    }

    init() {
      let value = this.current.getAttribute('value');
      let values = value === null ? [] : value.split(',');
      let current = $(this.current);

      if (this.hasProperty('multirange', 'multirange')) {
        this.ghost = current.clone().addClass('ghost');
        current = current.addClass('basic');
        const expr = this._options.min + (this._options.max - this._options.min) / 2;
        current.attr('value', values[0] || expr);
        this.ghost.attr('value', $.trim(values[1]) || expr);
        this.emit('addElement', {
          current,
          add: [this.ghost, this.thumb]
        });
      } else {
        current = current.addClass('basic');
        this.emit('addElement', {
          current,
          add: [this.thumb]
        });
      }

      this.Direction = ['left', 'right'];
      this.popup = this.Popup(true);
      this.Rotate(true);
      this.Scale(true);
      this.emit('moveRange', {});
      this.followProperty();
      this.updateProperty();
    }

    hasProperty(prop, value) {
      const currentData = $(this.current).data(prop);
      const currentProperty = this._options[prop];
      const status = ~$.inArray(value, [currentData, currentProperty]);
      return status;
    }

    set Direction(values) {
      $.map(values, v => {
        if (this.hasProperty('multirange', 'multirange')) {
          this.direction = 1;
        } else if (this.hasProperty('direction', v)) {
          if (v === 'left') {
            this.direction = 2;
          }
        }
      });
    }

    get Direction() {
      let range = $(this._options.range);

      switch (this.direction) {
        case 1:
          if (this.ghost) {
            return [Math.min(range.val(), this.ghost.val()), Math.max(range.val(), this.ghost.val())];
          } else throw new Error("не найден ghost");

          break;

        case 2:
          return [range.val(), 100];
          break;

        default:
          return [0, range.val()];
      }
    }

    Popup(value) {
      if (this.hasProperty('popup', value)) {
        let arrow = $('<div class="popup"><span></span><div class="arrow"></div>');

        if (this.ghost) {
          let arrowClone = arrow.clone(true);
          this.emit('addElement', {
            current: this.thumb,
            add: [arrow, arrowClone],
            method: 'append'
          });
        } else {
          this.emit('addElement', {
            current: this.thumb,
            add: [arrow],
            method: 'append'
          });
        }

        return true;
      }

      return false;
    }

    Rotate(value) {
      if (this.hasProperty('rotate', value)) {
        let rangeParent = $(this._options.range).parent();
        this.emit('addClass', {
          element: rangeParent,
          add: 'rotate--90'
        });
      }
    }

    Scale(value) {
      let current = $(this._options.range).parent();

      if (this.hasProperty('scale', value)) {
        let step = 0;
        let diff = (this._options.max - this._options.min) / 10;
        let scale = $('<ul class="scale"></ul>');

        while (step <= 10) {
          scale.append(`<li class="scale__item">${+this._options.min + diff * step}</li>`);
          ++step;
        }

        current.append(scale);
        this.emit('addElement', {
          current,
          add: [current]
        });
      }
    }

    followProperty() {
      this.valueLow = this.Direction[0];
      this.valueHight = this.Direction[1];
    }

    updateProperty() {
      const positionPercent = value => {
        return 100 * ((value - this._options.min) / (this._options.max - this._options.min)) + '%';
      };

      const faultRight = value => {
        return this._options.toffeeSize * (value - this._options.min) / (this._options.max - this._options.min);
      };

      const faultLeft = value => {
        return this._options.toffeeSize * (this._options.max - value) / (this._options.max - this._options.min);
      };

      function* revisionPercent() {
        for (var i = 0; i < 2; i++) {
          if (!i) {
            yield `${positionPercent(this.valueLow)} - ${faultRight(this.valueLow)}px`;
          } else {
            yield `${positionPercent(this.valueHight)} + ${faultLeft(this.valueHight)}px`;
          }
        }
      }

      ;
      const percent = [...revisionPercent.call(this)];
      this.emit('updateRange', {
        el: this.thumb,
        pos: percent
      });

      if (this.popup) {
        this.emit('updatePopup', {
          el: $(this.thumb).children()
        });
      }
    }

  }

  class ListView extends eventEmitter {
    constructor(model) {
      super();
      this._model = model;
      $(model._options.range).wrap('<div class="multirange"></div>');
      let rangeHeight = $(model._options.range).height();

      if (rangeHeight) {
        $(model._options.range).parent().height(rangeHeight);
      }
    }

    addElement({
      current,
      add,
      method = 'after'
    }) {
      current[method](add);
    }

    addClass({
      element,
      add
    }) {
      element.addClass(add);
    }

    updateRange(obj) {
      obj.el.css("--start", 'calc(' + obj.pos[0] + ')');
      obj.el.css("--stop", 'calc(' + obj.pos[1] + ')');
    }

    updatePopup(el, pos) {
      el.innerHTML = pos;
    }

  }

  class ListController extends eventEmitter {
    constructor(model, view) {
      super();
      this._model = model;
      this._view = view;

      this._model.on('addElement', obj => this.addElement(obj));

      this._model.on('addClass', obj => this.addClass(obj));

      this._model.on('moveRange', () => this.moveRange());

      this._model.on('updateRange', obj => this.updateRange(obj));

      this._model.on('updatePopup', obj => this.updatePopup(obj));
    }

    addElement(obj) {
      if (Array.isArray(obj.add)) {
        $.each(obj.add, (i, v) => {
          this._view.addElement({
            current: obj.current,
            add: obj.add[i],
            method: obj.method
          });
        });
      } else {
        this._view.addElement(obj);
      }
    }

    addClass(obj) {
      this._view.addClass({
        element: obj.element,
        add: obj.add
      });
    }

    moveRange() {
      let range = $(this._model._options.range);
      range.add(range.siblings('.ghost')).on('input', e => {
        this._model.followProperty();

        e.stopPropagation();

        this._model.updateProperty();
      });
    }

    updateRange(obj) {
      this._view.updateRange(obj);
    }

    updatePopup(obj) {
      function* generator() {
        yield this._model.valueLow.toString();
        return this._model.valueHight.toString();
      }

      let popupGenerator = generator.call(this);

      if (this._model.direction === 3) {
        popupGenerator.next();

        this._view.addClass({
          element: obj.el,
          add: 'right--0'
        });
      }

      obj.el.each((i, v) => {
        this._view.updatePopup($(v).children()[0], popupGenerator.next().value);
      });
    }

  }

  $.fn.multiRange = Object.assign(function (propertys) {
    $.each(this, function (i, v) {
      let target = {
        range: v,
        min: $(this).attr('min') || 0,
        max: $(this).attr('max') || 100
      };

      if ($(this).data('controller')) {
        $.error('Плагин уже был инициализирован');
      }

      Object.keys(propertys).forEach(keys => {
        if (!$.fn.multiRange.propertys.hasOwnProperty(keys)) {
          $.error('Передаваемого свойства ' + keys + ' не существует');
        }
      });
      let options = $.extend(target, $.fn.multiRange.propertys, propertys);
      const model = new ListModel(options);
      const view = new ListView(model);
      const controller = new ListController(model, view);
      model.init();
      $(this).data('controller', controller);
    });
    return this;
  }, {
    propertys: {
      toffeeSize: 0,
      multirange: false,
      popup: false,
      scale: false,
      direction: 'right'
    }
  });
})(jQuery);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3RzL2pxdWVyeS5tdWx0aVJhbmdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsQ0FBQyxVQUFBLENBQUEsRUFBVTtBQUVULFFBQUEsWUFBQSxDQUFrQjtBQUFsQixJQUFBLFdBQUEsR0FBQTtBQUNTLFdBQUEsU0FBQSxHQUFBLEVBQUE7QUFjUjs7QUFYQyxJQUFBLEVBQUUsQ0FBQSxHQUFBLEVBQUEsRUFBQSxFQUF1RDtBQUN2RCxXQUFBLFNBQUEsQ0FBQSxHQUFBLElBQXNCLENBQUMsS0FBQSxTQUFBLENBQUEsR0FBQSxLQUFELEVBQUEsRUFBQSxNQUFBLENBQXRCLEVBQXNCLENBQXRCO0FBQ0Q7O0FBQ0QsSUFBQSxHQUFHLENBQUEsR0FBQSxFQUFBLEVBQUEsRUFBdUQ7QUFDeEQsV0FBQSxTQUFBLENBQUEsR0FBQSxJQUFzQixDQUFDLEtBQUEsU0FBQSxDQUFBLEdBQUEsS0FBRCxFQUFBLEVBQUEsTUFBQSxDQUFxQyxDQUFELElBQTRCLENBQUMsS0FBdkYsRUFBc0IsQ0FBdEI7QUFDRDs7QUFDRCxJQUFBLElBQUksQ0FBQSxHQUFBLEVBQUEsSUFBQSxFQUEwQztBQUM1QyxPQUFDLEtBQUEsU0FBQSxDQUFBLEdBQUEsS0FBRCxFQUFBLEVBQUEsT0FBQSxDQUFvQyxVQUFBLEVBQUEsRUFBZ0M7QUFDbEUsUUFBQSxFQUFFLENBQUYsSUFBRSxDQUFGO0FBREYsT0FBQTtBQUdEOztBQWRlOztBQWlCbEIsUUFBQSxTQUFBLFNBQUEsWUFBQSxDQUE4SjtBQVU1SixJQUFBLFdBQUEsQ0FBQSxPQUFBLEVBQThDO0FBQzVDO0FBUEYsV0FBQSxLQUFBLEdBQTZCLENBQUMsQ0FBOUIscUJBQThCLENBQTlCO0FBQ0EsV0FBQSxLQUFBLEdBQUEsS0FBQTtBQUNBLFdBQUEsU0FBQSxHQUFBLENBQUE7QUFDQSxXQUFBLFVBQUEsR0FBQSxDQUFBO0FBQ0EsV0FBQSxRQUFBLEdBQUEsQ0FBQTtBQUlFLFdBQUEsUUFBQSxHQUFBLE9BQUE7QUFDQSxNQUFB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