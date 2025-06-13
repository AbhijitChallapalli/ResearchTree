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




function drawTree() {
  console.log("🌳 Drawing tree with:", treeData);
  console.log("📦 Tree data right before rendering:", JSON.stringify(treeData, null, 2));

  d3.select("svg").remove();

  const margin = { top: 20, right: 40, bottom: 20, left: 150 };
  const width = 960;
  const height = 600;
  const dx = 20, dy = 180;

  const tree = d3.tree().nodeSize([dx, dy]);
  const root = d3.hierarchy(treeData);

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

  const gNode = svg.append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");

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
    .on("click", function(event, d) {
  showModal(d);
});


  node.append("text")
    .attr("dy", "0.31em")
    .attr("x", d => d.children ? -6 : 6)
    .attr("text-anchor", d => d.children ? "end" : "start")
    .text(d => d.data.name);
}


// Modal logic
function showModal(d) {
  if (!d || !d.data || typeof d.data.name !== 'string') {
    console.warn("⚠️ Cannot open modal — invalid or missing node name:", d);
    return;
  }

  selectedNode = d;
  document.getElementById("nodeName").value = d.data.name;
  document.getElementById("node-modal").style.display = "block";
}

function addChild() {
  const newName = prompt("Enter name for new child node:");
  if (!newName || !selectedNode || !selectedNode.data) return;

  if (!selectedNode.data.children) {
    selectedNode.data.children = [];
  }

  selectedNode.data.children.push({ name: newName });
  db.collection("researchTree").doc("root").set(treeData).then(() => {
    drawTree(); // update UI
    closeModal();
  });
}

function moveNode(direction) {
  if (!selectedNode || !selectedNode.parent) return;

  const siblings = selectedNode.parent.data.children;
  const index = siblings.indexOf(selectedNode.data);
  if (index === -1) return;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= siblings.length) return;

  // Swap
  [siblings[index], siblings[targetIndex]] = [siblings[targetIndex], siblings[index]];

  db.collection("researchTree").doc("root").set(treeData).then(() => {
    drawTree();
    closeModal();
  });
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
