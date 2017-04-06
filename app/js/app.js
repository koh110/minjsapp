'use strict';

const $ = require('jquery/dist/jquery.min.js');

const helloWorld = require('hello/world');
helloWorld();

const txt = $('.hello').text();
console.log(txt);
