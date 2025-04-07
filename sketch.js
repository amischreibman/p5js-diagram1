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
let status1DelayRandomRange = [4, 20]; // טווח השהיות לאנימציית פיזור במצב 1

// === סטטוס 2 (התכווצות/מיקוד) ===
let status2ShrinkDuration = 1500; // משך כיווץ עיגולים לא ממוקדים
let status2CenterOffset = 100; // הזזת העיגול המרכזי הצידה
let status2CenterShrinkFactor = 0.4; // מקדם כיווץ העיגול המרכזי
let status2GrowDuration = 2000; // משך גדילת העיגול הממוקד
let status2MinExpandedSize = 300; // גודל מינימלי לעיגול ממוקד
let status2MaxExpandedSize = 500; // גודל מקסימלי לעיגול ממוקד
let status2DelayRandomRange = [4, 20]; // טווח השהיות לאנימציית פיזור במצב 2

// === משתנים נוספים למבנה האנימציה ===
let centerNode;
let surroundingNodes = [];
let status = 0; // 0: default, 1: center expanded, 2: node focused
let focusedNodeIndex = null; // אינדקס העיגול שבפוקוס
let transitionStartTime = 0; // זמן התחלת המעבר האחרון
let winkyFont; // הפונט (אם נטען)
let focusSwitchTimer = null; // טיימר למניעת לחיצות כפולות מהירות
let pendingFocusedIndex = null; // אינדקס ממתין לפוקוס בטיימר
let isFocusSwitching = false; // דגל למניעת כניסה כפולה לטיימר
let BlinkyStar; // שם משתנה לפונט

// === פונקציות ===
function preload() {
  try {
    // נסה לטעון את הפונט
    BlinkyStar = loadFont('Blinky Star.otf');
    console.log("Font Blinky Star loaded successfully.");
  } catch(e) {
    console.error("Could not load font 'Blinky Star.otf'. Using default font.", e);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  initNodes(); // אתחול ראשוני של העיגולים

  // הגדרת פונט ברירת מחדל או הפונט שנטען
  if (BlinkyStar) {
    textFont(BlinkyStar);
  } else {
    textFont('arial'); // פונט גיבוי
  }

  // הגדרות טקסט גלובליות
  textAlign(CENTER, CENTER);
  drawingContext.textBaseline = 'middle'; // יישור אנכי למרכז
  drawingContext.textAlign = 'center';   // יישור אופקי למרכז
  pixelDensity(1);
  console.log("Setup complete. Status:", status);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initNodes(); // אתחל מחדש את העיגולים בשינוי גודל החלון
  console.log("Window resized. Nodes reinitialized.");
}

function initNodes() {
  console.log("Initializing nodes...");
  surroundingNodes = [];
  focusedNodeIndex = null;
  status = 0; // חזרה למצב התחלתי
  pendingFocusedIndex = null;
  isFocusSwitching = false;
  if (focusSwitchTimer) { clearTimeout(focusSwitchTimer); focusSwitchTimer = null; }

  // אתחול העיגול המרכזי
  centerNode = {
    baseX: width / 2,
    baseY: height / 2,
    r: centerDefaultSize,
    currentR: centerDefaultSize,
    targetR: centerDefaultSize,
    col: color(0, 102, 255),
    angleOffset: random(TWO_PI),
    targetX: width / 2,
    targetY: height / 2,
    currentX: width / 2,
    currentY: height / 2,
    label: 'מרכז',
    content: "זהו העיגול המרכזי. לחץ על עיגולים מסביב כדי לגלות עוד.",
    contentAlpha: 0,
    expandedR: centerDefaultSize * growthMultiplier
  };

  // יצירת העיגולים ההיקפיים
  let maxTries = 1000;
  while (surroundingNodes.length < 10 && maxTries > 0) {
    maxTries--;
    let angle = random(TWO_PI);
    let distFromCenter = random(baseDistance * 1.2, baseDistance * 1.8);
    let r = random(50, 80) * 1.25;
    let x = centerNode.baseX + cos(angle) * distFromCenter;
    let y = centerNode.baseY + sin(angle) * distFromCenter;

    let overlaps = false;
    for (let other of surroundingNodes) {
      if (dist(x, y, other.baseX, other.baseY) < (r + other.r) * 1.1) {
        overlaps = true;
        break;
      }
    }
    if (overlaps) continue;

    let nodeIndex = surroundingNodes.length + 1;
    let nodeContent = `תוכן ייחודי לעיגול ${nodeIndex}. `;

    if (nodeIndex % 3 === 0) {
      nodeContent += `טקסט זה יוצג כאשר העיגול במצב פוקוס. כאן אפשר להוסיף פרטים נוספים. העיגול יגדל כדי להתאים לתוכן ארוך יותר.`;
    } else if (nodeIndex % 3 === 1) {
      nodeContent += `טקסט זה יוצג כאשר העיגול במצב פוקוס. הנה עוד קצת מידע.`;
    } else {
      nodeContent += `תיאור קצר לעיגול זה.`;
    }

    // הוספת העיגול למערך
    surroundingNodes.push({
      angle: angle,
      r: r,
      baseR: r,
      currentR: r,
      targetR: r,               // רדיוס יעד (ישתנה במצב 2)
      col: color(random(100, 220), random(100, 220), random(100, 220)),
      angleOffset: random(TWO_PI),
      baseX: x,
      baseY: y,
      currentX: x,
      currentY: y,
      targetX: x,
      targetY: y,
      label: `עיגול ${nodeIndex}`,
      content: nodeContent,
      contentAlpha: 0,
      expandedR: status2MinExpandedSize,
      // hoverStartTime: 0,     // הוסר - אין אנימציית hover
      shrinkStartTime: 0         // זמן התחלת אנימציית כיווץ (כשחוזרים ממצב 2)
    });
  }

  updateCircleSizesBasedOnContent();
  console.log(`Initialized ${surroundingNodes.length} surrounding nodes.`);
}

function updateCircleSizesBasedOnContent() {
  console.log("Updating expanded sizes based on content length...");
  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];
    let textLength = node.content.length;
    let minTextLength = 50;
    let maxTextLength = 300;
    let normalizedLength = constrain(textLength, minTextLength, maxTextLength);
    let sizeRange = status2MaxExpandedSize - status2MinExpandedSize;
    let sizeRatio = (maxTextLength === minTextLength) ? 0 : (normalizedLength - minTextLength) / (maxTextLength - minTextLength);
    let calculatedSize = status2MinExpandedSize + (sizeRange * sizeRatio);
    node.expandedR = max(calculatedSize, 350);
  }
}

