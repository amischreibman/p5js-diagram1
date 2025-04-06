// === הגדרות בסיס ===
let hoverAnimationDuration = 300;
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
// --- זו השורה שקובעת את הריווח הבסיסי ---
let textContentPadding = 30;
// ------------------------------------------
let textFadeInDelay = 200;
let textFadeInSpeed = 0.5;

// === סטטוס 0 (דיפולטיבי) ===
let centerDefaultSize = 180;

// === סטטוס 1 (גדילה) ===
let growthMultiplier = 1.5;
let status1ExpansionAmount = 100;
let status1CenterDelay = 0;
let status1DelayRandomRange = [4, 20];

// === סטטוס 2 (התכווצות/מיקוד) ===
let status2ShrinkDuration = 3500;
let status2CenterOffset = 100;
let status2CenterShrinkFactor = 0.4;
let status2GrowDuration = 2500;
let status2MinExpandedSize = 300;
let status2MaxExpandedSize = 500;
let status2DelayRandomRange = [4, 20];

// === משתנים נוספים למבנה האנימציה ===
let centerNode;
let surroundingNodes = [];
let status = 0;
let focusedNodeIndex = null;
let transitionStartTime = 0;
let hoverStartTimes = [];
let winkyFont;
let focusSwitchTimer = null;
let pendingFocusedIndex = null;
let isFocusSwitching = false;
let BlinkyStar;

// === תוכן נוסף לעיגולים ===
let defaultContent = "This is a paragraph of sample text that will appear when the circle is focused.";

// === פונקציות ===
function preload() {
  try {
    BlinkyStar = loadFont('Blinky Star.otf');
  } catch(e) {
    console.log("לא ניתן לטעון את הפונט, משתמש בפונט ברירת המחדל");
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  initNodes();

  if (BlinkyStar) {
    textFont(BlinkyStar);
  } else {
    textFont('arial');
  }

  textAlign(CENTER, CENTER);
  drawingContext.textBaseline = 'middle';
  drawingContext.textAlign = 'center';
  pixelDensity(1);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initNodes();
}

function initNodes() {
  hoverStartTimes = [];
  surroundingNodes = [];
  focusedNodeIndex = null;
  status = 0;

  centerNode = {
    baseX: width / 2,
    baseY: height / 2,
    r: centerDefaultSize,
    currentR: centerDefaultSize,
    col: color(0, 102, 255),
    angleOffset: random(1000),
    targetX: width / 2,
    targetY: height / 2,
    currentX: width / 2,
    currentY: height / 2, // תיקון קטן - היה width/2
    label: 'text 0',
    content: "This is the main central node. It contains important information about the core concept. Click on surrounding nodes to explore related topics.",
    contentAlpha: 0
  };

  centerNode.expandedR = centerDefaultSize * growthMultiplier;

  let maxTries = 1000;
  while (surroundingNodes.length < 10 && maxTries > 0) {
    maxTries--;
    let angle = random(TWO_PI);
    let distFromCenter = random(baseDistance, baseDistance + 100);
    let r = random(50, 80) * 1.25;
    let x = centerNode.baseX + cos(angle) * distFromCenter;
    let y = centerNode.baseY + sin(angle) * distFromCenter;

    let overlaps = false;
    for (let other of surroundingNodes) {
      if (dist(x, y, other.baseX, other.baseY) < r + other.r + 20) {
        overlaps = true;
        break;
      }
    }
    if (overlaps) continue;

    hoverStartTimes.push(0);

    let nodeIndex = surroundingNodes.length + 1;
    // --- תיקון קטן: הוספת גרשיים חסרים ---
    let nodeContent = `This is unique content for circle ${nodeIndex}. `;
    // --------------------------------------

    if (nodeIndex % 3 === 0) {
      nodeContent += `This text will be displayed when the circle is in focus mode. Here you can add more details about this specific topic or concept. The circle will grow larger to accommodate this longer text content. The size is calculated dynamically based on text length.`;
    } else if (nodeIndex % 3 === 1) {
      nodeContent += `This text will be displayed when the circle is in focus mode. Here you can add more details about this specific topic or concept.`;
    } else {
      nodeContent += `This is a short description for this circle.`;
    }

    surroundingNodes.push({
      angle: angle,
      r: r,
      col: color(random(255), random(255), random(255)),
      angleOffset: random(1000),
      baseX: x,
      baseY: y,
      currentX: x,
      currentY: y,
      targetX: x,
      targetY: y,
      currentR: r,
      baseR: r,
      // --- תיקון קטן: הוספת גרשיים חסרים ---
      label: `text ${nodeIndex}`,
      // --------------------------------------
      content: nodeContent,
      contentAlpha: 0,
      expandedR: status2MinExpandedSize
    });
  }

  updateCircleSizesBasedOnContent();
}

function updateCircleSizesBasedOnContent() {
  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];
    let textLength = node.content.length;

    let minTextLength = 50;
    let maxTextLength = 300;

    let normalizedLength = constrain(textLength, minTextLength, maxTextLength);
    let sizeRange = status2MaxExpandedSize - status2MinExpandedSize;
    let sizeRatio = (normalizedLength - minTextLength) / (maxTextLength - minTextLength);

    node.expandedR = status2MinExpandedSize + (sizeRange * sizeRatio);

    // --- תיקון קטן: הוספת גרשיים ---
    console.log(`Circle ${i+1}: Text length = ${textLength}, Expanded size = ${node.expandedR}`);
    // ---------------------------------
  }
}

