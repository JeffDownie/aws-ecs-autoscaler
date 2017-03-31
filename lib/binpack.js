'use strict';
const R = require('ramda');

const objectFits = (bin, object) => {
    const keys = R.keys(object);
    for(let i = 0; i < keys.length; i++) {
        if(bin[keys[i]] < object[keys[i]]) return false;
    }
    return true;
};

const addObjectToBin = R.curry((object, bin) => {
    return R.mapObjIndexed((val, key) => val - object[key], bin);
});

const maximalElementsIndex = objects => {
    let elements = [];
    for(let i = 0; i < objects.length; i++) {
        let alreadyBigger = false;
        for(let j = 0; j < elements.length; j++) {
            if(objectFits(objects[elements[j]], objects[i])) {
                alreadyBigger = true;
                break;
            }
        }
        if(!alreadyBigger) {
            elements = R.reject(elem => objectFits(objects[i], objects[elem]), elements);
            elements.push(i);
        }
    }
    return elements;
};

const binpack = (bins, objects) => {
    if(objects.length === 0) return true;
    const biggestObjects = maximalElementsIndex(objects);
    //console.log(biggestObjects, objects);
    const objIndex = biggestObjects[0];
    for(let binIndex = 0; binIndex < bins.length; binIndex++) {
        if(objectFits(bins[binIndex], objects[objIndex])) {
            const subFit = binpack(R.adjust(addObjectToBin(objects[objIndex]), binIndex, bins), R.remove(objIndex, 1, objects));
            //No backtracking - it's slow in the case of failiure.
            return subFit;
        }
    }
    return false;
};

module.exports = (bins, objects) => {
    if(objects.length === 0) return true;
    return binpack(bins, objects);
};
