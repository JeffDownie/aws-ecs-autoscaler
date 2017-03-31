'use strict';
describe('index.js', () => {
    it('exists', done => {
        require('../../lib/scaleDown');
        done();
    });
});
describe('removeable', () => {
    require('./removeable.js');
});