function draw() {
  let expandedSize = centerDefaultSize * growthMultiplier;

  background('#F2A900');
  drawingContext.imageSmoothingEnabled = true;

  let centerT = constrain((millis() - transitionStartTime) / centerGrowDuration, 0, 1);
  let outerT = constrain((millis() - transitionStartTime) / surroundingMoveDuration, 0, 1);
  let easeCenter = ultraEaseInOut(centerT);
  let easeOuter = ultraEaseInOut(outerT);

  let centerTargetR = status === 1 ? expandedSize : (status === 2 ? expandedSize * status2CenterShrinkFactor : centerDefaultSize);
  centerNode.currentR = lerp(centerNode.currentR, centerTargetR, easeCenter);
  centerNode.currentX = lerp(centerNode.currentX, centerNode.targetX, easeCenter);
  centerNode.currentY = lerp(centerNode.currentY, centerNode.targetY, easeCenter);

  let centerDisplayX = centerNode.currentX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;
  let centerDisplayY = centerNode.currentY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;

  stroke(0);
  strokeWeight(3);

  if (status === 0 || status === 1) {
    // ... (קוד ציור עיגולים מסביב וקווים - ללא שינוי) ...
     for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      node.currentX = lerp(node.currentX, node.targetX, easeOuter);
      node.currentY = lerp(node.currentY, node.targetY, easeOuter);
      let targetR = (node.targetR !== undefined) ? node.targetR : node.baseR;
      if (node.hoverTargetR !== undefined && i !== focusedNodeIndex) {
        targetR = node.hoverTargetR;
      }
      let hoverElapsed = millis() - max(transitionStartTime, hoverStartTimes[i]);
      let hoverDuration = (status === 2 && i === focusedNodeIndex) ? status2GrowDuration : hoverAnimationDuration;
      let tHover = constrain(hoverElapsed / hoverDuration, 0, 1);
      let easeHover = ultraEaseInOut(tHover);
      node.currentR = lerp(node.currentR, targetR, easeHover);

      node.contentAlpha = lerp(node.contentAlpha, 0, 0.1); // Fade out content if not focused

      node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;

      line(centerDisplayX, centerDisplayY, node.displayX, node.displayY);
    }

    for (let i = 0; i < surroundingNodes.length; i++) {
       let node = surroundingNodes[i];
       let shadowOffsetX = 3 * cos(radians(325));
       let shadowOffsetY = 3 * sin(radians(325));
       fill(0);
       ellipse(
         node.displayX + shadowOffsetX,
         node.displayY + shadowOffsetY,
         node.currentR
       );
       fill(node.col);
       ellipse(node.displayX, node.displayY, node.currentR);

       push();
       fill(0);
       noStroke();
       drawingContext.imageSmoothingEnabled = true;
       drawingContext.imageSmoothingQuality = 'high';
       let textSizeValue = min(node.currentR * textMaxSizePercentage, 20);
       textSize(textSizeValue);
       drawingContext.shadowColor = textShadowColor;
       drawingContext.shadowBlur = textShadowBlur;
       drawingContext.shadowOffsetX = 0;
       drawingContext.shadowOffsetY = 0;
       text(node.label, node.displayX, node.displayY);
       pop();
     }


    // --- ציור עיגול מרכזי ---
    push();
    noStroke();
    drawingContext.filter = 'none';
    let shadowOffsetX = 3 * cos(radians(145));
    let shadowOffsetY = 3 * sin(radians(145));
    fill(0);
    ellipse(
      centerDisplayX + shadowOffsetX,
      centerDisplayY + shadowOffsetY,
      centerNode.currentR
    );
    pop();

    fill(centerNode.col);
    ellipse(centerDisplayX, centerDisplayY, centerNode.currentR);

    // --- ציור טקסט עיגול מרכזי ---
    push();
    fill(0);
    noStroke();
    drawingContext.imageSmoothingEnabled = true;
    drawingContext.imageSmoothingQuality = 'high';
    let centerTextSize = min(centerNode.currentR * 0.25, 36);
    textSize(centerTextSize);
    drawingContext.shadowColor = textShadowColor;
    drawingContext.shadowBlur = textShadowBlur * 1.5;
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;

    if (status === 1) { // <-- זה הקוד שרץ כשהעיגול המרכזי במצב גדילה
      let titleOffset = map(centerNode.contentAlpha, 0, 255, 0, -centerNode.currentR * 0.15);
      // ציור הכותרת
      text(centerNode.label, centerDisplayX, centerDisplayY + titleOffset);

      if (centerNode.contentAlpha > 10) { // <-- הצגת הפסקה רק כשהיא מתחילה להופיע
        push();
        fill(0, centerNode.contentAlpha);
        noStroke();
        textSize(16); // גודל טקסט קבוע לפסקה
        textAlign(CENTER, CENTER);
        rectMode(CENTER);
        let textWidth = centerNode.currentR * 0.7;
        let textHeight = centerNode.currentR * 0.6;

        // ****** כאן מתבצע החישוב והשימוש ב-textContentPadding ******
        let adjustedPadding = textContentPadding * (centerNode.currentR / 400); // <-- חישוב הריווח היחסי
        // *************************************************************

        // ציור הפסקה עם הריווח המחושב
        text(centerNode.content, centerDisplayX, centerDisplayY + titleOffset + centerTextSize + adjustedPadding, textWidth, textHeight); // <-- שימוש ב-adjustedPadding
        pop();
      }

      // לוגיקה להופעה הדרגתית של הטקסט (contentAlpha)
      let centerElapsed = millis() - transitionStartTime;
      if (centerElapsed > textFadeInDelay) {
        let fadeElapsed = centerElapsed - textFadeInDelay;
        let alphaProgress = constrain(fadeElapsed / 500, 0, 1);
        centerNode.contentAlpha = lerp(centerNode.contentAlpha, 255, alphaProgress * textFadeInSpeed);
      } else {
        centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, 0.1); // Fade out if not enough time passed
      }
    } else { // status === 0
      // ציור הכותרת בלבד במצב רגיל
      text(centerNode.label, centerDisplayX, centerDisplayY);
      centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, 0.1); // Ensure content is faded out
    }
    pop(); // סוף ציור טקסט מרכזי

  } else if (status === 2) { // <-- קוד ציור במצב מיקוד (סטטוס 2)
    // ... (קוד ציור עיגולים במצב מיקוד - כולל שימוש דומה ב-textContentPadding לעיגול הממוקד) ...
        for (let i = 0; i < surroundingNodes.length; i++) {
          let node = surroundingNodes[i];
          node.currentX = lerp(node.currentX, node.targetX, easeOuter);
          node.currentY = lerp(node.currentY, node.targetY, easeOuter);
          let targetR = (node.targetR !== undefined) ? node.targetR : node.baseR;

          if (i === focusedNodeIndex) { // Focused node grows
            let hoverElapsed = millis() - transitionStartTime;
            let tHover = constrain(hoverElapsed / status2GrowDuration, 0, 1);
            let easeHover = ultraEaseInOut(tHover);
            node.currentR = lerp(node.currentR, targetR, easeHover); // TargetR here is node.expandedR

            // Fade in content for focused node
            if (hoverElapsed > textFadeInDelay) {
              let fadeElapsed = hoverElapsed - textFadeInDelay;
              let alphaProgress = constrain(fadeElapsed / 500, 0, 1);
              node.contentAlpha = lerp(node.contentAlpha, 255, alphaProgress * textFadeInSpeed);
            } else {
              node.contentAlpha = lerp(node.contentAlpha, 0, 0.1);
            }
          } else { // Other nodes shrink or stay base size
             node.contentAlpha = lerp(node.contentAlpha, 0, 0.2); // Fade out content faster
             let hoverElapsed = millis() - (node.shrinkStartTime || 0);
             let tHover = constrain(hoverElapsed / status2ShrinkDuration, 0, 1);
             let easeHover = ultraEaseInOut(tHover);
             node.currentR = lerp(node.currentR, targetR, easeHover); // TargetR here is node.baseR
          }

          node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
          node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
          line(centerDisplayX, centerDisplayY, node.displayX, node.displayY);
        }

    // --- Draw shrunk center node ---
    push();
    noStroke();
    drawingContext.filter = 'none';
    let shadowOffsetXCenter = 3 * cos(radians(145));
    let shadowOffsetYCenter = 3 * sin(radians(145));
    fill(0);
    ellipse(
      centerDisplayX + shadowOffsetXCenter,
      centerDisplayY + shadowOffsetYCenter,
      centerNode.currentR
    );
    pop();

    fill(centerNode.col);
    ellipse(centerDisplayX, centerDisplayY, centerNode.currentR);

    // --- Draw center node label ---
    push();
    fill(0);
    noStroke();
    drawingContext.imageSmoothingEnabled = true;
    drawingContext.imageSmoothingQuality = 'high';
    let centerTextSizeShrunk = min(centerNode.currentR * 0.25, 36);
    textSize(centerTextSizeShrunk);
    drawingContext.shadowColor = textShadowColor;
    drawingContext.shadowBlur = textShadowBlur * 1.5;
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;
    text(centerNode.label, centerDisplayX, centerDisplayY);
    pop();

    // --- Draw non-focused surrounding nodes first ---
    for (let i = 0; i < surroundingNodes.length; i++) {
      if (i === focusedNodeIndex) continue; // Skip focused node for now
      let node = surroundingNodes[i];
      let shadowOffsetX = 3 * cos(radians(325));
      let shadowOffsetY = 3 * sin(radians(325));
      fill(0);
      ellipse(
        node.displayX + shadowOffsetX,
        node.displayY + shadowOffsetY,
        node.currentR
      );
      fill(node.col);
      ellipse(node.displayX, node.displayY, node.currentR);
      push();
      fill(0);
      noStroke();
      drawingContext.imageSmoothingEnabled = true;
      drawingContext.imageSmoothingQuality = 'high';
      let textSizeValue = min(node.currentR * textMaxSizePercentage, 20);
      textSize(textSizeValue);
      drawingContext.shadowColor = textShadowColor;
      drawingContext.shadowBlur = textShadowBlur;
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      text(node.label, node.displayX, node.displayY);
      pop();
    }

    // --- Draw the focused surrounding node last (so it's on top) ---
    if (focusedNodeIndex !== null) { // Check if a node is actually focused
      let node = surroundingNodes[focusedNodeIndex];
      let shadowOffsetX = 3 * cos(radians(325));
      let shadowOffsetY = 3 * sin(radians(325));

      // Shadow
      fill(0);
      ellipse(
        node.displayX + shadowOffsetX,
        node.displayY + shadowOffsetY,
        node.currentR
      );

      // Main circle
      fill(node.col);
      ellipse(node.displayX, node.displayY, node.currentR);

      // Calculate title offset based on content alpha
      let titleOffset = map(node.contentAlpha, 0, 255, 0, -node.currentR * 0.25); // Move title up as content appears

      // Draw focused node label
      push();
      fill(0);
      noStroke();
      drawingContext.imageSmoothingEnabled = true;
      drawingContext.imageSmoothingQuality = 'high';
      let focusedTextSize = min(node.currentR * 0.25, 36); // Title size
      textSize(focusedTextSize);
      drawingContext.shadowColor = textShadowColor;
      drawingContext.shadowBlur = textShadowBlur * 1.5;
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      text(node.label, node.displayX, node.displayY + titleOffset); // Apply offset
      pop();

      // Draw focused node content if alpha is high enough
      if (node.contentAlpha > 10) {
        push();
        fill(0, node.contentAlpha); // Use content alpha for fade
        noStroke();
        textSize(16); // Content text size
        textAlign(CENTER, CENTER);
        rectMode(CENTER);
        let textWidth = node.currentR * 0.7;
        let textHeight = node.currentR * 0.6;
        // ****** Similar padding logic used here for focused surrounding node ******
        let adjustedPadding = textContentPadding * (node.currentR / 400);
        // *************************************************************************
        text(node.content, node.displayX, node.displayY + titleOffset + focusedTextSize + adjustedPadding, textWidth, textHeight); // Apply padding
        pop();
      }
    }
  }

  handleHover();
}

