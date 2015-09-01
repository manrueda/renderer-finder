var RendererFinder = require('../src/RendererFinder.js');
var finder = new RendererFinder();

finder.findOne(function(err, info){
  console.log(info);
});
