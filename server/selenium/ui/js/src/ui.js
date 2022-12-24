

var pretty = require('pretty');

var _ = require('lodash');

function AppUi(){

//@@ register_on_enter
  this.register_on_enter = function(sel, func){

     var $i = $(sel);

     $i.bind("enterKey",func);

     $i.keyup(function(e){
        if(e.keyCode == 13) {
          $(this).trigger("enterKey");
        }
     });

     return this;
  };

//@@ init
  this.init = function(){

  const app = this

  this
    .register_on_enter('#input_go',function(e){})
    .register_on_enter('#input_search',
        function(e){
            const word = $(this).val();
						const url = `https://duckduckgo.com/?q=${word}`
						$.ajax({
						  method  : 'POST',
						  data    : { url },
         		  dataType : 'json',
						  url     : `/goto`,
						  success : function(data){
						  },
						  error   : function(data){},
						});

        }
    )

    return this
  }

//@@ run
  this.run = function(){
    console.log('[AppUi] start run');

    this
        .init()

    return this
  }

}

module.exports = { AppUi }

