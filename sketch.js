// הגדרות אנימציה וכללי תנועה
let hoverAnimationDuration = 300; // מהירות הגדילה/התכווצות בזמן ריחוף (מילישניות)
let status2ShrinkDuration = 3500;   // משך אנימציית ההתכווצות בסטטוס 2 (מילישניות)
let status2CenterOffset = 100;      // הזזה אופקית לעיגול המרכזי בסטטוס 2
let status2CenterShrinkFactor = 0.4;// יחס כיווץ העיגול המרכזי בסטטוס 2
let status1ExpandedSize = 1000;      // גודל העיגול המרכזי במצב סטטוס 1
let status2GrowDuration = 2500;     // משך הגדילה של עיגול היקפי בסטטוס 2
let status2ExpandedSize = 300;      // גודל העיגול ההיקפי בסטטוס 2
let easeInPower = 4;                // עוצמת ה-ease in
let easeOutPower = 10;              // עוצמת ה-ease out
let status1ExpansionAmount = 150;   // המרחק שהעיגולים ההיקפיים מתרחקים במצב סטטוס 1
let status1CenterDelay = 0;         // דיליי לפני הגדלת העיגול המרכזי
let status2DelayRandomRange = [4, 20];  // טווח דיליי רנדומלי בין העיגולים בסטטוס 2
let status1DelayRandomRange = [4, 20];  // טווח דיליי רנדומלי בין העיגולים במעבר לסטטוס 1
let centerGrowDuration = 1800;         // מהירות הגדלת העיגול המרכזי
let surroundingMoveDuration = 2500;    // מהירות תנועת העיגולים ההיקפיים

let baseDistance = 150;
let wiggleSpeed = 0.01;
let wiggleRadius = 20;

// הגדרות לטקסט
let textShadowBlur = 0;              // עוצמת טשטוש הצל
let textShadowColor = 'white';       // צבע הצל לטקסט
let textMaxSizePercentage = 0.6;      // אחוז מקסימלי לגודל הטקסט ביחס לעיגול

// הגדרות לתוכן (פסקה) בתוך כל עיגול
let contentFadeDuration = 500;       // משך אנימציית fade in/out (מילישניות)

let centerNode;
let surroundingNodes = [];
let status = 0;
let focusedNodeIndex = null;
let transitionStartTime = 0;
let hoverStartTimes = [];  // זמנים לריחוף
let winkyFont;
let focusSwitchTimer = null;  // טיימר לדיליי בהחלפת פוקוס
let pendingFocusedIndex = null;
let isFocusSwitching = false;
let BlinkyStar;  // שם הפונט המועדף

