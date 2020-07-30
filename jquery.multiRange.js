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
      let current = this._options.range[0];
      let value = current.getAttribute('value');
      let values = value === null ? [] : value.split(',');

      if ( current.hasAttribute('multirange') ) {
        current = $(current);

        this.ghost = current.clone().addClass('ghost');
        current.addClass('basic');
        this.thumb = $('<div class="thumb">');

        const expr =  this._min + (this._max - this._min) / 2;

        current.attr('value', values[0] || expr);
        current.prop({value: values[0] || expr}); // !!!
        this.ghost.attr('value', values[1] || expr);
        this.ghost.prop({value: values[1] || expr}); // !!!

        this.emit('addRange', {current, add: [this.ghost, this.thumb]});
        this.emit('moveRange')[0];

        this.followProperty();
        this.updateProperty()
      }
    }

    followProperty() {
      let opt = this._options;
      opt.valueLow = Math.min(opt.range.val(), this.ghost.val())
      opt.valueHight = Math.max(opt.range.val(), this.ghost.val());
    }

    updateProperty() {
      let opt = this._options;

      function getPercent(value) {
        return 100 * ((value - this._min) / (this._max - this._min)) + '%';
      };
      this.emit('updateRange', {
        el: this.thumb,
        pos: [getPercent.call(this, opt.valueLow), getPercent.call(this, opt.valueHight)]
      });
    }
  };

  class ListView extends EventEmitter {
    constructor(model) {
      super();
      this._model = model;
    }
    addRange(range, add) {
      range.current.after(add);
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
        this._view.addRange(range, v);
      });
    }
    moveRange() {

      $('input.' + namespace).on('input', (e) => {
        this._model.followProperty();
        e.stopPropagation();
        this._model.updateProperty();
      });
    }
    updateRange(obj) {
      this._view.updateRange(obj);
    }
  };

  $.fn.multiRange = function() {
    this.map((i, v) => {
      let options = {
        index: i,
        range: $(v)
      };
      const model = new ListModel(options);
      const view = new ListView(model);
      const controller = new ListController(model, view);
      model.init();
    });

  };

})(jQuery);