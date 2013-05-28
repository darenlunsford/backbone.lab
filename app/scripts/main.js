var App = new Marionette.Application();

App.addRegions({
    "content": "#content",
    "navigation": "#navigation",
    // "filter": "#filters"
});

App.on("initialize:after", function() {
  Backbone.history.start();
});

App.module("Module", function(Mod, App, Backbone, Marionette, $, _){
    
    // Define Models to Represent our application state
    // --------------------------------------
    Mod.QueryModel = Backbone.Model.extend({
      defaults: {
        keywords: "",
        searchOptions: []
      }   
    });

    Mod.SearchResults = Backbone.Collection.extend({
      url: "http://limelightlabs.limelightdemo.com/templates/search.json",
      initialize: function(){

      },
      searchFetch: function(keywords, page, contentType) {
        var options = {};
        // defaults
        var page = page || 1;
        var contentType = contentType || 'All';
        var data = {keywords: keywords, page: 1, "content-type": contentType};
        options.dataType = 'jsonp';
        options.data = data;

        return this.fetch(options);
      },
      comparator: function(model) {
        return -model.sortDate;
      },
      parse: function(res){
        var mappedData = _.map(res.data, function(source) {
          source.prettyDate = new Date(source.sortDate);
          return source;
        });
        return mappedData;
      }
    });
    
    // Define a Views to render our templates
    // --------------------------------------
    Mod.HomeView = Marionette.ItemView.extend({
        template: "#home-template"
    });    

    Mod.NavigationView = Marionette.ItemView.extend({
        template: "#navigation-template",
        events: {
          'keypress #search-input' : 'searchKeywords',
        },
        searchKeywords: function(e){
          if ( typeof e.keyCode == 'undefined' || e.keyCode == 13) { 
            var keywords = $(e.target).val();
            
            if(keywords === '') return;

            this.model.set({keywords: keywords});
          }
        }
    });    
    
    Mod.SearchResultItem = Marionette.ItemView.extend({
        tagName: "li",
        template: "#search-result-item-template"
    });
    
    Mod.SearchResultCompositeView = Marionette.CompositeView.extend({
        template: "#search-result-template",
        itemView: Mod.SearchResultItem,
        itemViewContainer: "ul",
        className: "search-results"
    });
    
    // Define a controller to run this module
    // --------------------------------------
    var Router = Marionette.AppRouter.extend({
      appRoutes: {
          "": "home",
          "search/:keywords": "search"
      }
    });
        
    var Controller = Marionette.Controller.extend({
        start: function(){
            this.queryModel = new Mod.QueryModel();
            this.searchResults = new Mod.SearchResults();
            
            this.setupNavigation();
            this.setupSearch();
        },
        search: function(keywords){
          App.content.show(this.searchResultsView); 
          var self = this;
          var p = this.searchResults.searchFetch(keywords);
          // p.done(function() {
            
          // });
          
        },
        home: function() {
          var homeView = new Mod.HomeView();
          App.content.show(homeView);
        },
        setupNavigation: function(){
          this.navigationView = new Mod.NavigationView({
            model: this.queryModel
          });
          App.navigation.show(this.navigationView);
        },
        setupSearch: function() {
          var self = this;

          this.queryModel.on("change:keywords", function(){
            var keywords = this.get('keywords');
            self.search(keywords);
            // todo, update route silently
          });

          this.searchResultsView = new Mod.SearchResultCompositeView({
            model: this.queryModel,
            collection: this.searchResults
          });
        }
        
    });
   
    Mod.addInitializer(function(){
        Mod.controller = new Controller();
        Mod.router = new Router({
          controller: Mod.controller
        });
        Mod.controller.start();
    });
});

// Start the app
// -------------
App.start();