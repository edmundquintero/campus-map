/************************************
 *                                  *
 *        CPCC CAMPUS MAP           *
 *                                  *
 ************************************/

$(function(){

    /* PLONE.... */
    // Plone strips out html tags because the editor only allows text in the body.... thank you Plone.
    $('#directions_search').append('<div id="label">Starting Address</div><div id="input"><input id="map_start_address" type="textfield" placeholder="Enter Address" ></div><button id="get_directions" >Get Directions</button>');


    // Directions methods
    var directionsService = new google.maps.DirectionsService();
    var directionsDisplay = new google.maps.DirectionsRenderer();

    // Create the default Map of all compuses.
    var mapOptions = {
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
    var map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById("directionsPanel"));


    // Building a collection of campus objects to populateinto the map object.
    // --Models
    var Campus = Backbone.Model.extend({
        center: function(){
            map.panTo(this.get('latlng'));
            map.setZoom(this.get('zoom'));
        },
        changeDirections: function() {
            var that = this;
            $('#directionsPanel').hide(1, function(){
                $('#directionsPanel-buttons a#directions_close').html('Open Directions');
                var map_start = $('input#map_start_address').val();
                if( !map_start ){
                    $('#directionsPanel').html('No Starting Address');
                    directionsDisplay.setDirections({routes:[]});
                }else{
                    $('#directionsPanel').html('');
                    var request = {
                        origin: map_start,
                        destination: that.get('latlng'),
                        travelMode: google.maps.TravelMode.DRIVING
                    };
                    directionsService.route(request, function(response, status) {
                        if (status == google.maps.DirectionsStatus.OK) {
                            directionsDisplay.setDirections(response);
                        }
                    });
                    $('#directionsPanel-buttons a#directions_close').trigger('click', function(){});
                }
            });
        }
    });

    // Views
    var CampusView = Backbone.View.extend({
        tagName: 'li',
        events: {
            'click':'center' //handels which campus is in the view
        },
        center: function(){
            $('li.map_navigation_item').removeClass('active');
            $(this.el).addClass('active');
            this.setAddress();
            var map_start = $('input#map_start_address').val();
            if(map_start == ''){
                this.model.center(); //move model logic into the model
                this.model.changeDirections();
            }else{
                this.model.changeDirections();
            }
        },
        render: function(){
            this.marker();
            $(this.el).addClass('map_navigation_item');
            var html = "<a id='"+this.model.get('name')+"' class='campus-map-link' href='javascript:void(0);'>"+this.model.get('name')+"</a>";
            $(this.el).html(html);
            return this;
        },
        marker: function(){
            if(this.model.get('name') != 'All'){ // Only place markers for campuses not the overview.
                var markerOptions = {   // set the map marker options
                    map:map,
                    position: this.model.get('latlng'),
                    title: this.model.get('name')+' Campus -'+this.model.get('street')+' '+this.model.get('city')+' '+this.model.get('state')+' '+this.model.get('zip')+' '+this.model.get('phone')
                    };
                var that = this; // pass 'this' into the google event listener response function
                var marker = new google.maps.Marker(markerOptions); // create map marker for the campus
                google.maps.event.addListener(marker, 'click', function(){
                    that.center();
                });
            }else{
                this.center();
            }
        },
        setAddress: function(){
            campusAddressView = new CampusAddressView({model: this.model});
            $('#campus_address').html(campusAddressView.render().el);

        },
        
    });
    var CampusAddressView = Backbone.View.extend({
        tagName: 'h1',
        render: function(){
            if(this.model.get('name') != 'All'){
                var html = this.model.get('name')+' Campus -'+this.model.get('street')+' '+this.model.get('city')+' '+this.model.get('state')+' '+this.model.get('zip')+' '+this.model.get('phone');  
            }else{
                var html = this.model.get('city')+' '+this.model.get('state')
            }
            $(this.el).html(html);
            return this;
        },
    });
    
    // --Collections
    var CampusCollection = Backbone.Collection.extend({
        model: Campus,
        comparator: function(item){
            return item.get("name");
        }
    });

    // --Collection Views
    var CampusCollectionView = Backbone.View.extend({
        tagName: 'ul',
        id: 'campus-links',
        initialize: function(){
            this.collection.bind("reset", this.addAll, this);
            this.collection.on('add', this.addOne, this);
            //this.collection.fetch({}); maybe a campus API in the future?... maybe?
        },
        render: function(){
            this.addAll();
            return this;
        },
        addOne: function(campus){
            campusView = new CampusView({model: campus});
            this.$el.append(campusView.render().el);
        },
        addAll: function(){
            this.$el.html('');
            this.collection.forEach(this.addOne, this);
        },
        changeDirections: function(name){
            var model = this.collection.findWhere({name: name});
            model.changeDirections();
        },
        newCampus: function(){
            console.log("A NEW LOCATION!");
        }
    });

    // Create the Collection and populate it.
    campusCollection = new CampusCollection();
    campusCollectionView = new CampusCollectionView({collection: campusCollection});

    // KML layer for central campus
    // var kml_Layer = new google.maps.KmlLayer('https://dl.dropbox.com/u/70987694/CPCCCentralCampus.kml');
    // kml_Layer.setMap(map);

    /*****************
     *  CAMPUS API   *
     *****************/
    /*
     *  Campus locations are hard coded for now.
     *  I could derive the latlng fields from the addresses using the google API.
     */
    campusCollection.add([
        {name: 'All', 
         latlng: new google.maps.LatLng(35.217448, -80.830010), //the same latlng as central to default the map directions there.
         zoom: 10,
         street:'',
         city: 'Charlotte',
         state: 'NC',
         zip:'',
         phone:'',
         }, // this... is... Charlotte!
        {name: 'Central', 
         latlng: new google.maps.LatLng(35.217448, -80.830010), 
         zoom: 14,
         street: '1201 Elizabeth Avenue',
         city: 'Charlotte',
         state: 'NC',
         zip: '28235',
         phone: '704-330-2722',
        },
        {name: 'Cato', 
         latlng: new google.maps.LatLng(35.264854,-80.731197), 
         zoom: 14,
         street: '8120 Grier Road',
         city: 'Charlotte',
         state: 'NC',
         zip: '28215',
         phone: '704-330-4801',
         
        },
        {name: 'Harper', 
         latlng: new google.maps.LatLng(35.12986,-80.896497), 
         zoom: 14,
         street: '315 West Hebron Street',
         city: 'Charlotte',
         state: 'NC',
         zip: '28273',
         phone: '704-330-4400',
        },
        {name: 'Levine', 
         latlng: new google.maps.LatLng(35.106428,-80.69384), 
         zoom: 14,
         street: '2800 Campus Ridge Road',
         city: 'Charlotte',
         state: 'NC',
         zip: '28105',
         phone: '704-330-4200',
        },
        {name: 'Harris', 
         latlng: new google.maps.LatLng(35.215508,-80.919919), 
         zoom: 14,
         street: '3210 CPCC Harris Campus Drive',
         city: 'Charlotte',
         state: 'NC',
         zip: '28208',
         phone: '704-330-4601',
        },
        {name: 'Merancas', 
         latlng: new google.maps.LatLng(35.392814,-80.84055), 
         zoom: 14,
         street: '11930 Verhoeff Drive',
         city: 'Huntersville',
         state: 'NC',
         zip: '28078',
         phone: '704-330-4101',
        }]);


    $('#links-container').append(campusCollectionView.el);

// Listener for 'enter' event after address is entered
//   triggers click on get_directions
$("#map_start_address").keyup(function(event){
    if(event.keyCode == 13){
        $("button#get_directions").trigger('click');
    }
});

$('button#get_directions').on('click', function(){
    campusCollectionView.changeDirections($('li.active a').attr('id'));
});


$('#directionsPanel-buttons a#directions_close').on('click', function(){
    if($('#directionsPanel').is(':visible')){
        $('#directionsPanel').slideUp(300,function(){$('#directionsPanel-buttons a#directions_close').html('Open Directions');});
    }else{
        $('#directionsPanel').show(100, function(){$('#directionsPanel-buttons a#directions_close').html('Close Directions');});
    }
})
}); // /Document Ready

function newLocationForm(){
    if( $('#new-location-form').is(":visible")){
        $('#new-location-form').slideUp(500);
    }else{
        $('#new-location-form').slideDown(500);
    }
}
