function draw() {
  handleHover();
  background('#F2A900');
  drawingContext.imageSmoothingEnabled = true;

  let centerT = constrain((millis() - transitionStartTime) / centerGrowDuration, 0, 1);
  let outerT = constrain((millis() - transitionStartTime) / surroundingMoveDuration, 0, 1);
  let easeCenter = ultraEaseInOut(centerT);
  let easeOuter = ultraEaseInOut(outerT);

  let centerTargetR = status === 2 ? status1ExpandedSize * status2CenterShrinkFactor : (status === 1 ? status1ExpandedSize : 180);
  centerNode.currentR = lerp(centerNode.currentR, centerTargetR, easeCenter);
  centerNode.currentX = lerp(centerNode.currentX, centerNode.targetX, easeCenter);
  centerNode.currentY = lerp(centerNode.currentY, centerNode.targetY, easeCenter);

  stroke(0);
  strokeWeight(3);

  if (status === 0 || status === 1) {
    // ציור עבור סטטוס 0 ו-1: קווים, עיגולים היקפיים, ואז העיגול המרכזי
    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      node.currentX = lerp(node.currentX, node.targetX, easeOuter);
      node.currentY = lerp(node.currentY, node.targetY, easeOuter);
      let targetR = node.targetR !== undefined ? node.targetR : node.baseR;
      if (node.hoverTargetR !== undefined && (i !== focusedNodeIndex)) {
        targetR = node.hoverTargetR;
      }
      let isFocused = (status === 2 && i === focusedNodeIndex);
      let isReturning = (status !== 2 && i === focusedNodeIndex);
      let hoverElapsed = (isFocused || isReturning) ? (millis() - transitionStartTime) : (millis() - hoverStartTimes[i]);
      let hoverDuration = (isFocused || isReturning) ? status2GrowDuration : hoverAnimationDuration;
      let tHover = constrain(hoverElapsed / hoverDuration, 0, 1);
      let easeHover = ultraEaseInOut(tHover);
      node.currentR = lerp(node.currentR, targetR, easeHover);
      line(centerNode.currentX, centerNode.currentY, node.currentX, node.currentY);
    }

    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      // ציור צל
      let shadowOffsetX = 3 * cos(radians(325));
      let shadowOffsetY = 3 * sin(radians(325));
      fill(0); // צל שחור אטום
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

      // ציור טקסט בתוך העיגול עם תזוזת ה-wiggle - שיפור איכות הטקסט
      push(); // שמירת מצב הציור הנוכחי
      fill(0); // צבע הטקסט (שחור)
      noStroke(); // חשוב - מסיר את הקו מסביב לטקסט
      drawingContext.imageSmoothingEnabled = true;
      drawingContext.imageSmoothingQuality = 'high';
      
      // התאמת גודל הטקסט לגודל העיגול
      let textSizeValue = min(node.currentR * textMaxSizePercentage, 20);
      textSize(textSizeValue);
      
      // הוספת צל לטקסט לשיפור הקריאות
      drawingContext.shadowColor = textShadowColor;
      drawingContext.shadowBlur = textShadowBlur;
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      
      text(
        node.label,
        node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius
      );
      pop(); // שחזור מצב הציור הקודם
    }

    // ציור צל לעיגול המרכזי
    push();
    noStroke();
    drawingContext.filter = 'none'; // מניעת השפעה של הצל על הצבע
    let shadowOffsetX = 3 * cos(radians(145));
    let shadowOffsetY = 3 * sin(radians(145));
    fill(0); // צל שחור אטום
    ellipse(
      centerNode.currentX + shadowOffsetX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius,
      centerNode.currentY + shadowOffsetY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius,
      centerNode.currentR
    );
    pop();

    // ציור העיגול המרכזי
    fill(centerNode.col);
    ellipse(
      centerNode.currentX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius,
      centerNode.currentY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius,
      centerNode.currentR
    );
    
    // ציור טקסט בעיגול המרכזי - שיפור איכות הטקסט
    push();
    fill(0);
    noStroke();
    drawingContext.imageSmoothingEnabled = true;
    drawingContext.imageSmoothingQuality = 'high';
    
    // התאמת גודל הטקסט לגודל העיגול המרכזי
    let centerTextSize = min(centerNode.currentR * 0.25, 36);
    textSize(centerTextSize);
    
    // הוספת צל לטקסט לשיפור הקריאות
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
    // ציור עבור סטטוס 2: קווים, העיגול המרכזי, ואז העיגולים ההיקפיים
    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      node.currentX = lerp(node.currentX, node.targetX, easeOuter);
      node.currentY = lerp(node.currentY, node.targetY, easeOuter);
      let targetR = node.targetR !== undefined ? node.targetR : node.baseR;

      let isFocused = (i === focusedNodeIndex);
      let isReturning = (node.targetR === node.baseR && i !== focusedNodeIndex);

      if (isFocused) {
        let hoverElapsed = millis() - transitionStartTime;
        let tHover = constrain(hoverElapsed / status2GrowDuration, 0, 1);
        let easeHover = ultraEaseInOut(tHover);
        node.currentR = lerp(node.currentR, targetR, easeHover);
      } else if (isReturning) {
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
      line(centerNode.currentX, centerNode.currentY, node.currentX, node.currentY);
    }

    // ציור צל לעיגול המרכזי
    push();
    noStroke();
    drawingContext.filter = 'none'; // מניעת השפעה של הצל על הצבע
    let shadowOffsetX = 3 * cos(radians(145));
    let shadowOffsetY = 3 * sin(radians(145));
    fill(0); // צל שחור אטום
    ellipse(
      centerNode.currentX + shadowOffsetX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius,
      centerNode.currentY + shadowOffsetY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius,
      centerNode.currentR
    );
    pop();

    // ציור העיגול המרכזי
    fill(centerNode.col);
    ellipse(
      centerNode.currentX + cos(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius,
      centerNode.currentY + sin(frameCount * wiggleSpeed + centerNode.angleOffset) * wiggleRadius,
      centerNode.currentR
    );
    
    // ציור טקסט בעיגול המרכזי - שיפור איכות הטקסט
    push();
    fill(0);
    noStroke();
    drawingContext.imageSmoothingEnabled = true;
    drawingContext.imageSmoothingQuality = 'high';
    
    // התאמת גודל הטקסט לגודל העיגול המרכזי
    let centerTextSize = min(centerNode.currentR * 0.25, 36);
    textSize(centerTextSize);
    
    // הוספת צל לטקסט לשיפור הקריאות
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

    for (let i = 0; i < surroundingNodes.length; i++) {
      let node = surroundingNodes[i];
      // ציור צל
      let shadowOffsetX = 3 * cos(radians(325));
      let shadowOffsetY = 3 * sin(radians(325));
      fill(0); // צל שחור אטום
      ellipse(
        node.currentX + shadowOffsetX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentY + shadowOffsetY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentR
      );

      // ציור העיגול עצמו
      if (status === 2 && i === focusedNodeIndex) {
        continue; // דילוג על ציור העיגול הממוקד כאן
      }
      fill(node.col);
      ellipse(
        node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentR
      );

      // ציור טקסט בתוך העיגול עם תזוזת ה-wiggle - שיפור איכות הטקסט
      push();
      fill(0); // צבע הטקסט (שחור)
      noStroke(); // חשוב - מסיר את הקו מסביב לטקסט
      drawingContext.imageSmoothingEnabled = true;
      drawingContext.imageSmoothingQuality = 'high';
      
      // התאמת גודל הטקסט לגודל העיגול
      let textSizeValue = min(node.currentR * textMaxSizePercentage, 20);
      textSize(textSizeValue);
      
      // הוספת צל לטקסט לשיפור הקריאות
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

    // ציור העיגול הממוקד מעל כולם בסטטוס 2
    if (status === 2 && focusedNodeIndex !== null) {
      let node = surroundingNodes[focusedNodeIndex];
      fill(node.col);
      ellipse(
        node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentR
      );
      
      // ציור טקסט בתוך העיגול הממוקד - שיפור איכות הטקסט
      push();
      fill(0); // צבע הטקסט (שחור)
      noStroke();
      drawingContext.imageSmoothingEnabled = true;
      drawingContext.imageSmoothingQuality = 'high';
      
      // התאמת גודל הטקסט לגודל העיגול הממוקד
      let focusedTextSize = min(node.currentR * 0.2, 32); // גודל טקסט מותאם לעיגול ממוקד
      textSize(focusedTextSize);
      
      // הוספת צל לטקסט לשיפור הקריאות
      drawingContext.shadowColor = textShadowColor;
      drawingContext.shadowBlur = textShadowBlur * 2; // צל חזק יותר לעיגול ממוקד
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      
      text(
        node.label,
        node.currentX + cos(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius,
        node.currentY + sin(frameCount * wiggleSpeed + node.angleOffset) * wiggleRadius
      );
      pop();
    }
  }
}

function mousePressed() {
  let dx = mouseX - centerNode.currentX;
  let dy = mouseY - centerNode.currentY;
  if (dist(0, 0, dx, dy) < centerNode.currentR / 2) {
    if (status === 2) {
      status = 1;
    } else if (status === 1) {
      status = 0;
    } else {
      status = 1;
    }
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
      let dist = baseDistance + status1ExpansionAmount;

      setTimeout(() => {
        node.targetX = centerNode.baseX + cos(angle) * dist;
        node.targetY = centerNode.baseY + sin(angle) * dist;
        node.targetR = node.baseR;
      }, cumulativeDelay);

      cumulativeDelay += random(status1DelayRandomRange[0], status1DelayRandomRange[1]);
    }
    return;
  }

  for (let i = 0; i < surroundingNodes.length; i++) {
    let node = surroundingNodes[i];
    let dx = mouseX - node.currentX;
    let dy = mouseY - node.currentY;
    if (dist(0, 0, dx, dy) < node.currentR / 2) {
      if (status === 2 && focusedNodeIndex !== null && focusedNodeIndex !== i) {
        surroundingNodes[focusedNodeIndex].targetR = surroundingNodes[focusedNodeIndex].baseR;
        surroundingNodes[focusedNodeIndex].shrinkStartTime = millis();
      }
      let previousFocusedIndex = focusedNodeIndex;
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

        if (previousFocusedIndex === null || previousFocusedIndex === i) {
          surroundingNodes[i].targetR = status2ExpandedSize;
        }
      }

      for (let j = 0; j < surroundingNodes.length; j++) {
        if (j !== i) {
          let angle = surroundingNodes[j].angle;
          let dist = baseDistance + random(30, 120);
          let delay = j * random(status2DelayRandomRange[0], status2DelayRandomRange[1]);
          setTimeout(() => {
            surroundingNodes[j].targetX = width / 2 + cos(angle) * dist;
            surroundingNodes[j].targetY = height / 2 + sin(angle) * dist;
            surroundingNodes[j].targetR = surroundingNodes[j].baseR;
          }, delay);
        }
      }

      let angle = random(TWO_PI);
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
    let dx = mouseX - node.currentX;
    let dy = mouseY - node.currentY;
    let isHovering = dist(0, 0, dx, dy) < node.currentR / 2;
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

function distFunc(x1, y1, x2, y2) {
  return sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}
