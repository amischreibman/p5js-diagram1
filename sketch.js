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
let textContentPadding = 30;
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

function preload() {
  try {
    BlinkyStar = loadFont('Blinky Star.otf');
  } catch (e) {
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

function drawCenterNodeContent(centerDisplayX, centerDisplayY, centerTextSize, titleOffset) {
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
    text(
      centerNode.content,
      centerDisplayX,
      centerDisplayY + titleOffset + centerTextSize + adjustedPadding,
      textWidth,
      textHeight
    );
    pop();
  }
}

function draw() {
  background('#F2A900');
  let expandedSize = centerDefaultSize * growthMultiplier;
  let centerT = constrain((millis() - transitionStartTime) / centerGrowDuration, 0, 1);
  let easeCenter = ultraEaseInOut(centerT);

  centerNode.currentR = lerp(centerNode.currentR, status === 1 ? expandedSize : centerDefaultSize, easeCenter);

  fill(centerNode.col);
  ellipse(centerNode.currentX, centerNode.currentY, centerNode.currentR);

  push();
  fill(0);
  noStroke();
  let centerTextSize = min(centerNode.currentR * 0.25, 36);
  textSize(centerTextSize);
  drawingContext.shadowColor = textShadowColor;
  drawingContext.shadowBlur = textShadowBlur * 1.5;

  let titleOffset = map(centerNode.contentAlpha, 0, 255, 0, -centerNode.currentR * 0.45);
  text(centerNode.label, centerNode.currentX, centerNode.currentY + titleOffset);
  pop();

  if (status === 1) {
    let elapsed = millis() - transitionStartTime;
    centerNode.contentAlpha = elapsed > textFadeInDelay
      ? lerp(centerNode.contentAlpha, 255, constrain((elapsed - textFadeInDelay) / 500, 0, 1) * textFadeInSpeed)
      : lerp(centerNode.contentAlpha, 0, 0.1);
    drawCenterNodeContent(centerNode.currentX, centerNode.currentY, centerTextSize, titleOffset);
  } else {
    centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, 0.1);
  }

  handleHover();
  drawSurroundingNodes();
}

function drawSurroundingNodes() {
  for (let node of surroundingNodes) {
    fill(node.col);
    ellipse(node.currentX, node.currentY, node.currentR);
    push();
    fill(0);
    noStroke();
    textSize(min(node.currentR * textMaxSizePercentage, 20));
    text(node.label, node.currentX, node.currentY);
    pop();
  }
}

function ultraEaseInOut(t) {
  return t < 0.5
    ? pow(t * 2, easeInPower) / 2
    : 1 - pow((1 - t) * 2, easeOutPower) / 2;
}

function initNodes() {
  centerNode = {
    currentX: width / 2,
    currentY: height / 2,
    currentR: centerDefaultSize,
    col: color(0, 102, 255),
    label: "מרכז",
    content: "תוכן מרכזי שמתאר את לב הרעיון בדיאגרמה.",
    contentAlpha: 0
  };

  surroundingNodes = [];
  for (let i = 0; i < 8; i++) {
    let angle = (TWO_PI / 8) * i;
    let r = random(60, 90);
    let x = centerNode.currentX + cos(angle) * baseDistance;
    let y = centerNode.currentY + sin(angle) * baseDistance;

    surroundingNodes.push({
      angle: angle,
      baseX: x,
      baseY: y,
      currentX: x,
      currentY: y,
      baseR: r,
      currentR: r,
      hoverTargetR: r,
      col: color(random(255), random(255), random(255)),
      label: `עיגול ${i + 1}`,
      content: `פסקה לעיגול ${i + 1} שמוסיפה הקשר נוסף.`,
      contentAlpha: 0
    });
  }
}

function handleHover() {
  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];
    let d = dist(mouseX, mouseY, node.currentX, node.currentY);
    let isHovering = d < node.currentR / 2;
    node.hoverTargetR = isHovering ? node.baseR * 1.2 : node.baseR;
    node.currentR = lerp(node.currentR, node.hoverTargetR, 0.05);
  }
}

function mousePressed() {
  let dCenter = dist(mouseX, mouseY, centerNode.currentX, centerNode.currentY);
  if (dCenter < centerNode.currentR / 2) {
    status = (status + 1) % 3;
    transitionStartTime = millis();
    return;
  }

  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];
    let d = dist(mouseX, mouseY, node.currentX, node.currentY);
    if (d < node.currentR / 2) {
      focusedNodeIndex = i;
      status = 2;
      transitionStartTime = millis();

      node.contentAlpha = 0;
      centerNode.currentX = width / 2 + status2CenterOffset;
      centerNode.currentY = height / 2;

      for (let j = 0; j < surroundingNodes.length; j++) {
        if (j === i) {
          node.targetX = width / 2;
          node.targetY = height / 2;
        } else {
          let angle = surroundingNodes[j].angle;
          surroundingNodes[j].targetX = centerNode.currentX + cos(angle) * (baseDistance + 100);
          surroundingNodes[j].targetY = centerNode.currentY + sin(angle) * (baseDistance + 100);
        }
      }
      return;
    }
  }

  // לחיצה על הרקע
  if (status === 2) {
    status = 1;
    transitionStartTime = millis();
    focusedNodeIndex = null;
  } else if (status === 1) {
    status = 0;
    transitionStartTime = millis();
  }
}
