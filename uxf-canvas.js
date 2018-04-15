(function() {
  let umlElements = {
    'Default': function(UXF, element) {
      let x = 0, y = 0, w = element.coordinates.w, h = element.coordinates.h;
      UXF.drawBox({
          x: x
        , y: y
        , w: w
        , h: h
        , fg: element.attr.fg
        , bg: element.attr.bg
      });
      // Draw Lines
      for (let i = 0; i < element.lines.length; i++) {
        // TODO: crop by width and height
        y += UXF.getTextHeight();
        UXF.drawTextLine(element.lines[i], {fg: element.attr.fg, x: x, y: y, w: w, h: h });
      }
    },
    'UMLObject': function(UXF, element) {
      let x = 0, y = 0, w = element.coordinates.w, h = element.coordinates.h;
      // Draw Box
      UXF.drawBox({
          x: x
        , y: y
        , w: w
        , h: h
        , fg: element.attr.fg
        , bg: element.attr.bg
        , lineStyle: UXF.getLineData(element)[1]
      });
      // Draw Text
      let isHeading = true;
      for (let i = 0; i < element.lines.length; i++) {
        // TODO: crop by width and height
        y += UXF.getTextHeight();
        if (element.lines[i] == '--') {
          UXF.drawLines({style: ['','--',''], points: [[x, y], [x+w, y]]});
          isHeading = false;
        } else {
          UXF.drawTextLine(element.lines[i], {fg: element.attr.fg, x: x, y: y, w: w, h: h, align: isHeading ? 'center' : ''});
        }
      }
    },
    'UMLClass': function(UXF, element) {
      let x = 0, y = 0, w = element.coordinates.w, h = element.coordinates.h;
      // Draw Box
      UXF.drawBox({
          x: x
        , y: y
        , w: w
        , h: h
        , fg: element.attr.fg
        , bg: element.attr.bg
        , lineStyle: UXF.getLineData(element)[1]
      });
      // Draw Text
      let isHeading = true;
      for (let i = 0; i < element.lines.length; i++) {
        // TODO: crop by width and height
        y += UXF.getTextHeight();
        if (element.lines[i] == '--') {
          UXF.drawLines({style: ['','--',''], points: [[x, y], [x+w, y]]});
          isHeading = false;
        } else {
          UXF.drawTextLine(element.lines[i], {fg: element.attr.fg, x: x, y: y, w: w, h: h, align: isHeading ? 'center' : ''});
        }
      }
    },
    'UMLGeneric': function(UXF, element) {
      let x = 0, y = 0, w = element.coordinates.w, h = element.coordinates.h;
      // Draw Box
      UXF.drawBox({
          x: x
        , y: y
        , w: w
        , h: h
        , fg: element.attr.fg
        , bg: element.attr.bg
        , lineStyle: UXF.getLineData(element)[1]
      });
      // Draw Text
      let isHeading = true;
      for (let i = 0; i < element.lines.length; i++) {
        // TODO: crop by width and height
        y += UXF.getTextHeight();
        if (element.lines[i] == '--') {
          UXF.drawLines({style: ['','--',''], points: [[x, y], [x+w, y]]});
          isHeading = false;
        } else {
          UXF.drawTextLine(element.lines[i], {fg: element.attr.fg, x: x, y: y, w: w, h: h, align: isHeading ? 'center' : ''});
        }
      }
    },
    'Relation': function(UXF, element) {
      let x = 0, y = 0, w = element.coordinates.w, h = element.coordinates.h;
      let lineData = UXF.getLineData(element);
      UXF.drawLines(lineData);
      UXF.drawText(element.lines, {fg: element.attr.fg ? element.attr.fg : 'black', x: x, y: y + UXF.getTextHeight(), w: w, h: h});
    }
  };
  
  class UXFCanvas extends HTMLElement {
    static get observedAttributes() { return ['width', 'height', 'src']; }
    constructor() {
      super();
      var shadow = this.attachShadow({mode: 'open'});
      this.canvas = document.createElement('canvas');
      this.offscreenCanvas = document.createElement('canvas');
      shadow.appendChild(this.canvas);
    }
    connectedCallback() {
      // Is this even appropriate?
      if (!this.style.display) this.style.display = 'inline-block';
      setTimeout(() => {
        this.draw();
      }, 5)
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue == newValue) return;
  
      if (name === 'width' || name === 'height') {
        if (this.canvas.getAttribute(name) < newValue) {
          this.canvas.setAttribute(name, newValue);
          this.draw();
        }
      } else if (name === 'src') {
        this.load(newValue);
      }
    }
    load(src) {
      let self = this;
      let link = document.createElement('link');
      link.addEventListener('load', function(e) {
        // Remove old content
        while (self.firstChild) {
          self.removeChild(self.firstChild);
        }
        for (let i = 0; i < link.import.getElementsByTagName('body')[0].children.length; i++) {
          self.appendChild(link.import.getElementsByTagName('body')[0].children[i]);
        }
        self.draw();
        // Remove link from real DOM
        link.parentNode.removeChild(link);
      });
      link.setAttribute('rel', 'import');
      link.setAttribute('type', 'text/xml');
      link.setAttribute('href', src);
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    draw() {
      // Draw our diagram(s) -- does UXF even support multiple diagrams in an object?
      let diagramNodes = this.getElementsByTagName('diagram');
      for (let di = 0; di < diagramNodes.length; di++) {
        let parsedElements = [];
        let elementNodes = diagramNodes[di].getElementsByTagName('element');
        // Keep track of our largest X and Y values so we can resize the canvas
        let lastX = 0;
        let lastY = 0;
        // Parse our UXF elements
        for (let ei = 0; ei < elementNodes.length; ei++) {
          parsedElements.push(this.parseElement(elementNodes[ei]));
          let curX = parsedElements[ei].coordinates.x + parsedElements[ei].coordinates.w;
          let curY = parsedElements[ei].coordinates.y + parsedElements[ei].coordinates.h;
          if (curX > lastX) lastX = curX;
          if (curY > lastY) lastY = curY;
        }
        // Sort by their layer attribute
        parsedElements.sort(function(a, b) {
          let lA = a.attr.layer || 0,
              lB = b.attr.layer || 0;
          return (lA < lB ? -1 : lA > lB ? 1 : 0);
        });
        // Resize our canvas
        if (this.canvas.getAttribute('width') < lastX) {
          this.canvas.setAttribute('width', lastX);
        }
        if (this.canvas.getAttribute('height') < lastY) {
          this.canvas.setAttribute('height', lastY);
        }
        // Draw!
        let mainCtx = this.canvas.getContext('2d');
        mainCtx.save();
        mainCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //
        this.ctx = this.offscreenCanvas.getContext('2d');
        for (let pi = 0; pi < parsedElements.length; pi++) {
          let element = parsedElements[pi];
          this.offscreenCanvas.width = element.coordinates.w+1;
          this.offscreenCanvas.height = element.coordinates.h+1;
          this.ctx.save();
          this.ctx.translate(.5,.5);
          this.drawElement(parsedElements[pi]);
          this.ctx.restore();
          mainCtx.drawImage(this.offscreenCanvas, element.coordinates.x, element.coordinates.y, element.coordinates.w+1, element.coordinates.h+1);
        }
        mainCtx.restore();
      }
    }
    parseElement(element) {
      let values = this.getElementValues(element, {id: '', coordinates: { x:0, y:0, w:0,h:0 }, panel_attributes: '', additional_attributes:''});
      let parsedAttributes = this.parseContents(values.panel_attributes);
      values.attr   = parsedAttributes.extra;
      values.lines  = parsedAttributes.lines;
      return values;
    }
    drawElement(element) {
      if (umlElements[element.id]) {
        umlElements[element.id](this, element);
      } else {
        umlElements["Default"](this, element);
      }
    }
    drawBox(boxData) {
      boxData.fg = boxData.fg || 'black';
      boxData.lineStyle = boxData.lineStyle || '-';
      // Set alpha to be like umlet
      this.ctx.globalAlpha = 0.5;
      // Draw BG
      if (boxData.bg) {
        this.ctx.fillStyle = boxData.bg;
        this.ctx.fillRect(boxData.x, boxData.y, boxData.w, boxData.h);
      }
      // Reset alpha
      this.ctx.globalAlpha = 1.0;
      // Set stroke style
      this.setLineStyle(boxData.lineStyle);
      // Stroke box
      this.ctx.strokeRect(boxData.x, boxData.y, boxData.w, boxData.h);
    }
    drawLines(lineData) {
      // Begin our line drawing
      this.ctx.lineWidth = 1;
      // Set our line type
      this.setLineStyle(lineData.style[1]);
      // Make the line path
      this.ctx.beginPath();
      for (let i = 0; i < lineData.points.length; i++) {
        // Get our coordinate pair
        let x = parseInt(lineData.points[i][0]), y = parseInt(lineData.points[i][1]);
        // Create the line
        this.ctx.lineTo(lineData.points[i][0], lineData.points[i][1]);
      }
      this.ctx.stroke();
      // Draw arrow heads
      if (lineData.style[0]) {
        let x1 = lineData.points[0][0], y1 = lineData.points[0][1];
        let x2 = lineData.points[1][0], y2 = lineData.points[1][1];
        this.drawArrow(lineData.style[0], x1, y1, x2, y2);
      }
      if (lineData.style[2]) {
        let x1 = lineData.points[lineData.points.length-1][0], y1 = lineData.points[lineData.points.length-1][1];
        let x2 = lineData.points[lineData.points.length-2][0], y2 = lineData.points[lineData.points.length-2][1];
        this.drawArrow(lineData.style[2], x1, y1, x2, y2);
      }
    }
    drawArrow(type, fromX, fromY, toX, toY) {
      let radians = Math.atan2(toY - fromY, toX - fromX) - Math.PI/2;
      this.drawArrowHead(type, fromX, fromY, radians);
    }
    drawArrowHead(type, x, y, radians) {
      // FIXME: actually properly render inverted symbols
      // TODO: add '(+)', '()', 'x', '>[text]' '>|', '(', '[text]'
      let headLength    = 10;
      let headWidth     = 5;
      let lineColor     = 'black';
      let lineColorInv  = 'white';
      this.ctx.save();
      this.ctx.setLineDash([]); // Reset lines to solid
      this.ctx.translate(x, y);
      this.ctx.rotate(radians);
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      if (type == '<' || type == '>') {
        this.ctx.lineTo(-headWidth, headLength);
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(headWidth, headLength);
        this.ctx.closePath();
        this.ctx.stroke();
      } else if (type == '<<' || type == '>>') {
        this.ctx.lineTo(-headWidth, headLength);
        this.ctx.lineTo(headWidth, headLength);
        this.ctx.closePath();
        this.ctx.fillStyle = lineColorInv;
        this.ctx.fill();
        this.ctx.stroke();
      } else if (type == '<<<' || type == '>>>') {
        this.ctx.lineTo(-headWidth, headLength);
        this.ctx.lineTo(headWidth, headLength);
        this.ctx.closePath();
        this.ctx.fillStyle = lineColor;
        this.ctx.fill();
        this.ctx.stroke();
      } else if (type == '<<<<' || type == '>>>>' || type == '<<<<<' || type == '>>>>>') {
        this.ctx.lineTo(-headWidth, headLength);
        this.ctx.lineTo(0, headLength*2);
        this.ctx.lineTo(headWidth, headLength);
        this.ctx.lineTo(0, 0);
        this.ctx.fillStyle = (type.length === 4 ? lineColorInv : lineColor);
        this.ctx.fill();
        this.ctx.stroke();
      }
      this.ctx.restore();
    }
    drawText(text, textOptions) {
      let startX = textOptions.x;
      let startY = textOptions.y;
      for (let i = 0; i < text.length; i++) {
        this.drawTextLine(text[i], textOptions);
        textOptions.x = startX;
        textOptions.y += this.getTextHeight(textOptions);
      }
    }
    drawTextLine(line, textOptions) {
      let TEXT_PADDING = 2;
      // Clip our rendering to the provided width + height
      this.ctx.save();
      this.ctx.rect(textOptions.x, textOptions.y - textOptions.h/2, textOptions.w, textOptions.h);
      this.ctx.clip();
      // TODO: set our font styling here
      textOptions.y += TEXT_PADDING;
      if (textOptions.align === 'center') {
        let width = this.ctx.measureText(line).width;
        textOptions.x += textOptions.w/2;
        textOptions.x -= width/2;
      } else {
        textOptions.x += TEXT_PADDING;
      }
      this.renderFormattedText(this.getFormattedText(line), textOptions);
      // Restore to pre-clip state
      this.ctx.restore();
    }
    getFormattedText(text) {
      let regExp = /(\*|\/|_)(.*?)\1/g;
      let result = '';
      let matches = [];
      while((result = regExp.exec(text)) !== null) {
        matches.push({t: result[1], s: result.index+1, e: result.index + 1 + result[2].length});
        matches[matches.length-1].v = text.substring(matches[matches.length-1].s, matches[matches.length-1].e);
      }
      let last_s = 0, last_e = 0;
      for (let i = 0; i < matches.length; i++) {
        matches[i].c = this.getFormattedText(matches[i].v);
        if (last_e < matches[i].s) {
          matches.splice(i, 0, {t: '', s: last_e, e: matches[i].s-1});
          matches[i].v = text.substring(matches[i].s, matches[i].e);
          i++;
          last_e = matches[i].e+1;
        }
      }
      if (matches.length > 0) {
        let end = {t: '', s: matches[matches.length-1].e+1, e: text.length};
        end.v = text.substring(end.s, end.e);
        matches.push(end);
      }
      return matches;
    }
    renderFormattedText(formattedText, conf) {
      let offsetX = 0;
      for (let i = 0; i < formattedText.length; i++) {
        let textOptions = Object.assign({}, conf);
        textOptions.u   = textOptions.u || formattedText[i].t === '_';
        textOptions.i   = textOptions.i || formattedText[i].t === '/';
        textOptions.b   = textOptions.b || formattedText[i].t === '*';
        textOptions.x   += offsetX;
        if (formattedText[i].c && formattedText[i].c.length > 0) {
          offsetX += this.renderFormattedText(formattedText[i].c, textOptions);
        } else {
          offsetX += this.renderText(formattedText[i].v, textOptions);
        }
      }
      conf.x += offsetX;
      return offsetX;
    }
    renderText(text, textOptions) {
      let width = this.ctx.measureText(text).width;
      if (textOptions.u) {
        let height = this.getTextHeight();
        this.ctx.beginPath();
        this.ctx.moveTo(textOptions.x, textOptions.y+2);
        this.ctx.lineTo(textOptions.x+width, textOptions.y+2);
        this.ctx.stroke();
      }
      this.ctx.font = (textOptions.i ? 'italic ' : '') + (textOptions.b ? 'bold ' : '') + '12px serif';
      this.ctx.fillStyle = (textOptions.fg ? textOptions.fg : 'black');
      this.ctx.fillText(text, textOptions.x, textOptions.y);
      return width;
    }
    parseContents(source) {
      let data = {lines: [], extra: {}};
      let lines = source.split(/\n/);
      for (let li = 0; li < lines.length; li++) {
        let line = lines[li];
        let regExp = /([^=]*)=(.*)/g;
        let match = regExp.exec(line);
        // It is a key=value pair
        if (match) {
          // TODO: process whitespace during regex
          data.extra[match[1].trim()] = match[2];
        // It is text
        } else {
          data.lines.push(line);
        }
      }
      return data;
    }
    setLineStyle(lineStyle) {
      if (!lineStyle) return;
      // Set our line style
      if (lineStyle == '-') {
        this.ctx.setLineDash([]);
      } else if (lineStyle == '.') {
        this.ctx.setLineDash([6, 6]);
      } else if (lineStyle == '..') {
        this.ctx.setLineDash([2, 2]);
      }
    }
    getTextHeight(conf) {
      if (conf) {
        this.ctx.font = (conf.i ? 'italic ' : '') + (conf.b ? 'bold ' : '') + '12px serif';
      }
      return(this.ctx.measureText('M').width);
    }
    getElementValues(element, names, fillWithBlank) {
      let values = names;
      for (let ci = 0; ci < element.children.length; ci++) {
        let key = element.children[ci].tagName.toLowerCase();
        let match = names[key];
        if (match !== undefined) {
          if (typeof match === "number") {
            values[key] = parseInt(element.children[ci].innerText);
          } else if (match instanceof Object) {
            values[key] = this.getElementValues(element.children[ci], match);
          } else {
            values[key] = element.children[ci].innerText;
          }
        }
      }
      return values;
    }
    getLineData(element) {
      let lineData = { style: ['','-',''], points: [] };
      if (!element.attr.lt) return lineData;
      // Get our style of line. Returned array should have three UXFs that map to the left arrow, the middle line, and the right arrow respectively.
      lineData.style = element.attr.lt.match(/([^-.]*)([^>]*)(.*)/).slice(1);
      // Get coordinates as pairs
      let points = element.additional_attributes.split(';');
      for (let i = 0; i < points.length; i+= 2) {
        lineData.points.push(points.slice(i, i+2));
      }
      for (let i = 0; i < lineData.points.length; i++) {
        lineData.points[i][0] = parseInt(lineData.points[i][0]);
        lineData.points[i][1] = parseInt(lineData.points[i][1]);
      }
      return lineData;
    }
  }
  window.customElements.define('uxf-canvas', UXFCanvas);
})();
