'use strict';

const $ = require('jquery');

const helloWorld = require('hello/world');
helloWorld();

const txt = $('.hello').text();
console.log(txt);
