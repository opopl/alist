
// css
require('../../css/ui.css');

// js
//
//
//const { $ } = require('jquery')
//window.$ = window.jQuery = $

require('jquery-ui-bundle')

require('webpack-jquery-ui')
require('webpack-jquery-ui/css')

//require('jquery-validation');

//window.$ = window.jQuery = $

//require('jquery-ui')

import { App } from './ui.js';

$(function(){
  window.app =  new App();
  app.run();
});