function mousePressed() {
  // Check click on center node
  if (dist(mouseX, mouseY, centerNode.currentX, centerNode.currentY) < centerNode.currentR / 2) {
     // Toggle between status 0, 1, and back to 1 from 2
    if (status === 2) {
        status = 1; // Go back to expanded center view
        if (focusedNodeIndex !== null) {
            // Reset the previously focused node's target size immediately
            surroundingNodes[focusedNodeIndex].targetR = surroundingNodes[focusedNodeIndex].baseR;
            surroundingNodes[focusedNodeIndex].shrinkStartTime = millis(); // Start shrink animation
        }
        focusedNodeIndex = null; // No node is focused anymore
        transitionStartTime = millis();
        resetPositionsToStatus1(); // Go back to the expanded layout

    } else if (status === 1) {
        status = 0; // Collapse center node
        transitionStartTime = millis();
        resetPositionsToStatus0(); // Go to default layout
    } else { // status === 0
        status = 1; // Expand center node
        transitionStartTime = millis();
        animateToStatus1(); // Go to expanded layout
    }
    return; // Exit function after handling center click
  }

  // Check click on surrounding nodes
  let clickedSurrounding = false;
  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];
    if (dist(mouseX, mouseY, node.currentX, node.currentY) < node.currentR / 2) {
      clickedSurrounding = true;
      let previousFocusedIndex = focusedNodeIndex; // Store previous index

      // --- Handling click on a surrounding node ---
      if (status === 2 && focusedNodeIndex === i) {
          // Clicked on the already focused node - Go back to status 1
          status = 1;
          node.targetR = node.baseR; // Start shrinking the focused node
          node.shrinkStartTime = millis();
          focusedNodeIndex = null;
          transitionStartTime = millis();
          resetPositionsToStatus1();
      } else {
          // Clicked on a new node OR clicked on a node when in status 0 or 1
          // OR clicked on a different node when in status 2

          if (status === 2 && previousFocusedIndex !== null && previousFocusedIndex !== i) {
              // If switching focus, tell the previous node to shrink
              surroundingNodes[previousFocusedIndex].targetR = surroundingNodes[previousFocusedIndex].baseR;
              surroundingNodes[previousFocusedIndex].shrinkStartTime = millis();
          }

          // Initiate focus transition
          pendingFocusedIndex = i; // Set the node we intend to focus
          status = 2; // Enter focus mode
          transitionStartTime = millis(); // Reset timer for animations

          // --- Animate nodes for Status 2 ---
          // Center node moves aside and shrinks
          centerNode.targetX = width / 2 + status2CenterOffset;
          centerNode.targetY = height / 2;
          centerNode.targetR = (centerDefaultSize * growthMultiplier) * status2CenterShrinkFactor; // Shrunk size

          // Clicked node moves to center (but doesn't grow yet)
          node.targetX = width / 2;
          node.targetY = height / 2;
          // Temporarily set targetR to baseR during move, it will be updated to expandedR later
          node.targetR = node.baseR;

          // Other nodes reposition around the center (using delays)
          let cumulativeDelay = 0;
          for (let j = 0; j < surroundingNodes.length; j++) {
              if (j !== i) { // Don't move the clicked node again
                  let otherNode = surroundingNodes[j];
                  let angle = atan2(otherNode.baseY - centerNode.baseY, otherNode.baseX - centerNode.baseX); // Keep original relative angle
                  let distance = baseDistance + random(150, 250); // Reposition further out
                  let delay = random(status2DelayRandomRange[0], status2DelayRandomRange[1]);
                  setTimeout(() => {
                      if (status === 2 && focusedNodeIndex !== j) { // Ensure we are still in status 2 and this node is not the focused one
                          otherNode.targetX = width / 2 + cos(angle) * distance; // Move relative to new center
                          otherNode.targetY = height / 2 + sin(angle) * distance;
                          otherNode.targetR = otherNode.baseR; // Ensure it's base size
                          otherNode.shrinkStartTime = millis(); // Ensure shrink animation starts if needed
                      }
                  }, cumulativeDelay);
                  cumulativeDelay += delay;
              }
          }

          // --- Delayed Focus Switch ---
          // Clear any existing timer to prevent conflicts if clicking rapidly
          if (focusSwitchTimer !== null) {
              clearTimeout(focusSwitchTimer);
          }

          // Set a timer to actually set the focused index and start the growth animation
          // This delay allows the nodes to move towards their positions before the chosen one starts growing.
          focusSwitchTimer = setTimeout(() => {
              if (pendingFocusedIndex !== null && status === 2) { // Check if still relevant
                  focusedNodeIndex = pendingFocusedIndex; // Officially set the focused node
                  let focusedNode = surroundingNodes[focusedNodeIndex];
                  // Set the *final* target size for the focused node (growth starts now)
                  focusedNode.targetR = focusedNode.expandedR;
                  console.log(`Setting target size for circle ${focusedNodeIndex + 1} to ${focusedNode.expandedR}`);
                  transitionStartTime = millis(); // Reset start time *specifically* for the growth/fade-in animation
              }
              // Reset timer and pending index
              pendingFocusedIndex = null;
              focusSwitchTimer = null;

          }, 500); // Delay before growth starts (adjust as needed)

      }
      // --- End Handling click ---
      return; // Exit function after handling surrounding click
    }
  }


  // If clicked on background
  if (!clickedSurrounding) {
      if (status === 2) {
         // Clicked background while in focus mode: go back to status 1
         status = 1;
         if (focusedNodeIndex !== null) {
            surroundingNodes[focusedNodeIndex].targetR = surroundingNodes[focusedNodeIndex].baseR;
            surroundingNodes[focusedNodeIndex].shrinkStartTime = millis();
         }
         focusedNodeIndex = null;
         transitionStartTime = millis();
         resetPositionsToStatus1();
      } else if (status === 1) {
         // Clicked background while in expanded center mode: go back to status 0
         status = 0;
         transitionStartTime = millis();
         resetPositionsToStatus0();
      }
      // If status is 0, clicking background does nothing.
  }
}


