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
let titleContentGap = 40; // רווח קבוע בין הכותרת לפסקה

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

// טיפול בטקסט במצב 1 - העיגול המרכזי מוגדל
if (status === 1) {
  let titleOffset = -centerNode.currentR * 0.25;
  let centerTextSize = min(centerNode.currentR * 0.25, 36);
  let contentOffset = titleOffset + centerTextSize + titleContentGap;
  textSize(centerTextSize);
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
    text(centerNode.content, centerDisplayX, centerDisplayY + contentOffset, textWidth, textHeight);
    pop();
  }

  let centerElapsed = millis() - transitionStartTime;
  if (centerElapsed > textFadeInDelay) {
    let fadeElapsed = centerElapsed - textFadeInDelay;
    let alphaProgress = constrain(fadeElapsed / 500, 0, 1);
    centerNode.contentAlpha = lerp(centerNode.contentAlpha, 255, alphaProgress * textFadeInSpeed);
  }
} else {
  let centerTextSize = min(centerNode.currentR * 0.25, 36);
  textSize(centerTextSize);
  text(centerNode.label, centerDisplayX, centerDisplayY);
  centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, textFadeOutSpeed);
}

// טיפול בעיגול ממוקד בסטטוס 2
if (status === 2 && focusedNodeIndex !== null) {
  let node = surroundingNodes[focusedNodeIndex];
  let titleOffset = -node.currentR * 0.25;
  let focusedTextSize = min(node.currentR * 0.25, 36);
  let contentOffset = titleOffset + focusedTextSize + titleContentGap;

  // ציור הצללה ועיגול
  fill(0);
  ellipse(node.displayX + 3 * cos(radians(325)), node.displayY + 3 * sin(radians(325)), node.currentR);
  fill(node.col);
  ellipse(node.displayX, node.displayY, node.currentR);

  // טקסט כותרת
  push();
  fill(0);
  noStroke();
  drawingContext.imageSmoothingEnabled = true;
  drawingContext.imageSmoothingQuality = 'high';
  textSize(focusedTextSize);
  drawingContext.shadowColor = textShadowColor;
  drawingContext.shadowBlur = textShadowBlur * 1.5;
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  text(node.label, node.displayX, node.displayY + titleOffset);
  pop();

  // תוכן עיגול ממוקד
  if (node.contentAlpha > 10) {
    push();
    fill(0, node.contentAlpha);
    noStroke();
    textSize(16);
    textAlign(CENTER, CENTER);
    rectMode(CENTER);
    let textWidth = node.currentR * 0.7;
    let textHeight = node.currentR * 0.6;
    text(node.content, node.displayX, node.displayY + contentOffset, textWidth, textHeight);
    pop();
  }

  let focusElapsed = millis() - transitionStartTime;
  if (focusElapsed > textFadeInDelay) {
    let fadeElapsed = focusElapsed - textFadeInDelay;
    let alphaProgress = constrain(fadeElapsed / 500, 0, 1);
    node.contentAlpha = lerp(node.contentAlpha, 255, alphaProgress * textFadeInSpeed);
  }
}
