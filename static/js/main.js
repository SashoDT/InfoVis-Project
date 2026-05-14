const appState = {
    cityData: [],
    listingData: [],
    currentCityListings: [],
    selectedCity: null,
    selectedListing: null,
    // This is how we make the zoom distinction "europe" or "city"
    currentView: "europe"
};

function initApp(cityData, listingData) {
    appState.cityData = cityData;
    appState.listingData = listingData

    setupControls();
    renderMapView();
    // TODO Implement
    //renderCityComparison();
    //renderSpiderPlaceholder();
}

// Render either Europe map or city map based on mode
function renderMapView() {
    if (appState.currentView === "europe") {
        renderEuropeMap();
    } else if (appState.currentView === "city") {
        renderCityMap();
    }
}

function setupControls() {
    // later for dropdowns etc.
}