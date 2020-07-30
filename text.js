(function($) {
  class ListModel {
    constructor(name) {
      this.name = name
    }
    getName() {
      console.log(this.name);
    }
  }
  window.addEventListener('load', () => {
    const model = new ListModel('Vasia');
    console.log(model.getName());
  });


})(jQuery);

