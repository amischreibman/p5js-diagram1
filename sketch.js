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
  initNodes();

  if (BlinkyStar) {
    textFont(BlinkyStar);
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

  updateCircleSizesBasedOnContent(); // Calculate expanded sizes after all nodes are created
  console.log("Nodes initialized");
}

// Calculate expanded size based on content length and estimated lines
function updateCircleSizesBasedOnContent() {
  push(); // Use push/pop to isolate text settings for measurement
  textSize(contentTextSize); // Use the standard content text size for measurement
  textAlign(CENTER, TOP);
  rectMode(CENTER);

  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];

    // --- Estimate Title Size ---
    let tempLabelSize = constrain(status2MinExpandedSize * 0.25, 12, 36); // Estimate based on min expanded size
    let titleHeightEstimate = tempLabelSize * 1.2; // Approximate height needed for title

    // --- Estimate Content Size ---
    // Calculate rough width based on a potential radius, then use textBounds
    let roughContentWidth = status2MinExpandedSize * 0.7; // Estimate based on min expanded size
    // Use textBounds for a more accurate height calculation based on wrapping
    let bounds = BlinkyStar ? textBounds(node.content, 0, 0, roughContentWidth) : { h: contentTextSize * node.content.split('\n').length * 1.5 }; // Fallback if font fails
    let contentHeightEstimate = bounds.h + 10; // Add some padding


    // --- Calculate Required Radius ---
    // Total estimated vertical space needed: title + padding + content
    let totalTextHeight = titleHeightEstimate + textContentPadding + contentHeightEstimate;
    // Estimate radius needed to fit this height (roughly half the height, plus buffer)
    let heightBasedRadius = totalTextHeight * 0.6; // Heuristic factor

    // Also consider width needed for text
    let widthBasedRadius = (bounds.w || roughContentWidth) / 0.7 / 2; // Estimate radius needed for width

    // Base size calculation (similar to before, but less critical now)
    let textLength = node.content.length;
    let minTextLength = 50;
    let maxTextLength = 400; // Increased cap slightly
    let normalizedLength = constrain(textLength, minTextLength, maxTextLength);
    let sizeRange = status2MaxExpandedSize - status2MinExpandedSize;
    let sizeRatio = (normalizedLength - minTextLength) / (maxTextLength - minTextLength);
    let lengthBasedRadius = status2MinExpandedSize + (sizeRange * sizeRatio);

    // --- Determine Final Expanded Radius ---
    // Must be large enough for: calculated text height, calculated text width, length-based size,
    // minimum expanded size, and at least 1.5x base size.
    node.expandedR = constrain(
        max(heightBasedRadius, widthBasedRadius, lengthBasedRadius, node.baseR * 1.5),
        status2MinExpandedSize, // Global minimum expanded size
        status2MaxExpandedSize  // Global maximum expanded size
    );

    // console.log(`Circle ${i+1}: TextLines=${node.content.split('\n').length}, HBR=${heightBasedRadius.toFixed(1)}, WBR=${widthBasedRadius.toFixed(1)}, LBR=${lengthBasedRadius.toFixed(1)}, Final Expanded R = ${node.expandedR.toFixed(1)}`);
  }
  pop(); // Restore previous text settings
}


