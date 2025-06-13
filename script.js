let currentUser = null;
let treeData = {};
let selectedNode = null;

window.onload = function () {
  auth.onAuthStateChanged(user => {
    currentUser = user;
    document.getElementById('logoutBtn').style.display = user ? 'inline' : 'none';
    document.getElementById('auth-msg').innerText = user ? `Logged in as ${user.email}` : 'Not logged in';
    if (user) loadTree();
  });
};

// Login
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("Login successful!"))
    .catch(error => alert("Login failed: " + error.message));
}

// Signup
function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Signup successful. You are now logged in."))
    .catch(error => alert("Signup failed: " + error.message));
}

// Logout
function logout() {
  auth.signOut();
  d3.select("svg").remove();
}

// Firestore Listener
function loadTree() {
  db.collection("researchTree").doc("root").onSnapshot(doc => {
    treeData = doc.data();
    console.log("🌳 Firestore Tree:", treeData);
    drawTree();
  });
}

// Draw D3 Tree
function drawTree() {
  console.log("📦 Rendering Tree:", JSON.stringify(treeData, null, 2));
  d3.select("svg").remove();

  const margin = { top: 20, right: 40, bottom: 20, left: 150 };
  const width = 960;
  const height = 600;
  const dx = 20, dy = 180;

  const tree = d3.tree().nodeSize([dx, dy]);
  const root = d3.hierarchy(treeData);
  tree(root); // layout nodes

  const diagonal = d3.linkHorizontal()
    .x(d => d.y)
    .y(d => d.x);

  const svg = d3.select("#tree-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-margin.left, -margin.top, width, height])
    .style("font", "12px sans-serif")
    .style("user-select", "none");

  const gLink = svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5);

  gLink.selectAll("path")
    .data(root.links())
    .join("path")
    .attr("d", diagonal);

  const gNode = svg.append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");

  const node = gNode.selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", d => `translate(${d.y},${d.x})`);

  node.append("circle")
    .attr("r", 5)
    .attr("fill", d => d.children ? "#555" : "#999")
    .on("click", function (event, d) {
      showModal(d);
    });

  node.append("text")
    .attr("dy", "0.31em")
    .attr("x", d => d.children ? -8 : 8)
    .attr("text-anchor", d => d.children ? "end" : "start")
    .text(d => d.data.name);
}

// Show modal
function showModal(d) {
  if (!d || !d.data || typeof d.data.name !== 'string') {
    console.warn("⚠️ Cannot open modal — invalid node data:", d);
    return;
  }
  selectedNode = d;
  document.getElementById("nodeName").value = d.data.name;
  document.getElementById("node-modal").style.display = "block";
}

// Add a child node
function addChild() {
  const newName = prompt("Enter name for new child node:");
  if (!newName || !selectedNode || !selectedNode.data) return;

  if (!selectedNode.data.children) {
    selectedNode.data.children = [];
  }

  selectedNode.data.children.push({ name: newName });
  db.collection("researchTree").doc("root").set(treeData).then(() => {
    drawTree();
    closeModal();
  });
}

// Move node up/down
function moveNode(direction) {
  if (!selectedNode || !selectedNode.parent) return;

  const siblings = selectedNode.parent.data.children;
  const index = siblings.indexOf(selectedNode.data);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (index === -1 || targetIndex < 0 || targetIndex >= siblings.length) return;

  [siblings[index], siblings[targetIndex]] = [siblings[targetIndex], siblings[index]];

  db.collection("researchTree").doc("root").set(treeData).then(() => {
    drawTree();
    closeModal();
  });
}

// Save node name
function saveNode() {
  const newName = document.getElementById("nodeName").value;
  if (selectedNode && typeof newName === 'string') {
    selectedNode.data.name = newName;
    db.collection("researchTree").doc("root").set(treeData).then(drawTree);
    closeModal();
  }
}

// Close modal
function closeModal() {
  document.getElementById("node-modal").style.display = "none";
}
