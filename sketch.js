// === הגדרות בסיס ===
let centerGrowDuration = 1800;
let surroundingMoveDuration = 2500; // Duration for non-focused nodes moving
let focusTransitionDuration = 1000; // Duration for focused node moving/growing
let baseDistance = 150;
let wiggleSpeed = 0.01;
let wiggleRadius = 20;
let easeInPower = 4;
let easeOutPower = 10;

// === הגדרות טקסט ===
let textShadowBlur = 0; // Set to 0 as it wasn't used effectively
let textShadowColor = 'white'; // Kept for potential future use
let textMaxSizePercentage = 0.6; // Relative max size for labels (not content)
let textContentPadding = 15; // *** מרחק קבוע בין תחתית הכותרת לתחילת הטקסט ***
let textFadeInDelay = 150;    // Delay before text starts fading in
let textFadeInDuration = 500;  // Duration of the text fade-in animation
let textFadeOutSpeed = 0.25; // מהירות ה-fade out של הטקסט (0 to 1, higher is faster)
let contentTextSize = 16; // גודל טקסט קבוע לתוכן

// === סטטוס 0 (דיפולטיבי) ===
let centerDefaultSize = 180;

// === סטטוס 1 (גדילה) ===
let growthMultiplier = 1.5;
let status1ExpansionAmount = 100;
let status1CenterDelay = 0; // Delay not really used with current logic, kept for reference
let status1DelayRandomRange = [4, 20]; // Delay for surrounding nodes in status 1 transition

// === סטטוס 2 (התכווצות/מיקוד) ===
let status2CenterOffset = 100; // How much the center node moves aside
let status2CenterShrinkFactor = 0.4; // How much the center node shrinks
let status2MinExpandedSize = 300; // Min size for a focused surrounding node
let status2MaxExpandedSize = 500; // Max size for a focused surrounding node
let status2DelayRandomRange = [4, 20]; // Delay for non-focused nodes moving away in status 2

// === משתנים נוספים למבנה האנימציה ===
let centerNode;
let surroundingNodes = [];
let status = 0; // 0: Default, 1: Center expanded, 2: Surrounding node focused
let focusedNodeIndex = null; // Index of the currently focused surrounding node in status 2
let transitionStartTime = 0; // Timestamp when the current transition started
let BlinkyStar; // Font variable for preload

