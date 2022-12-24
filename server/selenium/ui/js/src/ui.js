

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

  $('#btn_facebook').on('click',function(){
     $.ajax({
       method  : 'GET',
       data    : {},
       dataType : 'json',
       url     : `/goto/fb`,
       success : function(data){},
       error   : function(data){},
     });
  })

  this
    .register_on_enter('#input_go',function(e){
        const url = $(this).val();
        var uri
        try { uri = new URL(url) }catch(e){}
        $(this).val('');
        if (!uri) { return }

        $.ajax({
          method  : 'POST',
          data    : { url },
          dataType : 'json',
          url     : `/goto`,
          success : function(data){},
          error   : function(data){},
        });
    })
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
                //$('#input_go').val(url)
                $('#page_url').attr({ href : url }).text(url)
              },
              error   : function(data){},
            });

        }
    )
    .register_on_enter('#input_xpath',
        function(e){
            const xpath = $(this).val();
            $.ajax({
              method  : 'POST',
              data    : { xpath },
              dataType : 'json',
              url     : `/page/src`,
              success : function(data){
                const src = data.src
                $('#page_src').text(src)
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

