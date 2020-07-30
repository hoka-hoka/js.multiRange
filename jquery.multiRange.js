(function( $ ) {
  var namespace = 'multiRange';

  class EventEmitter {
    constructor() {
      this._events = {};
    }
    on(evt, listener) {
      (this._events[evt] || (this._events[evt] = [])).push(listener);
      return this;
    }
    emit(evt, arg) {
      (this._events[evt] || []).slice().forEach(lsn => {
        lsn(arg);
      });
    }
  };

  class ListModel extends EventEmitter {
    constructor(options) {
      super();
      this._options = options;
    }

    init() {

      let current = this._options.range;
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

        current.val(values[0] || min + (max - min) / 2);
        ghost.val(values[1] || min + (max - min) / 2);

        this.emit('addRange', {current, add: [ghost, thumb]});
      }
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
  };

  class ListController extends EventEmitter {
    constructor(model, view) {
      super();
      this._model = model;
      this._view = view;
      this._model.on('addRange', (r) => this.addRange(r));
    }
    addRange(range) {
      range.add.map(v => {
        this._view.addRange(range, v);
      });

    }
  };

  $.fn.multiRange = function() {
    this.map((i, v) => {
      let options = {
        index: i,
        range: v
      };
      const model = new ListModel(options);
      const view = new ListView(model);
      const controller = new ListController(model, view);
      model.init();
    });

  };

})(jQuery);