// === תוכן נוסף לעיגולים ===
// (Content is generated dynamically in initNodes)

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
  initNodes(); // initNodes must be called AFTER font might be loaded

  // Set textFont here AFTER potential loading in preload and AFTER initNodes
  if (BlinkyStar) {
    textFont(BlinkyStar); // Apply the loaded font globally if successful
  } else {
    textFont('arial'); // Fallback font
  }

  // Default text settings - specific alignment/modes set during drawing
  pixelDensity(1); // Use device pixel density 1 for potential performance improvement
  console.log("Setup complete. Initial status:", status);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Re-initialize nodes on resize to adjust positions and potentially recalculate sizes
  initNodes();
  // Re-apply textFont in case windowResized clears some settings
  if (BlinkyStar) {
    textFont(BlinkyStar);
  } else {
    textFont('arial');
  }
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
    targetR: centerDefaultSize,
    col: color(0, 102, 255),
    angleOffset: random(1000), // Wiggle offset
    targetX: width / 2,
    targetY: height / 2,
    currentX: width / 2,
    currentY: height / 2,
    label: 'מרכז המידע', // Example Hebrew label
    content: "זהו העיגול המרכזי. הוא מכיל מידע חשוב על הנושא הראשי.\n\nלחצו על העיגולים מסביב כדי לגלות נושאים קשורים. ניתן להוסיף כאן הסברים נוספים או קישורים רלוונטיים.",
    contentAlpha: 0,
    expandedR: centerDefaultSize * growthMultiplier // Pre-calculate expanded size
  };


  // Initialize Surrounding Nodes
  let maxTries = 1000;
  let numNodes = 10; // Target number of nodes
  while (surroundingNodes.length < numNodes && maxTries > 0) {
    maxTries--;
    let angle = random(TWO_PI);
    let distFromCenter = random(baseDistance * 1.1, baseDistance * 1.1 + 100); // Slightly further base distance
    let r = random(60, 90); // Base radius range
    let x = centerNode.baseX + cos(angle) * distFromCenter;
    let y = centerNode.baseY + sin(angle) * distFromCenter;

    // Check for overlaps with existing surrounding nodes
    let overlaps = false;
    for (let other of surroundingNodes) {
      if (dist(x, y, other.baseX, other.baseY) < r + other.r + 30) { // Increased buffer
        overlaps = true;
        break;
      }
    }
    // Check overlap with the center node as well
    if (dist(x, y, centerNode.baseX, centerNode.baseY) < r + centerNode.r / 2 + 30) { // Increased buffer
       overlaps = true;
    }

    if (overlaps) continue; // Skip if it overlaps

    let nodeIndex = surroundingNodes.length + 1;
    let label = `נושא ${nodeIndex}`; // Example Hebrew label
    let nodeContent = `זהו תוכן ייחודי עבור עיגול ${nodeIndex}.\n`; // Start with a base line

    // Add varying lengths of content for demonstration
    if (nodeIndex % 3 === 0) {
       nodeContent += `טקסט זה יוצג כאשר העיגול במצב פוקוס.\nכאן ניתן להוסיף פרטים נוספים על הנושא הספציפי הזה.\nהעיגול יגדל כדי להתאים לתוכן הארוך.\nהגודל מחושב דינמית.\nאפשר להוסיף עוד ועוד שורות.\nזה ממשיך לרדת למטה.`;
    } else if (nodeIndex % 3 === 1) {
       nodeContent += `טקסט זה יוצג כאשר העיגול במצב פוקוס.\nכאן ניתן להוסיף פרטים נוספים על נושא זה.`;
    } else {
       nodeContent += `זהו תיאור קצר עבור עיגול זה.\nשורה שניה קצרה.`;
    }

    surroundingNodes.push({
      angle: angle, // Store original angle relative to center base
      baseR: r,
      currentR: r,
      targetR: r,
      col: color(random(150, 255), random(100, 200), random(200, 255)), // Lighter/pastel color range
      angleOffset: random(1000), // For wiggle
      baseX: x,
      baseY: y,
      currentX: x,
      currentY: y,
      targetX: x,
      targetY: y,
      label: label,
      content: nodeContent,
      contentAlpha: 0,
      expandedR: status2MinExpandedSize // Default expanded size, will be updated
    });
  }

  // Call updateCircleSizes AFTER nodes are created
  // This function needs the font to be potentially ready
  updateCircleSizesBasedOnContent();
  console.log("Nodes initialized");
}

// Calculate expanded size based on content length and estimated lines
function updateCircleSizesBasedOnContent() {
  // Temporarily set text properties for measurement
  push();
  if (BlinkyStar) {
      textFont(BlinkyStar); // Ensure the correct font is used for calculation
  } else {
      textFont('arial'); // Use fallback if font not loaded
  }
  textSize(contentTextSize);
  textAlign(CENTER, TOP);
  rectMode(CENTER); // Though not directly used for bounds, good practice

  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];

    // --- Estimate Title Size ---
    // Use current font settings to estimate label size if needed, but labelSize in draw is dynamic.
    // For expandedR calculation, let's focus more on content fitting.
    let tempLabelSize = constrain(status2MinExpandedSize * 0.25, 12, 36); // Estimate based on min expanded size
    let titleHeightEstimate = tempLabelSize * 1.2; // Approximate height needed for title

    // --- Estimate Content Size ---
    let roughContentWidth = status2MinExpandedSize * 0.7; // Estimate width based on min expanded size
    let bounds;

    // *** CORRECTED: Call textBounds as a method of the font object ***
    if (BlinkyStar) {
        // Make sure textFont is set to BlinkyStar before calling its methods
        textFont(BlinkyStar);
        textSize(contentTextSize); // Ensure correct size
        // Calculate bounds using the font object's method
        bounds = BlinkyStar.textBounds(node.content, 0, 0, roughContentWidth);
    } else {
        // Fallback calculation if font didn't load
        textFont('arial'); // Use fallback font for calculation
        textSize(contentTextSize);
        // Simple line count estimate as fallback
        let lines = node.content.split('\n').length;
        let approxLineHeight = contentTextSize * 1.5; // Estimate line height
        bounds = {
            x: 0, y: 0,
            w: min(roughContentWidth, textWidth(node.content.split('\n')[0] || '') * 1.1), // Estimate width roughly
            h: lines * approxLineHeight
        };
    }

    let contentHeightEstimate = bounds.h + 10; // Add some padding
    let contentWidthEstimate = bounds.w;

    // --- Calculate Required Radius ---
    let totalTextHeight = titleHeightEstimate + textContentPadding + contentHeightEstimate;
    let heightBasedRadius = totalTextHeight * 0.6; // Heuristic factor
    let widthBasedRadius = contentWidthEstimate / 0.7 / 1.8; // Estimate radius needed for width (adjust divisor as needed)

    // Base size calculation (length-based)
    let textLength = node.content.length;
    let minTextLength = 50;
    let maxTextLength = 400;
    let normalizedLength = constrain(textLength, minTextLength, maxTextLength);
    let sizeRange = status2MaxExpandedSize - status2MinExpandedSize;
    let sizeRatio = (normalizedLength - minTextLength) / (maxTextLength - minTextLength);
    let lengthBasedRadius = status2MinExpandedSize + (sizeRange * sizeRatio);

    // --- Determine Final Expanded Radius ---
    node.expandedR = constrain(
        max(heightBasedRadius, widthBasedRadius, lengthBasedRadius, node.baseR * 1.5),
        status2MinExpandedSize,
        status2MaxExpandedSize
    );
    // console.log(`Circle ${i+1}: Bounds=`, bounds, `HBR=${heightBasedRadius.toFixed(1)}, WBR=${widthBasedRadius.toFixed(1)}, LBR=${lengthBasedRadius.toFixed(1)}, Final Expanded R = ${node.expandedR.toFixed(1)}`);
  }
  pop(); // Restore previous text settings
}


