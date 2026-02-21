class MockSortable {
    constructor(el, options) {
        this.el = el;
        this.options = options;
        MockSortable.instances.push(this);
    }
    destroy() {
        MockSortable.instances = MockSortable.instances.filter(s => s !== this);
    }
}
MockSortable.instances = [];

export default MockSortable;
