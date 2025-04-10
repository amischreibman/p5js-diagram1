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
let textFadeInDelay = 200;
let textFadeInSpeed = 0.5;
let textFadeOutSpeed = 0.2; // מהירות ה-fade out של הטקסט

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
let winkyFont;
let focusSwitchTimer = null;
let pendingFocusedIndex = null;
let isFocusSwitching = false;
let BlinkyStar;
let previousFocusedIndex = null;

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
    currentY: width / 2,
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

    let nodeIndex = surroundingNodes.length + 1;
    let nodeContent = `This is unique content for circle ${nodeIndex}. `;

    if (nodeIndex % 3 === 0) {
      nodeContent += "This text will be displayed when the circle is in focus mode. Here you can add more details about this specific topic or concept. The circle will grow larger to accommodate this longer text content. The size is calculated dynamically based on text length.";
    } else if (nodeIndex % 3 === 1) {
      nodeContent += "This text will be displayed when the circle is in focus mode. Here you can add more details about this specific topic or concept.";
    } else {
      nodeContent += "This is a short description for this circle.";
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
      label: `text ${nodeIndex}`,
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

    // קביעת גודל מינימלי גדול יותר כדי להבטיח מספיק מקום לטקסט וכותרת
    node.expandedR = max(status2MinExpandedSize + (sizeRange * sizeRatio), 350);

    console.log(`Circle ${i+1}: Text length = ${textLength}, Expanded size = ${node.expandedR}`);
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

  // הצגת הקווים המחברים את העיגולים
  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];
    node.currentX = lerp(node.currentX, node.targetX, easeOuter);
    node.currentY = lerp(node.currentY, node.targetY, easeOuter);
    let targetR = (node.targetR !== undefined) ? node.targetR : node.baseR;
    node.currentR = lerp(node.currentR, targetR, 0.1);

    // Fade out הטקסט כאשר איננו במצב פוקוס
    if ((status !== 2 || i !== focusedNodeIndex) &&
        (status !== 1 || node !== centerNode)) {
      node.contentAlpha = lerp(node.contentAlpha, 0, textFadeOutSpeed);
    }

    node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
    node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;

    line(centerDisplayX, centerDisplayY, node.displayX, node.displayY);
  }

  // צייר עיגולים היקפיים (חוץ מהעיגול בפוקוס במצב 2)
  for (let i = 0; i < surroundingNodes.length; i++) {
    if (status === 2 && i === focusedNodeIndex) continue;

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

  // צייר עיגול מרכזי
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

  // טיפול בטקסט בעיגול המרכזי
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

  // טיפול בטקסט במצב 1 - העיגול המרכזי מוגדל
  if (status === 1) {
    // קביעת offset קבוע לכותרת
    let titleOffset = -centerNode.currentR * 0.25;
    text(centerNode.label, centerDisplayX, centerDisplayY + titleOffset);

    // הצגת תוכן במצב 1
    if (centerNode.contentAlpha > 10) {
      push();
      fill(0, centerNode.contentAlpha);
      noStroke();
      textSize(16);
      textAlign(CENTER, CENTER);
      rectMode(CENTER);
      let textWidth = centerNode.currentR * 0.7;
      let textHeight = centerNode.currentR * 0.6;
      // מיקום אנכי של התוכן - מתחת לכותרת עם ריווח
      let titleBottom = centerDisplayY + titleOffset + centerTextSize;
      let contentY = titleBottom + textContentPadding + textHeight / 2;
      text(centerNode.content, centerDisplayX, contentY, textWidth, textHeight);
      pop();
    }

    // Fade in טקסט במצב 1
    let centerElapsed = millis() - transitionStartTime;
    if (centerElapsed > textFadeInDelay) {
      let fadeElapsed = centerElapsed - textFadeInDelay;
      let alphaProgress = constrain(fadeElapsed / 500, 0, 1);
      centerNode.contentAlpha = lerp(centerNode.contentAlpha, 255, alphaProgress * textFadeInSpeed);
    }
  } else {
    // מצב רגיל או מצב 2 עבור העיגול המרכזי
    text(centerNode.label, centerDisplayX, centerDisplayY);
    // Fade out של הטקסט בעיגול המרכזי כאשר חוזרים ממצב 1 או עוברים למצב 2
    centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, textFadeOutSpeed);
  }
  pop();

  // צייר את העיגול הממוקד במצב 2
  if (status === 2 && focusedNodeIndex !== null) {
    let node = surroundingNodes[focusedNodeIndex];
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

    // חישוב offset קבוע לכותרת
    let titleOffset = -node.currentR * 0.25;

    push();
    fill(0);
    noStroke();
    drawingContext.imageSmoothingEnabled = true;
    drawingContext.imageSmoothingQuality = 'high';
    let focusedTextSize = min(node.currentR * 0.25, 36);
    textSize(focusedTextSize);
    drawingContext.shadowColor = textShadowColor;
    drawingContext.shadowBlur = textShadowBlur * 1.5;
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;

    // הצג את הכותרת
    text(node.label, node.displayX, node.displayY + titleOffset);
    pop();

    // הצג את התוכן של העיגול הממוקד
    if (node.contentAlpha > 10) {
      push();
      fill(0, node.contentAlpha);
      noStroke();
      textSize(16);
      textAlign(CENTER, CENTER);
      rectMode(CENTER);
      let textWidth = node.currentR * 0.7;
      let textHeight = node.currentR * 0.6;

      // מיקום אנכי של התוכן - מתחת לכותרת עם ריווח
      let titleBottom = node.displayY + titleOffset + focusedTextSize;
      let contentY = titleBottom + textContentPadding + textHeight / 2;
      text(node.content, node.displayX, contentY, textWidth, textHeight);
      pop();
    }

    // Fade in הטקסט בעיגול הממוקד
    let focusElapsed = millis() - transitionStartTime;
    if (focusElapsed > textFadeInDelay) {
      let fadeElapsed = focusElapsed - textFadeInDelay;
      let alphaProgress = constrain(fadeElapsed / 500, 0, 1);
      node.contentAlpha = lerp(node.contentAlpha, 255, alphaProgress * textFadeInSpeed);
    }
  }
}