function draw() {
  background('#F2A900'); // Orange background
  drawingContext.imageSmoothingEnabled = true; // Keep things smooth

  // --- Calculate Progress ---
  let elapsedTime = millis() - transitionStartTime;
  // Use different durations/easing based on context
  let easeOuter = ultraEaseInOut(constrain(elapsedTime / surroundingMoveDuration, 0, 1)); // For non-focused elements
  let easeFocus = ultraEaseInOut(constrain(elapsedTime / focusTransitionDuration, 0, 1)); // For the focused element transition
  let easeCenter = ultraEaseInOut(constrain(elapsedTime / centerGrowDuration, 0, 1)); // For center node transitions (status 0 <-> 1)


  // --- Update Center Node ---
  // Use appropriate easing based on whether it's the main transition (0<->1) or reacting to status 2
  let centerEase = (status === 0 || status === 1) ? easeCenter : easeFocus;
  centerNode.currentR = lerp(centerNode.currentR, centerNode.targetR, centerEase);
  centerNode.currentX = lerp(centerNode.currentX, centerNode.targetX, centerEase);
  centerNode.currentY = lerp(centerNode.currentY, centerNode.targetY, centerEase);

  // Apply wiggle
  let centerDisplayX = centerNode.currentX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;
  let centerDisplayY = centerNode.currentY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;

  // --- Update Surrounding Nodes ---
  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];
    // Determine easing: faster if it's the focused node, slower otherwise
    let easing = (status === 2 && i === focusedNodeIndex) ? easeFocus : easeOuter;

    // Update position and radius
    node.currentX = lerp(node.currentX, node.targetX, easing);
    node.currentY = lerp(node.currentY, node.targetY, easing);
    node.currentR = lerp(node.currentR, node.targetR, easing);

    // Apply wiggle
    node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
    node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;

    // --- Update Text Alpha ---
    // Fade In Logic
    if ((status === 1 && node === centerNode) || (status === 2 && i === focusedNodeIndex)) {
        if (elapsedTime >= textFadeInDelay) {
            let fadeProgress = constrain((elapsedTime - textFadeInDelay) / textFadeInDuration, 0, 1);
            node.contentAlpha = lerp(node.contentAlpha, 255, fadeProgress); // Lerp towards 255
        } else {
            // Ensure alpha stays 0 before the delay starts
             if(node.contentAlpha !== 0 && transitionStartTime === millis()) { // Reset alpha if transition just started
               node.contentAlpha = 0;
             }
        }
    }
    // Fade Out Logic (apply more broadly)
    else {
       // If alpha is targeted to be 0, fade it out
        if (node.contentAlpha > 0) {
             node.contentAlpha = lerp(node.contentAlpha, 0, textFadeOutSpeed);
        }
        // Ensure alpha is precisely 0 if it's very close
        if (node.contentAlpha < 1) {
            node.contentAlpha = 0;
        }
    }
  }
  
  // Update center node text alpha separately if it's not handled in the loop above (e.g., transitioning away from status 1)
  if (status !== 1 && centerNode.contentAlpha > 0) {
     centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, textFadeOutSpeed);
     if (centerNode.contentAlpha < 1) centerNode.contentAlpha = 0;
  } else if (status === 1) {
     // Handle fade-in for center node when status becomes 1 (if not already handled)
     if (elapsedTime >= textFadeInDelay) {
        let fadeProgress = constrain((elapsedTime - textFadeInDelay) / textFadeInDuration, 0, 1);
        centerNode.contentAlpha = lerp(centerNode.contentAlpha, 255, fadeProgress);
     } else {
        if(centerNode.contentAlpha !== 0 && transitionStartTime === millis()) {
           centerNode.contentAlpha = 0;
        }
     }
  }


  // --- Draw Elements ---

  // Draw connecting lines (draw these first, underneath)
  stroke(0);
  strokeWeight(2); // Thinner lines
  for (let node of surroundingNodes) {
    // Don't draw line to focused node if it's exactly at center? Optional.
    // if (!(status === 2 && node === surroundingNodes[focusedNodeIndex])) {
       line(centerDisplayX, centerDisplayY, node.displayX, node.displayY);
    // }
  }
  noStroke(); // Turn off stroke for drawing circles

  // Draw non-focused surrounding nodes
  for (let i = 0; i < surroundingNodes.length; i++) {
    // Skip drawing the focused node here; it will be drawn last (on top)
    if (status === 2 && i === focusedNodeIndex) continue;

    let node = surroundingNodes[i];
    drawNodeWithShadow(node.displayX, node.displayY, node.currentR, node.col, 325); // Draw node with shadow
    // Draw label ONLY for non-focused nodes
    drawNodeLabel(node.displayX, node.displayY, node.currentR, node.label);
  }

  // Draw Center Node
  drawNodeWithShadow(centerDisplayX, centerDisplayY, centerNode.currentR, centerNode.col, 145);
  // Draw Center Node Text (Label and Content if status 1)
  drawNodeText(centerDisplayX, centerDisplayY, centerNode.currentR, centerNode.label, centerNode.content, centerNode.contentAlpha, (status === 1));

  // Draw Focused Node (Status 2) - Draw last to ensure it's on top
  if (status === 2 && focusedNodeIndex !== null && focusedNodeIndex < surroundingNodes.length) {
    let node = surroundingNodes[focusedNodeIndex];
    drawNodeWithShadow(node.displayX, node.displayY, node.currentR, node.col, 325);
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
  fill(0, 0, 0, 80); // Softer, semi-transparent black shadow
  ellipse(x + shadowOffsetX, y + shadowOffsetY, r);
  // Main Circle
  fill(col);
  ellipse(x, y, r);
  pop();
}

