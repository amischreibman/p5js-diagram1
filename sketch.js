// === הגדרות בסיס ===
let centerGrowDuration = 1800;
let surroundingMoveDuration = 2500;
let baseDistance = 150;
let wiggleSpeed = 0.01;
let wiggleRadius = 20;
let easeInPower = 4;
let easeOutPower = 10;

// === הגדרות טקסט ===
let textShadowBlur = 0;
let textShadowColor = 'white';
let textMaxSizePercentage = 0.6;
let textContentPadding = 30; // שליטה במרחק בין הכותרת לטקסט בכל העיגולים
let textFadeInDelay = 200; // Delay before text starts fading in
let textFadeInDuration = 500; // Duration of the text fade-in animation
let textFadeOutSpeed = 0.2; // מהירות ה-fade out של הטקסט (0 to 1, higher is faster)

// === סטטוס 0 (דיפולטיבי) ===
let centerDefaultSize = 180;

// === סטטוס 1 (גדילה) ===
let growthMultiplier = 1.5;
let status1ExpansionAmount = 100;
let status1CenterDelay = 0;
let status1DelayRandomRange = [4, 20];

// === סטטוס 2 (התכווצות/מיקוד) ===
// Note: status2ShrinkDuration and status2GrowDuration are less relevant now as focus transition is faster
let status2CenterOffset = 100;
let status2CenterShrinkFactor = 0.4;
let status2MinExpandedSize = 300;
let status2MaxExpandedSize = 500;
let status2DelayRandomRange = [4, 20]; // Delay for non-focused nodes moving away

// === משתנים נוספים למבנה האנימציה ===
let centerNode;
let surroundingNodes = [];
let status = 0; // 0: Default, 1: Center expanded, 2: Surrounding node focused
let focusedNodeIndex = null; // Index of the currently focused surrounding node in status 2
let transitionStartTime = 0; // Timestamp when the current transition started
let winkyFont; // Font variable
let BlinkyStar; // Font variable for preload

// === תוכן נוסף לעיגולים ===
let defaultContent = "This is a paragraph of sample text that will appear when the circle is focused.";