// ================== DRAW FUNCTION ==================
function draw() {
  background('#F2A900');
  drawingContext.imageSmoothingEnabled = true;

  let timeSinceTransition = millis() - transitionStartTime;
  let centerT = constrain(timeSinceTransition / centerGrowDuration, 0, 1);
  let outerT = constrain(timeSinceTransition / surroundingMoveDuration, 0, 1);
  let easeCenter = ultraEaseInOut(centerT);
  let easeOuter = ultraEaseInOut(outerT);

  // --- עדכון מצב העיגול המרכזי ---
  centerNode.targetR = status === 1 ? centerNode.expandedR : (status === 2 ? centerNode.expandedR * status2CenterShrinkFactor : centerDefaultSize);
  centerNode.currentR = lerp(centerNode.currentR, centerNode.targetR, easeCenter);
  centerNode.currentX = lerp(centerNode.currentX, centerNode.targetX, easeCenter);
  centerNode.currentY = lerp(centerNode.currentY, centerNode.targetY, easeCenter);
  let centerDisplayX = centerNode.currentX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;
  let centerDisplayY = centerNode.currentY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;

  stroke(0);
  strokeWeight(3);

  // --- עדכון מצב העיגולים ההיקפיים (לולאה ראשונה: עדכון מאפיינים) ---
  for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      node.currentX = lerp(node.currentX, node.targetX, easeOuter);
      node.currentY = lerp(node.currentY, node.targetY, easeOuter);

      // קביעת רדיוס מטרה (נקבע ב-mousePressed)
      let targetR = (node.targetR !== undefined) ? node.targetR : node.baseR;

      // אנימציית שינוי גודל בהתאם למצב
      if (status === 2) { // אנימציה במצב פוקוס
          if (i === focusedNodeIndex) { // עיגול ממוקד גדל
              let growElapsed = timeSinceTransition;
              let tGrow = constrain(growElapsed / status2GrowDuration, 0, 1);
              let easeGrow = ultraEaseInOut(tGrow);
              node.currentR = lerp(node.currentR, targetR, easeGrow); // targetR הוא expandedR

              // Fade-in של הטקסט הממוקד
              if (growElapsed > textFadeInDelay) {
                  let fadeElapsed = growElapsed - textFadeInDelay;
                  let alphaProgress = constrain(fadeElapsed / 500, 0, 1);
                  node.contentAlpha = lerp(node.contentAlpha, 255, alphaProgress * textFadeInSpeed);
              } else {
                  if (node.contentAlpha > 0) node.contentAlpha = lerp(node.contentAlpha, 0, textFadeOutSpeed * 2);
              }
          } else { // עיגולים אחרים במצב 2 (מתכווצים/זזים)
              let shrinkElapsed = millis() - (node.shrinkStartTime || transitionStartTime);
              let tShrink = constrain(shrinkElapsed / status2ShrinkDuration, 0, 1);
              let easeShrink = ultraEaseInOut(tShrink);
              node.currentR = lerp(node.currentR, targetR, easeShrink); // targetR הוא baseR

              node.contentAlpha = lerp(node.contentAlpha, 0, textFadeOutSpeed);
          }
       // *** שינוי: הסרת אנימציית Hover ***
      } else { // אנימציית גודל בסטטוס 0 או 1 (חזרה לגודל בסיס)
           let targetR = node.baseR; // היעד הוא תמיד הגודל הבסיסי
           // שימוש בזמן תחילת הכיווץ (אם קיים, כשחוזרים מ-2) או זמן המעבר הכללי
           let animStartTime = node.shrinkStartTime || transitionStartTime;
           let animElapsed = millis() - animStartTime;
           let returnDuration = 500; // משך זמן לחזרה לגודל בסיס
           let tAnim = constrain(animElapsed / returnDuration, 0, 1);
           let easeAnim = ultraEaseInOut(tAnim);
           // בצע אנימציה רק אם הגודל הנוכחי שונה מהיעד
           if (abs(node.currentR - targetR) > 0.1) {
                node.currentR = lerp(node.currentR, targetR, easeAnim);
           } else {
                node.currentR = targetR; // קבע לגודל היעד אם קרוב מספיק
           }

           // Fade-out של הטקסט אם לא במצב הנכון להצגה
           if (status !== 1 && node === centerNode) { // תוכן מרכזי
                 centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, textFadeOutSpeed);
           } else if (status !== 2 || i !== focusedNodeIndex) { // תוכן היקפי
                 node.contentAlpha = lerp(node.contentAlpha, 0, textFadeOutSpeed);
           }
      }

      // עדכון מיקום תצוגה סופי עם ריצוד
      node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
  }


  // --- ציור האלמנטים (לולאה שנייה: ציור) ---

  // ציור הקווים המחברים
  for (let i = 0; i < surroundingNodes.length; i++) {
      line(centerDisplayX, centerDisplayY, surroundingNodes[i].displayX, surroundingNodes[i].displayY);
  }

  // ציור עיגולים היקפיים (כל אלה שאינם בפוקוס במצב 2)
  for (let i = 0; i < surroundingNodes.length; i++) {
      if (status === 2 && i === focusedNodeIndex) continue;

      let node = surroundingNodes[i];
      // צל
      let shadowOffsetX = 3 * cos(radians(325));
      let shadowOffsetY = 3 * sin(radians(325));
      fill(0, 50);
      noStroke();
      ellipse(node.displayX + shadowOffsetX, node.displayY + shadowOffsetY, node.currentR);

      // עיגול
      fill(node.col);
      stroke(0);
      strokeWeight(2);
      ellipse(node.displayX, node.displayY, node.currentR);

      // כותרת העיגול ההיקפי
      push();
      fill(0);
      noStroke();
      let textSizeValue = min(node.currentR * textMaxSizePercentage, 20);
      textSize(textSizeValue);
      text(node.label, node.displayX, node.displayY);
      pop();
  }

  // --- ציור העיגול המרכזי ---
  let shadowOffsetXCenter = 3 * cos(radians(145));
  let shadowOffsetYCenter = 3 * sin(radians(145));
  fill(0, 50);
  noStroke();
  ellipse(centerDisplayX + shadowOffsetXCenter, centerDisplayY + shadowOffsetYCenter, centerNode.currentR);
  fill(centerNode.col);
  stroke(0);
  strokeWeight(2);
  ellipse(centerDisplayX, centerDisplayY, centerNode.currentR);

  // --- ציור טקסט העיגול המרכזי ---
  push();
  fill(0);
  noStroke();
  let centerTextSize = min(centerNode.currentR * 0.25, 36);
  textSize(centerTextSize);
  drawingContext.shadowColor = textShadowColor;
  drawingContext.shadowBlur = textShadowBlur * 1.5;
  drawingContext.shadowOffsetX = 2;
  drawingContext.shadowOffsetY = 2;

  if (status === 1) { // טקסט במצב 1
     let targetTitleOffset = -centerNode.currentR * 0.35;
     let currentTitleOffset = lerp(0, targetTitleOffset, easeCenter);
     text(centerNode.label, centerDisplayX, centerDisplayY + currentTitleOffset);

     if (centerNode.contentAlpha > 10) {
        push();
        fill(0, centerNode.contentAlpha);
        noStroke();
        drawingContext.shadowBlur = 0;
        drawingContext.shadowOffsetX = 0;
        drawingContext.shadowOffsetY = 0;
        textSize(16);
        let textWidth = centerNode.currentR * 0.7;
        let textHeight = centerNode.currentR * 0.6;
        text(centerNode.content,
             centerDisplayX,
             centerDisplayY + currentTitleOffset + centerTextSize + textContentPadding,
             textWidth, textHeight);
        pop();
     }

     let centerElapsed = timeSinceTransition;
     if (centerElapsed > textFadeInDelay) {
       let fadeElapsed = centerElapsed - textFadeInDelay;
       let alphaProgress = constrain(fadeElapsed / 500, 0, 1);
       centerNode.contentAlpha = lerp(centerNode.contentAlpha, 255, alphaProgress * textFadeInSpeed);
     } else {
         if (centerNode.contentAlpha > 0 && transitionStartTime === millis() - centerElapsed) {
              centerNode.contentAlpha = 0;
         } else if (centerNode.contentAlpha > 0) {
              centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, textFadeOutSpeed);
         }
     }

  } else { // טקסט במצב 0 או 2 (עבור העיגול המרכזי)
     text(centerNode.label, centerDisplayX, centerDisplayY);
     if (status !== 1 && centerNode.contentAlpha > 0) {
          centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, textFadeOutSpeed);
     }
  }
  pop(); // סיום הגדרות טקסט מרכזי

  // --- ציור העיגול הממוקד במצב 2 (מעל הכל) ---
  if (status === 2 && focusedNodeIndex !== null) {
      let node = surroundingNodes[focusedNodeIndex];
      // צל
      let shadowOffsetX = 3 * cos(radians(325));
      let shadowOffsetY = 3 * sin(radians(325));
      fill(0, 50);
      noStroke();
      ellipse(node.displayX + shadowOffsetX, node.displayY + shadowOffsetY, node.currentR);

      // עיגול ממוקד
      fill(node.col);
      stroke(0);
      strokeWeight(2);
      ellipse(node.displayX, node.displayY, node.currentR);

      // טקסט של עיגול ממוקד
      let titleOffsetFocused = -node.currentR * 0.25;

      // כותרת ממוקדת
      push();
      fill(0);
      noStroke();
      let focusedTextSize = min(node.currentR * 0.25, 36);
      textSize(focusedTextSize);
      drawingContext.shadowColor = textShadowColor;
      drawingContext.shadowBlur = textShadowBlur * 1.5;
      drawingContext.shadowOffsetX = 2;
      drawingContext.shadowOffsetY = 2;
      text(node.label, node.displayX, node.displayY + titleOffsetFocused);
      pop();

      // תוכן ממוקד
      if (node.contentAlpha > 10) {
           push();
           fill(0, node.contentAlpha);
           noStroke();
           drawingContext.shadowBlur = 0;
           drawingContext.shadowOffsetX = 0;
           drawingContext.shadowOffsetY = 0;
           textSize(16);
           let textWidth = node.currentR * 0.7;
           let textHeight = node.currentR * 0.6;
           text(node.content,
                node.displayX,
                node.displayY + titleOffsetFocused + focusedTextSize + textContentPadding,
                textWidth, textHeight);
           pop();
      }
  }

  // --- סוף הציור ---

} // ================== END OF DRAW FUNCTION ==================


