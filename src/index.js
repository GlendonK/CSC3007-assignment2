// import * as d3 from "../node_modules/d3"

const getData = async () => {
    var d;
    await fetch('https://data.gov.sg/api/action/datastore_search?resource_id=83c21090-bd19-4b54-ab6b-d999c251edcf').then((res) => res.json()).then((data) => {
        // console.log(data.result);
        d = data.result.records
    })
    return d
}



var data = [];
const start = async () => {
    await getData().then(e => {
        data = e;
        data = data.sort((a, b) => { return a.year - b.year })
        var chart = GroupedBarChart(data, {

            x: d => d.year,
            y: d => d.value / 10,
            z: d => d.level_2,
            xDomain: d3.groupSort(data, D => d3.sum(D, d => -d.value), d => d.year).slice(0, 10), // top 6
            yLabel: "Number of crimes (1/10)",
            zDomain: z(),
            colors: d3.schemeSpectral[z().length],
            width: 1000,
            height: 800
        })
        // console.log(data)
        // Initialize the plot with the first dataset
        update(getByCrime(data, "Cheating Related Offences"))
        var existed = []
        data.forEach((each) => {
            // check if same crime added.
            if (!existed.includes(each.level_2)) {
                makeDropContent(each.level_2)
                existed.push(each.level_2)
            }

        })
    });

}

start();

const makeDropContent = (crime) => {
    var node = document.createElement("a")
    node.classList = "dropdown-item"
    node.textContent = crime
    // node.addEventListener("click", update(getByCrime(data, crime)))
    node.onclick = () => {
        update(getByCrime(data, crime))
        document.getElementById("dropText").textContent = crime

    }
    document.getElementById("dropdown-content").appendChild(node)

}
// make z axis array
const z = () => {
    var arr = []
    data.forEach((each) => {
        arr.push(each.level_2)
    })
    return arr
}





// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/grouped-bar-chart
function GroupedBarChart(data, {
    x = (d, i) => i, // given d in data, returns the (ordinal) x-value
    y = d => d, // given d in data, returns the (quantitative) y-value
    z = () => 1, // given d in data, returns the (categorical) z-value
    title, // given d in data, returns the title text
    marginTop = 30, // top margin, in pixels
    marginRight = 0, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 40, // left margin, in pixels
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    xDomain, // array of x-values
    xRange = [marginLeft, width - marginRight], // [xmin, xmax]
    xPadding = 0.1, // amount of x-range to reserve to separate groups
    yType = d3.scaleLinear, // type of y-scale
    yDomain, // [ymin, ymax]
    yRange = [height - marginBottom, marginTop], // [ymin, ymax]
    zDomain, // array of z-values
    zPadding = 0.05, // amount of x-range to reserve to separate bars
    yFormat, // a format specifier string for the y-axis
    yLabel, // a label for the y-axis
    colors = d3.schemeTableau10, // array of colors
} = {}) {
    // Compute values.
    const X = d3.map(data, x);
    const Y = d3.map(data, y);
    const Z = d3.map(data, z);

    // console.log(data)

    // Compute default domains, and unique the x- and z-domains.
    if (xDomain === undefined) xDomain = X;
    if (yDomain === undefined) yDomain = [0, d3.max(Y)];
    if (zDomain === undefined) zDomain = Z;
    xDomain = new d3.InternSet(xDomain);
    zDomain = new d3.InternSet(zDomain);

    // Omit any data not present in both the x- and z-domain.
    const I = d3.range(X.length).filter(i => xDomain.has(X[i]) && zDomain.has(Z[i]));

    // Construct scales, axes, and formats.
    const xScale = d3.scaleBand(xDomain, xRange).paddingInner(xPadding);
    const xzScale = d3.scaleBand(zDomain, [0, xScale.bandwidth()]).padding(zPadding);
    const yScale = yType(yDomain, yRange);
    const zScale = d3.scaleOrdinal(zDomain, colors);
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(height / 60, yFormat);

    // Compute titles.
    if (title === undefined) {
        const formatValue = yScale.tickFormat(100, yFormat);
        title = i => `${X[i]}\n${Z[i]}\n${formatValue(Y[i])}`;
    } else {
        const O = d3.map(data, d => d);
        const T = title;
        title = i => T(O[i], i, data);
    }
    const svg = d3.select("#chart1").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(yLabel));

    const bar = svg.append("g")
        .selectAll("rect")
        .data(I)
        .join("rect")
        .attr("x", i => xScale(X[i]) + xzScale(Z[i]))
        .attr("y", i => yScale(Y[i]))
        .attr("width", xzScale.bandwidth())
        .attr("height", i => yScale(0) - yScale(Y[i]))
        .attr("fill", i => zScale(Z[i]));

    if (title) bar.append("title")
        .text(title);

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis);

    return Object.assign(svg.node(), { scales: { color: zScale } });
}


// filter data by crime
const getByCrime = (data, crime) => {
    let y = []
    data.forEach((each) => {
        if (each.level_2 == crime) {
            y.push(
                {
                    "year": each.year,
                    "value": each.value,
                }
            )
        }

    })
    console.log(y)
    return y
}


/// BAR CHART

const margin = { top: 30, right: 30, bottom: 70, left: 60 },
    width = 1000 - margin.left - margin.right,
    height = 850 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg2 = d3.select("#chart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Initialize the X axis
const x = d3.scaleBand()
    .range([0, width])
    .padding(0.2);
const xAxis = svg2.append("g")
    .attr("transform", `translate(0,${height})`)

// Initialize the Y axis
const y = d3.scaleLinear()
    .range([height, 0]);
const yAxis = svg2.append("g")
    .attr("class", "myYaxis")


// A function that create / update the plot for a given variable:
function update(data) {

    // Update the X axis
    x.domain(data.map(d => d.year))
    xAxis.call(d3.axisBottom(x)).selectAll('text').style("text-anchor", "end")
        .attr("transform", "rotate(-65)");

    // Update the Y axis
    y.domain([0, d3.max(data, d => d.value - 1)]);
    yAxis.transition().duration(1000).call(d3.axisLeft(y));

    // Create the u variable
    var u = svg2.selectAll("rect")
        .data(data)

    u
        .join("rect") // Add a new rect for each new elements
        .transition()
        .duration(1000)
        .attr("x", d => x(d.year))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", "#69b3a2")

}



