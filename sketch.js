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
  let expandedSize = centerDefaultSize * growthMultiplier;

  background('#F2A900');
  drawingContext.imageSmoothingEnabled = true;

  // חישוב התקדמות האנימציות
  let centerT = constrain((millis() - transitionStartTime) / centerGrowDuration, 0, 1);
  let outerT = constrain((millis() - transitionStartTime) / surroundingMoveDuration, 0, 1);
  let easeCenter = ultraEaseInOut(centerT); // מידת ההתקדמות החלקה של האנימציה המרכזית
  let easeOuter = ultraEaseInOut(outerT);  // מידת ההתקדמות החלקה של האנימציה החיצונית

  // עדכון גודל ומיקום העיגול המרכזי בהתאם לסטטוס
  let centerTargetR = status === 1 ? expandedSize : (status === 2 ? expandedSize * status2CenterShrinkFactor : centerDefaultSize);
  centerNode.currentR = lerp(centerNode.currentR, centerTargetR, easeCenter);
  centerNode.currentX = lerp(centerNode.currentX, centerNode.targetX, easeCenter);
  centerNode.currentY = lerp(centerNode.currentY, centerNode.targetY, easeCenter);

  // הוספת תנועת "ריצוד" קלה לעיגול המרכזי
  let centerDisplayX = centerNode.currentX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;
  let centerDisplayY = centerNode.currentY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;

  stroke(0);
  strokeWeight(3);

  // === ציור במצב ברירת מחדל (0) או במצב גדילה (1) ===
  if (status === 0 || status === 1) {
    // עדכון וציור קווים ועיגולים מסביב
    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      // עדכון מיקום חלק
      node.currentX = lerp(node.currentX, node.targetX, easeOuter);
      node.currentY = lerp(node.currentY, node.targetY, easeOuter);

      // קביעת רדיוס המטרה (כולל אפקט hover)
      let targetR = (node.targetR !== undefined) ? node.targetR : node.baseR;
      if (node.hoverTargetR !== undefined && i !== focusedNodeIndex) { // אל תחיל hover על עיגול ממוקד
        targetR = node.hoverTargetR;
      }

      // אנימציית שינוי גודל (כולל hover)
      let hoverElapsed = millis() - max(transitionStartTime, hoverStartTimes[i]);
      let hoverDuration = hoverAnimationDuration; // משך זמן קבוע ל-hover רגיל
      let tHover = constrain(hoverElapsed / hoverDuration, 0, 1);
      let easeHover = ultraEaseInOut(tHover);
      node.currentR = lerp(node.currentR, targetR, easeHover);

      // דעיכה של תוכן אם העיגול לא ממוקד
      node.contentAlpha = lerp(node.contentAlpha, 0, 0.1);

      // הוספת ריצוד
      node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;

      // ציור הקו המחבר
      line(centerDisplayX, centerDisplayY, node.displayX, node.displayY);
    }

    // ציור העיגולים מסביב (כולל צל וטקסט)
    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      let shadowOffsetX = 3 * cos(radians(325));
      let shadowOffsetY = 3 * sin(radians(325));
      // צל
      fill(0);
      ellipse(
        node.displayX + shadowOffsetX,
        node.displayY + shadowOffsetY,
        node.currentR
      );
      // עיגול
      fill(node.col);
      ellipse(node.displayX, node.displayY, node.currentR);

      // טקסט (כותרת)
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

    // --- ציור העיגול המרכזי ---
    // צל
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

    // עיגול מרכזי
    fill(centerNode.col);
    ellipse(centerDisplayX, centerDisplayY, centerNode.currentR);

    // --- ציור טקסט העיגול המרכזי ---
    push();
    fill(0);
    noStroke();
    drawingContext.imageSmoothingEnabled = true;
    drawingContext.imageSmoothingQuality = 'high';
    let centerTextSize = min(centerNode.currentR * 0.25, 36); // גודל טקסט הכותרת
    textSize(centerTextSize);
    drawingContext.shadowColor = textShadowColor;
    drawingContext.shadowBlur = textShadowBlur * 1.5;
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;

    // --- התנהגות טקסט בסטטוס 1 (גדילה) ---
    if (status === 1) {
        // *** השינוי מתחיל כאן ***
        // 1. הגדרת מיקום היעד העליון של הכותרת
        let targetTitleOffset = -centerNode.currentR * 0.35; // 35% מהרדיוס כלפי מעלה
        // 2. חישוב ה-offset הנוכחי באמצעות אינטרפולציה חלקה (easeCenter)
        let currentTitleOffset = lerp(0, targetTitleOffset, easeCenter);
        // *** השינוי ממשיך כאן ***

        // ציור הכותרת במיקום המחושב והמעודכן
        text(centerNode.label, centerDisplayX, centerDisplayY + currentTitleOffset);

        // הצגת הפסקה רק אם ה-alpha מספיק גבוה
        if (centerNode.contentAlpha > 10) {
            push();
            fill(0, centerNode.contentAlpha);
            noStroke();
            textSize(16); // גודל טקסט קבוע לפסקה
            textAlign(CENTER, CENTER);
            rectMode(CENTER);
            let textWidth = centerNode.currentR * 0.7;
            let textHeight = centerNode.currentR * 0.6;

            let adjustedPadding = textContentPadding * (centerNode.currentR / 400);

            // ציור הפסקה מתחת לכותרת, תוך התחשבות במיקום החדש שלה ובריווח
            text(
              centerNode.content,
              centerDisplayX,
              // מיקום הפסקה = מיקום מרכז העיגול + הזזת הכותרת + גודל הכותרת + ריווח
              centerDisplayY + currentTitleOffset + centerTextSize + adjustedPadding, // <-- שימוש ב-currentTitleOffset
              textWidth,
              textHeight
            );
            pop();
        }

        // לוגיקה קיימת להופעה הדרגתית של הטקסט (contentAlpha)
        let centerElapsed = millis() - transitionStartTime;
        if (centerElapsed > textFadeInDelay) {
            let fadeElapsed = centerElapsed - textFadeInDelay;
            let alphaProgress = constrain(fadeElapsed / 500, 0, 1);
            centerNode.contentAlpha = lerp(centerNode.contentAlpha, 255, alphaProgress * textFadeInSpeed);
        } else {
            centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, 0.1); // דעיכה אם לא עבר מספיק זמן
        }
    } else { // --- התנהגות טקסט בסטטוס 0 (ברירת מחדל) ---
        // הכותרת נשארת במרכז
        text(centerNode.label, centerDisplayX, centerDisplayY);
        // ודא שהתוכן דועך החוצה
        centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, 0.1);
    }
    pop(); // סוף הגדרות טקסט מרכזי

  // === ציור במצב מיקוד (2) ===
  } else if (status === 2) {
    // עדכון וציור קווים ועיגולים מסביב (כולל אנימציות גדילה/כיווץ)
    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      // עדכון מיקום
      node.currentX = lerp(node.currentX, node.targetX, easeOuter);
      node.currentY = lerp(node.currentY, node.targetY, easeOuter);
      // רדיוס מטרה נקבע בלוגיקת הלחיצה (mousePressed)
      let targetR = (node.targetR !== undefined) ? node.targetR : node.baseR;

      // אנימציית שינוי גודל תלויה אם העיגול ממוקד או לא
      if (i === focusedNodeIndex) { // העיגול הממוקד גדל
        let growElapsed = millis() - transitionStartTime; // משתמש בזמן המעבר הראשי לסטטוס 2
        let tGrow = constrain(growElapsed / status2GrowDuration, 0, 1);
        let easeGrow = ultraEaseInOut(tGrow);
        node.currentR = lerp(node.currentR, targetR, easeGrow); // targetR הוא node.expandedR

        // הופעה הדרגתית של תוכן העיגול הממוקד
        if (growElapsed > textFadeInDelay) {
          let fadeElapsed = growElapsed - textFadeInDelay;
          let alphaProgress = constrain(fadeElapsed / 500, 0, 1);
          node.contentAlpha = lerp(node.contentAlpha, 255, alphaProgress * textFadeInSpeed);
        } else {
          node.contentAlpha = lerp(node.contentAlpha, 0, 0.1);
        }
      } else { // עיגולים אחרים מתכווצים או נשארים בגודל בסיס
        node.contentAlpha = lerp(node.contentAlpha, 0, 0.2); // דעיכה מהירה יותר של תוכן
        let shrinkElapsed = millis() - (node.shrinkStartTime || 0); // זמן מאז תחילת הכיווץ הספציפי שלו
        let tShrink = constrain(shrinkElapsed / status2ShrinkDuration, 0, 1);
        let easeShrink = ultraEaseInOut(tShrink);
        node.currentR = lerp(node.currentR, targetR, easeShrink); // targetR הוא node.baseR
      }

      // הוספת ריצוד
      node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      // ציור הקו המחבר
      line(centerDisplayX, centerDisplayY, node.displayX, node.displayY);
    }

    // --- ציור העיגול המרכזי (מוקטן ומוזז הצידה) ---
    // צל
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

    // עיגול
    fill(centerNode.col);
    ellipse(centerDisplayX, centerDisplayY, centerNode.currentR);

    // --- ציור הכותרת של העיגול המרכזי (נשאר ממורכז בתוכו) ---
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
    text(centerNode.label, centerDisplayX, centerDisplayY); // <-- ממורכז, ללא אופסט
    pop();

    // --- ציור העיגולים הלא-ממוקדים מסביב ---
    for (let i = 0; i < surroundingNodes.length; i++) {
      if (i === focusedNodeIndex) continue; // נצייר את הממוקד בסוף (מעל כולם)
      let node = surroundingNodes[i];
      let shadowOffsetX = 3 * cos(radians(325));
      let shadowOffsetY = 3 * sin(radians(325));
      // צל
      fill(0);
      ellipse(
        node.displayX + shadowOffsetX,
        node.displayY + shadowOffsetY,
        node.currentR
      );
      // עיגול
      fill(node.col);
      ellipse(node.displayX, node.displayY, node.currentR);
      // טקסט (כותרת)
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

    // --- ציור העיגול הממוקד (אם קיים) ---
    if (focusedNodeIndex !== null) {
      let node = surroundingNodes[focusedNodeIndex];
      let shadowOffsetX = 3 * cos(radians(325));
      let shadowOffsetY = 3 * sin(radians(325));

      // צל
      fill(0);
      ellipse(
        node.displayX + shadowOffsetX,
        node.displayY + shadowOffsetY,
        node.currentR
      );

      // עיגול ממוקד
      fill(node.col);
      ellipse(node.displayX, node.displayY, node.currentR);

      // --- טקסט העיגול הממוקד ---
      // חישוב הזזת הכותרת למעלה ככל שהתוכן מופיע
      let titleOffsetFocused = map(node.contentAlpha, 0, 255, 0, -node.currentR * 0.25);

      // כותרת
      push();
      fill(0);
      noStroke();
      drawingContext.imageSmoothingEnabled = true;
      drawingContext.imageSmoothingQuality = 'high';
      let focusedTextSize = min(node.currentR * 0.25, 36); // גודל כותרת
      textSize(focusedTextSize);
      drawingContext.shadowColor = textShadowColor;
      drawingContext.shadowBlur = textShadowBlur * 1.5;
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      text(node.label, node.displayX, node.displayY + titleOffsetFocused); // הזזה קלה למעלה
      pop();

      // תוכן (פסקה)
      if (node.contentAlpha > 10) {
        push();
        fill(0, node.contentAlpha); // שימוש ב-alpha לדעיכה
        noStroke();
        textSize(16); // גודל תוכן
        textAlign(CENTER, CENTER);
        rectMode(CENTER);
        let textWidth = node.currentR * 0.7;
        let textHeight = node.currentR * 0.6;
        // שימוש ב-textContentPadding המקורי
        let adjustedPadding = textContentPadding * (node.currentR / 400);
        text(
            node.content,
            node.displayX,
            // מיקום הפסקה מתחת לכותרת המוזזת
            node.displayY + titleOffsetFocused + focusedTextSize + adjustedPadding,
            textWidth,
            textHeight
        );
        pop();
      }
    }
  } // סוף else if (status === 2)

  // טיפול באפקט hover (בסוף, כדי שישפיע על targetR לפריים הבא)
  handleHover();
} // סוף פונקציית draw
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
