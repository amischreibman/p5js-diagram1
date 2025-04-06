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
let textShadowBlur = 0;                    
let textShadowColor = 'white';             
let textMaxSizePercentage = 0.6;           
let textContentPadding = 30;               // מרווח בין כותרת העיגול לתוכן הטקסט
let textFadeInDelay = 600;                 // דיליי במילישניות לפני תחילת הפייד אין של הטקסט
let textFadeInSpeed = 0.5;                 // מהירות הפייד אין של הטקסט (ערך גבוה = מהיר יותר)

/* ======================= סטטוס 0 (דיפולטיבי) ======================= */
let centerDefaultSize = 180;               

/* ======================= סטטוס 1 (גדילה) ======================= */
let growthMultiplier = 1.5;                
let status1ExpansionAmount = 100;          
let status1CenterDelay = 0;                
let status1DelayRandomRange = [4, 20];       

/* ======================= סטטוס 2 (התכווצות/מיקוד) ======================= */
let status2ShrinkDuration = 3500;          
let status2CenterOffset = 100;             
let status2CenterShrinkFactor = 0.4;       
let status2GrowDuration = 2500;            
let status2ExpandedSize = 300;             
let status2DelayRandomRange = [4, 20];       

/* ======================= משתנים נוספים למבנה האנימציה ======================= */
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

/* ======================= תוכן נוסף לעיגולים ======================= */
let defaultContent = "This is a paragraph of sample text that will appear when the circle is focused.";

/* ======================= פונקציות ======================= */
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
    currentY: height / 2,
    label: 'text 0',
    content: "This is the main central node. It contains important information about the core concept. Click on surrounding nodes to explore related topics.",
    contentAlpha: 0
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
    // הוספת תוכן ייחודי לכל עיגול באנגלית
    let nodeContent = `This is unique content for circle ${surroundingNodes.length + 1}. This text will be displayed when the circle is in focus mode. Here you can add more details about this specific topic or concept.`;
    
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
      content: nodeContent,
      contentAlpha: 0  // מתחילים עם שקיפות 0
    });
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
    
    // אם המצב הוא 1 (גדילה) - מציג גם את הטקסט של העיגול המרכזי
    if (status === 1) {
      let titleOffset = map(centerNode.contentAlpha, 0, 255, 0, -centerNode.currentR * 0.15);
      text(centerNode.label, centerDisplayX, centerDisplayY + titleOffset);
      
      // מציג את התוכן של העיגול המרכזי אם יש מספיק שקיפות
      if (centerNode.contentAlpha > 10) {
        push();
        fill(0, centerNode.contentAlpha);
        noStroke();
        textSize(16);
        textAlign(CENTER, CENTER);
        rectMode(CENTER);
        let textWidth = centerNode.currentR * 0.7;
        let textHeight = centerNode.currentR * 0.5;
        text(centerNode.content, centerDisplayX, centerDisplayY + titleOffset + centerTextSize + textContentPadding, textWidth, textHeight);
        pop();
      }
      
      // Fade in טקסט רק אחרי הדיליי שהוגדר
      let centerElapsed = millis() - transitionStartTime;
      if (centerElapsed > textFadeInDelay) {
        // מחשב ערך אלפא בהתאם לזמן שעבר מאז הדיליי
        let fadeElapsed = centerElapsed - textFadeInDelay;
        let alphaProgress = constrain(fadeElapsed / 500, 0, 1); // 500ms למעבר מלא
        centerNode.contentAlpha = lerp(centerNode.contentAlpha, 255, alphaProgress * textFadeInSpeed);
      } else {
        centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, 0.1);
      }
    } else {
      // במצבים אחרים, רק מציג את הכותרת ומאפס את שקיפות התוכן
      text(centerNode.label, centerDisplayX, centerDisplayY);
      centerNode.contentAlpha = lerp(centerNode.contentAlpha, 0, 0.1);
    }
    pop();
    
  } else if (status === 2) {
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
        
        // Fade in טקסט רק אחרי הדיליי שהוגדר
        if (hoverElapsed > textFadeInDelay) {
          // מחשב ערך אלפא בהתאם לזמן שעבר מאז הדיליי
          let fadeElapsed = hoverElapsed - textFadeInDelay;
          let alphaProgress = constrain(fadeElapsed / 500, 0, 1); // 500ms למעבר מלא
          node.contentAlpha = lerp(node.contentAlpha, 255, alphaProgress * textFadeInSpeed);
        } else {
          // שומר על שקיפות מלאה עד שהעיגול מגיע ל-80% מגודלו הסופי
          node.contentAlpha = lerp(node.contentAlpha, 0, 0.1);
        }
      } else {
        // עבור שאר העיגולים – fade out של התוכן
        node.contentAlpha = lerp(node.contentAlpha, 0, 0.2);
        let hoverElapsed = millis() - (node.shrinkStartTime || 0);
        let tHover = constrain(hoverElapsed / status2ShrinkDuration, 0, 1);
        let easeHover = ultraEaseInOut(tHover);
        node.currentR = lerp(node.currentR, targetR, easeHover);
      }
      
      node.displayX = node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      node.displayY = node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius;
      line(centerDisplayX, centerDisplayY, node.displayX, node.displayY);
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
    text(centerNode.label, centerDisplayX, centerDisplayY);
    pop();
    
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
    
    if (status === 2 && focusedNodeIndex !== null) {
      let node = surroundingNodes[focusedNodeIndex];
      let shadowOffsetX = 3 * cos(radians(325));
      let shadowOffsetY = 3 * sin(radians(325));
      
      // צייר את הצל של העיגול המרכזי
      fill(0);
      ellipse(
        node.displayX + shadowOffsetX,
        node.displayY + shadowOffsetY,
        node.currentR
      );
      
      // צייר את העיגול עצמו
      fill(node.col);
      ellipse(node.displayX, node.displayY, node.currentR);
      
      // הזזת הכותרת למעלה כאשר התוכן מופיע
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
      
      // הוספת התוכן של העיגול - צייר את הטקסט
      if (node.contentAlpha > 10) { // רק אם התוכן כבר לא שקוף לחלוטין
        push();
        fill(0, node.contentAlpha);
        noStroke();
        textSize(16);
        textAlign(CENTER, CENTER);
        rectMode(CENTER);
        // הקטנת האזור של טקסט כדי שיהיה מרווח בתוך העיגול
        let textWidth = node.currentR * 0.8;
        let textHeight = node.currentR * 0.6;
        text(node.content, node.displayX, node.displayY + titleOffset + focusedTextSize + textContentPadding, textWidth, textHeight);
        pop();
      }
    }
  }
  
  // קריאה לפונקציה שבודקת את מצב הריחוף
  handleHover();
}

function mousePressed() {
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
