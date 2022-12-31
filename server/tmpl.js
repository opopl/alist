
const path = require('path')
const _ = require('lodash')

//const cons = require('consolidate');
const nunjucks = require('nunjucks');

const viewsDir = path.resolve(__dirname, 'views')
const noon = nunjucks.configure(viewsDir, {
  autoescape: true,
  express   : srv
});
noon.addFilter('isArr', x => Array.isArray(x))
noon.addFilter('isObj', x => _.isPlainObject(x))

module.exports = { noon }
