let leafletMap = null;
let leafletLayerGroup = null;

function renderEuropeMap() {
    // Create the Leaflet map
    ensureLeafletMap();

    // Clear old markers and layers
    leafletLayerGroup.clearLayers();
    // Remove the back button when in Europe view
    removeBackButton();
    // Center the map of Europe
    leafletMap.setView([50, 10], 4);

    // Hardcoded city center coordinates
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

    // Attach coords to city-level dataset
    const cities = appState.cityData
        .map(d => ({
            ...d,
            lat: cityCoordinates[d.city]?.lat,
            lng: cityCoordinates[d.city]?.lng
        }))
        .filter(d => d.lat !== undefined && d.lng !== undefined);

    // Add one marker per city
    cities.forEach(city => {
        const marker = L.circleMarker([city.lat, city.lng], {
            radius: 8,
            fillColor: city.city === appState.selectedCity ? "#f59e0b" : "#2563eb",
            color: "#ffffff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        });
        // Show the city name on hover
        marker.bindTooltip(city.city, {
            permanent: false,
            direction: "top",
            offset: [0, -8],
            opacity: 0.95
        });

        // Highlight hovered city
        marker.on("mouseover", function () {
            this.setStyle({
                fillColor: "#f59e0b"
            });
            this.openTooltip();
        });
        // Reset marker when hover ends
        marker.on("mouseout", function () {
            this.setStyle({
                fillColor: city.city === appState.selectedCity ? "#f59e0b" : "#2563eb"
            });
            this.closeTooltip();
        });

        // Select city and switch to city view
        marker.on("click", () => {
            appState.selectedCity = city.city;
            appState.currentCityListings = appState.listingData.filter(
                listing => listing.city === city.city
            );
            appState.currentView = "city";

            renderMapView();
            //TODO
            //renderCityComparison();
        });

        marker.addTo(leafletLayerGroup);
    });
}

function renderCityMap() {
    ensureLeafletMap();

    // Clear the old markers and add the back button for the city view
    leafletLayerGroup.clearLayers();
    addBackButton();

    const listings = appState.currentCityListings;

    if (!listings || listings.length === 0) {
        console.log("No listings found for selected city.");
        return;
    }

    // Add a marker for each listing
    listings.forEach(d => {
        const marker = L.circleMarker([+d.lat, +d.lng], {
            radius: 5,
            fillColor: "#2563eb",
            color: "#ffffff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.75
        });

        // Show basic listing info
        // TODO decide what exactly we will display
        marker.bindPopup(`
            <strong>Listing ${d.listing_id}</strong><br>
            Price: ${d.listing_price}<br>
            Satisfaction: ${d.guest_satisfaction}<br>
            Capacity: ${d.guest_capacity}
        `);

        // Add the mouseover  and mouseoutbehavior
        marker.on("mouseover", function () {
            this.setStyle({
                radius: 7,
                fillOpacity: 1
            });
        });

        marker.on("mouseout", function () {
            this.setStyle({
                radius: 5,
                fillOpacity: 0.75
            });
        });

        // Select listing and update the spider chart
        marker.on("click", () => {
            appState.selectedListing = d;
            renderSpiderChart(d);
            // TODO implement
            //renderCityComparison();
        });

        marker.addTo(leafletLayerGroup);
    });

    // Zoom the map so all listings of the city ae visible at once
    const bounds = L.latLngBounds(listings.map(d => [+d.lat, +d.lng]));
    leafletMap.fitBounds(bounds, {padding: [30, 30]});
}


// Helper functions
function addBackButton() {
    // To prevent duplicate buttons
    removeBackButton();

    const button = document.createElement("button");
    button.id = "leaflet-back-button";
    button.textContent = "Choose different city";

    // Button styling
    button.style.position = "absolute";
    button.style.top = "10px";
    button.style.left = "50px";
    button.style.zIndex = "1000";
    button.style.padding = "8px 12px";
    button.style.background = "white";
    button.style.border = "1px solid #888";
    button.style.cursor = "pointer";

    // Reset state and return to Europe view on click
    button.onclick = () => {
        appState.currentView = "europe";
        appState.selectedCity = null;
        appState.currentCityListings = [];
        appState.selectedListing = null;

        renderMapView();
        renderSpiderPlaceholder();
        // TODO
        //renderCityComparison();
    };

    document.getElementById("left_panel").appendChild(button);
}

function removeBackButton() {
    const oldButton = document.getElementById("leaflet-back-button");
    if (oldButton) oldButton.remove();
}

function ensureLeafletMap() {
    // Make sure to create map only once
    if (!leafletMap) {
        leafletMap = L.map("leaflet_map", {
            center: [50, 10],
            zoom: 4,
            zoomControl: true
        });

        // Add OpenStreetMap tiles for the base
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(leafletMap);

        // Layer group so that we can easily clear and redraw markers
        leafletLayerGroup = L.layerGroup().addTo(leafletMap);
    }
}