import * as d3 from "d3";
import * as topojson from "topojson-client";
import { legendColor, legendHelpers } from "d3-svg-legend";

import countiesJson from "../data/counties.json";
import educationJson from "../data/education.json";
import "./app.scss";

const countiesUrl =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
const educationUrl =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

const margin = { top: 64, right: 64, bottom: 64, left: 64 };
const w = 1024 - margin.right - margin.left;
const h = 768 - margin.top - margin.bottom;

let tooltip;
let topoData;
let educationData;
const educationById = {};

const fetchData = async (url) => {
  let res = null;

  try {
    res = await d3.json(url);
    return res;
  } catch (e) {
    console.error(e.message);
  }

  return res;
};

const createTooltip = () => {
  tooltip = d3
    .select(".js-wrapper")
    .append("div")
    .attr("class", "tooltip js-tooltip")
    .attr("id", "tooltip")
    .style("opacity", 0);
};

const createVisualization = () => {
  const svg = d3
    .select(".js-d3")
    .append("svg")
    .classed("svg", true)
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  createTooltip();

  const educationValues = educationData.map((d) => d.bachelorsOrHigher);
  const minEdu = d3.min(educationValues);
  const maxEdu = d3.max(educationValues);

  const color = d3
    .scaleThreshold()
    .domain(d3.range(minEdu, maxEdu, (maxEdu - minEdu) / 8))
    .range(d3.schemeBlues[9]);

  svg.append("g").attr("id", "legend").attr("transform", "translate(192,-48)");

  const legend = legendColor()
    .shapeWidth(60)
    .orient("horizontal")
    .labelWrap(40)
    .labelFormat(d3.format(".2f"))
    .labels(legendHelpers.thresholdLabels)
    .scale(color);

  svg.select("#legend").call(legend);

  const path = d3.geoPath();

  educationData.forEach((d) => {
    educationById[d.fips] = d;
  });

  svg
    .append("g")
    .selectAll("path")
    .data(topojson.feature(topoData, topoData.objects.counties).features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("data-fips", (d) => {
      return d.id;
    })
    .attr("data-education", (d) => {
      const county = educationById[d.id];

      if (county && county.bachelorsOrHigher) {
        return county.bachelorsOrHigher;
      }

      console.log("missing data: ", d.id);
      return 0;
    })
    .attr("d", path)
    .style("fill", (d) => {
      const county = educationById[d.id];

      if (!county || !county.bachelorsOrHigher) return "white";

      return color(county.bachelorsOrHigher);
    })
    .on("mouseover", (d) => {
      tooltip.style("opacity", 0.9);
      tooltip
        .html(() => {
          const county = educationById[d.id];
          return county
            ? `${county.area_name}, ${county.state}: ${county.bachelorsOrHigher}%`
            : "";
        })
        .attr("data-education", () => {
          const county = educationById[d.id];

          return county ? county.bachelorsOrHigher : 0;
        })
        .style("left", `${d3.event.pageX - 16}px`)
        .style("top", `${d3.event.pageY - 32}px`);
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  svg
    .append("path")
    .datum(
      topojson.mesh(topoData, topoData.objects.states, (a, b) => a.id !== b.id)
    )
    .attr("class", "states")
    .attr("d", path);
};

const runApp = async () => {
  d3.select(".js-d3").html("");

  topoData = await fetchData(countiesUrl);
  educationData = await fetchData(educationUrl);

  if (!topoData) topoData = countiesJson;
  if (!educationData) educationData = educationJson;

  createVisualization();
};

export default runApp;
