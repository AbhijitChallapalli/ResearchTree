let currentUser = null;
let treeData = {};
let selectedNode = null;

window.onload = function () {
  // ✅ Wait until auth is available
  auth.onAuthStateChanged(user => {
    currentUser = user;
    document.getElementById('logoutBtn').style.display = user ? 'inline' : 'none';
    document.getElementById('auth-msg').innerText = user ? `Logged in as ${user.email}` : 'Not logged in';
    if (user) loadTree();
  });
};


// Login function
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login successful!");
    })
    .catch(error => {
      alert("Login failed: " + error.message);
    });
}

//sign up
function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      alert("Signup successful. You are now logged in.");
    })
    .catch(error => {
      alert("Signup failed: " + error.message);
    });
}


// Logout
function logout() {
  auth.signOut();
  d3.select("svg").remove();
}

// Load tree data from Firestore
function loadTree() {
  db.collection("researchTree").doc("root").onSnapshot(doc => {
    treeData = doc.data();
    console.log("Tree data from Firestore:", treeData);  // Add this
    drawTree();
  });
}


const margin = { top: 10, right: 10, bottom: 10, left: 40 };

// Draw the D3 tree
function drawTree() {
  console.log(" Drawing tree with:", treeData);
  console.log("Tree data right before rendering:", JSON.stringify(treeData, null, 2));

  d3.select("svg").remove();
  const width = 960;
  const dx = 20, dy = width / 4;
  const tree = d3.tree().nodeSize([dx, dy]);
  const root = d3.hierarchy(treeData);

  root.x0 = dy / 2;
  root.y0 = 0;

  const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);
  const svg = d3.select("#tree-container")
    .append("svg")
    .attr("viewBox", [-margin.left, -margin.top, width, dx])
    .style("font", "10px sans-serif")
    .style("user-select", "none");

  const gLink = svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5);

  const gNode = svg.append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");

  tree(root);

  const link = gLink.selectAll("path")
    .data(root.links())
    .join("path")
    .attr("d", diagonal);

  const node = gNode.selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", d => `translate(${d.y},${d.x})`);

  node.append("circle")
    .attr("r", 4)
    .attr("fill", d => d.children ? "#555" : "#999")
    .on("click", d => showModal(d));

  node.append("text")
    .attr("dy", "0.31em")
    .attr("x", d => d.children ? -6 : 6)
    .attr("text-anchor", d => d.children ? "end" : "start")
    .text(d => d.data.name);
}

// Modal logic
function showModal(d) {
  selectedNode = d;
  document.getElementById("nodeName").value = d.data.name;
  document.getElementById("node-modal").style.display = "block";
}

function closeModal() {
  document.getElementById("node-modal").style.display = "none";
}

function saveNode() {
  const newName = document.getElementById("nodeName").value;
  if (selectedNode) {
    selectedNode.data.name = newName;
    db.collection("researchTree").doc("root").set(treeData);
    closeModal();
  }
}
