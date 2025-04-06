// הגדרות אנימציה וכללי תנועה
let hoverAnimationDuration = 300; // מהירות הגדילה/התכווצות בזמן ריחוף (מילישניות)
let status2ShrinkDuration = 3500;   // משך אנימציית ההתכווצות בסטטוס 2 (מילישניות)
let status2CenterOffset = 100;      // הזזה אופקית לעיגול המרכזי בסטטוס 2
let status2CenterShrinkFactor = 0.4;// יחס כיווץ העיגול המרכזי בסטטוס 2
let status1ExpandedSize = 300;      // גודל העיגול המרכזי במצב סטטוס 1
let status2GrowDuration = 2500;     // משך הגדילה של עיגול היקפי בסטטוס 2
let status2ExpandedSize = 300;      // גודל העיגול ההיקפי במצב מוקד
let easeInPower = 4;                // עוצמת ה-ease in
let easeOutPower = 10;              // עוצמת ה-ease out
let status1ExpansionAmount = 100;   // המרחק שהעיגולים ההיקפיים מתרחקים במצב סטטוס 1
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
let status = 0;               // 0: מצב רגיל, 1: מעבר, 2: מצב מוקד
let focusedNodeIndex = null;  // העיגול הממוקד
let transitionStartTime = 0;
let hoverStartTimes = [];     // זמנים לריחוף
let winkyFont;
let BlinkyStar;             // שם הפונט המועדף

// משתנים לעדכון תהליך העברת מוקד
let focusSwitchTimer = null;
let pendingFocusedIndex = null;
let isFocusSwitching = false;

function preload() {
  try {
    BlinkyStar = loadFont('Blinky Star.otf'); // ודא ששמו נכון
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

    // לכל עיגול נוספו גם מאפייני תוכן (פסקה) ואנימציית fade in/out
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
      contentAlpha: 0,      // 0 = מוסתר, 255 = מלא
      fadingOut: false,     // האם התוכן נמצא בתהליך fade out
      contentFadeStart: 0   // הזמן שבו התחילה האנימציה
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
  
  // עדכון הגודל והמיקום של העיגול המרכזי:
  let centerTargetR = status === 2 
      ? status1ExpandedSize * status2CenterShrinkFactor 
      : (status === 1 ? status1ExpandedSize : 180);
  centerNode.currentR = lerp(centerNode.currentR, centerTargetR, easeCenter);
  centerNode.currentX = lerp(centerNode.currentX, centerNode.targetX, easeCenter);
  centerNode.currentY = lerp(centerNode.currentY, centerNode.targetY, easeCenter);

  stroke(0);
  strokeWeight(3);
  
  // מצב 0 ו-1: ציור עיגולים היקפיים, קווים והעיגול המרכזי
  if (status === 0 || status === 1) {
    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      node.currentX = lerp(node.currentX, node.targetX, easeOuter);
      node.currentY = lerp(node.currentY, node.targetY, easeOuter);
      let targetR = (node.targetR !== undefined) ? node.targetR : node.baseR;
      if (node.hoverTargetR !== undefined && (i !== focusedNodeIndex)) {
        targetR = node.hoverTargetR;
      }
      let hoverElapsed = millis() - max(transitionStartTime, hoverStartTimes[i]);
      let tHover = constrain(hoverElapsed / hoverAnimationDuration, 0, 1);
      let easeHover = ultraEaseInOut(tHover);
      node.currentR = lerp(node.currentR, targetR, easeHover);
      line(centerNode.currentX, centerNode.currentY, node.currentX, node.currentY);
    }
    
    // ציור העיגולים ההיקפיים וטקסטם (הכותרת במרכז)
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
      // ציור הכותרת במרכז העיגול
      push();
      fill(0);
      noStroke();
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
    
    // ציור הטקסט של העיגול המרכזי במרכז
    push();
    fill(0);
    noStroke();
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
    
  // מצב 2: מצב מוקד – עדכון מיקומם וגודלם של העיגולים, והצגת תוכן עבור העיגול הממוקד
  } else if (status === 2) {
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
      
      // ציור הצל והעיגול עבור כל העיגולים (למעט הממוקד)
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
      
      // ציור הכותרת עבור העיגולים שאינם במוקד
      push();
      fill(0);
      noStroke();
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
      
      // אם לעיגול שהיו בעבר במוקד הופעל fade out לתוכן:
      if (i !== focusedNodeIndex && node.fadingOut) {
        let fadeOutAlpha = constrain(255 - ((millis() - node.contentFadeStart) / contentFadeDuration) * 255, 0, 255);
        node.contentAlpha = fadeOutAlpha;
        if (fadeOutAlpha <= 0) {
          node.contentAlpha = 0;
          node.fadingOut = false;
        }
      }
    }
    
    // ציור העיגול הממוקד עם הצגת התוכן (פסקה) בתהליך fade in
    if (focusedNodeIndex !== null) {
      let node = surroundingNodes[focusedNodeIndex];
      // ציור העיגול עצמו (כולל תנועת wiggle)
      fill(node.col);
      ellipse(
        node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentR
      );
      
      // ציור הכותרת עבור העיגול הממוקד – הטקסט נע יחד עם ה-wiggle ומוזז כלפי מעלה
      push();
      fill(0);
      noStroke();
      let focusedTextSize = min(node.currentR * 0.2, 32);
      textSize(focusedTextSize);
      drawingContext.shadowColor = textShadowColor;
      drawingContext.shadowBlur = textShadowBlur * 2;
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      let titleX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      let titleY = (node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius) - node.currentR * 0.15;
      text(node.label, titleX, titleY);
      pop();
      
      // עדכון ערך ה־alpha לתוכן (fade in / fade out)
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
      
      // ציור הפסקה בתוך העיגול – שימוש במסכה (clip) כדי להגביל את הטקסט לתוך גבולות העיגול
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
    
    // הגדלת העיגול המרכזי במצב 1
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
      // אם יש מוקד קודם ושלא אותו, מבצעים fade out לעיגול הקודם
      if (status === 2 && focusedNodeIndex !== null && focusedNodeIndex !== i) {
        let prevNode = surroundingNodes[focusedNodeIndex];
        prevNode.targetR = prevNode.baseR;
        prevNode.fadingOut = true;
        prevNode.contentFadeStart = millis();
      }
      // מעבירים את המוקד לעיגול שנלחץ
      focusedNodeIndex = i;
      status = 2;
      transitionStartTime = millis();
      // מעבירים את העיגול למרכז ומגדילים אותו מיד
      node.targetX = width / 2;
      node.targetY = height / 2;
      node.targetR = status2ExpandedSize;
      node.fadingOut = false;
      node.contentFadeStart = millis();
      
      // עדכון מיקום יתר העיגולים
      for (let j = 0; j < surroundingNodes.length; j++) {
        if (j !== i) {
          let angle = surroundingNodes[j].angle;
          let distance = baseDistance + random(30, 120);
          surroundingNodes[j].targetX = width / 2 + cos(angle) * distance;
          surroundingNodes[j].targetY = height / 2 + sin(angle) * distance;
          surroundingNodes[j].targetR = surroundingNodes[j].baseR;
        }
      }
      
      // עדכון מיקום וגודל העיגול המרכזי במצב מוקד
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

function ultraEaseInOut(t) {
  return t < 0.5 
    ? pow(t * 2, easeInPower) / 2 
    : 1 - pow((1 - t) * 2, easeOutPower) / 2;
}
