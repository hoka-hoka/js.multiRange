interface multiRangeOptionsSettings {
  range: HTMLElement,
  multirange?: 'multirange' | boolean,
  scale?: boolean,
  toffeeSize?: number,
  popup?: boolean,
  range?: HTMLInputElement | null,
  min?: string | number,
  max?: string | number,
  direction?: 'left' | 'right'
}

interface multiRangeDefaultSettings {
  propertys: multiRangeOptionsSettings,
}

interface multiRangeSettings {
  (propertys: multiRangeOptionsSettings): jQuery,
}

interface multiRange extends multiRangeDefaultSettings, multiRangeSettings { }

interface JQuery {
  multiRange: multiRange;
}

type ObjectKeys<T> =
  T extends object ? (keyof T)[] :
  T extends number ? [] :
  T extends Array<any> | string ? string[] :
  never;

interface ObjectConstructor {
  keys<T>(o: T): ObjectKeys<T>
}

interface Emitter<T extends EventMap> { // K = ('data') содержится в EventKey() ?
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void; // если да, то в (x: string) => this.data() ищем 'data'
  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

interface ListModelSettings {
  ghost?: JQuery<HTMLElement>,
  current: HTMLInputElement,
  thumb: JQuery<HTMLElement>,
  direction: number,
  valueLow: number,
  valueHight: number,
  hasProperty<T>(prop: string, value: T): number,
  Popup(value: boolean): boolean,
  Rotate(value: boolean): void,
  Scale(value: boolean): void,
  updateProperty(): void,
  followProperty(): void
}

interface ListViewSettings {
  _model: ListModel,
  addElement(obj: addElement): void,
  updateRange(obj: updateRange): void,
  addClass(obj: addClass): void,                                       //element: JQuery<HTMLElement>, add: string): void,
  updatePopup(el: HTMLElement, pos: string): void,
}

interface ListControllerSettings {
  _model: ListModel,
  _view: ListView,
  addElement(obj: addElement): void,
  addClass(obj: addClass): void,
  updateRange(obj: updateRange): void,
  updatePopup(obj: updatePopup): void,
}

interface addElement {
  current: JQuery<HTMLElement>,
  add: map | JQuery<HTMLElement>,
  method?: string,
}

interface addClass {
  element: JQuery<HTMLElement>,
  add: string,
}

interface updateRange {
  el: JQuery<HTMLElement>,
  pos: string[],
}

interface updatePopup {
  el: JQuery<HTMLElement>,
}

interface moveRange {}

type map = {
  [key: number]: JQuery<HTMLElement>;
}

type DirectionPromise = number[] | string[];

type insert = 'after' | 'before' | 'append' | 'prepend';

type EventMap = Record<string, any>; // { data: string } => true, {x: string} => true

type EventKey<T extends EventMap> = string & keyof T; // { string, data, ... }

type EventReceiver<C> = (params: C) => void;