// === פונקציות ===
function preload() {
  try {
    // Note: Make sure the font file 'Blinky Star.otf' is in the same directory or provide the correct path
    BlinkyStar = loadFont('Blinky Star.otf');
    console.log("פונט Blinky Star נטען בהצלחה");
  } catch (e) {
    console.log("לא ניתן לטעון את הפונט Blinky Star, משתמש בפונט ברירת המחדל", e);
    BlinkyStar = null; // Ensure it's null if loading failed
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  initNodes();

  if (BlinkyStar) {
    textFont(BlinkyStar);
  } else {
    textFont('arial'); // Fallback font
  }

  textAlign(CENTER, CENTER);
  drawingContext.textBaseline = 'middle';
  drawingContext.textAlign = 'center';
  pixelDensity(1); // Use device pixel density 1 for potential performance improvement
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initNodes(); // Re-initialize nodes on resize to adjust positions
}

function initNodes() {
  surroundingNodes = [];
  focusedNodeIndex = null;
  status = 0;
  transitionStartTime = millis(); // Set initial transition time

  // Initialize Center Node
  centerNode = {
    baseX: width / 2,
    baseY: height / 2,
    r: centerDefaultSize,
    currentR: centerDefaultSize,
    targetR: centerDefaultSize, // Add targetR for consistency
    col: color(0, 102, 255),
    angleOffset: random(1000),
    targetX: width / 2,
    targetY: height / 2,
    currentX: width / 2,
    currentY: height / 2, // Corrected from width / 2
    label: 'text 0',
    content: "This is the main central node. It contains important information about the core concept. Click on surrounding nodes to explore related topics.",
    contentAlpha: 0,
    expandedR: centerDefaultSize * growthMultiplier // Pre-calculate expanded size
  };


  // Initialize Surrounding Nodes
  let maxTries = 1000;
  let numNodes = 10; // Target number of nodes
  while (surroundingNodes.length < numNodes && maxTries > 0) {
    maxTries--;
    let angle = random(TWO_PI);
    let distFromCenter = random(baseDistance, baseDistance + 100); // Random distance within a range
    let r = random(50, 80) * 1.25; // Random base radius
    let x = centerNode.baseX + cos(angle) * distFromCenter;
    let y = centerNode.baseY + sin(angle) * distFromCenter;

    // Check for overlaps with existing surrounding nodes
    let overlaps = false;
    for (let other of surroundingNodes) {
      // Add a buffer (20) to prevent nodes touching
      if (dist(x, y, other.baseX, other.baseY) < r + other.r + 20) {
        overlaps = true;
        break;
      }
    }
     // Check overlap with the center node as well
     if (dist(x, y, centerNode.baseX, centerNode.baseY) < r + centerNode.r / 2 + 20) {
        overlaps = true;
     }

    if (overlaps) continue; // Skip if it overlaps

    let nodeIndex = surroundingNodes.length + 1;
    let nodeContent = `This is unique content for circle ${nodeIndex}. `;

    // Add varying lengths of content for demonstration
    if (nodeIndex % 3 === 0) {
      nodeContent += `This text will be displayed when the circle is in focus mode. Here you can add more details about this specific topic or concept. The circle will grow larger to accommodate this longer text content. The size is calculated dynamically based on text length.`;
    } else if (nodeIndex % 3 === 1) {
      nodeContent += `This text will be displayed when the circle is in focus mode. Here you can add more details about this specific topic or concept.`;
    } else {
      nodeContent += `This is a short description for this circle.`;
    }

    surroundingNodes.push({
      angle: angle, // Store original angle
      baseR: r,     // Store original radius
      r: r,         // Use r for current radius variable name consistency if needed elsewhere
      currentR: r,
      targetR: r,   // Add targetR
      col: color(random(150, 255), random(100, 200), random(200, 255)), // Example color range
      angleOffset: random(1000), // For wiggle
      baseX: x,
      baseY: y,
      currentX: x,
      currentY: y,
      targetX: x,
      targetY: y,
      label: `text ${nodeIndex}`,
      content: nodeContent,
      contentAlpha: 0,
      expandedR: status2MinExpandedSize // Default expanded size, will be updated
    });
  }

  updateCircleSizesBasedOnContent(); // Calculate expanded sizes after all nodes are created
  console.log("Nodes initialized");
}

// Calculate expanded size based on content length
function updateCircleSizesBasedOnContent() {
  textSize(16); // Use the standard content text size for measurement
  textAlign(CENTER, CENTER);
  rectMode(CENTER);

  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];
    let textLength = node.content.length;

    // Estimate required width/height based on text (this is approximate)
    // A more accurate way involves p5.textBounds but can be complex with line breaks.
    // We'll use a simpler heuristic: more text needs more area.
    let estimatedMinRadiusForText = sqrt(textLength) * 5; // Simple heuristic

     // Ensure title also fits. Calculate title width/height needs.
     let titleSize = min(status2MinExpandedSize * 0.25, 36) * 1.5; // Approx height needed for title + padding
     let requiredRadiusForTitle = titleSize / (2 * 0.25); // Back-calculate radius needed just for title space

    // Calculate base expanded radius based on text length mapping
    let minTextLength = 50;
    let maxTextLength = 300; // Cap the effect of very long text
    let normalizedLength = constrain(textLength, minTextLength, maxTextLength);
    let sizeRange = status2MaxExpandedSize - status2MinExpandedSize;
    let sizeRatio = (normalizedLength - minTextLength) / (maxTextLength - minTextLength);
    let lengthBasedRadius = status2MinExpandedSize + (sizeRange * sizeRatio);

    // The final expanded radius should be large enough for base size, text, and title.
    // Also ensure it's within the overall min/max bounds.
    node.expandedR = constrain(
        max(lengthBasedRadius, estimatedMinRadiusForText, requiredRadiusForTitle, node.baseR * 1.5), // Must be at least base size * 1.5, and fit text/title estimate
        status2MinExpandedSize, // Global minimum expanded size
        status2MaxExpandedSize  // Global maximum expanded size
    );

    // console.log(`Circle ${i+1}: Text length = ${textLength}, Estimated min radius = ${estimatedMinRadiusForText.toFixed(1)}, Length-based radius = ${lengthBasedRadius.toFixed(1)}, Final Expanded size = ${node.expandedR.toFixed(1)}`);
  }
}


