function renderSpiderPlaceholder() {
    const svg = d3.select("#svg_spider");

    const svgNode = svg.node();
    const width = svgNode.clientWidth;
    const height = svgNode.clientHeight;

    // Create new and clear old data from svg
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    // Add the initial text
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#666")
        .attr("font-size", "16px")
        .text("Select a listing");
}


function getRadarData(listing) {
    // With this we can add features to the spider chart
    // We can scale/normalize them if necessary
    const features = [
        { key: "cleanliness", label: "Cleanliness", alreadyNormalized: false, useScaling: true },
        { key: "guest_satisfaction", label: "Satisfaction", alreadyNormalized: false, useScaling: true },
        { key: "attraction_index", label: "Attractions", alreadyNormalized: false, useScaling: true },
        { key: "restaurant_index", label: "Restaurants", alreadyNormalized: false, useScaling: true },
        { key: "price_per_person", label: "Price / Person", alreadyNormalized: false, useScaling: true },
        { key: "value_score", label: "Value Score", alreadyNormalized: false, useScaling: true }
    ];

    return features.map(feature => {
        const rawValue = +listing[feature.key];

        // value_score is already in (0, 1)
        if (feature.alreadyNormalized) {
            return {
                key: feature.key,
                label: feature.label,
                value: rawValue
            };
        }

        const allValues = appState.listingData
            .map(d => +d[feature.key])
            .filter(v => !isNaN(v))
            .sort((a, b) => a - b);

        let normalizedValue = 0;

        if (feature.useScaling) {
            // Robust scaling for skewed variables:
            // use 5th and 95th percentile instead of min and max
            // Maybe try 10 and 90, because still very skewed
            const q05 = d3.quantile(allValues, 0.05);
            const q95 = d3.quantile(allValues, 0.95);

            const clippedValue = Math.max(q05, Math.min(rawValue, q95));

            if (q95 !== q05) {
                normalizedValue = (clippedValue - q05) / (q95 - q05);
            }
        } else {
            // Standard min-max scaling for regular variables
            const min = d3.min(allValues);
            const max = d3.max(allValues);

            // use min max scaling
            if (max !== min) {
                normalizedValue = (rawValue - min) / (max - min);
            }
        }

        return {
            key: feature.key,
            label: feature.label,
            value: normalizedValue
        };
    });
}


function renderSpiderChart(listing) {
    const svg = d3.select("#svg_spider");
    const svgNode = svg.node();
    const width = svgNode.clientWidth;
    const height = svgNode.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const chartRadius = 90;
    const levels = 4;

    // Create new and clear old data from svg
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    const radarData = getRadarData(listing);
    // We use this for the angles of the chart
    const angleSlice = (Math.PI * 2) / radarData.length;

    // Draw background grid
    for (let level = 1; level <= levels; level++) {
        const levelRadius = (chartRadius / levels) * level;

        const levelPoints = radarData.map((_, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            return [
                centerX + levelRadius * Math.cos(angle),
                centerY + levelRadius * Math.sin(angle)
            ];
        });

        levelPoints.push(levelPoints[0]);

        svg.append("path")
            .attr("d", d3.line()(levelPoints))
            .attr("fill", "none")
            .attr("stroke", "#d1d5db")
            .attr("stroke-width", 1);
    }

    // Draw axes
    radarData.forEach((d, i) => {
        const angle = i * angleSlice - Math.PI / 2;
        const axisX = centerX + chartRadius * Math.cos(angle);
        const axisY = centerY + chartRadius * Math.sin(angle);

        svg.append("line")
            .attr("x1", centerX)
            .attr("y1", centerY)
            .attr("x2", axisX)
            .attr("y2", axisY)
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 1);

        const labelX = centerX + (chartRadius + 22) * Math.cos(angle);
        const labelY = centerY + (chartRadius + 22) * Math.sin(angle);

        svg.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#374151")
            .text(d.label);
    });

    // Convert normalized values into polygon points
    const polygonPoints = radarData.map((d, i) => {
        const angle = i * angleSlice - Math.PI / 2;
        const pointRadius = d.value * chartRadius;

        return [
            centerX + pointRadius * Math.cos(angle),
            centerY + pointRadius * Math.sin(angle)
        ];
    });

    polygonPoints.push(polygonPoints[0]);

    // Draw filled polygon
    svg.append("path")
        .attr("d", d3.line()(polygonPoints))
        .attr("fill", "rgba(37, 99, 235, 0.25)")
        .attr("stroke", "#2563eb")
        .attr("stroke-width", 2);

    // Draw points
    svg.selectAll(".radar-point")
        .data(polygonPoints.slice(0, -1))
        .enter()
        .append("circle")
        .attr("class", "radar-point")
        .attr("cx", d => d[0])
        .attr("cy", d => d[1])
        .attr("r", 3)
        .attr("fill", "#2563eb");
}