// ================== MOUSE PRESSED FUNCTION ==================
function mousePressed() {
    let clickedSurrounding = false; // דגל לבדיקה אם לחצו על עיגול היקפי

    // --- בדיקת לחיצה על העיגול המרכזי ---
    if (dist(mouseX, mouseY, centerNode.currentX, centerNode.currentY) < centerNode.currentR / 2) {
        console.log("Center node clicked. Current status:", status);
        if (status === 2 && focusedNodeIndex !== null) {
            surroundingNodes[focusedNodeIndex].contentAlpha = 0;
            surroundingNodes[focusedNodeIndex].targetR = surroundingNodes[focusedNodeIndex].baseR;
            surroundingNodes[focusedNodeIndex].shrinkStartTime = millis();
        }

        if (status === 2) {
            status = 1;
            focusedNodeIndex = null;
            resetPositionsToStatus1();
        } else if (status === 1) {
            status = 0;
            centerNode.contentAlpha = 0;
            resetPositionsToStatus0();
        } else { // status === 0
            status = 1;
            animateToStatus1();
        }
        transitionStartTime = millis();
        console.log("New status:", status);
        return;
    }

    // --- בדיקת לחיצה על עיגולים היקפיים ---
    for (let i = 0; i < surroundingNodes.length; i++) {
        let node = surroundingNodes[i];
        if (dist(mouseX, mouseY, node.currentX, node.currentY) < node.currentR / 2) {
            console.log(`Surrounding node ${i+1} clicked. Current status: ${status}, Focused: ${focusedNodeIndex}`);
            clickedSurrounding = true;

            if (status === 2 && focusedNodeIndex !== null && focusedNodeIndex !== i) {
                console.log(`Switching focus from node ${focusedNodeIndex+1}`);
                surroundingNodes[focusedNodeIndex].contentAlpha = 0;
                surroundingNodes[focusedNodeIndex].targetR = surroundingNodes[focusedNodeIndex].baseR;
                surroundingNodes[focusedNodeIndex].shrinkStartTime = millis();
            }

            if (status === 1) {
                centerNode.contentAlpha = 0;
            }

            // --- התחלת מעבר למצב 2 ---
            pendingFocusedIndex = i;
            status = 2;
            transitionStartTime = millis();

            node.targetX = width / 2;
            node.targetY = height / 2;
            node.targetR = node.expandedR; // קביעת יעד גדילה מיידי
            node.contentAlpha = 0;

            console.log(`Immediately setting target size for circle ${i+1} to ${node.expandedR}`);

            centerNode.targetX = width / 2 + status2CenterOffset;
            centerNode.targetY = height / 2;
            centerNode.targetR = centerNode.expandedR * status2CenterShrinkFactor;

            let cumulativeDelay = 0;
            for (let j = 0; j < surroundingNodes.length; j++) {
                if (j !== i) {
                    let otherNode = surroundingNodes[j];
                    let angle = otherNode.angle;
                    let distance = centerNode.r * 0.8 + random(150, 250);
                    let delay = random(status2DelayRandomRange[0], status2DelayRandomRange[1]);
                    setTimeout(() => {
                        if (status === 2) {
                            otherNode.targetX = width / 2 + cos(angle) * distance;
                            otherNode.targetY = height / 2 + sin(angle) * distance;
                            otherNode.targetR = otherNode.baseR;
                            otherNode.shrinkStartTime = millis();
                        }
                    }, cumulativeDelay);
                    cumulativeDelay += delay;
                }
            }

            if (!isFocusSwitching) {
                isFocusSwitching = true;
                if (focusSwitchTimer !== null) {
                    clearTimeout(focusSwitchTimer);
                    focusSwitchTimer = null;
                }
                focusSwitchTimer = setTimeout(() => {
                    if (pendingFocusedIndex === i && status === 2) {
                        focusedNodeIndex = i;
                        console.log(`Confirmed focusedNodeIndex: ${focusedNodeIndex}`);
                    } else {
                        console.log("Focus switch cancelled or outdated.");
                    }
                    pendingFocusedIndex = null;
                    focusSwitchTimer = null;
                    isFocusSwitching = false;
                }, 100);
            }
             console.log("New status: 2");
            return;
        }
    } // סוף לולאת בדיקת עיגולים היקפיים

    // --- בדיקת לחיצה על הרקע ---
    if (!clickedSurrounding) { // אם לא לחצו על אף עיגול
        console.log("Background clicked. Current status:", status);
        if (status === 2) {
            // *** שינוי: לחיצה על הרקע במצב 2 -> חזרה למצב 0 ***
            status = 0;
            if (focusedNodeIndex !== null) {
                surroundingNodes[focusedNodeIndex].targetR = surroundingNodes[focusedNodeIndex].baseR;
                surroundingNodes[focusedNodeIndex].shrinkStartTime = millis();
                surroundingNodes[focusedNodeIndex].contentAlpha = 0;
            }
            focusedNodeIndex = null;
            transitionStartTime = millis();
            resetPositionsToStatus0(); // קריאה לפונקציה שמאפסת למצב 0
             console.log("New status: 0");
        } else if (status === 1) {
            status = 0;
            centerNode.contentAlpha = 0;
            transitionStartTime = millis();
            resetPositionsToStatus0();
             console.log("New status: 0");
        }
    }
} // ================== END OF MOUSE PRESSED ==================