function draw() {
  background('#F2A900'); // Orange background
  drawingContext.imageSmoothingEnabled = true; // Keep things smooth

  // --- Calculate Progress ---
  let elapsedTime = millis() - transitionStartTime;
  let easeOuter = ultraEaseInOut(constrain(elapsedTime / surroundingMoveDuration, 0, 1));
  let easeFocus = ultraEaseInOut(constrain(elapsedTime / focusTransitionDuration, 0, 1));
  let easeCenter = ultraEaseInOut(constrain(elapsedTime / centerGrowDuration, 0, 1));


  // --- Update Center Node ---
  let centerEase = (status === 0 || status === 1) ? easeCenter : easeFocus;
  centerNode.currentR = lerp(centerNode.currentR, centerNode.targetR, centerEase);
  centerNode.currentX = lerp(centerNode.currentX, centerNode.targetX, centerEase);
  centerNode.currentY = lerp(centerNode.currentY, centerNode.targetY, centerEase);
  let centerDisplayX = centerNode.currentX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;
  let centerDisplayY = centerNode.currentY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;

  // --- Update Surrounding Nodes ---
  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];
    let easing = (status === 2 && i === focusedNodeIndex) ? easeFocus : easeOuter;
    node.currentX = lerp(node.currentX, node.targetX, easing);
    node.currentY = lerp(node.currentY, node.targetY, easing);
    node.currentR = lerp(node.currentR, node.targetR, easing);
    node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
    node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;

    // --- Update Text Alpha ---
    let isActive = (status === 1 && node === centerNode) || (status === 2 && i === focusedNodeIndex);
    if (isActive) {
        if (elapsedTime >= textFadeInDelay) {
            let fadeProgress = constrain((elapsedTime - textFadeInDelay) / textFadeInDuration, 0, 1);
            // Check if alpha is already near target to prevent unnecessary lerp
             if (abs(node.contentAlpha - 255) > 1) {
                 node.contentAlpha = lerp(node.contentAlpha, 255, fadeProgress);
             } else {
                 node.contentAlpha = 255; // Snap to target if close
             }
        } else {
            // Reset alpha if transition just started and it's before delay
             if (elapsedTime < textFadeInDelay && node.contentAlpha !== 0) {
                node.contentAlpha = 0;
             }
        }
    } else { // Node is not active
        // Fade out if alpha is greater than 0
        if (node.contentAlpha > 0) {
             node.contentAlpha = lerp(node.contentAlpha, 0, textFadeOutSpeed);
             // Snap to 0 if very close
             if (node.contentAlpha < 1) {
                 node.contentAlpha = 0;
             }
        }
    }
  }
   // Explicitly handle center node alpha when not active
   if (status !== 1 && centerNode.contentAlpha > 0) {
       centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, textFadeOutSpeed);
        if (centerNode.contentAlpha < 1) centerNode.contentAlpha = 0;
   }


  // --- Draw Elements ---

  // Draw connecting lines
  stroke(0);
  strokeWeight(2);
  for (let node of surroundingNodes) {
    line(centerDisplayX, centerDisplayY, node.displayX, node.displayY);
  }
  noStroke();

  // Set default font for labels (might be overridden later)
  if (BlinkyStar) textFont(BlinkyStar); else textFont('arial');

  // Draw non-focused surrounding nodes
  for (let i = 0; i < surroundingNodes.length; i++) {
    if (status === 2 && i === focusedNodeIndex) continue; // Skip focused node
    let node = surroundingNodes[i];
    drawNodeWithShadow(node.displayX, node.displayY, node.currentR, node.col, 325);
    drawNodeLabel(node.displayX, node.displayY, node.currentR, node.label); // Only label
  }

  // Draw Center Node
  drawNodeWithShadow(centerDisplayX, centerDisplayY, centerNode.currentR, centerNode.col, 145);
  // Draw Center Node Text (Label + Content if status 1)
  // Ensure correct font is set before drawing text
  if (BlinkyStar) textFont(BlinkyStar); else textFont('arial');
  drawNodeText(centerDisplayX, centerDisplayY, centerNode.currentR, centerNode.label, centerNode.content, centerNode.contentAlpha, (status === 1));

  // Draw Focused Node (Status 2) - Draw last
  if (status === 2 && focusedNodeIndex !== null && focusedNodeIndex < surroundingNodes.length) {
    let node = surroundingNodes[focusedNodeIndex];
    drawNodeWithShadow(node.displayX, node.displayY, node.currentR, node.col, 325);
    // Draw Focused Node Text (Label + Content)
    // Ensure correct font is set before drawing text
    if (BlinkyStar) textFont(BlinkyStar); else textFont('arial');
    drawNodeText(node.displayX, node.displayY, node.currentR, node.label, node.content, node.contentAlpha, true); // Always show content
  }
}