function draw() {
  background('#F2A900'); // Orange background
  drawingContext.imageSmoothingEnabled = true; // Try to keep things smooth

  // --- Calculate Progress ---
  // Use different durations for center and surrounding nodes if needed,
  // but for simplicity, we can use a common one or adjust easing.
  let elapsedTime = millis() - transitionStartTime;
  let centerT = constrain(elapsedTime / centerGrowDuration, 0, 1);
  let outerT = constrain(elapsedTime / surroundingMoveDuration, 0, 1);
  // Apply easing
  let easeCenter = ultraEaseInOut(centerT);
  let easeOuter = ultraEaseInOut(outerT);
  // For focused node transition (move to center), we might want a faster curve
   let focusT = constrain(elapsedTime / 1000, 0, 1); // Faster transition for focus (e.g., 1000ms)
   let easeFocus = ultraEaseInOut(focusT);


  // --- Update Center Node ---
  centerNode.currentR = lerp(centerNode.currentR, centerNode.targetR, easeCenter);
  centerNode.currentX = lerp(centerNode.currentX, centerNode.targetX, easeCenter);
  centerNode.currentY = lerp(centerNode.currentY, centerNode.targetY, easeCenter);

  // Apply wiggle
  let centerDisplayX = centerNode.currentX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;
  let centerDisplayY = centerNode.currentY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;

  // --- Update Surrounding Nodes ---
  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];
    let easing = (status === 2 && i === focusedNodeIndex) ? easeFocus : easeOuter; // Use faster easing for focused node

    // Update position and radius
    node.currentX = lerp(node.currentX, node.targetX, easing);
    node.currentY = lerp(node.currentY, node.targetY, easing);
    node.currentR = lerp(node.currentR, node.targetR, easing); // Use targetR directly

    // Apply wiggle
    node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
    node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;

    // --- Update Text Alpha ---
    if ((status === 1 && node === centerNode) || (status === 2 && i === focusedNodeIndex)) {
      // Fade in text for the active node (center in status 1, focused in status 2)
      if (elapsedTime > textFadeInDelay) {
        let fadeProgress = constrain((elapsedTime - textFadeInDelay) / textFadeInDuration, 0, 1);
        node.contentAlpha = lerp(0, 255, fadeProgress); // Lerp from 0 to 255
      } else {
        // Ensure alpha stays 0 before the delay
        node.contentAlpha = 0;
      }
    } else {
      // Fade out text for inactive nodes
      node.contentAlpha = lerp(node.contentAlpha, 0, textFadeOutSpeed);
    }
  }
   // Update center node text alpha separately if it's not handled in the loop above
   if (status !== 1) {
       centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, textFadeOutSpeed);
   } else {
        // Handle fade-in for center node when status becomes 1
        if (elapsedTime > textFadeInDelay) {
            let fadeProgress = constrain((elapsedTime - textFadeInDelay) / textFadeInDuration, 0, 1);
            centerNode.contentAlpha = lerp(0, 255, fadeProgress);
        } else {
            centerNode.contentAlpha = 0;
        }
   }


  // --- Draw Elements ---

  // Draw connecting lines (draw these first, underneath)
  stroke(0);
  strokeWeight(3);
  for (let node of surroundingNodes) {
    line(centerDisplayX, centerDisplayY, node.displayX, node.displayY);
  }
  noStroke(); // Turn off stroke for drawing circles

  // Draw non-focused surrounding nodes
  for (let i = 0; i < surroundingNodes.length; i++) {
    // Skip drawing the focused node here; it will be drawn last (on top)
    if (status === 2 && i === focusedNodeIndex) continue;

    let node = surroundingNodes[i];
    drawNodeWithShadow(node.displayX, node.displayY, node.currentR, node.col, 325); // Draw node with shadow
    drawNodeLabel(node.displayX, node.displayY, node.currentR, node.label); // Draw label
    // Note: Content for non-focused nodes is not drawn (alpha is fading out)
  }

  // Draw Center Node
  drawNodeWithShadow(centerDisplayX, centerDisplayY, centerNode.currentR, centerNode.col, 145); // Draw center node with shadow
  // Draw Center Node Text (Label and Content)
  drawNodeText(centerDisplayX, centerDisplayY, centerNode.currentR, centerNode.label, centerNode.content, centerNode.contentAlpha, (status === 1));

  // Draw Focused Node (Status 2) - Draw last to ensure it's on top
  if (status === 2 && focusedNodeIndex !== null) {
    let node = surroundingNodes[focusedNodeIndex];
    drawNodeWithShadow(node.displayX, node.displayY, node.currentR, node.col, 325); // Draw focused node with shadow
    // Draw Focused Node Text (Label and Content)
    drawNodeText(node.displayX, node.displayY, node.currentR, node.label, node.content, node.contentAlpha, true); // Always show content structure when focused
  }
}