// ================== HELPER FUNCTIONS ==================

// איפוס המיקומים למצב ברירת מחדל (סטטוס 0)
function resetPositionsToStatus0() {
  console.log("Resetting positions to Status 0");
  centerNode.targetX = width / 2;
  centerNode.targetY = height / 2;
  centerNode.targetR = centerDefaultSize;
  centerNode.contentAlpha = 0;

  for (let node of surroundingNodes) {
    node.targetX = node.baseX;
    node.targetY = node.baseY;
    node.targetR = node.baseR;
    node.contentAlpha = 0;
    node.shrinkStartTime = millis();
  }
  focusedNodeIndex = null;
}

// החזרת המיקומים למצב מרכז מוגדל (סטטוס 1)
function resetPositionsToStatus1() {
  console.log("Resetting positions to Status 1");
  centerNode.targetX = width / 2;
  centerNode.targetY = height / 2;
  centerNode.targetR = centerNode.expandedR;

  let cumulativeDelay = 0;
  for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      let angle = node.angle;
      let distance = baseDistance + status1ExpansionAmount;
      setTimeout(() => {
            if (status === 1) {
               node.targetX = centerNode.baseX + cos(angle) * distance;
               node.targetY = centerNode.baseY + sin(angle) * distance;
               node.targetR = node.baseR;
               node.contentAlpha = 0;
               node.shrinkStartTime = millis(); // Set shrink start time for smooth transition back
            }
       }, cumulativeDelay);
      cumulativeDelay += random(status1DelayRandomRange[0] / 2, status1DelayRandomRange[1] / 2);
  }
  focusedNodeIndex = null;
}

