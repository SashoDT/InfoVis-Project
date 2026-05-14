let leafletMap = null;
let leafletLayerGroup = null;

function renderEuropeMap() {
    showEuropeSvgView();

    const oldButton = document.getElementById("leaflet-back-button");
    if (oldButton) oldButton.remove();

    const svg = d3.select("#svg_map");
    const width = 900;
    const height = 700;

    // Make the SVG scale nicely with the container
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    // Clear when called
    svg.selectAll("*").remove();

    // Set projection so Europe fits into the SVG
    const projection = d3.geoMercator()
        .center([10, 50])
        .scale(700)
        .translate([width / 2, height / 2]);

    // Convert geojson shapes into SVG paths
    const path = d3.geoPath().projection(projection);

    // Read the .geojson file for Europe
    d3.json("/static/data/europe.geojson").then(geoData => {
        svg.selectAll("path.country")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("fill", "#eaeaea")
            .attr("stroke", "#999");

        // Hardcode the city coordinates as we do not have them in the dataset
        const cityCoordinates = {
            Amsterdam: {lat: 52.3676, lng: 4.9041},
            Athens: {lat: 37.9838, lng: 23.7275},
            Barcelona: {lat: 41.3874, lng: 2.1686},
            Berlin: {lat: 52.5200, lng: 13.4050},
            Budapest: {lat: 47.4979, lng: 19.0402},
            Lisbon: {lat: 38.7223, lng: -9.1393},
            London: {lat: 51.5072, lng: -0.1276},
            Paris: {lat: 48.8566, lng: 2.3522},
            Rome: {lat: 41.9028, lng: 12.4964},
            Vienna: {lat: 48.2082, lng: 16.3738}
        };

        // Attach coordinates to each city
        const cities = appState.cityData
            .map(d => ({
                ...d,
                lat: cityCoordinates[d.city]?.lat,
                lng: cityCoordinates[d.city]?.lng
            }))
            .filter(d => d.lat !== undefined && d.lng !== undefined);

        // Draw a clickable point per city
        svg.selectAll("circle.city-point")
            .data(cities)
            .enter()
            .append("circle")
            .attr("class", "city-point")
            .attr("cx", d => projection([d.lng, d.lat])[0])
            .attr("cy", d => projection([d.lng, d.lat])[1])
            .attr("r", 7)
            .attr("fill", d => d.city === appState.selectedCity ? "orange" : "steelblue")
            .attr("stroke", "black")
            .style("cursor", "pointer")
            // On click change the view to city and rerender the map
            .on("click", function (event, d) {
                appState.selectedCity = d.city;
                appState.currentCityListings = appState.listingData.filter(
                    listing => listing.city === d.city
                );
                appState.currentView = "city";

                renderMapView();
                // Later, also update the city comparison view
                // renderCityComparison();
            });

        // Add labels to the city points
        svg.selectAll("text.city-label")
            .data(cities)
            .enter()
            .append("text")
            .attr("class", "city-label")
            .attr("x", d => projection([d.lng, d.lat])[0] - 20)
            .attr("y", d => projection([d.lng, d.lat])[1] - 10)
            .text(d => d.city)
            .attr("font-size", "14px")
            .attr("fill", "#222");
    });
}

function renderCityMap() {
    showLeafletCityView();

    const listings = appState.currentCityListings;

    if (!listings || listings.length == 0) {
        console.log("No listings????")
        return;
    }

    // Create the Leaflet map
    if (!leafletMap) {
        // Initialize it
        leafletMap = L.map("leaflet_map");

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(leafletMap);

        leafletLayerGroup = L.layerGroup().addTo(leafletMap);
    }

    // Remove old listing markers if any
    leafletLayerGroup.clearLayers();

    // Add the listings
    listings.forEach(d => {
        const lat = +d.lat;
        const lng = +d.lng;

        const marker = L.circleMarker([lat, lng], {
            radius: 5,
            fillColor: "#2563eb",
            color: "#ffffff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.75
        });

        marker.bindPopup(`
            <strong>${appState.selectedCity}</strong><br>
            Price: ${d.listing_price}<br>
            Satisfaction: ${d.guest_satisfaction}<br>
            Capacity: ${d.guest_capacity}
        `);

        marker.on("click", () => {
            appState.selectedListing = d;
            console.log("Selected listing:", d);
        });

        marker.addTo(leafletLayerGroup);
    });

    // Fit the map to the markers
    const bounds = L.latLngBounds(
        listings.map(d => [+d.lat, +d.lng])
    );
    leafletMap.fitBounds(bounds, {padding: [30, 30]});

    // This rechecks the container size if it is now visible
    setTimeout(() => {
        leafletMap.invalidateSize();
    }, 0);

    addLeafletBackButton();
}

// === Helper functions === //
function showEuropeSvgView() {
    d3.select("#svg_map").style("display", "block");
    d3.select("#leaflet_map").style("display", "none");
}

function showLeafletCityView() {
    d3.select("#svg_map").style("display", "none");
    d3.select("#leaflet_map").style("display", "block");
}

function addLeafletBackButton() {
    const oldButton = document.getElementById("leaflet-back-button");
    if (oldButton) oldButton.remove();

    const button = document.createElement("button");
    button.id = "leaflet-back-button";
    button.textContent = "Back";

    button.style.position = "absolute";
    button.style.top = "10px";
    button.style.left = "50px";
    button.style.zIndex = "1000";
    button.style.padding = "8px 12px";
    button.style.background = "white";
    button.style.border = "1px solid #888";
    button.style.cursor = "pointer";

    button.onclick = () => {
        appState.currentView = "europe";
        appState.selectedCity = null;
        appState.currentCityListings = [];
        appState.selectedListing = null;

        renderMapView();
    };

    document.getElementById("left_panel").appendChild(button);
}