// Helper function to draw a node (circle) with its shadow
function drawNodeWithShadow(x, y, r, col, shadowAngleDeg) {
  push();
  noStroke();
  // Shadow
  let shadowOffsetX = 3 * cos(radians(shadowAngleDeg));
  let shadowOffsetY = 3 * sin(radians(shadowAngleDeg));
  fill(0, 0, 0, 100); // Semi-transparent black shadow
  ellipse(x + shadowOffsetX, y + shadowOffsetY, r);
  // Main Circle
  fill(col);
  ellipse(x, y, r);
  pop();
}

// Helper function to draw node label (short text)
function drawNodeLabel(x, y, r, label) {
  push();
  fill(0); // Black text
  noStroke();
  drawingContext.imageSmoothingEnabled = true;
  drawingContext.imageSmoothingQuality = 'high';
  let textSizeValue = constrain(r * 0.2, 10, 20); // Constrain label size
  textSize(textSizeValue);
  // Simple white outline/shadow for readability - less configurable than context shadow
  // fill(255);
  // text(label, x + 1, y + 1);
  // text(label, x - 1, y + 1);
  // text(label, x + 1, y - 1);
  // text(label, x - 1, y - 1);
  fill(0);
  text(label, x, y); // Draw label centered
  pop();
}

// Helper function to draw node text (label + content)
function drawNodeText(x, y, r, label, content, contentAlpha, showContent) {
  push();
  noStroke();
  drawingContext.imageSmoothingEnabled = true;
  drawingContext.imageSmoothingQuality = 'high';

  // --- Draw Label ---
  let labelSize = constrain(r * 0.25, 12, 36); // Constrained label size
  textSize(labelSize);
  fill(0); // Black label

  // Calculate label Y position: If content is shown, move label up; otherwise, center it.
  let labelYOffset = showContent ? -r * 0.25 : 0; // Move label up if content is visible
  text(label, x, y + labelYOffset);

  // --- Draw Content ---
  // Only draw content if alpha is significant and showContent flag is true
  if (showContent && contentAlpha > 10) {
    push();
    fill(0, contentAlpha); // Use calculated alpha for fade effect
    noStroke();
    let contentTextSize = 16; // Fixed size for content
    textSize(contentTextSize);
    textAlign(CENTER, TOP); // Align text to the top of the bounding box
    rectMode(CENTER);

    // Calculate available width/height for the text box inside the circle
    // Leave padding from the edges and space below the title
    let textWidth = r * 0.7; // Use 70% of radius for width
    let textHeight = r * 0.6; // Max height for content area
    let contentY = y + labelYOffset + labelSize * 0.7 + textContentPadding; // Position below label + padding

    // Draw the content text wrapped within the calculated bounds
    text(content, x, contentY, textWidth, textHeight);
    pop();
  }
  pop();
}


function mousePressed() {
    // Check click on Center Node
    let dCenter = dist(mouseX, mouseY, centerNode.currentX, centerNode.currentY);
    if (dCenter < centerNode.currentR / 2) {
        handleCenterNodeClick();
        return; // Exit after handling click
    }

    // Check click on Surrounding Nodes
    for (let i = 0; i < surroundingNodes.length; i++) {
        let node = surroundingNodes[i];
        let dSurrounding = dist(mouseX, mouseY, node.currentX, node.currentY);
        if (dSurrounding < node.currentR / 2) {
            handleSurroundingNodeClick(i);
            return; // Exit after handling click
        }
    }

    // Check click outside any node (Background Click)
    handleBackgroundClick();
}

