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
    }

    init() {

      let current = this._options.range[0];

      let min = current.min || 0;
      let max = current.max || 100;
      let value = current.getAttribute('value');
      let values = value === null ? [] : value.split(',');

      if ( current.hasAttribute('multirange') ) {
        current = $(current);
        let ghost = current.clone();
        let thumb = $('<div class="thumb">');
        current.addClass('basic');
        ghost.addClass('ghost');
        this._options.ghost = ghost;

        const expr =  min + (max - min) / 2;

        current.attr('value', values[0] || expr);
        current.prop({value: values[0] || expr}); // !!!
        ghost.attr('value', values[1] || expr);
        ghost.prop({value: values[1] || expr}); // !!!

        this.emit('addRange', {current, add: [ghost, thumb]});
        this.emit('moveRange')[0];
        this.emit('update', {
          thumb,
          pos: [getPercent(this._options.valueLow), getPercent(this._options.valueHight)],
        });
        console.log(this._options.valueLow);
        function getPercent(value) {
          return 100 * ((value - min) / (max - min)) + '%';
        }
      }
    }
    followProperty() {
      let opt = this._options;
      opt.valueLow = Math.min(opt.range.val(), opt.ghost.val())
      opt.valueHight = Math.max(opt.range.val(), opt.ghost.val());
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
    update(el) {
      console.log(el.pos);
      el.thumb.css("--start", el.pos[0]);
      el.thumb.css("--stop", el.pos[1]);
    }
  };

  class ListController extends EventEmitter {
    constructor(model, view) {
      super();
      this._model = model;
      this._view = view;
      this._model.on('addRange', (r) => this.addRange(r));
      this._model.on('moveRange', () => this.moveRange());
      this._model.on('update', (t) => this.update(t));


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
      });
    }
    update(el) {
      this._view.update(el);
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