function preload() {
  // ניסיון לטעון את הפונט המועדף
  try {
    BlinkyStar = loadFont('Blinky Star.otf');  // ודא ששמו נכון
  } catch(e) {
    console.log("לא ניתן לטעון את הפונט, משתמש בפונט ברירת המחדל");
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  initNodes();
  
  // הגדרת הפונט – פתרון חלופי במקרה של כשל
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

  // הגדרת העיגול המרכזי
  centerNode = {
    baseX: width / 2,
    baseY: height / 2,
    r: 180,
    currentR: 180,
    col: color(0, 102, 255),
    angleOffset: random(1000),
    targetX: width / 2,
    targetY: height / 2,
    currentX: width / 2,
    currentY: height / 2,
    label: 'text 0'
  };

  let maxTries = 1000;
  // יצירת עיגולים היקפיים – עד 10 עיגולים
  while (surroundingNodes.length < 10 && maxTries > 0) {
    maxTries--;
    let angle = random(TWO_PI);
    let distFromCenter = random(baseDistance, baseDistance + 100);
    let r = random(50, 80) * 1.25;
    let x = centerNode.baseX + cos(angle) * distFromCenter;
    let y = centerNode.baseY + sin(angle) * distFromCenter;

    let overlaps = false;
    for (let other of surroundingNodes) {
      let d = dist(x, y, other.baseX, other.baseY);
      if (d < r + other.r + 20) {
        overlaps = true;
        break;
      }
    }
    if (overlaps) continue;

    // כל עיגול יקבל גם תכולת פסקה, עם הגדרות לאנימציית fade
    let node = {
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
      expandedR: r * 1.4,
      label: `text ${surroundingNodes.length + 1}`,
      content: "זו פסקה של טקסט שתוחלף בהמשך",
      contentAlpha: 0,      // שקיפות התוכן (0 = מוסתר, 255 = מלא)
      fadingOut: false,     // האם התוכן נמצא בתהליך fade out
      contentFadeStart: 0   // הזמן שבו התחילה האנימציה של התוכן
    };
    hoverStartTimes.push(0);
    surroundingNodes.push(node);
  }
}

function draw() {
  background('#F2A900');
  drawingContext.imageSmoothingEnabled = true;
  
  // חישובי זמן לאנימציות
  let centerT = constrain((millis() - transitionStartTime) / centerGrowDuration, 0, 1);
  let outerT = constrain((millis() - transitionStartTime) / surroundingMoveDuration, 0, 1);
  let easeCenter = ultraEaseInOut(centerT);
  let easeOuter = ultraEaseInOut(outerT);

  let centerTargetR = status === 2 ? status1ExpandedSize : status2CenterShrinkFactor * (status === 1 ? status1ExpandedSize : 180);
  centerNode.currentR = lerp(centerNode.currentR, centerTargetR, easeCenter);
  centerNode.currentX = lerp(centerNode.currentX, centerNode.targetX, easeCenter);
  centerNode.currentY = lerp(centerNode.currentY, centerNode.targetY, easeCenter);

  stroke(0);
  strokeWeight(3);

  if (status === 0 || status === 1) {
    // מצבים רגילים – ציור קווים, עיגולים היקפיים והעיגול המרכזי
    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      node.currentX = lerp(node.currentX, node.targetX, easeOuter);
      node.currentY = lerp(node.currentY, node.targetY, easeOuter);
      let targetR = (node.targetR !== undefined) ? node.targetR : node.baseR;
      if (node.hoverTargetR !== undefined && (i !== focusedNodeIndex)) {
        targetR = node.hoverTargetR;
      }
      let hoverElapsed = millis() - max(transitionStartTime, hoverStartTimes[i]);
      let hoverDuration = (status === 2 && i === focusedNodeIndex) ? status2GrowDuration : hoverAnimationDuration;
      let tHover = constrain(hoverElapsed / hoverDuration, 0, 1);
      let easeHover = ultraEaseInOut(tHover);
      node.currentR = lerp(node.currentR, targetR, easeHover);
      line(centerNode.currentX, centerNode.currentY, node.currentX, node.currentY);
    }

    // ציור העיגולים ההיקפיים וטקסטם
    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      // ציור הצל לעיגול
      let shadowOffsetX = 3 * cos(radians(325));
      let shadowOffsetY = 3 * sin(radians(325));
      fill(0);
      ellipse(
        node.currentX + shadowOffsetX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentY + shadowOffsetY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentR
      );
      // ציור העיגול עצמו
      fill(node.col);
      ellipse(
        node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentR
      );
      // ציור טקסט (הכותרת) במרכז העיגול
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
      text(
        node.label,
        node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius
      );
      pop();
    }

    // ציור העיגול המרכזי
    push();
    noStroke();
    drawingContext.filter = 'none';
    let shadowOffsetX = 3 * cos(radians(145));
    let shadowOffsetY = 3 * sin(radians(145));
    fill(0);
    ellipse(
      centerNode.currentX + shadowOffsetX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius,
      centerNode.currentY + shadowOffsetY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius,
      centerNode.currentR
    );
    pop();

    fill(centerNode.col);
    ellipse(
      centerNode.currentX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius,
      centerNode.currentY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius,
      centerNode.currentR
    );
    
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
    text(
      centerNode.label,
      centerNode.currentX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius,
      centerNode.currentY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius
    );
    pop();
    
  } else if (status === 2) {
    // מצב התמקדות – ציור כל העיגולים ועדכון המוקד
    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      node.currentX = lerp(node.currentX, node.targetX, easeOuter);
      node.currentY = lerp(node.currentY, node.targetY, easeOuter);
      let targetR = (node.targetR !== undefined) ? node.targetR : node.baseR;
      
      if (i !== focusedNodeIndex) {
        if (node.hoverTargetR !== undefined) {
          targetR = node.hoverTargetR;
          let hoverElapsed = millis() - hoverStartTimes[i];
          let tHover = constrain(hoverElapsed / hoverAnimationDuration, 0, 1);
          let easeHover = ultraEaseInOut(tHover);
          node.currentR = lerp(node.currentR, targetR, easeHover);
        }
      }
      line(centerNode.currentX, centerNode.currentY, node.currentX, node.currentY);
      
      // ציור הצל והעיגול עצמו עבור כל העיגולים
      let shadowOffsetX = 3 * cos(radians(325));
      let shadowOffsetY = 3 * sin(radians(325));
      fill(0);
      ellipse(
        node.currentX + shadowOffsetX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentY + shadowOffsetY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentR
      );
      if (i === focusedNodeIndex) continue;
      fill(node.col);
      ellipse(
        node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentR
      );
      
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
      text(
        node.label,
        node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius
      );
      pop();
      
      // עבור עיגולים שאיבדו מוקד והיו בעבר ממוקדים – ניתן לעדכן אנימציית fade out
      if (i !== focusedNodeIndex && node.fadingOut) {
        let fadeOutAlpha = constrain(255 - ((millis() - node.contentFadeStart) / contentFadeDuration) * 255, 0, 255);
        node.contentAlpha = fadeOutAlpha;
        if (fadeOutAlpha <= 0) {
          node.contentAlpha = 0;
          node.fadingOut = false;
        }
      }
    }
    
    // ציור העיגול הממוקד מעל כולם עם תצוגת התוכן
    if (focusedNodeIndex !== null) {
      let node = surroundingNodes[focusedNodeIndex];
      // ציור העיגול עצמו
      fill(node.col);
      ellipse(
        node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentR
      );
      
      // ציור הכותרת – כשהעיגול במוקד, הכותרת עולה מעט למעלה
      push();
      fill(0);
      noStroke();
      let focusedTextSize = min(node.currentR * 0.2, 32);
      textSize(focusedTextSize);
      drawingContext.shadowColor = textShadowColor;
      drawingContext.shadowBlur = textShadowBlur * 2;
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      let titleY = node.currentY - node.currentR * 0.15;
      text(node.label, node.currentX, titleY);
      pop();
      
      // עדכון אנימציית fade in/out עבור תוכן העיגול
      let contentAlpha;
      if (node.fadingOut) {
         contentAlpha = constrain(255 - ((millis() - node.contentFadeStart) / contentFadeDuration) * 255, 0, 255);
      } else {
         contentAlpha = constrain(((millis() - node.contentFadeStart) / contentFadeDuration) * 255, 0, 255);
      }
      node.contentAlpha = contentAlpha;
      if (node.fadingOut && contentAlpha <= 0) {
         node.contentAlpha = 0;
         node.fadingOut = false;
      }
      
      // ציור הפסקה בתוך העיגול – תוך שימוש במסכה (clip) כך שהתוכן יוצג רק בתוך גבולות העיגול
      if (node.contentAlpha > 0) {
        push();
        drawingContext.save();
        drawingContext.beginPath();
        drawingContext.arc(node.currentX, node.currentY, node.currentR / 2, 0, TWO_PI);
        drawingContext.clip();
        
        fill(0, node.contentAlpha);
        let contentTextSize = min(node.currentR * 0.1, 18);
        textSize(contentTextSize);
        textAlign(CENTER, CENTER);
        let contentY = node.currentY + node.currentR * 0.1;
        text(node.content, node.currentX, contentY);
        
        drawingContext.restore();
        pop();
      }
    }
  }
}