// אנימציית מעבר למצב 1 (סטטוס 0 -> 1)
function animateToStatus1() {
    console.log("Animating to Status 1");
    centerNode.targetR = centerNode.expandedR;
    centerNode.targetX = width / 2;
    centerNode.targetY = height / 2;

    let indices = [...Array(surroundingNodes.length).keys()];
    shuffle(indices, true);
    let cumulativeDelay = 0;

    for (let i = 0; i < indices.length; i++) {
      let nodeIndex = indices[i];
      let node = surroundingNodes[nodeIndex];
      let angle = node.angle;
      let distance = baseDistance + status1ExpansionAmount;
      setTimeout(() => {
          if (status === 1) {
             node.targetX = centerNode.baseX + cos(angle) * distance;
             node.targetY = centerNode.baseY + sin(angle) * distance;
             node.targetR = node.baseR;
          }
      }, cumulativeDelay);
      cumulativeDelay += random(status1DelayRandomRange[0], status1DelayRandomRange[1]);
    }
}

// פונקציית עזר לאנימציה חלקה (Easing)
function ultraEaseInOut(t) {
  if (t === 0) return 0;
  if (t === 1) return 1;
  t *= 2;
  if (t < 1) return 0.5 * pow(t, easeInPower);
  return 1 - 0.5 * pow(2 - t, easeOutPower);
}

// פונקציה לטיפול ב-Hover (כרגע לא עושה כלום - הוסרה)
// function handleHover() {
//    // No hover effect implemented
// }

// ================== END OF HELPER FUNCTIONS ==================
