const routesArray = [];
const stat = [];
const mapStat = [];
const veh = [];
const mapVeh = [];

function Route (id, line, long_name, type, color, stops, vehicles) {
  this.id = id;
  this.line = line;
  this.name = long_name;
  this.type = type;
  this.color = color;
  this.stops = stops;
  this.vehicles = vehicles;
}

function Vehicle (id, current_status, latitude, longitude) {
  this.id = id;
  this.current_status = current_status;
  this.latitude = latitude;
  this.longitude = longitude;
}

// Request route data from MBTA
async function getRoutes(routesArray){
  const url = 'https://api-v3.mbta.com/routes?include=line,stop';
  const response = await fetch(url);
  const json     = await response.json();
  for(let i=0; i < json.data.length; i++) {
    if (json.data[i].relationships.line.data.id == "line-Red" || json.data[i].relationships.line.data.id == "line-Green") {
      let inst = json.data[i];
      let stops = await getStops(inst.id);
      let vehicles = await getVehicles(inst.id);
      const nRoute = new Route(inst.id, inst.relationships.line.data.id, inst.attributes.long_name, inst.attributes.type, inst.attributes.color, stops, vehicles);
      routesArray.push(nRoute);
    }
  }
  return;
}
// Request stop data from MBTA based on Route in the Red and Green line from getRoutes
async function getStops(route) {
  const url = 'https://api-v3.mbta.com/stops?include=route,facilities&filter[route]=' + route;
  const response =await fetch(url);
  const json     = await response.json();
  const stops = [];
  for(let i=0; i < json.data.length; i++) {
      let inst = json.data[i].attributes;
      stops.push(inst);
  }
  return stops;
}

// Request vehicle data from MBTA for Routes in the Red and Green Line from getRoutes
async function getVehicles(route) {
  const url = 'https://api-v3.mbta.com/vehicles?include=stop&filter[route]=' + route;
  const response =await fetch(url);
  const json     = await response.json();
  const vehicles = [];
  for(let i=0; i < json.data.length; i++) {
    const inst = new Vehicle(json.data[i].id, json.data[i].attributes.current_status, json.data[i].attributes.latitude, json.data[i].attributes.longitude);
    vehicles.push(inst);
  }
  return vehicles;
}

(async function showMap() {

    // Access token for mapbox
    mapboxgl.accessToken = 'pk.eyJ1IjoicGFtZWFyY2giLCJhIjoiY2w2angzOHUzMW9qOTNpb2F4MnQwcmJlaCJ9.aoozJrq6s8vg8wKTTluP9w';
    
    // This is the map instance
    let map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-71.086176, 42.362491],
      zoom: 13,
    });
    
    const arrayReady = await getRoutes(routesArray);

    // Creation of station markers for Red and Green line stations
    for(let i=0; i < routesArray.length; i++) {
     for(let s=0; s < routesArray[i].stops.length; s++) {
        stat[i,s] = document.createElement('div');
        if (routesArray[i].line == "line-Red") {
          stat[i,s].className = 'stred' }
        else {
          stat[i,s].className = 'stgreen' }
        mapStat[i,s] = new mapboxgl.Marker(stat[i,s])
          .setLngLat([routesArray[i].stops[s].longitude, routesArray[i].stops[s].latitude])
          .addTo(map);
      }
    }
    // Creation of vehicle markers for Red and Green routes
    for(let i=0; i < routesArray.length; i++) {
      for(let s=0; s < routesArray[i].vehicles.length; s++) {
         veh[i,s] = document.createElement('div');
         veh[i,s].className = 'bus';
         mapVeh[i,s] = new mapboxgl.Marker(veh[i,s])
           .setLngLat([routesArray[i].vehicles[s].longitude, routesArray[i].vehicles[s].latitude])
           .addTo(map);
       }
     }
  }
)();


// Goes through the Red Line vehicle list,  goes out to get the latest location and moves the vehicle

function move() {
    setTimeout(async () => {
      let url = null;
      let response = null;
      let json = null;
      let i = 0;
      for (let s=0; s < routesArray[i].vehicles.length; s++) {
        url = 'https://api-v3.mbta.com/vehicles?filter[id]=' + routesArray[i].vehicles[s].id;
        response = await fetch(url);
        json     = await response.json();
        routesArray[i].vehicles[s].latitude = json.data[0].attributes.latitude;
        routesArray[i].vehicles[s].longitude = json.data[0].attributes.longitude;
        mapVeh[i,s].setLngLat([routesArray[i].vehicles[s].longitude, routesArray[i].vehicles[s].latitude])
      }
//      move();
    },1000);
}

// Do not edit code past this point
if (typeof module !== 'undefined') {
  module.exports = { showMap};
}
