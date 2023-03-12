export const testData = {
  nodes: [
    {id: "node1"},
    {id: "node2"},
    {id: "node3"},
    {id: "node4"},
  ],
  links: [
    {source: "node1", target: "node2"},
    {source: "node2", target: "node3"},
    {source: "node3", target: "node1"},
    {source: "node4", target: "node1"},
  ],
};

