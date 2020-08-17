"use strict";
(function ($) {
    class eventEmitter {
        constructor() {
            this.listeners = {};
        }
        on(key, fn) {
            this.listeners[key] = (this.listeners[key] || []).concat(fn);
        }
        ;
        off(key, fn) {
            this.listeners[key] = (this.listeners[key] || []).filter((f) => f !== fn);
        }
        ;
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
        }
        init() {
            let value = this.current.getAttribute('value');
            let values = (value === null) ? [] : value.split(',');
            let current = $(this.current);
            if (this.hasProperty('multirange', 'multirange')) {
                this.ghost = current.clone().addClass('ghost');
                current = current.addClass('basic');
                const expr = this._options.min + (this._options.max - this._options.min) / 2;
                current.attr('value', values[0] || expr);
                this.ghost.attr('value', $.trim(values[1]) || expr);
                this.emit('addElement', { current, add: [this.ghost, this.thumb] });
            }
            else {
                current = current.addClass('basic');
                this.emit('addElement', { current, add: [this.thumb] });
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
            return ~($.inArray(value, [currentData, currentProperty]));
        }
        set Direction(values) {
            $.map(values, v => {
                if (this.hasProperty('multirange', 'multirange')) {
                    this.direction = 1;
                }
                else if (this.hasProperty('direction', v)) {
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
                        return [Math.min(range.val(), this.ghost.val()),
                            Math.max(range.val(), this.ghost.val())];
                    }
                    else
                        throw new Error("не найден ghost");
                    break;
                case 2:
                    return [range.val(), 100];
                    break;
                default: return [0, range.val()];
            }
        }
        Popup(value) {
            if (this.hasProperty('popup', value)) {
                let arrow = $('<div class="popup"><span></span><div class="arrow"></div>');
                if (this.ghost) {
                    let arrowClone = arrow.clone(true);
                    this.emit('addElement', { current: this.thumb, add: [arrow, arrowClone], method: 'append' });
                }
                else {
                    this.emit('addElement', { current: this.thumb, add: [arrow], method: 'append' });
                }
                return true;
            }
            return false;
        }
        Rotate(value) {
            if (this.hasProperty('rotate', value)) {
                let rangeParent = $(this._options.range).parent();
                this.emit('addClass', { element: rangeParent, add: 'rotate--90' });
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
                this.emit('addElement', { current, add: [current] });
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
                    }
                    else {
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
        addElement({ current, add, method = 'after' }) {
            current[method](add);
        }
        addClass({ element, add }) {
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
            this._model.on('addElement', (obj) => this.addElement(obj));
            this._model.on('addClass', (obj) => this.addClass(obj));
            this._model.on('moveRange', () => this.moveRange());
            this._model.on('updateRange', (obj) => this.updateRange(obj));
            this._model.on('updatePopup', (obj) => this.updatePopup(obj));
        }
        addElement(obj) {
            if (Array.isArray(obj.add)) {
                $.each(obj.add, (i, v) => {
                    this._view.addElement({ current: obj.current, add: obj.add[i], method: obj.method });
                });
            }
            else {
                this._view.addElement(obj);
            }
        }
        addClass(obj) {
            this._view.addClass({ element: obj.element, add: obj.add });
        }
        moveRange() {
            let range = $(this._model._options.range);
            range.add(range.siblings('.ghost')).on('input', (e) => {
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
                this._view.addClass({ element: obj.el, add: 'right--0' });
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
                max: $(this).attr('max') || 100,
            };
            let options = $.extend(target, $.fn.multiRange.propertys, propertys);
            const model = new ListModel(options);
            const view = new ListView(model);
            const controller = new ListController(model, view);
            $(this).data('controller', controller);
            model.init();
        });
        return this;
    }, {
        propertys: {
            toffeeSize: 0,
        }
    });
})(jQuery);
//# sourceMappingURL=script.js.map