// --- Helper functions for state transitions ---

function animateToStatus1() {
    // Center node expands
    centerNode.targetR = centerNode.expandedR;
    centerNode.targetX = width / 2;
    centerNode.targetY = height / 2;

    // Surrounding nodes move outwards slightly
    let indices = [...Array(surroundingNodes.length).keys()];
    shuffle(indices, true); // Randomize animation order
    let cumulativeDelay = 0;

    for (let i = 0; i < indices.length; i++) {
      let nodeIndex = indices[i];
      let node = surroundingNodes[nodeIndex];
      let angle = node.angle; // Use original angle
      let distance = baseDistance + status1ExpansionAmount; // Target distance for status 1
      setTimeout(() => {
          if (status === 1) { // Ensure status hasn't changed
             node.targetX = centerNode.baseX + cos(angle) * distance;
             node.targetY = centerNode.baseY + sin(angle) * distance;
             node.targetR = node.baseR; // Ensure base size
          }
      }, cumulativeDelay);
      cumulativeDelay += random(status1DelayRandomRange[0], status1DelayRandomRange[1]);
    }
}

function resetPositionsToStatus0() {
  // Center node shrinks to default
  centerNode.targetX = width / 2;
  centerNode.targetY = height / 2;
  centerNode.targetR = centerDefaultSize; // Default size
  centerNode.contentAlpha = 0; // Hide content immediately

  // Surrounding nodes return to base positions
  for (let node of surroundingNodes) {
    node.targetX = node.baseX;
    node.targetY = node.baseY;
    node.targetR = node.baseR; // Ensure base size
    node.contentAlpha = 0;
  }
  focusedNodeIndex = null; // No node is focused
}

