'use strict';

const document = require('document');

module.exports = () => {
  const hello = document.querySelector('.hello');
  hello.innerHTML = 'hello world';
};
