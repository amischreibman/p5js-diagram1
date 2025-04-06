// הגדרות בסיסיות ואנימציה
let hoverAnimationDuration = 300; // מהירות ריחוף (מילישניות)
let status2ShrinkDuration = 3500;   // משך התכווצות בסטטוס 2 (מילישניות)
let status2CenterOffset = 100;      // הזזה אופקית לעיגול במצב סטטוס 2
let status2CenterShrinkFactor = 0.4;// מקדם כיווץ לעיגול במצב סטטוס 2
let status2GrowDuration = 2500;     // משך הגדילה לעיגולים ההיקפיים בסטטוס 2
let status2ExpandedSize = 300;      // גודל עיגול היקפי בסטטוס 2
let easeInPower = 4;                // עוצמת ease in
let easeOutPower = 10;              // עוצמת ease out
let status1ExpansionAmount = 100;   // התרחקות העיגולים ההיקפיים במצב סטטוס 1
let status1CenterDelay = 0;         // דיליי לפני הגדלת העיגול המרכזי
let status2DelayRandomRange = [4, 20];  // טווח דיליי רנדומלי במצב סטטוס 2
let status1DelayRandomRange = [4, 20];  // טווח דיליי במעבר לסטטוס 1
let centerGrowDuration = 1800;         // מהירות הגדילה של העיגול המרכזי
let surroundingMoveDuration = 2500;    // מהירות תנועת העיגולים ההיקפיים

let baseDistance = 150;
let wiggleSpeed = 0.01;
let wiggleRadius = 20;

// הגדרות טקסט
let textShadowBlur = 0;          // עוצמת טשטוש הצל
let textShadowColor = 'white';   // צבע הצל
let textMaxSizePercentage = 0.6;   // אחוז מקסימלי של גודל הטקסט ביחס לעיגול

// משתנה לשליטה בגודל העיגול במצב סטטוס 1 – ניתן לשנות באמצעות מחוון
let status1ExpandedSize = 300;   // ערך ברירת מחדל
let status1SizeSlider;           // המחוון

// משתנים עבור מבנה האנימציה
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

function preload() {
  // ניסיון טעינת הפונט המועדף
  try {
    BlinkyStar = loadFont('Blinky Star.otf');
  } catch(e) {
    console.log("לא ניתן לטעון את הפונט, משתמש בפונט ברירת המחדל");
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();

  // יצירת מחוון לשליטה בגודל העיגול המרכזי במצב סטטוס 1
  status1SizeSlider = createSlider(100, 600, status1ExpandedSize, 10);
  status1SizeSlider.position(20, 20);
  
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
      expandedR: r * 1.4,
      label: `text ${surroundingNodes.length + 1}`
    });
  }
}