function mousePressed() {
  // לחיצה על העיגול המרכזי
  if (dist(mouseX, mouseY, centerNode.currentX, centerNode.currentY) < centerNode.currentR / 2) {
    if (status === 2) {
      status = 1;
      if (focusedNodeIndex !== null) {
        let prevNode = surroundingNodes[focusedNodeIndex];
        prevNode.targetR = prevNode.baseR;
        prevNode.fadingOut = true;
        prevNode.contentFadeStart = millis();
      }
    } else {
      status = 1;
    }
    transitionStartTime = millis();
    
    let indices = [...Array(surroundingNodes.length).keys()];
    shuffle(indices, true);
    let cumulativeDelay = 0;
    
    // הגדלת העיגול המרכזי
    centerNode.targetR = status1ExpandedSize;
    
    for (let i = 0; i < indices.length; i++) {
      let nodeIndex = indices[i];
      let node = surroundingNodes[nodeIndex];
      let angle = node.angle;
      let distance = baseDistance + status1ExpansionAmount;
      setTimeout(() => {
        node.targetX = centerNode.baseX + cos(angle) * distance;
        node.targetY = centerNode.baseY + sin(angle) * distance;
        node.targetR = node.baseR;
      }, cumulativeDelay);
      cumulativeDelay += random(status1DelayRandomRange[0], status1DelayRandomRange[1]);
    }
    return;
  }
  
  // לחיצה על עיגול היקפי
  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];
    if (dist(mouseX, mouseY, node.currentX, node.currentY) < node.currentR / 2) {
      // אם יש עיגול מוקד קודם ושלא אותו שנלחץ כעת – מקטינים אותו ומפעילים fade out
      if (status === 2 && focusedNodeIndex !== null && focusedNodeIndex !== i) {
        let prevNode = surroundingNodes[focusedNodeIndex];
        prevNode.targetR = prevNode.baseR;
        prevNode.fadingOut = true;
        prevNode.contentFadeStart = millis();
      }
      pendingFocusedIndex = i;
      status = 2;
      transitionStartTime = millis();
      // הזזת העיגול למרכז והכנה להרחבה
      node.targetX = width / 2;
      node.targetY = height / 2;
      node.targetR = node.baseR;
      
      if (!isFocusSwitching) {
        isFocusSwitching = true;
        if (focusSwitchTimer !== null) {
          clearTimeout(focusSwitchTimer);
          focusSwitchTimer = null;
        }
        focusSwitchTimer = setTimeout(() => {
          focusedNodeIndex = pendingFocusedIndex;
          pendingFocusedIndex = null;
          focusSwitchTimer = null;
          transitionStartTime = millis();
          // כאן העיגול מתרחב – targetR מוגדר כערך גבוה (status2ExpandedSize)
          surroundingNodes[i].targetR = status2ExpandedSize;
          surroundingNodes[i].fadingOut = false;
          surroundingNodes[i].contentFadeStart = millis(); // התחלת fade in לתוכן
          isFocusSwitching = false;
        }, 500);
        // במידה ואין מוקד קיים או שהוא אותו העיגול, מיד מגדילים אותו
        if (focusedNodeIndex === null || focusedNodeIndex === i) {
          surroundingNodes[i].targetR = status2ExpandedSize;
          surroundingNodes[i].fadingOut = false;
          surroundingNodes[i].contentFadeStart = millis();
        }
      }
      
      // מיקום מחדש של יתר העיגולים
      for (let j = 0; j < surroundingNodes.length; j++) {
        if (j !== i) {
          let angle = surroundingNodes[j].angle;
          let distance = baseDistance + random(30, 120);
          let delay = j * random(status2DelayRandomRange[0], status2DelayRandomRange[1]);
          setTimeout(() => {
            surroundingNodes[j].targetX = width / 2 + cos(angle) * distance;
            surroundingNodes[j].targetY = height / 2 + sin(angle) * distance;
            surroundingNodes[j].targetR = surroundingNodes[j].baseR;
          }, delay);
        }
      }
      
      // הזזת העיגול המרכזי בהתאם למוקד החדש
      centerNode.targetX = width / 2 + status2CenterOffset;
      centerNode.targetY = height / 2;
      centerNode.targetR = status1ExpandedSize * status2CenterShrinkFactor;
      return;
    }
  }
  
  // לחיצה מחוץ לעיגולים
  if (status === 2) {
    status = 1;
    if (focusedNodeIndex !== null) {
      let prevNode = surroundingNodes[focusedNodeIndex];
      prevNode.targetR = prevNode.baseR;
      prevNode.fadingOut = true;
      prevNode.contentFadeStart = millis();
    }
    transitionStartTime = millis();
    resetPositions();
  } else if (status === 1) {
    status = 0;
    transitionStartTime = millis();
    resetPositions();
  }
}

function resetPositions() {
  centerNode.targetX = width / 2;
  centerNode.targetY = height / 2;
  centerNode.targetR = status1ExpandedSize;
  for (let node of surroundingNodes) {
    node.targetX = node.baseX;
    node.targetY = node.baseY;
    node.targetR = node.baseR;
  }
}

function handleHover() {
  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];
    let isHovering = dist(mouseX, mouseY, node.currentX, node.currentY) < node.currentR / 2;
    let newTargetR = isHovering ? node.baseR * 1.2 : node.baseR;
    if (node.hoverTargetR !== newTargetR) {
      hoverStartTimes[i] = millis();
    }
    node.hoverTargetR = newTargetR;
  }
}

function ultraEaseInOut(t) {
  return t < 0.5 
    ? pow(t * 2, easeInPower) / 2 
    : 1 - pow((1 - t) * 2, easeOutPower) / 2;
}