function resetPositionsToStatus1() {
  // Center node targets expanded size and center position
  centerNode.targetX = width / 2;
  centerNode.targetY = height / 2;
  centerNode.targetR = centerNode.expandedR; // Expanded size

  // Surrounding nodes move to their status 1 positions
  let cumulativeDelay = 0;
   for (let i = 0; i < surroundingNodes.length; i++) {
       let node = surroundingNodes[i];
       let angle = node.angle;
       let distance = baseDistance + status1ExpansionAmount; // Target distance for status 1
        setTimeout(() => {
             if(status === 1){ // Check if still relevant
                node.targetX = centerNode.baseX + cos(angle) * distance;
                node.targetY = centerNode.baseY + sin(angle) * distance;
                node.targetR = node.baseR; // Ensure base size
                node.contentAlpha = 0; // Hide content
             }
        }, cumulativeDelay);
       cumulativeDelay += random(status1DelayRandomRange[0]/2, status1DelayRandomRange[1]/2); // Faster transition back
   }
  focusedNodeIndex = null; // Ensure no node is marked as focused
}

// --- End Helper functions ---


function handleHover() {
  // Only apply hover effect in status 0 and 1, or on non-focused nodes in status 2
  if (status === 0 || status === 1 || (status === 2 && mouseIsPressed === false /* Optional: disable hover during focus transition */)) {
      for (let i = 0; i < surroundingNodes.length; i++) {
          // Don't apply hover effect to the node currently being focused in status 2
          if (status === 2 && i === focusedNodeIndex) {
              // If it's the focused node, ensure its target is the expanded size
              if (surroundingNodes[i].targetR !== surroundingNodes[i].expandedR) {
                 // This check might be redundant if handled well in mousePressed, but good for safety
                 // surroundingNodes[i].targetR = surroundingNodes[i].expandedR;
              }
              continue; // Skip hover logic for the focused node
          }

          let node = surroundingNodes[i];
          let d = dist(mouseX, mouseY, node.currentX, node.currentY); // Use currentX/Y for hover check
          let isHovering = d < node.currentR / 2;

          let newTargetR;
          if (isHovering) {
              newTargetR = node.baseR * 1.2; // Hover size increase
          } else {
              newTargetR = node.baseR; // Back to base size
          }

          // If the target size changes due to hover, reset the hover animation timer
          if (node.hoverTargetR !== newTargetR) {
              hoverStartTimes[i] = millis(); // Start hover animation timer
              node.hoverTargetR = newTargetR; // Update the target radius for hover
          }

           // Apply hover target only if not the focused node in status 2
           if (!(status === 2 && i === focusedNodeIndex)) {
              // Check if hoverTargetR is defined before assigning
              if(node.hoverTargetR !== undefined) {
                 node.targetR = node.hoverTargetR;
              } else {
                 node.targetR = node.baseR; // Fallback to baseR if undefined
              }
           }
      }
  } else if (status === 2) {
       // In status 2, ensure non-focused nodes target baseR and focused node targets expandedR
       for (let i = 0; i < surroundingNodes.length; i++) {
           let node = surroundingNodes[i];
           if(i === focusedNodeIndex){
              // Ensure focused node is targeting its expanded size
              if(node.targetR !== node.expandedR){
                 node.targetR = node.expandedR;
                 // transitionStartTime = millis(); // Maybe reset timer? Careful here.
              }
           } else {
              // Ensure non-focused nodes target their base size
               if(node.targetR !== node.baseR){
                   node.targetR = node.baseR;
                   node.shrinkStartTime = millis(); // Ensure shrink anim timer is set
               }
           }
       }
  }
}


function ultraEaseInOut(t) {
  return t < 0.5
    ? pow(t * 2, easeInPower) / 2
    : 1 - pow((1 - t) * 2, easeOutPower) / 2;
}