// Helper function to draw ONLY the node label (for non-focused nodes)
function drawNodeLabel(x, y, r, label) {
  push();
  fill(0); // Black text
  noStroke();
  let textSizeValue = constrain(r * 0.25, 10, 20); // Constrain label size
  textSize(textSizeValue);
  textAlign(CENTER, CENTER); // Center the label within the circle
  text(label, x, y);
  pop();
}

// Helper function to draw node text (label + content) for focused/center nodes
function drawNodeText(x, y, r, label, content, contentAlpha, showContent) {
  push();
  noStroke();

  // --- Draw Label ---
  let labelSize = constrain(r * 0.25, 12, 36); // Constrained label size
  textSize(labelSize);
  fill(0); // Black label
  textAlign(CENTER, CENTER); // Center the label horizontally and vertically first

  // Calculate label Y position based on whether content will be shown
  let labelYOffset = 0;
  
  if (showContent) {
    // כאשר מציגים תוכן, הכותרת עולה למעלה באופן קבוע
    labelYOffset = -r * 0.3; // offset קבוע של 30% מגודל העיגול
  }
  
  // Draw the label at its calculated Y position
  text(label, x, y + labelYOffset);

  // --- Draw Content ---
  // Only draw content if alpha is significant and showContent flag is true
  if (showContent && contentAlpha > 10) {
    push();
    fill(0, contentAlpha); // Use calculated alpha for fade effect
    textSize(contentTextSize); // Use fixed content text size
    textAlign(CENTER, TOP); // Align text to the TOP-CENTER
    
    // Calculate available width for the text box inside the circle
    let textWidth = r * 0.75; // Use 75% of radius for width
    
    // המרחק הקבוע בין הכותרת לתוכן
    let fixedPadding = textContentPadding;
    
    // חישוב מיקום התחלת הטקסט - תמיד באותו מרחק מהכותרת
    // מיקום הכותרת + גובה הכותרת + רווח קבוע
    let contentY_Top = y + labelYOffset + labelSize/2 + fixedPadding;
    
    // חישוב הגובה המקסימלי המותר לטקסט
    let availableHeight = (y + r/2) - contentY_Top - 10; // מגבול העיגול התחתון עד למיקום התחלת הטקסט
    
    if (availableHeight > contentTextSize) { // וודא שיש מקום לפחות לשורה אחת
      text(content, x, contentY_Top, textWidth, availableHeight);
    }
    
    pop();
  }
  pop();
}

