
/* ======================= הגדרות כלליות ======================= */
let hoverAnimationDuration = 300;        
let centerGrowDuration = 1800;             
let surroundingMoveDuration = 2500;        
let baseDistance = 150;                    
let wiggleSpeed = 0.01;                    
let wiggleRadius = 20;                     
let easeInPower = 4;
let easeOutPower = 10;


/* ======================= הגדרות טקסט ======================= */
let textShadowBlur = 0;                    // עוצמת טשטוש הצל
let textShadowColor = 'white';             // צבע הצל
let textMaxSizePercentage = 0.6;           // אחוז מקסימלי של גודל הטקסט ביחס לעיגול

/* ======================= סטטוס 0 (דיפולטיבי) ======================= */
// הגודל הדיפולטיבי של העיגול המרכזי (לפני לחיצה ואחרי החזרה)
let centerDefaultSize = 180;               

/* ======================= סטטוס 1 (גדילה) ======================= */
// המכפיל שקובע עד לאיזה גודל העיגול יגדל – לדוגמה: 1.5 = הגדלה ב-50%
let growthMultiplier = 1.5;                
let status1ExpansionAmount = 100;          // התרחקות העיגולים ההיקפיים במצב סטטוס 1
let status1CenterDelay = 0;                // דיליי לפני הגדלת העיגול המרכזי
let status1DelayRandomRange = [4, 20];       // טווח דיליי רנדומלי לעיגולים (סטטוס 1)

/* ======================= סטטוס 2 (התכווצות/מיקוד) ======================= */
let status2ShrinkDuration = 3500;          // משך התכווצות העיגול במצב סטטוס 2
let status2CenterOffset = 100;             // הזזה אופקית לעיגול המרכזי במצב סטטוס 2
let status2CenterShrinkFactor = 0.4;       // מקדם כיווץ לעיגול המרכזי במצב סטטוס 2
let status2GrowDuration = 2500;            // משך הגדילה לעיגולים ההיקפיים במצב סטטוס 2
let status2ExpandedSize = 300;             // הגודל שאליו עיגול היקפי מתמקד במצב סטטוס 2
let status2DelayRandomRange = [4, 20];       // טווח דיליי רנדומלי לעיגולים (סטטוס 2)

/* ======================= משתנים נוספים למבנה האנימציה ======================= */
let centerNode;
let surroundingNodes = [];
let status = 0;                          // 0, 1, 2 – מצבים שונים של האנימציה
let focusedNodeIndex = null;
let transitionStartTime = 0;
let hoverStartTimes = [];
let winkyFont;
let focusSwitchTimer = null;
let pendingFocusedIndex = null;
let isFocusSwitching = false;
let BlinkyStar;

/* ======================= תוכן נוסף לעיגולים ======================= */
// לכל עיגול (במערכת ההיקפית) נוסיף תוכן (פסקה) אשר יופיע רק כאשר העיגול במצב מיקוד
let defaultContent = "זו פסקה של טקסט שתוחלף בהמשך";

/* ======================= פונקציות ======================= */
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
  
  // אתחול העיגול המרכזי – בגודל הדיפולטיבי (סטטוס 0)
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
    
    // לכל עיגול היקפי נוסיף גם תכונת contentAlpha (לאפקט fade) ותוכן נוסף
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
      label: `text ${surroundingNodes.length + 1}`,
      content: defaultContent,
      contentAlpha: 0  // התחלת שקיפות 0
    });
  }
}

