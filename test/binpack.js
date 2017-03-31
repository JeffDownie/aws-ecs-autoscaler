'use strict';
require('should');
const R = require('ramda');

const binpack = require('../lib/binpack');
it('is a function', () => {
    binpack.should.be.a.Function();
});
it('can fit no objects in any bins', () => {
    binpack([], []).should.be.true();
    binpack([{x:1}], []).should.be.true();
});
it('can\'t fit any objects in no bins', () => {
    binpack([], [{x:1, y:2}]).should.be.false();
    binpack([], [{x:1}, {x:2}]).should.be.false();
});
it('can\'t fit an object in a smaller bin', () => {
    binpack([{x:1}], [{x:2}]).should.be.false();
});
it('can fit one object if one bin is bigger', () => {
    binpack([{x:4}], [{x:4}]).should.be.true();
    binpack([{x:1}, {x:4}], [{x:4}]).should.be.true();
    binpack([{x:4}, {x:1}], [{x:4}]).should.be.true();
});
it('can fit two objects in one big enough bin', () => {
    binpack([{x:2}], R.repeat({x:1}, 2)).should.be.true();
});
it('can\'t fit three objects in one small bin', () => {
    binpack([{x:2}], R.repeat({x:1}, 3)).should.be.false();
});
it('can fit in two objects into two specific bins', () => {
    binpack([{x:2, y:3},{x:3,y:2}], [{x:3,y:2},{x:2, y:3}]).should.be.true();
});
it('works on a lot of bins and objects that fit', () => {
    binpack(R.repeat({x:2, y:4}, 5), R.repeat({x:1, y:2}, 10)).should.be.true();
});
it('works on a lot of bins and objects that dont fit', () => {
    binpack(R.repeat({x:2, y:4}, 5), R.repeat({x:1, y:2}, 11)).should.be.false();
});
