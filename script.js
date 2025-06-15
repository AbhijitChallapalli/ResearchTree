let currentUser = null;
let treeData = {};
let selectedNode = null;

const ADMIN_EMAIL = "abhijitchallapalli99@gmail.com"; // Only I have admin access

window.onload = function () {
  auth.onAuthStateChanged(user => {
    currentUser = user;

    document.getElementById('logoutBtn').style.display = user ? 'inline' : 'none';
    document.getElementById('auth-msg').innerText = user ? `Logged in as ${user.email}` : 'Not logged in';

    if (user) {
      loadTree();
      fetchVersions();

      // Always show admin panel for admin
      if (user.email === ADMIN_EMAIL) {
        document.getElementById('adminPanelBtn').style.display = 'inline';
        toggleEditingFeatures(true); //  Admins always get edit access
        document.getElementById('edit-access-request').style.display = 'none';
        return; //  Skip further approval check
      }

      // Now check if regular user is approved
      db.collection("approvedUsers").doc(user.email).get().then(doc => {
        const isApproved = doc.exists;
        toggleEditingFeatures(isApproved);

        if (!isApproved) {
          document.getElementById('edit-access-request').style.display = 'block';
          document.getElementById('requestAccessBtn').style.display = 'inline';
        }
      });
    }
  });
};


function toggleEditingFeatures(isApproved) {
  const editButtons = document.querySelectorAll(".edit-btn");
  editButtons.forEach(btn => {
    btn.style.display = isApproved ? 'inline-block' : 'none';
  });
}


function goToAdminPanel() {
  window.location.href = "admin.html";
}

function requestEditAccess() {
  const email = currentUser.email;

  db.collection("accessRequests").add({
    email: email,
    requestedAt: new Date()
  }).then(() => {
    alert("Access request sent to admin.");
    document.getElementById("requestAccessBtn").style.display = "none";
  }).catch(error => {
    alert("Error sending request: " + error.message);
  });
}

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
    console.log("Firestore Tree:", treeData);
    drawTree();
  });
}


//Draw Tree
function drawTree() {
  d3.select("svg").remove();

  const margin = { top: 20, right: 120, bottom: 20, left: 60 };
  const dx = 36;
  const dy = 200;

  const tree = d3.tree().nodeSize([dx, dy]);
  const root = d3.hierarchy(treeData);
  tree(root);

  const svg = d3.select("#tree-container")
    .append("svg")
    .style("font", "14px 'Segoe UI', Roboto, sans-serif")
    .style("user-select", "none")
    .style("background-color", "#f8f9fa");

  const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top}) scale(0.8)`);


  const gLink = g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("stroke-width", 2);

  const gNode = g.append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");

  // Link generator
  const diagonal = d3.linkHorizontal()
    .x(d => d.y)
    .y(d => d.x);

  // Draw links
  gLink.selectAll("path")
    .data(root.links())
    .join("path")
    .attr("d", diagonal);

  // Draw nodes
  const node = gNode.selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", d => `translate(${d.y},${d.x})`)
    .on("click", function (event, d) {
      showModal(d);
    });

  node.append("circle")
    .attr("r", 8)
    .attr("fill", d => d.children ? "#0d6efd" : "#6c757d")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .style("cursor", "pointer");

  node.append("text")
    .attr("dy", "0.4em")
    .attr("x", d => d.children ? -14 : 14)
    .attr("text-anchor", d => d.children ? "end" : "start")
    .text(d => d.data.name)
    .style("fill", "#212529")
    .style("font-weight", d => d.depth === 0 ? "bold" : "normal")
   // .style("font-size", d => d.data.name.length > 20 ? "11px" : "14px");
    .style("font-size", "12px");

node.append("title")
  .text(d => d.data.notes || "No notes");

    node.append("text")
  .filter(d => d.data.notes)
  .attr("dy", "-1em")  // Move up
  .attr("x", d => d.children ? -14 : 14)
  .attr("text-anchor", d => d.children ? "end" : "start")
  .text("📝")
  .style("font-size", "8px");

  // Recalculate viewBox to fit all content
  requestAnimationFrame(() => {
    const bbox = g.node().getBBox();
    svg.attr("viewBox", [
      bbox.x - margin.left,
      bbox.y - margin.top,
      bbox.width + margin.left + margin.right,
      bbox.height + margin.top + margin.bottom
    ]);
  });
}

// showModal
function showModal(d) {
  if (!d || !d.data) return;

  selectedNode = d;

  document.getElementById("nodeName").value = d.data.name || "";
  document.getElementById("nodeNotes").value = d.data.notes || "";
  document.getElementById("nodeLink").value = d.data.link || "";

  document.getElementById("node-modal").style.display = "block";
}


// saveNode
function saveNode() {
  const newName = document.getElementById("nodeName").value.trim();
  const newNotes = document.getElementById("nodeNotes").value.trim();
  const newLink = document.getElementById("nodeLink").value.trim();

  if (!selectedNode) return;

  selectedNode.data.name = newName;
  selectedNode.data.notes = newNotes;
  selectedNode.data.link = newLink;

  const updatedTree = JSON.parse(JSON.stringify(treeData));

  // Save current state
  db.collection("researchTree").doc("root").set(updatedTree)
    .then(() => {
      drawTree();
      saveTreeVersion();
      closeModal();

      // ✅ Save version with timestamp
      db.collection("treeVersions").add({
        timestamp: new Date(),
        updatedBy: currentUser.email,
        data: updatedTree
      });
    })
    .catch(err => console.error("Failed to update tree:", err));
}


// Deep copy trick to force update to Firebase (needed in complex trees)
function selectedNodeCopy(node) {
  return JSON.parse(JSON.stringify(node));
}

// === C. Edit Logs (For Add, Rename, Move, Delete) ===

function logEdit(action, nodeName) {
  db.collection("editLogs").add({
    user: currentUser.email,
    action,
    node: nodeName,
    timestamp: new Date()
  });
}

// Add a child node
function addChild() {
  const newName = prompt("Enter name for new child node:");
  if (!newName || !selectedNode || !selectedNode.data) return;

  if (!selectedNode.data.children) {
    selectedNode.data.children = [];
  }

  selectedNode.data.children.push({
    name: newName,
    notes: "",
    link: ""
  });

  db.collection("researchTree").doc("root").set(treeData).then(() => {
    drawTree();
    closeModal();
    saveTreeVersion();
    logEdit("add", newName); // ✅ Log the add
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
    saveTreeVersion();
    closeModal();
  });
}

// Delete Node
function deleteNode() {
  if (!selectedNode || !selectedNode.parent) {
    alert("Root node cannot be deleted.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete "${selectedNode.data.name}" and all its children?`);
  if (!confirmed) return;

  const parent = selectedNode.parent.data;
  const index = parent.children.indexOf(selectedNode.data);

  if (index !== -1) {
    const deletedNodeName = selectedNode.data.name;
    parent.children.splice(index, 1);

    db.collection("researchTree").doc("root").set(treeData)
      .then(() => {
        drawTree();
        saveTreeVersion();
        closeModal();
        logEdit("delete", deletedNodeName); // ✅ Log the delete
      })
      .catch(error => console.error("Error deleting node:", error));
  }
}