function handleCenterNodeClick() {
    console.log("Center node clicked. Current status:", status);
    // If in status 2, reset the focused node first
    if (status === 2 && focusedNodeIndex !== null) {
        resetFocusedNode();
    }

    // Toggle between status 0 and 1
    status = (status === 0) ? 1 : 0;
    console.log("New status:", status);
    transitionStartTime = millis();

    if (status === 1) { // Transitioning to Center Expanded
        centerNode.targetR = centerNode.expandedR;
        centerNode.targetX = width / 2; // Ensure it stays centered
        centerNode.targetY = height / 2;
        // Move surrounding nodes outwards
        moveSurroundingNodes(status1ExpansionAmount, true); // Expand outwards
    } else { // Transitioning back to Default (Status 0)
        centerNode.targetR = centerDefaultSize;
        centerNode.targetX = width / 2;
        centerNode.targetY = height / 2;
        centerNode.contentAlpha = 0; // Immediately hide text when leaving status 1
        // Move surrounding nodes back to base positions
        resetSurroundingNodesToBase();
    }
}

function handleSurroundingNodeClick(index) {
    console.log(`Surrounding node ${index} clicked. Current status:`, status);
    let previouslyFocused = focusedNodeIndex;

    // If clicking the *already* focused node in status 2, do nothing or maybe return to status 0/1?
    // Current behavior: Clicking focused node again does nothing specific here, background click handles exit.
    // if (status === 2 && focusedNodeIndex === index) return;

    // --- Immediate Actions on Click ---
    status = 2; // Set status to 2 immediately
    focusedNodeIndex = index; // Set the new focused node index immediately
    transitionStartTime = millis(); // Reset transition timer immediately

    console.log("New status: 2, Focused index:", focusedNodeIndex);

    // Reset the *previously* focused node (if there was one and it's different)
    if (previouslyFocused !== null && previouslyFocused !== index) {
        let prevNode = surroundingNodes[previouslyFocused];
        prevNode.targetR = prevNode.baseR; // Start shrinking previous node
        prevNode.contentAlpha = 0; // Hide its text immediately
        // Its position will be updated in the loop below
         console.log(`Resetting previously focused node ${previouslyFocused}`);
    }

    // If coming from status 1, reset the center node's text
    if (centerNode.contentAlpha > 0) {
         centerNode.contentAlpha = 0;
         console.log("Resetting center node text alpha");
    }


    // --- Set Targets for the NEWLY Focused Node ---
    let focusedNode = surroundingNodes[index];
    focusedNode.targetX = width / 2;   // Target: center X
    focusedNode.targetY = height / 2;   // Target: center Y
    focusedNode.targetR = focusedNode.expandedR; // Target: calculated expanded size
    // Text alpha will start fading in via the draw() loop logic based on transitionStartTime

    console.log(`Setting targets for focused node ${index}: X=${focusedNode.targetX}, Y=${focusedNode.targetY}, R=${focusedNode.targetR}`);


    // --- Set Targets for the Center Node ---
    // Move center node slightly off-center
    centerNode.targetX = width / 2 + status2CenterOffset; // Example offset
    centerNode.targetY = height / 2;
    centerNode.targetR = centerDefaultSize * status2CenterShrinkFactor; // Shrink center node

     console.log(`Setting targets for center node: X=${centerNode.targetX}, Y=${centerNode.targetY}, R=${centerNode.targetR}`);


    // --- Set Targets for OTHER Surrounding Nodes ---
    // Move other nodes away radially, potentially with delay
    let cumulativeDelay = 0;
    for (let j = 0; j < surroundingNodes.length; j++) {
        if (j === index) continue; // Skip the node that is now focused

        let otherNode = surroundingNodes[j];
        let angle = otherNode.angle; // Use original angle relative to center
        // Calculate a distance further away from the new center node position
        // Or simply push them further radially from the screen center
        let distance = baseDistance + random(150, 250); // Push them further out

        let targetX = width / 2 + cos(angle) * distance;
        let targetY = height / 2 + sin(angle) * distance;

        // Apply delay using setTimeout (optional, adds staggered effect to non-focused nodes)
        let delay = cumulativeDelay; // Use the calculated cumulative delay

        setTimeout(() => {
            otherNode.targetX = targetX;
            otherNode.targetY = targetY;
            otherNode.targetR = otherNode.baseR; // Ensure they are at base size
             if (otherNode.contentAlpha > 0) otherNode.contentAlpha = 0; // Ensure text is hidden
        }, delay);

        cumulativeDelay += random(status2DelayRandomRange[0], status2DelayRandomRange[1]);
         // console.log(`Setting targets for non-focused node ${j} with delay ${delay}ms`);
    }
}