// Helper function to draw a node (circle) with its shadow
function drawNodeWithShadow(x, y, r, col, shadowAngleDeg) {
  push();
  noStroke();
  // Shadow
  let shadowOffsetX = 3 * cos(radians(shadowAngleDeg));
  let shadowOffsetY = 3 * sin(radians(shadowAngleDeg));
  fill(0, 0, 0, 80); // Softer shadow
  ellipse(x + shadowOffsetX, y + shadowOffsetY, r);
  // Main Circle
  fill(col);
  ellipse(x, y, r);
  pop();
}

// Helper function to draw ONLY the node label (for non-focused nodes)
function drawNodeLabel(x, y, r, label) {
  push();
  // Font is assumed to be set by the caller (draw function)
  fill(0); // Black text
  noStroke();
  let textSizeValue = constrain(r * 0.25, 10, 20);
  textSize(textSizeValue);
  textAlign(CENTER, CENTER);
  text(label, x, y);
  pop();
}

// Helper function to draw node text (label + content) for focused/center nodes
function drawNodeText(x, y, r, label, content, contentAlpha, showContent) {
  push();
  // Font is assumed to be set by the caller (draw function)
  noStroke();

  // --- Draw Label ---
  let labelSize = constrain(r * 0.25, 12, 36);
  textSize(labelSize);
  fill(0);
  textAlign(CENTER, CENTER);

  let labelYOffset = 0;
  let contentHeightEstimate = 0;
  if (showContent) {
      // Estimate content height
      push();
      // Use the currently set font (should be correct from draw())
      textSize(contentTextSize);
      textAlign(CENTER, TOP);
      let tempBounds;
      let currentFont = drawingContext.font; // Get current font string
      // Check if BlinkyStar is loaded AND active
      if (BlinkyStar && currentFont.includes('Blinky Star')) { // Heuristic check
          tempBounds = BlinkyStar.textBounds(content, 0, 0, r * 0.75);
      } else {
          // Fallback estimate if font not loaded or not active
          tempBounds = { h: content.split('\n').length * contentTextSize * 1.4 };
      }
      contentHeightEstimate = tempBounds.h;
      pop();
      labelYOffset = - (contentHeightEstimate / 2 + textContentPadding / 2);
       if (isNaN(labelYOffset)) labelYOffset = 0; // Safety check for NaN
  }
  text(label, x, y + labelYOffset);


  // --- Draw Content ---
  if (showContent && contentAlpha > 10) {
    push();
    fill(0, contentAlpha);
    textSize(contentTextSize);
    textAlign(CENTER, TOP); // Align text block top-center
    rectMode(CENTER);

    let textWidth = r * 0.75;
    let labelBottomApprox = y + labelYOffset + labelSize * 0.5;
    let contentY_Top = labelBottomApprox + textContentPadding;
    let availableHeight = (y + r * 0.5) - contentY_Top - 10; // Max height available

    if (availableHeight > contentTextSize) {
       text(content, x, contentY_Top, textWidth, availableHeight);
    }
    pop();
  }
  pop();
}


