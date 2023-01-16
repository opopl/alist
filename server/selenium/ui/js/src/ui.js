

var pretty = require('pretty');

var _ = require('lodash');

////window.$ = require('jquery');
//require('webpack-jquery-ui');
//require('webpack-jquery-ui/css');

//console.log($.ui.tabs)
//console.log($.ui.dialog)

function App(){

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

//@@ find
  this.find = function({ xpath, selector }){
    const app = this

    const urlSrc = `/page/src/html`
    $.ajax({
      method  : 'POST',
      data    : { xpath, selector },
      //dataType : 'json',
      url     : urlSrc,
      success : function(html){
        const src = html
        const encoded = "data:text/html;charset=utf-8," + encodeURIComponent(html);
        $('#pre_page_src').text(src)
        $('#tab_src_html iframe').attr({ src : encoded })
      },
      error   : function(data){},
    })

    return this
  }

//@@ goto
  this.goto = function({ url }){
    const app = this

    $.ajax({
      method  : 'POST',
      data    : { url },
      dataType : 'json',
      url     : `/goto`,
      success : function(data){
        //$('#input_go').val(url)
        $('#page_url').attr({ href : url }).text(url)
        $('#tab_src_html iframe').attr({ src : `/page/src/html` })
      },
      error   : function(data){},
    });

     return this
  }

//@@ init
  this.init = function(){
    const app = this

    $('#tabs').tabs()

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

          app.goto({ url })
      })
      .register_on_enter('#input_search',
          function(e){
              const word = $(this).val();
              const url = `https://duckduckgo.com/?q=${word}`
              app.goto({ url })

          }
      )
      .register_on_enter('#input_xpath',
          function(e){
              const xpath = $(this).val();
              app.find({ xpath })
          }
      )
      .register_on_enter('#input_selector',
          function(e){
              const selector = $(this).val();
              app.find({ selector })
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

module.exports = { App }

