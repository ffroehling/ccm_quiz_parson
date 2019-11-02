/**
 * @overview ccm component for quiz single choice question
 * @author Felix Fröhling <felix.froehling1@gmail.com> 2019
 * @license The MIT License (MIT)
 * @version latest (1.0.0)
 */

{

  var component  = {

    /**
     * unique component name
     * @type {string}
     */
    name: 'quiz_parson',
    version: [1,0,0],
    
    ccm: 'https://ccmjs.github.io/ccm/versions/ccm-20.7.2.js',

    /**
     * default instance configuration
     * @type {object}
     */
    config: {
      html: {
        main: {
          inner: [
              {tag : "h3", id : 'question_text', inner : ""},
            {
              tag : "div",
              id : "wrapper",
                inner : [

                {
                  tag : 'ul',
                  id : 'sort_elements',
                  inner : [
                    
                  ]
                },
                {
                  tag : 'ul',
                  id : 'answer_box',
                  inner : []
                },
                {
                  tag : 'button',
                  id : 'submit',
                  inner : ["Bestätigen"]
                }
              ]
            },
              
          ]
        }
      }
    },

    /**
     * for creating instances of this component
     * @constructor
     */
    Instance: function () {

      "use strict";

      /**
       * own reference for inner functions
       * @type {Instance}
       */
      const self = this;

      /**
       * shortcut to help functions
       * @type {Object.<string,function>}
       */
      let $;

      /**
       * init is called once after all dependencies are solved and is then deleted
       */
      this.init = async () => {
        // set shortcut to help functions
        $ = self.ccm.helper;
        this.traverse_light_dom();
      };
  
      this.traverse_light_dom = () => {
        if(!self.inner){
          return;
        }

        let elements = [];
        [ ...self.inner.children ].forEach( parson_tag => {
            if ( parson_tag.tagName !== 'CCM-PARSON-ELEMENT' ) return;

            
            const el = $.generateConfig( parson_tag );
            elements.push(el);
        });

        if(elements.length > 0){
          this.elements = elements;
        }
        /*
         * #################
         * THE SOURCE CODE IN THIS AREA IS BASED AND ALMOST EQUIVALENT 
         * TO André Kless' quiz component
         * https://akless.github.io/ccm-components/quiz/ccm.quiz.js
         * #################
         */  
        
        //let answers = [];

        //[ ...self.inner.children ].forEach( answer_tag => {
        //    // no answer tag? => skip
        //    if ( answer_tag.tagName !== 'CCM-CHOICE-ANSWER' ) return;

        //    /**
        //     * answer data (generated out of answer tag)
        //     * @type {Object}
        //     */
        //    const answer = $.generateConfig( answer_tag );
        //    answers.push(answer);

        //  } );

        //  // add question data to question data sets
        //  if(answers.length > 0){
        //    this.answers = answers;
        //  }
      } ;


      this.on_answer_callback = () => {
        if(this.answer_callback){
          this.answer_callback(this.percentage, this.given_answer);
        }
      };
      /**
       * is called once after the initialization and is then deleted
       */
      this.ready = async () => {
      };

      this.set_given_answer = (answer) => {
        //this.given_answer = answer;
        this.sorted = answer;
      };

      this.on_drag_start = (element) => {
        return (event) => {
          event.dataTransfer.setData("element", element);
          this.dragged_element = element;
        }
      };

      this.show_correct_answer = () => {
        this.disable_submit();

        this.unsorted = $.clone(this.correct);
        this.given_answer = this.sorted;

        for(var i = 0; i < this.sorted.length; i++){
          let element = this.sorted[i];

          if((i+1) == element.position){
            element.correct = true;
          }
          else{
            element.correct = false;
          }
        }

        this.render_elements();
      }

      this.disable_submit = () => {
        this.disabled_submit = true;

        //deactivate multiple submits
        this.disabled_submit = true;
        this.element.querySelectorAll('button').forEach((button)  => {
          button.classList.add('disabled');
        });
      }

      this.on_submit = (event) => {
        if(this.disabled_submit){
          return;
        }

        if(this.sorted.indexOf(null) >= 0){
            alert('Nicht alle Elemente einsortiert');
            return;
        }

        this.disable_submit();

        this.on_answer_callback();
        let perc_answer = 100 / this.correct.length;
        let percent = 0;

        for(var i = 0; i < this.sorted.length; i++){
          let element = this.sorted[i];
          if((i+1) == element.position){
            percent += perc_answer;
          }
        }

        this.percentage = percent;

        //show feedback instant if wished
        if(this.show_feedback){
          this.show_correct_answer();
        }
      };

      this.on_dragover = (event) => {
        let list = event.target.attributes['list'].value;
        let idx = event.target.attributes['idx'].value;
        list = list == 'sorted' ? this.sorted : this.unsorted;

        let element = list[idx];

        //allow drop only when nothing else is there
        if(!element){
          event.preventDefault();
        }
      };

      this.on_drop = (event) => {
        event.preventDefault();

        let element = this.dragged_element; 
        let list = event.target.attributes['list'].value;
        let idx = event.target.attributes['idx'].value;
        let opposite_list = null;

        if(list == 'sorted'){
          list = this.sorted;
          opposite_list = this.unsorted;
        }
        else{
          list = this.unsorted;
          opposite_list = this.sorted;
        }

        //check that it is not a movement on the same list
        //we can see this if the element is in our own list
        if(list.indexOf(element) >= 0){
          opposite_list = list;
        }

        let r_idx = opposite_list.indexOf(element);

        //add to new list
        list[idx] = element;

        //delete from list
        opposite_list[r_idx] = null;

        this.render_elements();
      }

      this.create_filled_element = (list, idx, element) => {
          let e_filled = {
            tag : 'li',
            class : 'filled_element',
            draggable : true,
            ondragstart : this.on_drag_start(element),
            element : element,
            list : list,
            idx : idx,

            inner : [
              { 
                tag : 'p',
                inner : element.value
              }
            ]
          };

          if(element.correct == false){
            e_filled.class += ' wrong';
          }
          else if(element.correct == true){
            e_filled.class += ' correct';
          }

          e_filled.class += " indent_" + element.indentation;

          return e_filled;
      }

      this.create_placeholder_element = (list, idx) => {
          let e_placeholder = {
            tag : 'li',
            class : 'placeholder_element',
            ondragover : this.on_dragover,
            ondrop : this.on_drop,
            list : list,
            idx : idx
          };

          return e_placeholder;
      }


      this.list_elements = (elements, list, ul) => {
        elements.forEach((element, index)=> {
          if(element){
            let e_content = this.create_filled_element(list, index, element);
            ul.inner.push(e_content);
          }
          else {
            let e_placeholder = this.create_placeholder_element(list, index);

            ul.inner.push(e_placeholder);
          }
        });
      };

      this.render_elements = () => {
        //first clear it
        this.html.main.inner[1].inner[0].inner = [];
        this.html.main.inner[1].inner[1].inner = [];

        //then add elements
        this.list_elements(this.unsorted, "unsorted", self.html.main.inner[1].inner[0]);
        this.list_elements(this.sorted, "sorted", self.html.main.inner[1].inner[1]);

        console.log(self.html.main);
        let html = $.html(self.html.main);
        $.setContent(self.element, html);
      };



      this.unify_config = async () => {
        //when no position is given take it from the given order
        for(var i = 0; i < this.elements.length; i++){
          if(!this.elements[i].position ){
            this.elements[i].position = (i+1);
          }
        }

        return true;
      }

      /**
       * starts the instance
       */
      this.start = async () => {
        //self.html.main.inner[2].onclick = this.submit;
        //this.render();
        if(!this.unify_config()){
          return;
        }

        //for test
        this.unsorted = this.elements;
        this.sorted = [];
        this.correct = [];

        //okay this is not really elegant, so fix TODO make it good
        this.elements.forEach(element => {
          this.sorted.push(null);
          this.correct[element.position - 1] = element;
        });


        //add the question and the button listener
        this.html.main.inner[0].inner = this.question_text;
        this.html.main.inner[1].inner[2].onclick = this.on_submit;

        this.render_elements();
      };

    }

  };

  function p(){window.ccm[v].component(component)}const f="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[f])window.ccm.files[f]=component;else{const n=window.ccm&&window.ccm.components[component.name];n&&n.ccm&&(component.ccm=n.ccm),"string"===typeof component.ccm&&(component.ccm={url:component.ccm});var v=component.ccm.url.split("/").pop().split("-");if(v.length>1?(v=v[1].split("."),v.pop(),"min"===v[v.length-1]&&v.pop(),v=v.join(".")):v="latest",window.ccm&&window.ccm[v])p();else{const e=document.createElement("script");document.head.appendChild(e),component.ccm.integrity&&e.setAttribute("integrity",component.ccm.integrity),component.ccm.crossorigin&&e.setAttribute("crossorigin",component.ccm.crossorigin),e.onload=function(){p(),document.head.removeChild(e)},e.src=component.ccm.url}}
}