// Save version of current tree to Firestore
function saveTreeVersion() {
  const userEmail = currentUser ? currentUser.email : "unknown";
  const timestamp = new Date();

  db.collection("treeVersions").add({
    tree: JSON.parse(JSON.stringify(treeData)),  // Deep copy for safety
    user: userEmail,
    timestamp: timestamp
  }).then(() => {
    fetchVersions();  // Refresh version dropdown (optional)
    console.log("Version saved");
  }).catch(err => {
    console.error("Failed to save version:", err);
  });
}


// fetch versions
function fetchVersions() {
  const select = document.getElementById("versionHistory");
  select.innerHTML = "";

  db.collection("treeVersions")
    .orderBy("timestamp", "desc")
    .limit(10)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const option = document.createElement("option");
        const date = new Date(data.timestamp.seconds * 1000);
        option.value = doc.id;
        option.text = `${data.user} @ ${date.toLocaleString()}`;
        select.appendChild(option);
      });
    })
    .catch(err => {
      console.error("Failed to fetch versions:", err);
    });
}

//revert functions
function revertVersion() {
  const versionId = document.getElementById("versionHistory").value;
  if (!versionId) return alert("Please select a version to revert.");

  const confirmRevert = confirm("Are you sure you want to revert to this version?");
  if (!confirmRevert) return;

  db.collection("treeVersions").doc(versionId).get()
    .then(doc => {
      if (!doc.exists) throw new Error("Version not found.");
      const versionData = doc.data();

      treeData = versionData.tree; // ✅ assign here
      return db.collection("researchTree").doc("root").set(treeData);
    })
    .then(() => {
      drawTree();
      alert("Tree reverted successfully.");
    })
    .catch(err => {
      console.error("Error reverting tree:", err.message);
      alert("Failed to revert version.");
    });
}





// Download as PNG
function downloadPNG() {
  const container = document.getElementById('tree-container');
  html2canvas(container).then(canvas => {
    const link = document.createElement('a');
    link.download = 'research_tree.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}

// Download as PDF
function downloadPDF() {
  const container = document.getElementById('tree-container');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });

  html2canvas(container).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Add the image of the tree
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Add a new page for notes
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text("Node Notes Summary", 40, 40);

    let y = 70;
    const traverse = (node, depth = 0) => {
      const indent = " ".repeat(depth * 2);
      const label = `${indent}• ${node.name || "Unnamed"}`;
      pdf.text(label, 40, y);
      y += 20;

      if (node.notes) {
        pdf.setFontSize(10);
        pdf.text(`${indent}   Notes: ${node.notes}`, 50, y);
        y += 15;
      }
      if (node.link) {
        pdf.text(`${indent}   Link: ${node.link}`, 50, y);
        y += 15;
      }
      pdf.setFontSize(14);

      (node.children || []).forEach(child => traverse(child, depth + 1));
    };

    traverse(treeData);  // Assumes treeData has the tree structure
    pdf.save("research_tree.pdf");
  });
}


// Close modal
function closeModal() {
  document.getElementById("node-modal").style.display = "none";
}