function mousePressed() {
    let clickedOnNode = false;

    // Check click on Center Node
    // Use displayX/Y which includes wiggle
    let dCenter = dist(mouseX, mouseY, centerNode.displayX, centerNode.displayY);
    if (dCenter < centerNode.currentR / 2) {
        handleCenterNodeClick();
        clickedOnNode = true;
    }

    // Check click on Surrounding Nodes (only if center wasn't clicked)
    if (!clickedOnNode) {
        for (let i = 0; i < surroundingNodes.length; i++) {
            let node = surroundingNodes[i];
            let dSurrounding = dist(mouseX, mouseY, node.displayX, node.displayY);
            if (dSurrounding < node.currentR / 2) {
                handleSurroundingNodeClick(i);
                clickedOnNode = true;
                break;
            }
        }
    }

    // Check click outside any node (Background Click)
    if (!clickedOnNode) {
        handleBackgroundClick();
    }
}

function handleCenterNodeClick() {
    console.log("Center node clicked. Current status:", status);
    if (status === 1) {
        console.log("Center re-clicked. Returning to status 0.");
        status = 0;
        transitionStartTime = millis();
        resetPositions();
        return;
    }
    if (status === 2 && focusedNodeIndex !== null) {
        resetFocusedNode(); // Prepare for transition from status 2
    }
    status = 1;
    console.log("New status: 1");
    transitionStartTime = millis();
    centerNode.targetR = centerNode.expandedR;
    centerNode.targetX = width / 2;
    centerNode.targetY = height / 2;
    centerNode.contentAlpha = 0; // Start fade-in
    moveSurroundingNodes(status1ExpansionAmount, true);
}

function handleSurroundingNodeClick(index) {
    console.log(`Surrounding node ${index} clicked. Current status:`, status);
    if (status === 2 && focusedNodeIndex === index) {
        console.log(`Re-clicked focused node ${index}. Returning to status 0.`);
        status = 0;
        transitionStartTime = millis();
        resetFocusedNode();
        resetPositions();
        return;
    }

    let previouslyFocused = focusedNodeIndex;
    status = 2;
    focusedNodeIndex = index;
    transitionStartTime = millis();
    console.log("New status: 2, Focused index:", focusedNodeIndex);

    // Reset Previous State
    if (previouslyFocused !== null && previouslyFocused !== index && previouslyFocused < surroundingNodes.length) { // Added boundary check
        let prevNode = surroundingNodes[previouslyFocused];
        prevNode.targetR = prevNode.baseR;
        prevNode.contentAlpha = 0;
        console.log(`Resetting previously focused node ${previouslyFocused}`);
    }
     if (centerNode.contentAlpha > 0) {
         centerNode.contentAlpha = 0;
         console.log("Resetting center node text alpha");
     }


    // Targets for NEWLY Focused Node
    let focusedNode = surroundingNodes[index];
    focusedNode.targetX = width / 2;
    focusedNode.targetY = height / 2;
    focusedNode.targetR = focusedNode.expandedR;
    focusedNode.contentAlpha = 0; // Start fade-in

    console.log(`Setting targets for focused node ${index}: X=${focusedNode.targetX}, Y=${focusedNode.targetY}, R=${focusedNode.targetR}`);

    // Targets for Center Node
    centerNode.targetX = width / 2 + status2CenterOffset;
    centerNode.targetY = height / 2;
    centerNode.targetR = centerDefaultSize * status2CenterShrinkFactor;
    console.log(`Setting targets for center node: X=${centerNode.targetX}, Y=${centerNode.targetY}, R=${centerNode.targetR}`);

    // Targets for OTHER Surrounding Nodes
    moveOtherNodesAway(index);
}

function handleBackgroundClick() {
    console.log("Background clicked. Current status:", status);
    if (status !== 0) {
        console.log("Returning to status 0.");
        status = 0;
        transitionStartTime = millis();
        if (focusedNodeIndex !== null) {
           resetFocusedNode();
        }
        resetPositions();
    } else {
        console.log("Already in status 0. No change.");
    }
}