function draw() {
  // חישוב הגודל במצב סטטוס 1: 
  // expandedSize = centerDefaultSize * growthMultiplier
  let expandedSize = centerDefaultSize * growthMultiplier;
  
  background('#F2A900');
  drawingContext.imageSmoothingEnabled = true;
  
  let centerT = constrain((millis() - transitionStartTime) / centerGrowDuration, 0, 1);
  let outerT = constrain((millis() - transitionStartTime) / surroundingMoveDuration, 0, 1);
  let easeCenter = ultraEaseInOut(centerT);
  let easeOuter = ultraEaseInOut(outerT);
  
  // חישוב גודל העיגול המרכזי בהתאם למצב:
  // סטטוס 1: מגיע לגודל expandedSize
  // סטטוס 2: מתכווץ לגודל expandedSize * status2CenterShrinkFactor
  // סטטוס 0: חוזר לגודל centerDefaultSize
  let centerTargetR = status === 1 ? expandedSize : (status === 2 ? expandedSize * status2CenterShrinkFactor : centerDefaultSize);
  centerNode.currentR = lerp(centerNode.currentR, centerTargetR, easeCenter);
  centerNode.currentX = lerp(centerNode.currentX, centerNode.targetX, easeCenter);
  centerNode.currentY = lerp(centerNode.currentY, centerNode.targetY, easeCenter);
  
  // חישוב מיקום ויזואלי לעיגול המרכזי (כולל אפקט "ווייגל")
  let centerDisplayX = centerNode.currentX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;
  let centerDisplayY = centerNode.currentY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius;
  
  stroke(0);
  strokeWeight(3);
  
  if (status === 0 || status === 1) {
    // במצבים 0 ו-1 – לא מציגים תוכן, רק את העיגולים והקווים
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
      
      // עדכון contentAlpha – עבור עיגולים שאינם בפוקוס, מבטיחים fade out
      node.contentAlpha = lerp(node.contentAlpha, 0, 0.1);
      
      // חישוב מיקום ויזואלי לעיגול ההיקפי
      node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      
      // ציור קו מחבר מהעיגול ההיקפי לעיגול המרכזי
      line(centerDisplayX, centerDisplayY, node.displayX, node.displayY);
    }
    
    // ציור העיגולים ההיקפיים והכותרות במצבים 0 ו-1
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
      // הכותרת מוצגת במרכז העיגול
      text(node.label, node.displayX, node.displayY);
      pop();
    }
    
    // ציור העיגול המרכזי והכותרת בו
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
    text(centerNode.label, centerDisplayX, centerDisplayY);
    pop();
    
  } else if (status === 2) {
    // במצב סטטוס 2 – עדכון מיקומי העיגולים
    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      node.currentX = lerp(node.currentX, node.targetX, easeOuter);
      node.currentY = lerp(node.currentY, node.targetY, easeOuter);
      let targetR = (node.targetR !== undefined) ? node.targetR : node.baseR;
      
      if (i === focusedNodeIndex) {
        // עבור העיגול הפוקוס, נעדכן את contentAlpha ל-255 (fade in)
        node.contentAlpha = lerp(node.contentAlpha, 255, 0.1);
        let hoverElapsed = millis() - transitionStartTime;
        let tHover = constrain(hoverElapsed / status2GrowDuration, 0, 1);
        let easeHover = ultraEaseInOut(tHover);
        node.currentR = lerp(node.currentR, targetR, easeHover);
      } else {
        // עבור שאר העיגולים, ודא שהתוכן אינו מופיע (fade out)
        node.contentAlpha = lerp(node.contentAlpha, 0, 0.1);
        let hoverElapsed = millis() - (node.shrinkStartTime || 0);
        let tHover = constrain(hoverElapsed / status2ShrinkDuration, 0, 1);
        let easeHover = ultraEaseInOut(tHover);
        node.currentR = lerp(node.currentR, targetR, easeHover);
      }
      
      node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      line(centerDisplayX, centerDisplayY, node.displayX, node.displayY);
    }
    
    // ציור העיגול המרכזי
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
    text(centerNode.label, centerDisplayX, centerDisplayY);
    pop();
    
    // ציור העיגולים ההיקפיים שאינם בפוקוס (ללא תוכן)
    for (let i = 0; i < surroundingNodes.length; i++) {
      if (i === focusedNodeIndex) continue;
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
    
    // ציור העיגול הפוקוס עם תוכן (fade in) – הכותרת תוזז כלפי מעלה והתוכן מופיע מתחתיה
    if (status === 2 && focusedNodeIndex !== null) {
      let node = surroundingNodes[focusedNodeIndex];
      // (node.contentAlpha כבר עודכן לעיל)
      fill(node.col);
      ellipse(node.displayX, node.displayY, node.currentR);
      // הכותרת – זזה בהתאם לערך contentAlpha
      let titleOffset = map(node.contentAlpha, 0, 255, 0, -node.currentR * 0.25);
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
      text(node.label, node.displayX, node.displayY + titleOffset);
      pop();
      
      // התוכן – מופיע בתוך העיגול עם אפקט fade in
      push();
      fill(0, node.contentAlpha);
      noStroke();
      textSize(16); // ניתן לשנות את גודל הפונט של הפסקה לפי הצורך
      textAlign(CENTER, CENTER);
      // מציירים בתוך תיבה בגודל 80% מרוחב העיגול (המסכה)
      text(node.content, node.displayX, node.displayY + node.currentR * 0.15, node.currentR * 0.8, node.currentR * 0.8);
      pop();
    }
  }
}

function mousePressed() {
  // לחיצה על העיגול המרכזי משנה בין המצבים
  if (dist(mouseX, mouseY, centerNode.currentX, centerNode.currentY) < centerNode.currentR / 2) {
    status = (status === 2) ? 1 : (status === 1 ? 0 : 1);
    transitionStartTime = millis();
    
    let indices = [...Array(surroundingNodes.length).keys()];
    shuffle(indices, true);
    let cumulativeDelay = 0;
    if (status1CenterDelay === 0) {
      centerNode.targetR = status === 1 ? centerDefaultSize * growthMultiplier : centerDefaultSize;
    } else {
      setTimeout(() => {
        centerNode.targetR = status === 1 ? centerDefaultSize * growthMultiplier : centerDefaultSize;
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
      centerNode.targetR = (centerDefaultSize * growthMultiplier) * status2CenterShrinkFactor;
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
  centerNode.targetR = centerDefaultSize;
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
