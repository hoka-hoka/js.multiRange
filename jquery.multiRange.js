(function( $ ) {
  var namespace = 'multirange';

  class EventEmitter {
    constructor() {
      this._events = {};
    }
    on(evt, listener) {
      (this._events[evt] || (this._events[evt] = [])).push(listener);
      return this;
    }
    emit(evt, arg) {
      let a = [];
      (this._events[evt] || []).slice().forEach(lsn => {
        a.push(lsn(arg)); // () => this.Function()
      });
      return a;
    }
  };

  class ListModel extends EventEmitter {
    constructor(options) {
      super();
      this._options = options;
      this._min = this._options.range.attr('min') || 0;
      this._max = this._options.range.attr('max') || 100;
      this.fault = 0;
    }

    init() {
      const addThumb = () => {
        return $('<div class="thumb">');
      }

      let current = this._options.range[0];
      let value = current.getAttribute('value');
      let values = value === null ? [] : value.split(',');

      if ( this.hasProperty('multirange', 'multirange') ) {
        this.ghost = $(current).clone().addClass('ghost');
        current = $(current).addClass('basic');

        const expr =  this._min + (this._max - this._min) / 2;

        current.attr('value', values[0] || expr);
        current.prop({value: values[0] || expr}); // !!!
        this.ghost.attr('value', values[1] || expr);
        this.ghost.prop({value: values[1] || expr}); // !!!

        this.thumb = addThumb();
        this.emit('addRange', {current, add: [this.ghost, this.thumb]});
      }
      else {
        current = $(current).addClass('basic');
        this.thumb = addThumb();
        this.emit('addRange', {current, add: [this.thumb]});
      }
      this.Direction = ['left', 'right'];
      this.popub = this.Popub(true);

      this.emit('moveRange');
      this.followProperty();
      this.updateProperty();

    }

    hasProperty(prop, value) {
      let current = this._options.range[0];
      return ~($.inArray(value, [$(current).data(prop), this._options[prop]]));
    }

    followProperty() {
      this.valueLow = this.Direction[0];
      this.valueHight = this.Direction[1];
    }

    Popub(values) {
      if ( this.hasProperty('popub', values) ) {
        let arrow = $('<div class="popub"><span></span><div class="arrow"></div>');
        if ( this.ghost ) {
          let arrowClone = arrow.clone(true);
          this.emit('addRange', {current: this.thumb, add: [arrow, arrowClone], method: 'append'});

        }
        else {
          this.emit('addRange', {current: this.thumb, add: [arrow], method: 'append'});
        }
        return true;
      }
    }

    set Direction(values) {
    this.direction = 3;
    $.map(values, v => {
      if ( this.hasProperty('multirange', 'multirange') ) {
        this.direction = 1;
      }
      else if ( this.hasProperty('direction', v) ) {
        if ( v === 'left' ) {
          this.direction = 2;
        }
      }
    });
    }

    get Direction() {
      let opt = this._options;
      switch(this.direction) {
        case 1: return [Math.min(opt.range.val(), this.ghost.val()), Math.max(opt.range.val(), this.ghost.val())];
        break;
        case 2: return [opt.range.val(), 100];
        break;
        default: return [0, opt.range.val()];
      }
    }

    updateProperty() {
      const positionPercent = value => {
        return 100 * ((value - this._min) / (this._max - this._min)) + '%';
      }
      const faultRight = value => {
        return this._options.toffeeSize * (value - this._min) / (this._max - this._min);
      }
      const faultLeft = value => {
        return this._options.toffeeSize * (this._max - value) / (this._max - this._min);
      }
      function* revisionPercent() {
        for (var i = 0; i < 2; i++) {
          if ( !i ) {
            yield `${positionPercent(this.valueLow)} - ${faultRight(this.valueLow)}px`;
          } else {
            yield `${positionPercent(this.valueHight)} + ${faultLeft(this.valueHight)}px`;
          }
        }
      };
      let percent = [...revisionPercent.call(this)];
      this.emit('updateRange', {
        el: this.thumb,
        pos: percent
      });
      if ( this.popub ) {
        this.emit('updatePopub', {
        el: $(this.thumb),
        pos: [this.valueLow, this.valueHight]
      });
      }
    }
  };

  class ListView extends EventEmitter {
    constructor(model) {
      super();
      this._model = model;
      let opt = model._options;
      opt.range.parent().height(opt.range.height());
    }

    addRange(range, add, method = 'after') {
      range.current[method](add);
    }

    updateRange(obj) {
      obj.el.css("--start", 'calc(' + obj.pos[0] + ')');
      obj.el.css("--stop", 'calc(' + obj.pos[1] + ')');
    }
    updatePopub(obj) {
      obj.el.children().each(function(i) {
        $(this).children()[0].innerHTML = obj.pos[i];
      });
    }
  };

  class ListController extends EventEmitter {
    constructor(model, view) {
      super();
      this._model = model;
      this._view = view;
      this._model.on('addRange', (t) => this.addRange(t));
      this._model.on('moveRange', () => this.moveRange());
      this._model.on('updateRange', (t) => this.updateRange(t));
      this._model.on('updatePopub', (t) => this.updatePopub(t));
    }

    addRange(range) {
      range.add.map(v => {
        this._view.addRange(range, v, range.method);
      });
    }

    moveRange() {
      let opt = this._model._options;
      $(opt.range.add(opt.range.siblings('.ghost'))).on('input', (e) => {
        this._model.followProperty();
        e.stopPropagation();
        this._model.updateProperty();
      });
    }

    updateRange(obj) {
      this._view.updateRange(obj);
    }
    updatePopub(obj) {
      this._view.updatePopub(obj);
    }
  };

  $.fn.multiRange = function(options) {
    let option = options;
    this.map(function(i, v) {
      let target = { index: i, range: $(v), toffeeSize: 0 };
      options = $.extend(target, option);
      const model = new ListModel(options);
      const view = new ListView(model);
      const controller = new ListController(model, view);
      model.init();
    });
  };
})(jQuery);