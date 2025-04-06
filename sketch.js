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
let textContentPadding = 50; // פדינג בין הכותרת לפסקה
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

    hoverStartTimes.push(0);

    let nodeIndex = surroundingNodes.length + 1;
    let nodeContent = `This is unique content for circle ${nodeIndex}. `;

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

    node.expandedR = status2MinExpandedSize + (sizeRange * sizeRatio);

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

  if (status === 0 || status === 1) {
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

      node.contentAlpha = lerp(node.contentAlpha, 0, 0.1);

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

    if (status === 1) {
      let titleOffset = map(centerNode.contentAlpha, 0, 255, 0, -centerNode.currentR * 0.15);
      text(centerNode.label, centerDisplayX, centerDisplayY + titleOffset);

      if (centerNode.contentAlpha > 10) {
        push();
        fill(0, centerNode.contentAlpha);
        noStroke();
        textSize(16);
        textAlign(CENTER, CENTER);
        rectMode(CENTER);
        let textWidth = centerNode.currentR * 0.7;
        let textHeight = centerNode.currentR * 0.6;
        let adjustedPadding = textContentPadding * (centerNode.currentR / 400);
        text(centerNode.content, centerDisplayX, centerDisplayY + titleOffset + centerTextSize + adjustedPadding, textWidth, textHeight);
        pop();
      }

      let centerElapsed = millis() - transitionStartTime;
      if (centerElapsed > textFadeInDelay) {
        let fadeElapsed = centerElapsed - textFadeInDelay;
        let alphaProgress = constrain(fadeElapsed / 500, 0, 1);
        centerNode.contentAlpha = lerp(centerNode.contentAlpha, 255, alphaProgress * textFadeInSpeed);
      } else {
        centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, 0.1);
      }
    } else {
      text(centerNode.label, centerDisplayX, centerDisplayY);
      centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, 0.1);
    }
    pop();

  } else if (status === 2) {
    // חזרה על הציור במצב סטטוס 2
  }

  handleHover();
}
