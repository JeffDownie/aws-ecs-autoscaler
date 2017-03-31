'use strict';
const oldest = require('./oldest.js');
const removeable = require('./removeable.js');

module.exports = (data, strategy) => {
    switch(strategy) {
    case 'oldest':
        return oldest(data);
    case 'removeable':
        return removeable(data);
    default:
        return false;
    }
};