// Helper to reset the state of the currently focused node
function resetFocusedNode() {
    if (focusedNodeIndex !== null && focusedNodeIndex < surroundingNodes.length) { // Added check
        let node = surroundingNodes[focusedNodeIndex];
        node.contentAlpha = 0; // Hide text immediately
         // Target R and position will be handled by resetPositions
        console.log(`Resetting focused node ${focusedNodeIndex} state (alpha)`);
        focusedNodeIndex = null;
    } else {
       focusedNodeIndex = null; // Ensure it's null
    }
}

// Helper function to reset all nodes to their base positions and sizes (Status 0)
function resetPositions() {
    console.log("Resetting all node positions to base state (Status 0)");
    // Reset Center Node
    centerNode.targetX = width / 2;
    centerNode.targetY = height / 2;
    centerNode.targetR = centerDefaultSize;
    if (centerNode.contentAlpha !== 0) centerNode.contentAlpha = 0;

    // Reset Surrounding Nodes
    resetSurroundingNodesToBase();
    // Ensure no node is marked as focused (might be redundant but safe)
    focusedNodeIndex = null;
}

// Helper function to specifically reset surrounding nodes to base state
function resetSurroundingNodesToBase() {
     console.log("Resetting surrounding nodes to base positions/sizes");
    for (let node of surroundingNodes) {
        node.targetX = node.baseX;
        node.targetY = node.baseY;
        node.targetR = node.baseR;
        if (node.contentAlpha !== 0) node.contentAlpha = 0;
    }
}

// Helper function to move surrounding nodes outwards (Status 1 expansion)
function moveSurroundingNodes(expansionAmount, expand = true) {
    let cumulativeDelay = 0;
    let indices = [...Array(surroundingNodes.length).keys()];
    shuffle(indices, true);

    for (let i = 0; i < indices.length; i++) {
        let nodeIndex = indices[i];
        let node = surroundingNodes[nodeIndex];
        let angle = node.angle;
        let distance;
        let targetX, targetY;

        if (expand) {
            distance = baseDistance + expansionAmount + random(-20, 20);
            targetX = centerNode.baseX + cos(angle) * distance;
            targetY = centerNode.baseY + sin(angle) * distance;
        } else {
            targetX = node.baseX;
            targetY = node.baseY;
        }

        setTimeout(() => {
            // Check if node still exists (relevant if resizing happens during timeout)
            if(surroundingNodes[nodeIndex]) {
                surroundingNodes[nodeIndex].targetX = targetX;
                surroundingNodes[nodeIndex].targetY = targetY;
                surroundingNodes[nodeIndex].targetR = node.baseR;
            }
        }, cumulativeDelay);

        cumulativeDelay += random(status1DelayRandomRange[0], status1DelayRandomRange[1]);
    }
    console.log(`Moving surrounding nodes. Expand: ${expand}`);
}

// Helper function to move non-focused nodes away in Status 2
function moveOtherNodesAway(focusedIdx) {
     let cumulativeDelay = 0;
     console.log("Moving other nodes away for status 2");
      for (let j = 0; j < surroundingNodes.length; j++) {
        if (j === focusedIdx) continue;

        let otherNode = surroundingNodes[j];
        let angle = atan2(otherNode.baseY - height/2, otherNode.baseX - width/2);
        let distance = width * 0.6 + random(-50, 50);
        let targetX = width / 2 + cos(angle) * distance;
        let targetY = height / 2 + sin(angle) * distance;
        let delay = cumulativeDelay;

        setTimeout(() => {
             // Check if node still exists
            if(surroundingNodes[j]) {
                surroundingNodes[j].targetX = targetX;
                surroundingNodes[j].targetY = targetY;
                surroundingNodes[j].targetR = otherNode.baseR * random(0.8, 1.1);
                if (surroundingNodes[j].contentAlpha !== 0) surroundingNodes[j].contentAlpha = 0;
            }
        }, delay);

        cumulativeDelay += random(status2DelayRandomRange[0], status2DelayRandomRange[1]);
    }
}

// Easing function
function ultraEaseInOut(t) {
  t = constrain(t, 0, 1);
  return t < 0.5
    ? pow(t * 2, easeInPower) / 2
    : 1 - pow((1 - t) * 2, easeOutPower) / 2;
}
