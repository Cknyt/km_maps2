let map;
let draw;
let source;
let vector;
let sketch;
let distanciaTotal = 0;

function initMap() {
    map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM() // Puedes mantener esta capa base si lo deseas
            })
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([-3.749220, 40.463667]), // España (longitud, latitud)
            zoom: 5
        })
    });

    source = new ol.source.Vector();
    vector = new ol.layer.Vector({
        source: source,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'black',
                width: 2
            })
        })
    });
    map.addLayer(vector);

    draw = new ol.interaction.Draw({
        source: source,
        type: 'LineString'
    });
    map.addInteraction(draw);

    draw.on('drawstart', function (event) {
        sketch = event.feature;
        distanciaTotal = 0;
    });

    draw.on('drawend', function (event) {
        const geometry = sketch.getGeometry();
        const coordinates = geometry.getCoordinates();

        if (coordinates.length > 1) {
            calculateRoute(coordinates);
        }
    });
}

function calculateRoute(coordinates) {
    const routeCoords = coordinates.map(coord => ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326')); 

    fetch(`https://router.project-osrm.org/route/v1/driving/${routeCoords.map(c => c.join(',')).join(';')}?overview=full&geometries=geojson`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 'Ok') {
                const routeGeometry = new ol.format.GeoJSON().readGeometry(data.routes[0].geometry);
                const routeFeature = new ol.Feature({
                    geometry: routeGeometry,
                    name: 'Route'
                });
                routeFeature.setStyle(
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            width: 6, color: [40, 40, 40, 0.8]
                        })
                    })
                );

                source.clear(); 
                source.addFeature(routeFeature);

                distanciaTotal = data.routes[0].distance / 1000; 
                document.getElementById('distancia').textContent = distanciaTotal.toFixed(2);
            } else {
                console.error('Error al calcular la ruta:', data);
            }
        })
        .catch(error => {
            console.error('Error en la solicitud de ruta:', error);
        });
}