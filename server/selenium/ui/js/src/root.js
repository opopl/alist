
// css
require('../../css/ui.css');

// js
//window.$ = require('jquery');
require('webpack-jquery-ui');
require('webpack-jquery-ui/css');

import { AppUi } from './ui.js';

$(function(){
  window.app =  new AppUi();
  app.run();
});