function draw() {
  // עדכון המחוון – שינוי דינמי של ערך העיגול במצב סטטוס 1
  status1ExpandedSize = status1SizeSlider.value();
  
  background('#F2A900');
  drawingContext.imageSmoothingEnabled = true;
  
  let centerT = constrain((millis() - transitionStartTime) / centerGrowDuration, 0, 1);
  let outerT = constrain((millis() - transitionStartTime) / surroundingMoveDuration, 0, 1);
  let easeCenter = ultraEaseInOut(centerT);
  let easeOuter = ultraEaseInOut(outerT);
  
  // חישוב הגודל היעד של העיגול המרכזי:
  // במצב סטטוס 1 – גדל לגודל מלא, במצב סטטוס 2 – מתכווץ לפי מקדם, ובמצב 0 – גודל ברירת מחדל (180)
  let centerTargetR = status === 1 ? status1ExpandedSize : (status === 2 ? status1ExpandedSize * status2CenterShrinkFactor : 180);
  centerNode.currentR = lerp(centerNode.currentR, centerTargetR, easeCenter);
  centerNode.currentX = lerp(centerNode.currentX, centerNode.targetX, easeCenter);
  centerNode.currentY = lerp(centerNode.currentY, centerNode.targetY, easeCenter);
  
  // חישוב מיקומים ויזואליים (כולל אפקט הווייגל) לעיגול המרכזי
  let centerDisplayX = centerNode.currentX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;
  let centerDisplayY = centerNode.currentY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;
  
  stroke(0);
  strokeWeight(3);
  
  if (status === 0 || status === 1) {
    // עדכון מיקומי העיגולים ההיקפיים
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
      
      // חשבו גם את המיקום הוויזואלי של כל עיגול היקפי
      node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      
      // ציור קו מחבר מהעיגול ההיקפי לעיגול המרכזי (בעזרת המיקומים הוויזואליים)
      line(centerDisplayX, centerDisplayY, node.displayX, node.displayY);
    }
    
    // ציור העיגולים ההיקפיים והטקסט בתוכם
    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      // ציור צל לעיגול
      let shadowOffsetX = 3 * cos(radians(325));
      let shadowOffsetY = 3 * sin(radians(325));
      fill(0);
      ellipse(
        node.displayX + shadowOffsetX,
        node.displayY + shadowOffsetY,
        node.currentR
      );
      // ציור העיגול עצמו
      fill(node.col);
      ellipse(node.displayX, node.displayY, node.currentR);
      
      // ציור טקסט בתוך העיגול
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
    
    // ציור צל לעיגול המרכזי
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
    
    // ציור העיגול המרכזי
    fill(centerNode.col);
    ellipse(centerDisplayX, centerDisplayY, centerNode.currentR);
    
    // ציור טקסט בתוך העיגול המרכזי
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
    text(centerNode.label, centerDisplayX, centerDisplayY);
    pop();
    
  } else if (status === 2) {
    // עבור מצב סטטוס 2 – עדכון מיקומים והצגת הקווים והעיגולים
    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      node.currentX = lerp(node.currentX, node.targetX, easeOuter);
      node.currentY = lerp(node.currentY, node.targetY, easeOuter);
      let targetR = (node.targetR !== undefined) ? node.targetR : node.baseR;
      
      if (i === focusedNodeIndex) {
        let hoverElapsed = millis() - transitionStartTime;
        let tHover = constrain(hoverElapsed / status2GrowDuration, 0, 1);
        let easeHover = ultraEaseInOut(tHover);
        node.currentR = lerp(node.currentR, targetR, easeHover);
      } else if (node.targetR === node.baseR && i !== focusedNodeIndex) {
        let hoverElapsed = millis() - (node.shrinkStartTime || 0);
        let tHover = constrain(hoverElapsed / status2ShrinkDuration, 0, 1);
        let easeHover = ultraEaseInOut(tHover);
        node.currentR = lerp(node.currentR, targetR, easeHover);
      } else {
        if (node.hoverTargetR !== undefined) {
          targetR = node.hoverTargetR;
          let hoverElapsed = millis() - hoverStartTimes[i];
          let tHover = constrain(hoverElapsed / hoverAnimationDuration, 0, 1);
          let easeHover = ultraEaseInOut(tHover);
          node.currentR = lerp(node.currentR, targetR, easeHover);
        }
      }
      // חשבו את המיקום הוויזואלי לעיגול ההיקפי
      node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      line(centerDisplayX, centerDisplayY, node.displayX, node.displayY);
    }
    
    // ציור צל לעיגול המרכזי
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
    
    // ציור העיגול המרכזי
    fill(centerNode.col);
    ellipse(centerDisplayX, centerDisplayY, centerNode.currentR);
    
    // ציור הטקסט בעיגול המרכזי
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
    text(centerNode.label, centerDisplayX, centerDisplayY);
    pop();
    
    // ציור העיגולים ההיקפיים
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
      if (status === 2 && i === focusedNodeIndex) continue;
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
    
    // ציור העיגול הממוקד מעל כולם במצב סטטוס 2
    if (status === 2 && focusedNodeIndex !== null) {
      let node = surroundingNodes[focusedNodeIndex];
      fill(node.col);
      ellipse(node.displayX, node.displayY, node.currentR);
      push();
      fill(0);
      noStroke();
      drawingContext.imageSmoothingEnabled = true;
      drawingContext.imageSmoothingQuality = 'high';
      let focusedTextSize = min(node.currentR * 0.2, 32);
      textSize(focusedTextSize);
      drawingContext.shadowColor = textShadowColor;
      drawingContext.shadowBlur = textShadowBlur * 2;
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      text(node.label, node.displayX, node.displayY);
      pop();
    }
  }
}

function mousePressed() {
  // לחיצה על העיגול המרכזי
  if (dist(mouseX, mouseY, centerNode.currentX, centerNode.currentY) < centerNode.currentR / 2) {
    status = (status === 2) ? 1 : (status === 1 ? 0 : 1);
    transitionStartTime = millis();
    
    let indices = [...Array(surroundingNodes.length).keys()];
    shuffle(indices, true);
    let cumulativeDelay = 0;
    
    if (status1CenterDelay === 0) {
      centerNode.targetR = status1ExpandedSize;
    } else {
      setTimeout(() => {
        centerNode.targetR = status1ExpandedSize;
      }, status1CenterDelay);
    }
    
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
      if (status === 2 && focusedNodeIndex !== null && focusedNodeIndex !== i) {
        surroundingNodes[focusedNodeIndex].targetR = surroundingNodes[focusedNodeIndex].baseR;
        surroundingNodes[focusedNodeIndex].shrinkStartTime = millis();
      }
      pendingFocusedIndex = i;
      status = 2;
      transitionStartTime = millis();
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
          surroundingNodes[i].targetR = status2ExpandedSize;
          isFocusSwitching = false;
        }, 500);
        if (focusedNodeIndex === null || focusedNodeIndex === i) {
          surroundingNodes[i].targetR = status2ExpandedSize;
        }
      }
      
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
      
      centerNode.targetX = width / 2 + status2CenterOffset;
      centerNode.targetY = height / 2;
      centerNode.targetR = status1ExpandedSize * status2CenterShrinkFactor;
      return;
    }
  }
  
  if (status === 2) {
    status = 1;
    if (focusedNodeIndex !== null) {
      surroundingNodes[focusedNodeIndex].targetR = surroundingNodes[focusedNodeIndex].baseR;
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
