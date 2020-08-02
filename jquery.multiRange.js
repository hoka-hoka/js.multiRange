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
    }

    init() {
      const addThumb = () => {
        return $('<div class="thumb">');
      }
      const send = () => {
        this.emit('moveRange');
        this.followProperty();
        this.updateProperty();
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
      this.Popub(true);
      send();

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
        console.log('1');
        let arrow = $('<div class="popub"><div class="arrow"></div>');
        this.emit('addRange', {current: this.thumb, add: [arrow], method: 'append'});
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
      let opt = this._options;
      function getPercent(value) {
        return 100 * ((value - this._min) / (this._max - this._min)) + '%';
      };
      this.emit('updateRange', {
        el: this.thumb,
        pos: [getPercent.call(this, this.valueLow), getPercent.call(this, this.valueHight)]
      });
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
      obj.el.css("--start", obj.pos[0]);
      obj.el.css("--stop", obj.pos[1]);
    }
  };

  class ListController extends EventEmitter {
    constructor(model, view) {
      super();
      this._model = model;
      this._view = view;
      this._model.on('addRange', (r) => this.addRange(r));
      this._model.on('moveRange', () => this.moveRange());
      this._model.on('updateRange', (t) => this.updateRange(t));


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
  };

  $.fn.multiRange = function(options) {
    let option = options;
    this.map(function(i, v) {
      let target = { index: i, range: $(v) };
      options = $.extend(target, option);
      const model = new ListModel(options);
      const view = new ListView(model);
      const controller = new ListController(model, view);
      model.init();
    });
  };
})(jQuery);