function handleBackgroundClick() {
    console.log("Background clicked. Current status:", status);
    // Change: If in status 2, go back to status 0 (Default)
    if (status === 2) {
        status = 0; // Go to default state
        console.log("New status: 0");
        transitionStartTime = millis();
        resetFocusedNode(); // Reset the node that was focused
        resetPositions();   // Reset all nodes to default positions/sizes
    }
    // If in status 1 (Center Expanded), go back to status 0 (Default)
    else if (status === 1) {
        status = 0; // Go to default state
        console.log("New status: 0");
        transitionStartTime = millis();
        resetPositions(); // Reset all nodes to default positions/sizes
        centerNode.contentAlpha = 0; // Immediately hide center text
    }
    // If already in status 0, clicking background does nothing.
}

// Helper to reset the currently focused node when leaving status 2
function resetFocusedNode() {
    if (focusedNodeIndex !== null) {
        let node = surroundingNodes[focusedNodeIndex];
        node.targetR = node.baseR; // Target base size
        node.contentAlpha = 0;      // Hide text immediately
        // Its position will be reset by resetPositions() or set individually if needed
         console.log(`Resetting focused node ${focusedNodeIndex} state`);
        focusedNodeIndex = null; // Clear the focused index
    }
}

// Helper function to reset all nodes to their base positions and sizes (Status 0)
function resetPositions() {
    console.log("Resetting all node positions to base state (Status 0)");
    // Reset Center Node
    centerNode.targetX = width / 2;
    centerNode.targetY = height / 2;
    centerNode.targetR = centerDefaultSize;
    centerNode.contentAlpha = 0; // Ensure text is hidden

    // Reset Surrounding Nodes
    resetSurroundingNodesToBase();
}

// Helper function to specifically reset surrounding nodes to base state
function resetSurroundingNodesToBase() {
     console.log("Resetting surrounding nodes to base positions/sizes");
    for (let node of surroundingNodes) {
        node.targetX = node.baseX;
        node.targetY = node.baseY;
        node.targetR = node.baseR;
         if (node.contentAlpha > 0) node.contentAlpha = 0; // Ensure text is hidden
    }
}

// Helper function to move surrounding nodes (e.g., expand/contract in Status 1)
function moveSurroundingNodes(expansionAmount, expand = true) {
    let cumulativeDelay = 0;
    // Optional: Shuffle indices for random order animation
    let indices = [...Array(surroundingNodes.length).keys()];
    shuffle(indices, true); // p5 shuffle function

    for (let i = 0; i < indices.length; i++) {
        let nodeIndex = indices[i];
        let node = surroundingNodes[nodeIndex];
        let angle = node.angle;
        // Calculate distance based on whether expanding or contracting
        let distance = expand ? (baseDistance + expansionAmount) : node.baseDistance; // Assuming baseDistance is stored or use baseX/Y

        // Use baseX/Y for base positions if not expanding from exact center
         let targetX, targetY;
         if (expand) {
             targetX = centerNode.baseX + cos(angle) * distance; // Expand from center's base
             targetY = centerNode.baseY + sin(angle) * distance;
         } else {
             targetX = node.baseX; // Return to original base position
             targetY = node.baseY;
         }


        // Apply delay using setTimeout
        setTimeout(() => {
            node.targetX = targetX;
            node.targetY = targetY;
            node.targetR = node.baseR; // Usually reset to base size when moving
        }, cumulativeDelay);

        cumulativeDelay += random(status1DelayRandomRange[0], status1DelayRandomRange[1]);
    }
     console.log(`Moving surrounding nodes. Expand: ${expand}, Amount/Target: ${expansionAmount}`);
}


// Easing function
function ultraEaseInOut(t) {
  // Clamp t to ensure it's within [0, 1]
  t = constrain(t, 0, 1);
  // The easing logic
  return t < 0.5
    ? pow(t * 2, easeInPower) / 2
    : 1 - pow((1 - t) * 2, easeOutPower) / 2;
}

// Fisher-Yates (Knuth) Shuffle function - p5 already has shuffle()
// function shuffle(array) {
//   let currentIndex = array.length, randomIndex;
//   while (currentIndex != 0) {
//     randomIndex = Math.floor(Math.random() * currentIndex);
//     currentIndex--;
//     [array[currentIndex], array[randomIndex]] = [
//       array[randomIndex], array[currentIndex]];
//   }
//   return array;
// }
