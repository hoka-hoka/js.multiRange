(function($) {

  class eventEmitter<T extends EventMap> implements Emitter<T> {
    public listeners: {
      [K in keyof EventMap]?: Array<(p: EventMap[K]) => void>; // {""?:[(e)=>void]}
    } = {};
    on<K extends EventKey<T>>(key: K, fn: EventReceiver<T[K]>): void {
      this.listeners[key] = (this.listeners[key] || []).concat(fn);
    };
    off<K extends EventKey<T>>(key: K, fn: EventReceiver<T[K]>): void {
      this.listeners[key] = (this.listeners[key] || []).filter( (f: EventReceiver<T[K]>) => f !== fn);
    };
    emit<K extends EventKey<T>>(key: K, data: T[K]): void {
      (this.listeners[key] || []).forEach(function(fn: EventReceiver<T[K]>) {
        fn(data);
      });
    }
  }

  class ListModel extends eventEmitter<{ moveRange: moveRange, addElement: addElement, addClass: addClass, updateRange: updateRange, updatePopup: updatePopup }> implements ListModelSettings { //
    ghost?: JQuery<HTMLElement>;
    _options: { [keys: string]: any };
    current: HTMLInputElement;
    thumb: JQuery<HTMLElement> = $('<div class="thumb">');
    popup: boolean = false;
    direction: number = 3;
    valueHight: number = 0;
    valueLow: number = 0;

    constructor(options: multiRangeOptionsSettings) {
      super();
      this._options = options;
      Object.keys(options).forEach(key => {
        this._options[key] = options[key];
      });
      this.current = this._options.range;
      if ( !$(this.current).is('input.range[type="range"]')) {
        $.error(`Плагин неверно инициализирован (прим. <input type="range" class=range>`);
      }
    }

    init() {
      let value: string | null = this.current.getAttribute('value');
      let values: string[] = ( value === null ) ? [] : value.split(',');
      let current: JQuery<HTMLInputElement> = $(this.current);

      if ( this.hasProperty('multirange', 'multirange') ) {
        this.ghost = current.clone().addClass('ghost');
        current = current.addClass('basic');
        const expr: number =  this._options.min + (this._options.max - this._options.min) / 2;
        current.attr('value', values[0] || expr);
        this.ghost.attr('value', $.trim(values[1]) || expr);

        this.emit('addElement', { current, add: [this.ghost, this.thumb] }); //this.ghost,
      }
      else {
        current = current.addClass('basic');
        this.emit('addElement', {current, add: [this.thumb]});
      }
      this.Direction = ['left', 'right'];
      this.popup = this.Popup(true);
      this.Rotate(true);
      this.Scale(true);
      this.emit('moveRange', {});
      this.followProperty();
      this.updateProperty();
    }

    hasProperty<T>(prop: string, value: T): number {
      const currentData: T | undefined = $(this.current).data(prop);
      const currentProperty: multiRangeOptionsSettings | undefined = this._options[prop];
      const status: number = ~($.inArray(value, [currentData, currentProperty]));
      return status;
    }

    set Direction(values: DirectionPromise) {
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

    get Direction(): DirectionPromise {
      let range: JQuery<HTMLElement> = $(this._options.range);
      switch(this.direction) {
        case 1:
          if ( this.ghost ) {
            return [Math.min(range.val() as number, this.ghost.val() as number),
            Math.max(range.val() as number, this.ghost.val() as number)];
          }
          else throw new Error("не найден ghost");
        break;
        case 2: return [range.val() as number, 100];
        break;
        default: return [0, range.val() as number];
      }
    }

    Popup(value: boolean) {
      if ( this.hasProperty('popup', value) ) {
        let arrow: JQuery<HTMLElement> = $('<div class="popup"><span></span><div class="arrow"></div>');
        if ( this.ghost ) {
          let arrowClone: JQuery<HTMLElement> = arrow.clone(true);
          this.emit('addElement', {current: this.thumb, add: [arrow, arrowClone], method: 'append'});
        }
        else {
          this.emit('addElement', {current: this.thumb, add: [arrow], method: 'append'});
        }
        return true;
      }
      return false;
    }

    Rotate(value: boolean) {
      if ( this.hasProperty('rotate', value) ) {
        let rangeParent: JQuery<HTMLElement> = $(this._options.range).parent();

        this.emit('addClass', { element: rangeParent, add: 'rotate--90' });
      }
    }

    Scale(value: boolean): void {
      let current: JQuery<HTMLElement> = $(this._options.range).parent();
      if ( this.hasProperty('scale', value) ) {
        let step: number = 0;
        let diff: number = (this._options.max - this._options.min) / 10;
        let scale: JQuery<HTMLElement> = $('<ul class="scale"></ul>');

        while(step <= 10) {
          scale.append(`<li class="scale__item">${+this._options.min + diff*step}</li>`);
          ++step;
        }
        current.append(scale);
        this.emit('addElement', {current, add: [current]});
      }
    }

    followProperty() {
      this.valueLow = <number>this.Direction[0];
      this.valueHight = <number>this.Direction[1];
    }

    updateProperty() {
      const positionPercent: (value: number) => string = value => {
        return 100 * ((value - this._options.min) / (this._options.max - this._options.min)) + '%';
      }
      const faultRight: (value: number) => number = value => {
        return this._options.toffeeSize * (value - this._options.min) / (this._options.max - this._options.min);
      }
      const faultLeft: (value: number) => number = value => {
        return this._options.toffeeSize * (this._options.max - value) / (this._options.max - this._options.min);
      }
      function* revisionPercent(this: ListModel) {
        for (var i = 0; i < 2; i++) {
          if ( !i ) {
            yield `${positionPercent(this.valueLow)} - ${faultRight(this.valueLow)}px`;
          } else {
            yield `${positionPercent(this.valueHight)} + ${faultLeft(this.valueHight)}px`;
          }
        }
      };
      const percent: string[] = [...revisionPercent.call(this)];
      this.emit('updateRange', {
        el: this.thumb,
        pos: percent
      });
      if ( this.popup ) {
          this.emit('updatePopup', {
          el: $(this.thumb).children()
        });
      }
    }

  }

  class ListView extends eventEmitter<{ data: string }> implements ListViewSettings {
    _model: ListModel;
    constructor(model: ListModel) {
      super();
      this._model = model;
      $(model._options.range).wrap('<div class="multirange"></div>');

      let rangeHeight: number | undefined = $(model._options.range).height();
      if ( rangeHeight ) {
        $(model._options.range).parent().height(rangeHeight);
      }

    }

    addElement({ current, add, method = 'after' }: addElement) {
      current[method as insert](add as JQuery<HTMLElement>);
    }

    addClass({ element, add }: addClass) {
      element.addClass(add);
    }

    updateRange(obj: updateRange) {
      obj.el.css("--start", 'calc(' + obj.pos[0] + ')');
      obj.el.css("--stop", 'calc(' + obj.pos[1] + ')');
    }

    updatePopup(el: HTMLElement, pos: string) {
      el.innerHTML = pos;
    }
  }

  class ListController extends eventEmitter<{  }> implements ListControllerSettings {
    _model: ListModel;
    _view: ListView;
    constructor(model: ListModel, view: ListView) {
      super();
      this._model = model;
      this._view = view;
      this._model.on('addElement', (obj) => this.addElement(obj));
      this._model.on('addClass', (obj) => this.addClass(obj));
      this._model.on('moveRange', () => this.moveRange());
      this._model.on('updateRange', (obj) => this.updateRange(obj));
      this._model.on('updatePopup', (obj) => this.updatePopup(obj));
    }

    addElement(obj: addElement): void {
      if ( Array.isArray(obj.add) ) {
        $.each(obj.add, (i, v) => {
          this._view.addElement({ current: obj.current, add: obj.add[i] as JQuery<HTMLElement>, method: obj.method });
        });
      }
      else {
        this._view.addElement(obj);
      }
    }

    addClass(obj: addClass) {
      this._view.addClass({ element: obj.element, add: obj.add });
    }

    moveRange(): void {
      let range: JQuery<HTMLElement> = $(this._model._options.range);
      //let listener: JQuery<HTMLElement> = this._model._options.listener;

      range.add(range.siblings('.ghost')).on('input', (e) => {
          this._model.followProperty();
          e.stopPropagation();
          this._model.updateProperty();
      });
    }

    updateRange(obj: updateRange): void {
      this._view.updateRange(obj);
    }

    updatePopup(obj: updatePopup): void {
      function* generator(this: ListController) {
        yield this._model.valueLow.toString();
        return this._model.valueHight.toString();
      }
      let popupGenerator = generator.call(this);
      if ( this._model.direction === 3) {
        popupGenerator.next();
        this._view.addClass({ element: obj.el, add: 'right--0'} );
      }
      obj.el.each((i, v) => {
        this._view.updatePopup($(v).children()[0], popupGenerator.next().value);
      });
    }
  }

  $.fn.multiRange = Object.assign<multiRangeSettings, multiRangeDefaultSettings>(
    function(this: JQuery, propertys: multiRangeOptionsSettings): JQuery {
      $.each(this, function(i, v) {
        let target: multiRangeOptionsSettings = {
          range: (v as HTMLInputElement),
          min: $(this).attr('min') || 0,
          max: $(this).attr('max') || 100,
        }
        if ( $(this).data('controller') ) {
          $.error('Плагин уже был инициализирован');
        }
        Object.keys(propertys).forEach( keys => {
          if ( !$.fn.multiRange.propertys.hasOwnProperty(keys) ) {
            $.error('Передаваемого свойства ' + keys + ' не существует'); //
          }
        });

        let options = $.extend(target, $.fn.multiRange.propertys, propertys);

        const model = new ListModel(options);
        const view = new ListView(model);
        const controller = new ListController(model, view);
        model.init();
        $(this).data('controller', controller);
      });

    return this
  },
  {
    propertys: {
      toffeeSize: 0,
      multirange: false,
      popup: false,
      scale: false,
      direction: 'right',
    }
  }
);

})(jQuery);