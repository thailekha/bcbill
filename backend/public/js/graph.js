import { getRandomGif } from './fetchData.js';
import { testData } from './testData.js';

alert('hey');

const menuItems = [
  {
    title: "Request access",
    action: async function(d, i) {
      await getRandomGif();
      console.log("Request access clicked for node " + d.id);
    }
  },
  {
    title: "Share",
    action: function(d, i) {
      console.log("Share clicked for node " + d.id);
    }
  },
  {
    title: "Create Link",
    action: function(d, i) {
      const selectedNode = d;
      const svg = d3.select("svg");
      const line = svg.append("line")
        .attr("x1", selectedNode.x)
        .attr("y1", selectedNode.y)
        .attr("x2", selectedNode.x)
        .attr("y2", selectedNode.y)
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1.5);
      const mousemove = function(event) {
        const [x, y] = d3.pointer(event);
        line.attr("x2", x).attr("y2", y);
      };
      const mouseup = function(event) {
        svg.on("mousemove", null);
        svg.on("mouseup", null);
        const [x, y] = d3.pointer(event);
        const targetNode = simulation.find(x, y);
        if (targetNode) {
          testData.links.push({source: selectedNode.id, target: targetNode.id});
          updateGraph();
        }
        line.remove();
      };
      svg.on("mousemove", mousemove);
      svg.on("mouseup", mouseup);
    }
  }
];

const svg = d3.select("svg");

const nodeWidth = 80;
const nodeHeight = 30;

const simulation = d3.forceSimulation(testData.nodes)
  .force("link", d3.forceLink(testData.links)
    .id(d => d.id)
    .distance(200)
    .strength(1)
  )
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(svg.attr("width") / 2, svg.attr("height") / 2))
  .force("collide", d3.forceCollide().radius(nodeWidth / 2));

const link = svg.append("g")
  .attr("stroke", "#999")
  .attr("stroke-opacity", 0.6)
  .selectAll("line")
  .data(testData.links)
  .join("line");

const node = svg
  .append("g")
  .selectAll("g")
  .data(testData.nodes)
  .join("g")
  .attr("transform", (d) => `translate(${d.x},${d.y})`)
  .call(d3.drag()
    .on("start", (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }))
  .on('contextmenu', d3.contextMenu(menuItems));

node
  .append("rect")
  .attr("width", nodeWidth)
  .attr("height", nodeHeight)
  .attr("rx", 5) // rounded corners
  .attr("fill", "transparent")
  .attr("stroke", "#333")
  .attr("stroke-width", 1.5);

node
  .append("text")
  .text((d) => d.id)
  .attr("text-anchor", "middle")
  .attr("alignment-baseline", "central")
  .attr("font-size", "12px")
  .attr("fill", "#333")
  .attr("x", nodeWidth / 2)
  .attr("y", nodeHeight / 2);

simulation.on("tick", () => {
  link
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);

  node.attr("transform", (d) => `translate(${d.x},${d.y})`);
});

function updateGraph() {
  const link = svg.select("g.links")
    .selectAll("line")
    .data(testData.links, d => [d.source, d.target]);

  link.enter()
    .append("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", 1.5)
    .merge(link)
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);

  link.exit().remove();

  const node = svg.select("g.nodes")
    .selectAll("g")
    .data(testData.nodes, d => d.id);

  const nodeEnter = node.enter()
    .append("g")
    .attr("transform", (d) => `translate(${d.x},${d.y})`)
    .call(d3.drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }))
    .on('contextmenu', d3.contextMenu(menuItems));

  nodeEnter
    .append("rect")
    .attr("width", nodeWidth)
    .attr("height", nodeHeight)
    .attr("rx", 5) // rounded corners
    .attr("fill", "transparent")
    .attr("stroke", "#333")
    .attr("stroke-width", 1.5);

  nodeEnter
    .append("text")
    .text((d) => d.id)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "central")
    .attr("font-size", "12px")
    .attr("fill", "#333")
    .attr("x", nodeWidth / 2)
    .attr("y", nodeHeight / 2);

  node.merge(nodeEnter)
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  node.exit().remove();

  simulation.nodes(testData.nodes);
  simulation.force("link").links(testData.links);
  simulation.alpha(1).restart();
}