function mousePressed() {
  if (dist(mouseX, mouseY, centerNode.currentX, centerNode.currentY) < centerNode.currentR / 2) {
    // לחיצה על העיגול המרכזי
    // קודם נבצע fade out על הטקסט של העיגול הממוקד הנוכחי אם ישנו
    if (status === 2 && focusedNodeIndex !== null && surroundingNodes[focusedNodeIndex].contentAlpha > 0) {
      // אין צורך לעשות פה כלום כרגע, הטקסט יתחיל להתפוגג ב-draw
    }
    if (status === 0) {
      status = 1;
      transitionStartTime = millis() + status1CenterDelay;
      centerNode.targetX = centerNode.baseX;
      centerNode.targetY = centerNode.baseY - status1ExpansionAmount;
      for (let i = 0; i < surroundingNodes.length; i++) {
        let angle = surroundingNodes[i].angle;
        let dist = baseDistance;
        surroundingNodes[i].targetX = centerNode.baseX + cos(angle) * (dist + status1ExpansionAmount * 0.8);
        surroundingNodes[i].targetY = centerNode.baseY + sin(angle) * (dist + status1ExpansionAmount * 0.8);
      }
    } else if (status === 1) {
      status = 0;
      transitionStartTime = millis();
      centerNode.targetX = centerNode.baseX;
      centerNode.targetY = centerNode.baseY;
      for (let i = 0; i < surroundingNodes.length; i++) {
        let angle = surroundingNodes[i].angle;
        let dist = baseDistance;
        surroundingNodes[i].targetX = centerNode.baseX + cos(angle) * dist;
        surroundingNodes[i].targetY = centerNode.baseY + sin(angle) * dist;
      }
    } else if (status === 2) {
      // חזרה למצב 1
      status = 1;
      transitionStartTime = millis();
      centerNode.targetX = centerNode.baseX;
      centerNode.targetY = centerNode.baseY - status1ExpansionAmount;
      centerNode.targetR = centerDefaultSize * growthMultiplier;
      for (let i = 0; i < surroundingNodes.length; i++) {
        let angle = surroundingNodes[i].angle;
        let dist = baseDistance;
        surroundingNodes[i].targetX = centerNode.baseX + cos(angle) * (dist + status1ExpansionAmount * 0.8);
        surroundingNodes[i].targetY = centerNode.baseY + sin(angle) * (dist + status1ExpansionAmount * 0.8);
        surroundingNodes[i].targetR = surroundingNodes[i].baseR; // חזרה לגודל הבסיסי
      }
      focusedNodeIndex = null;
    }
  } else {
    // לחיצה על אחד העיגולים ההיקפיים
    let clickedIndex = -1;
    for (let i = 0; i < surroundingNodes.length; i++) {
      let d = dist(mouseX, mouseY, surroundingNodes[i].currentX, surroundingNodes[i].currentY);
      if (d < surroundingNodes[i].currentR / 2) {
        clickedIndex = i;
        break;
      }
    }

    if (clickedIndex !== -1) {
      if (status === 0 || status === 1) {
        status = 2;
        previousFocusedIndex = focusedNodeIndex;
        focusedNodeIndex = clickedIndex;
        transitionStartTime = millis();

        // עדכון מיקום וגודל העיגול המרכזי
        centerNode.targetX = centerNode.baseX + status2CenterOffset;
        centerNode.targetY = centerNode.baseY - status2CenterOffset;
        centerNode.targetR = centerDefaultSize * growthMultiplier * status2CenterShrinkFactor;

        // עדכון מיקום וגודל העיגולים ההיקפיים
        for (let i = 0; i < surroundingNodes.length; i++) {
          if (i === focusedNodeIndex) {
            surroundingNodes[i].targetX = width / 2 - 50;
            surroundingNodes[i].targetY = height / 2 + 50;
            surroundingNodes[i].targetR = surroundingNodes[i].expandedR;
          } else {
            let angle = surroundingNodes[i].angle;
            let dist = baseDistance * 0.6;
            surroundingNodes[i].targetX = centerNode.baseX + cos(angle) * dist;
            surroundingNodes[i].targetY = centerNode.baseY + sin(angle) * dist;
            surroundingNodes[i].targetR = surroundingNodes[i].baseR * 0.7;
          }
        }
      } else if (status === 2 && clickedIndex === focusedNodeIndex) {
        // יציאה ממצב פוקוס
        status = 1;
        transitionStartTime = millis();
        centerNode.targetX = centerNode.baseX;
        centerNode.targetY = centerNode.baseY - status1ExpansionAmount;
        centerNode.targetR = centerDefaultSize * growthMultiplier;
        for (let i = 0; i < surroundingNodes.length; i++) {
          let angle = surroundingNodes[i].angle;
          let dist = baseDistance;
          surroundingNodes[i].targetX = centerNode.baseX + cos(angle) * (dist + status1ExpansionAmount * 0.8);
          surroundingNodes[i].targetY = centerNode.baseY + sin(angle) * (dist + status1ExpansionAmount * 0.8);
          surroundingNodes[i].targetR = surroundingNodes[i].baseR;
        }
        focusedNodeIndex = null;
      } else if (status === 2 && clickedIndex !== focusedNodeIndex) {
        // מעבר פוקוס לעיגול אחר
        previousFocusedIndex = focusedNodeIndex;
        focusedNodeIndex = clickedIndex;
        transitionStartTime = millis();

        // עדכון מיקום וגודל העיגול הממוקד החדש
        for (let i = 0; i < surroundingNodes.length; i++) {
          if (i === focusedNodeIndex) {
            surroundingNodes[i].targetX = width / 2 - 50;
            surroundingNodes[i].targetY = height / 2 + 50;
            surroundingNodes[i].targetR = surroundingNodes[i].expandedR;
          } else {
            let angle = surroundingNodes[i].angle;
            let dist = baseDistance * 0.6;
            surroundingNodes[i].targetX = centerNode.baseX + cos(angle) * dist;
            surroundingNodes[i].targetY = centerNode.baseY + sin(angle) * dist;
            surroundingNodes[i].targetR = surroundingNodes[i].baseR * 0.7;
          }
        }
      }
    }
  }
}

function ultraEaseInOut(t) {
  if (t < 0.5) {
    let p = easeInPower;
    return 0.5 * pow(2 * t, p);
  } else {
    let p = easeOutPower;
    return 1 - 0.5 * abs(pow(2 - 2 * t, p));
  }
}