function mousePressed() {
    let clickedOnNode = false;

    // Check click on Center Node
    let dCenter = dist(mouseX, mouseY, centerNode.currentX, centerNode.currentY);
    if (dCenter < centerNode.currentR / 2) {
        handleCenterNodeClick();
        clickedOnNode = true;
    }

    // Check click on Surrounding Nodes (only if center wasn't clicked)
    if (!clickedOnNode) {
        for (let i = 0; i < surroundingNodes.length; i++) {
            let node = surroundingNodes[i];
            // Use displayX/Y for click check as that includes wiggle
            let dSurrounding = dist(mouseX, mouseY, node.displayX, node.displayY);
            if (dSurrounding < node.currentR / 2) {
                handleSurroundingNodeClick(i);
                clickedOnNode = true;
                break; // Exit loop once a node is clicked
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

    // *** Change: If center is clicked when already in status 1, go to status 0 ***
    if (status === 1) {
        console.log("Center re-clicked. Returning to status 0.");
        status = 0;
        transitionStartTime = millis();
        resetPositions(); // Reset all nodes to default positions/sizes
        return;
    }

    // If in status 2, reset the focused node first, then proceed to status 1
    if (status === 2 && focusedNodeIndex !== null) {
        resetFocusedNode();
    }

    // Otherwise (usually coming from status 0), go to status 1
    status = 1;
    console.log("New status: 1");
    transitionStartTime = millis();

    // Set targets for Status 1 (Center Expanded)
    centerNode.targetR = centerNode.expandedR;
    centerNode.targetX = width / 2; // Ensure it stays centered
    centerNode.targetY = height / 2;
    // Move surrounding nodes outwards (using the helper function)
    moveSurroundingNodes(status1ExpansionAmount, true); // Expand outwards
}

function handleSurroundingNodeClick(index) {
    console.log(`Surrounding node ${index} clicked. Current status:`, status);

    // *** Change: If the clicked node is already focused in status 2, go to status 0 ***
    if (status === 2 && focusedNodeIndex === index) {
        console.log(`Re-clicked focused node ${index}. Returning to status 0.`);
        status = 0;
        transitionStartTime = millis();
        resetFocusedNode(); // Reset the node that was focused
        resetPositions();   // Reset all nodes to default positions/sizes
        return; // Stop further processing
    }

    // --- Proceed with focusing the clicked node ---
    let previouslyFocused = focusedNodeIndex;

    // Set status and focused index immediately
    status = 2;
    focusedNodeIndex = index;
    transitionStartTime = millis(); // Reset transition timer

    console.log("New status: 2, Focused index:", focusedNodeIndex);

    // --- Reset Previous State ---
    // Reset the *previously* focused node (if different)
    if (previouslyFocused !== null && previouslyFocused !== index) {
        let prevNode = surroundingNodes[previouslyFocused];
        prevNode.targetR = prevNode.baseR; // Start shrinking previous node
        prevNode.contentAlpha = 0; // Hide its text immediately
        // Its position will be updated in the loop below
        console.log(`Resetting previously focused node ${previouslyFocused}`);
    }
    // Reset the center node's text alpha if it was visible (coming from status 1)
    if (centerNode.contentAlpha > 0) {
         centerNode.contentAlpha = 0;
         console.log("Resetting center node text alpha");
    }

    // --- Set Targets for the NEWLY Focused Node ---
    let focusedNode = surroundingNodes[index];
    focusedNode.targetX = width / 2;   // Target: center X
    focusedNode.targetY = height / 2;   // Target: center Y
    focusedNode.targetR = focusedNode.expandedR; // Target: calculated expanded size
    // Ensure its alpha starts low for fade-in (handled in draw)
    // focusedNode.contentAlpha = 0; // Let draw handle the fade-in from 0

    console.log(`Setting targets for focused node ${index}: X=${focusedNode.targetX}, Y=${focusedNode.targetY}, R=${focusedNode.targetR}`);

    // --- Set Targets for the Center Node ---
    centerNode.targetX = width / 2 + status2CenterOffset;
    centerNode.targetY = height / 2;
    centerNode.targetR = centerDefaultSize * status2CenterShrinkFactor; // Shrink center node
    console.log(`Setting targets for center node: X=${centerNode.targetX}, Y=${centerNode.targetY}, R=${centerNode.targetR}`);

    // --- Set Targets for OTHER Surrounding Nodes ---
    moveOtherNodesAway(index);
}

function handleBackgroundClick() {
    console.log("Background clicked. Current status:", status);
    // *** Change: Always return to status 0 on background click ***
    if (status !== 0) {
        console.log("Returning to status 0.");
        status = 0;
        transitionStartTime = millis();
        if (focusedNodeIndex !== null) {
           resetFocusedNode(); // Reset the node that was focused if applicable
        }
        resetPositions();   // Reset all nodes to default positions/sizes
    } else {
        console.log("Already in status 0. No change.");
    }
}

// Helper to reset the state of the currently focused node
function resetFocusedNode() {
    if (focusedNodeIndex !== null && focusedNodeIndex < surroundingNodes.length) {
        let node = surroundingNodes[focusedNodeIndex];
        // Don't reset targetR here if resetPositions is called next,
        // but DO reset alpha immediately.
        node.contentAlpha = 0; // Hide text immediately
        console.log(`Resetting focused node ${focusedNodeIndex} state (alpha)`);
        focusedNodeIndex = null; // Clear the focused index
    } else {
       focusedNodeIndex = null; // Ensure it's null even if index was invalid
    }
}

// Helper function to reset all nodes to their base positions and sizes (Status 0)
function resetPositions() {
    console.log("Resetting all node positions to base state (Status 0)");
    // Reset Center Node
    centerNode.targetX = width / 2;
    centerNode.targetY = height / 2;
    centerNode.targetR = centerDefaultSize;
    if (centerNode.contentAlpha > 0) centerNode.contentAlpha = 0; // Ensure text is hidden

    // Reset Surrounding Nodes
    resetSurroundingNodesToBase();
    // Ensure no node is marked as focused
    focusedNodeIndex = null;
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

// Helper function to move surrounding nodes outwards (Status 1 expansion)
function moveSurroundingNodes
