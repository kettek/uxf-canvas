(function() {
  let umlElements = {
    'Default': function(UXF, element) {
      UXF.drawBox(element);
      // Draw Lines
      let x = 0, y = 0;
      for (let i = 0; i < element.lines.length; i++) {
        if ((/^(-|--)$/).test(element.lines[i]) ) {
          y += UXF.getTextHeight()/2;
          UXF.drawLines({style: ['','--',''], points: [[x, y], [x+element.w, y]]});
        } else {
          y += UXF.drawTextLine(element.lines[i], {fg: element.fg, x: x, y: y, w: element.w, h: element.h }).height;
        }
      }
    },
    'UMLObject': function(UXF, element) {
      let x = 0, y = 0, w = element.w, h = element.h;
      // Draw Box
      UXF.drawBox({
          x: x
        , y: y
        , w: w
        , h: h
        , fg: element.fg
        , bg: element.bg
      });
      // Draw Text
      let isHeading = true;
      for (let i = 0; i < element.lines.length; i++) {
        if ((/^(-|--)$/).test(element.lines[i]) ) {
          y += UXF.getTextHeight()/2;
          UXF.drawLines({style: ['','--',''], points: [[x, y], [x+w, y]]});
          isHeading = false;
        } else {
          y += UXF.drawTextLine(element.lines[i], {fg: element.fg, x: x, y: y, w: w, h: h, align: isHeading ? 'center' : ''}).height;
        }
      }
    },
    'UMLClass': function(UXF, element) {
      let x = 0, y = 0, w = element.w, h = element.h;
      // Draw Box
      UXF.drawBox(element);
      // Draw Text
      let isHeading = true;
      for (let i = 0; i < element.lines.length; i++) {
        if ((/^(-|--)$/).test(element.lines[i]) ) {
          y += UXF.getTextHeight()/2;
          UXF.drawLines({style: ['','--',''], points: [[x, y], [x+w, y]]});
          isHeading = false;
        } else {
          y += UXF.drawTextLine(element.lines[i], {fg: element.fg, x: x, y: y, w: w, h: h, align: isHeading ? 'center' : ''}).height;
        }
      }
    },
    'UMLGeneric': function(UXF, element) {
      let x = 0, y = 0, w = element.w, h = element.h;
      // Draw Box
      UXF.drawBox(element);
      // Draw Text
      let isHeading = true;
      for (let i = 0; i < element.lines.length; i++) {
        if ((/^(-|--)$/).test(element.lines[i]) ) {
          y += UXF.getTextHeight()/2;
          UXF.drawLines({style: ['','--',''], points: [[x, y], [x+w, y]]});
          isHeading = false;
        } else {
          y += UXF.drawTextLine(element.lines[i], {fg: element.fg, x: x, y: y, w: w, h: h, align: isHeading ? 'center' : ''}).height;
        }
      }
    },
    'UMLUseCase': function(UXF, element) {
      let x = 0, y = 0, w = element.w, h = element.h;
      UXF.drawEllipse(element);
      let origH = h;
      let linesH = element.lines.length * UXF.getTextHeight();
      y = origH/2 - linesH/2;
      for (let i = 0; i < element.lines.length; i++) {
        if ((/^(-|--)$/).test(element.lines[i]) ) {
          y += UXF.getTextHeight();
          UXF.drawLines({style: ['','--',''], points: [[x, y], [x+w, y]]});
        } else {
          y += UXF.drawTextLine(element.lines[i], {fg: element.fg, x: x, y: y, w: w, h: h, align: 'center', valign: 'center'}).height;
        }
      }

    },
    'Relation': function(UXF, element) {
      let x = 0, y = 0, w = element.w, h = element.h;
      let lineData = element.getLineData();
      lineData.fg = element.fg;
      UXF.drawLines(lineData);
      if (lineData.points.length > 0) {
        let centerPointIndex = Math.floor(lineData.points.length / 2)-1;
        let nextPointIndex   = centerPointIndex+1;
        let centerPoint = lineData.points[centerPointIndex];
        let nextPoint = lineData.points[nextPointIndex];

        let lX = (centerPoint[0]+nextPoint[0])/2;
        let lY = (centerPoint[1]+nextPoint[1])/2 - UXF.getTextHeight()/2; // Why do we remove half the height?
        // TODO: Proper text centering between centerPoint and nextPoint
        UXF.drawText(element.lines, {fg: element.fg ? element.fg : 'black', x: lX, y: lY, w: w, h: h});
      }
    }
  };

  class UXFElement {
    constructor(xml) {
      this.w = 0;
      this.h = 0;
      this.x = 0;
      this.y = 0;
      this.layer = 0;
      this.attrs = '';

      if (xml) this.parseXML(xml);
    }
    parseXML(xml) {
      // Read our XML element's contained values.
      let values = this.getXMLValues(xml, {id: '', coordinates: { x:0, y:0, w:0,h:0 }, panel_attributes: '', additional_attributes:''});
      // Sync the element with the values.
      this.id     = values.id;
      this.x      = values.coordinates.x;
      this.y      = values.coordinates.y;
      this.w      = values.coordinates.w;
      this.h      = values.coordinates.h;
      this.attrs  = values.additional_attributes;
      // Read the element's contained content into lines and variables.
      let parsedAttributes = this.parseXMLContents(values.panel_attributes);
      this.lines  = parsedAttributes.lines;
      // Merge the additional properties with this object.
      for (let i in parsedAttributes.extra) {
        this[i] = parsedAttributes.extra[i];
      }
    }
    getXMLValues(xml, names, fillWithBlank) {
      let values = names;
      for (let ci = 0; ci < xml.children.length; ci++) {
        let key = xml.children[ci].tagName.toLowerCase();
        let match = names[key];
        if (match !== undefined) {
          if (typeof match === "number") {
            values[key] = parseInt(xml.children[ci].innerText);
          } else if (match instanceof Object) {
            values[key] = this.getXMLValues(xml.children[ci], match);
          } else {
            values[key] = xml.children[ci].innerText;
          }
        }
      }
      return values;
    }
    parseXMLContents(source) {
      let data = {lines: [], extra: {}};
      let lines = source.split(/\n/);
      for (let li = 0; li < lines.length; li++) {
        let line = lines[li];
        let regExp = /([^=\s]*[^\s])=(.*)/g;
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
    getLineData() {
      let lineData = { style: ['','-',''], points: [] };
      if (!this.lt) {
        this.lt = "-";
      }
      // Get our style of line. Returned array should have three elements that map to the left arrow, the middle line, and the right arrow respectively.
      lineData.style = this.lt.match(/([^-.]*)([^>]*)(.*)/).slice(1);
      // Get coordinates as pairs
      let points = this.attrs.split(';');
      for (let i = 0; i < points.length; i+= 2) {
        lineData.points.push(points.slice(i, i+2));
      }
      for (let i = 0; i < lineData.points.length; i++) {
        lineData.points[i][0] = parseInt(lineData.points[i][0]);
        lineData.points[i][1] = parseInt(lineData.points[i][1]);
      }
      return lineData;
    }
    static sort(a, b) {
      return (a.layer < b.layer ? -1 : a.layer > b.layer ? 1 : 0);
    };
  }

  class UXFCanvas extends HTMLElement {
    static get observedAttributes() { return ['width', 'height', 'src']; }
    constructor() {
      super();
      var shadow = this.attachShadow({mode: 'open'});
      this.conf = {
        fontFamily: "serif",
        fontSize: 14,
        zoomLevel: 1.0
      };
      this.canvas = document.createElement('canvas');
      this.offscreenCanvas = document.createElement('canvas');
      this.dummyCanvas = document.createElement('canvas');
      this.textHeightCache = {};
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
        let body = link.import.getElementsByTagName('body')[0];
        if (!body) {
          let parser = new DOMParser();
          let doc = parser.parseFromString(link.import.innerHTML, "text/html");
          body = doc.body;
        }
        for (let i = 0; i < body.children.length; i++) {
          self.appendChild(body.children[i]);
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
      let diagramNodes = this.children;
      for (let di = 0; di < diagramNodes.length; di++) {
        // Get our zoom_level
        let zoomLevel = diagramNodes[di].getElementsByTagName('zoom_level')[0];
        if (zoomLevel) {
          this.conf.zoomLevel = parseFloat(zoomLevel.innerText) / 10;
        }
        // Get our help_text settings
        let helpText = diagramNodes[di].getElementsByTagName('help_text')[0];
        if (helpText) {
          let conf = this.parseContents(helpText.innerText).extra;
          if ((/^(SansSerif)/).test(conf.fontfamily)) {
            this.conf.fontFamily = "sans-serif";
          } else if ((/^(Monospaced)/).test(conf.fontfamily)) {
            this.conf.fontFamily = "monospace";
          }
          if (conf.fontsize) {
            this.conf.fontSize = parseInt(conf.fontsize)
          }
        }
        this.conf.fontSize *= this.conf.zoomLevel;
        // Parse our elements
        let parsedElements = [];
        let elementNodes = diagramNodes[di].getElementsByTagName('element');
        // Keep track of our largest X and Y values so we can resize the canvas
        let lastX = 0;
        let lastY = 0;
        // Parse our UXF elements
        for (let ei = 0; ei < elementNodes.length; ei++) {
          parsedElements.push(new UXFElement(elementNodes[ei]));
          let curX = parsedElements[ei].x + parsedElements[ei].w;
          let curY = parsedElements[ei].y + parsedElements[ei].h;
          if (curX > lastX) lastX = curX;
          if (curY > lastY) lastY = curY;
        }
        // Sort by the elements
        parsedElements.sort(UXFElement.sort);
        // Resize our canvas
        if (this.canvas.getAttribute('width') < lastX) {
          this.canvas.setAttribute('width', lastX+1);
        }
        if (this.canvas.getAttribute('height') < lastY) {
          this.canvas.setAttribute('height', lastY+1);
        }
        // Draw!
        let mainCtx = this.canvas.getContext('2d');
        mainCtx.save();
        mainCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //
        this.ctx = this.offscreenCanvas.getContext('2d');
        for (let pi = 0; pi < parsedElements.length; pi++) {
          let element = parsedElements[pi];
          this.offscreenCanvas.width = element.w+1;
          this.offscreenCanvas.height = element.h+1;
          this.ctx.save();
          this.ctx.translate(.5,.5);
          // What is this fresh sin:
          let absoluteX = element.x, absoluteY = element.y;
          element.x = element.y = 0;
          // :(
          this.drawElement(element);
          this.ctx.restore();
          mainCtx.drawImage(this.offscreenCanvas, absoluteX, absoluteY, element.w+1, element.h+1);
        }
        mainCtx.restore();
      }
    }
    drawElement(element) {
      if (UXFCanvas.hasElementSupport(element.id)) {
        umlElements[element.id](this, element);
      } else {
        umlElements["Default"](this, element);
      }
    }
    fillShape(data) {
      // Set alpha to be like umlet
      this.ctx.globalAlpha = 0.5;
      // Draw BG
      if (data.bg) {
        this.ctx.fillStyle = data.bg;
        this.ctx.fill();
      }
      // Reset alpha
      this.ctx.globalAlpha = 1.0;
    }
    strokeShape(data) {
      data.fg = data.fg || 'black';
      data.lineStyle = data.lineStyle || '-';
      // Set stroke style
      this.ctx.strokeStyle = data.fg;
      if (data instanceof UXFElement) {
        let ld = data.getLineData().style[1];
        if (ld) {
          data.lineStyle = ld;
        }
      }
      this.setLineStyle(data.lineStyle);
      // Stroke
      this.ctx.stroke();
    }
    drawBox(boxData) {
      // Get shape
      this.ctx.rect(boxData.x, boxData.y, boxData.w, boxData.h);
      // fill and stroke
      this.fillShape(boxData);
      this.strokeShape(boxData);
      this.ctx.clip();
    }
    drawEllipse(ellipseData) {
      this.ctx.beginPath();
      this.ctx.ellipse(ellipseData.x+ellipseData.w/2, ellipseData.y+ellipseData.h/2, ellipseData.w/2, ellipseData.h/2, 0, 0, Math.PI*2);
      this.fillShape(ellipseData);
      this.strokeShape(ellipseData);
      this.ctx.clip();
    }
    drawLines(lineData) {
      // Begin our line drawing
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = lineData.fg || 'black';
      // Set our line type
      this.setLineStyle(lineData.style[1]);
      // Make the line path
      this.ctx.beginPath();
      for (let i = 0; i < lineData.points.length; i++) {
        this.ctx.lineTo(lineData.points[i][0]*this.conf.zoomLevel, lineData.points[i][1]*this.conf.zoomLevel);
      }
      this.ctx.stroke();
      // Draw arrow heads
      if (lineData.style[0]) {
        let x1 = lineData.points[0][0]*this.conf.zoomLevel, y1 = lineData.points[0][1] * this.conf.zoomLevel;
        let x2 = lineData.points[1][0]*this.conf.zoomLevel, y2 = lineData.points[1][1] * this.conf.zoomLevel;
        this.drawArrow(lineData.style[0], x1, y1, x2, y2);
      }
      if (lineData.style[2]) {
        let x1 = lineData.points[lineData.points.length-1][0]*this.conf.zoomLevel, y1 = lineData.points[lineData.points.length-1][1]*this.conf.zoomLevel;
        let x2 = lineData.points[lineData.points.length-2][0]*this.conf.zoomLevel, y2 = lineData.points[lineData.points.length-2][1]*this.conf.zoomLevel;
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
      let headLength    = 10 * this.conf.zoomLevel;
      let headWidth     = 5 * this.conf.zoomLevel;
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
      let dimensions = {width: 0, height: 0};
      if ((/^(-|--)$/).test(line) ) {
        // Render '-' and '--' as a full width line
        dimensions.height += this.getTextHeight()/2;
        dimensions.width = textOptions.w;
        this.drawLines({style: ['','--',''], points: [[textOptions.x, textOptions.y], [textOptions.x+textOptions.w, textOptions.y]]});
      } else {
        // TODO: Probably render all text to another offscreen canvas then render that to our element offscreen canvas. This would make centering easier.
        let formattedText = this.getFormattedText(line);
        // Render Text
        this.ctx.textBaseline = "top";
        if (textOptions.valign != 'center') {
          textOptions.y += TEXT_PADDING;
        }
        if (textOptions.align === 'center') {
          let width = this.getTextWidth(this.getPlainTextFromFormattedText(formattedText), textOptions);
          textOptions.x += textOptions.w/2;
          textOptions.x -= width/2;
        } else {
          textOptions.x += TEXT_PADDING;
        }
        dimensions = this.renderFormattedText(formattedText, textOptions);
      }
      return dimensions;
    }
    getFormattedText(text) {
      let regExp = /(?:^|[^a-zA-Z0-9])(\*|\/|_)(.*)\1/g;
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
      } else {
        matches.push({v: text});
      }
      return matches;
    }
    getPlainTextFromFormattedText(formattedText) {
      let str = '';
      for (let i = 0; i < formattedText.length; i++) {
        if (formattedText[i].c && formattedText[i].c.length > 0) {
          str += this.getPlainTextFromFormattedText(formattedText[i].c);
        } else {
          str += formattedText[i].v;
        }
      }
      return str;
    }
    renderFormattedText(formattedText, conf) {
      let offsetX = 0;
      let offsetY = 0;
      let dimensions = {width: 0, height: 0};
      for (let i = 0; i < formattedText.length; i++) {
        let textOptions = Object.assign({}, conf);
        textOptions.u   = textOptions.u || formattedText[i].t === '_';
        textOptions.i   = textOptions.i || formattedText[i].t === '/';
        textOptions.b   = textOptions.b || formattedText[i].t === '*';
        textOptions.x   += offsetX;
        if (formattedText[i].c && formattedText[i].c.length > 0) {
          dimensions = this.renderFormattedText(formattedText[i].c, textOptions);
          offsetX += dimensions.width;
        } else {
          dimensions = this.renderText(formattedText[i].v, textOptions);
          offsetX += dimensions.width;
        }
      }
      conf.x += offsetX;
      return {width: offsetX, height: dimensions.height};
    }
    renderText(text, textOptions) {
      let width = this.getTextWidth(text, textOptions);
      let height = this.getTextHeight(text, textOptions);
      if (textOptions.u) {
        let underlineOffset = height - 1;
        this.ctx.beginPath();
        this.ctx.moveTo(textOptions.x, underlineOffset+textOptions.y);
        this.ctx.lineTo(textOptions.x+width, underlineOffset+textOptions.y);
        this.ctx.stroke();
      }
      this.ctx.font = (textOptions.i ? 'italic ' : '') + (textOptions.b ? 'bold ' : '') + (textOptions.fontSize ? textOptions.fontSize : this.conf.fontSize)+'px ' + (textOptions.fontFamily ? textOptions.fontFamily : this.conf.fontFamily);
      this.ctx.fillStyle = (textOptions.fg ? textOptions.fg : 'black');
      this.ctx.fillText(text, textOptions.x, textOptions.y);
      return {width: width, height: height};
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
    getTextWidth(text, conf) {
      conf = Object.assign(this.conf, conf);
      this.ctx.font = (conf.i ? 'italic ' : '') + (conf.b ? 'bold ' : '') + (conf.fontSize ? conf.fontSize : this.conf.fontSize)+'px ' + (conf.fontFamily ? conf.fontFamily : this.conf.fontFamily);
      return(this.ctx.measureText(text).width);
    }
    getTextHeight(conf) {
      conf = Object.assign(this.conf, conf);

      let fontStyle = (conf.i ? 'italic ' : '') + (conf.b ? 'bold ' : '') + conf.fontSize+'px ' + conf.fontFamily;

      if (this.textHeightCache[fontStyle]) {
        return this.textHeightCache[fontStyle];
      }

      this.dummyCanvas.width  = this.getTextWidth('M', conf);
      this.dummyCanvas.height = this.dummyCanvas.width*2;
      let ctx = this.dummyCanvas.getContext('2d');
      ctx.font = fontStyle;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("M", 0, 0);
      let data = ctx.getImageData(0, 0, this.dummyCanvas.width, this.dummyCanvas.height).data;
      let top = -1, bottom = -1;
      for (let y = 0; y < this.dummyCanvas.height; y++) {
        for (let x = 0; x < this.dummyCanvas.width; x++) {
          if (data[((this.dummyCanvas.width * y) + x) * 4 + 3] > 0) {
            top = y;
            break;
          }
        }
        if (top != -1) break;
      }
      for (let y = this.dummyCanvas.height; y > 0; y--) {
        for (let x = 0; x < this.dummyCanvas.width; x++) {
          if (data[((this.dummyCanvas.width * y) + x) * 4 + 3] > 0) {
            bottom = y;
            break;
          }
        }
        if (bottom != -1) break;
      }

      return this.textHeightCache[fontStyle] = (bottom-top)*1.75;
    }

    static hasElementSupport(name) {
      if (umlElements[name]) return true;
      return false;
    }
    static addElementSupport(name, cb) {
      umlElements[name] = cb;
    }
  }
  window.customElements.define('uxf-canvas', UXFCanvas);
})();
