class UXFCanvas extends HTMLElement {
  static get observedAttributes() { return ['width', 'height', 'src']; }
  constructor() {
    super();
    var shadow = this.attachShadow({mode: 'open'});
    this.canvas = document.createElement('canvas');
    shadow.appendChild(this.canvas);
  }
  connectedCallback() {
    // Is this even appropriate?
    this.style.display = 'inline-block';
    setTimeout(() => {
      this.draw();
    }, 5)
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue == newValue) return;

    if (name === 'width' || name === 'height') {
      this.canvas.setAttribute(name, newValue);
      this.draw();
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
    let ctx = this.canvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.translate(0.5, 0.5);
    // Draw our diagram(s) -- does UXF even support multiple diagrams in an object?
    let diagramNodes = this.getElementsByTagName('diagram');
    for (let di = 0; di < diagramNodes.length; di++) {
      let elementNodes = diagramNodes[di].getElementsByTagName('element');
      // TODO: sort elementNodes by their layer attribute
      for (let ei = 0; ei < elementNodes.length; ei++) {
	      this.drawElement(ctx, elementNodes[ei]);
      }
    }
    ctx.restore();
  }
  drawElement(ctx, element) {
    // Read in all our important values
    let values = this.getElementValues(element, {id: '', coordinates: { x:0, y:0, w:0,h:0 }, panel_attributes: '', additional_attributes:''});
    values.id = values.id.toLowerCase();
    // Draw our different element types
    if (values.id === 'umlclass' || values.id === 'umlgeneric') {
      this.drawUMLClass(ctx, values);
    } else if (values.id === 'relation') {
      this.drawRelation(ctx, values);
    }
  }
  drawUMLClass(ctx, data) {
    // TODO: Add "drawText" method
    let textObjects = this.parseText(data.panel_attributes);
    // Draw BG
    if (textObjects.extra.bg) {
      ctx.fillStyle = textObjects.extra.bg;
      ctx.fillRect(data.coordinates.x, data.coordinates.y, data.coordinates.w, data.coordinates.h);
    }
    // Render Text
    let x = 0, y = 0;
    for (let ti = 0; ti < textObjects.text.length; ti++) {
      x = 0;
      let text = textObjects.text[ti];
      let metrics = ctx.measureText(text.value);
      // FIXME: Absolutely BOGUS height measurement
      metrics.height = ctx.measureText('M').width;
      //
      y += metrics.height + metrics.height/2;
      ctx.font = (text.style.italics ? 'italic ' : '') + '12px serif';

      // FIXME
      x += data.coordinates.w/2;
      ctx.textAlign = "center";

      ctx.fillStyle = 'black';
      ctx.fillText(text.value, data.coordinates.x+x, data.coordinates.y+y, data.coordinates.w);
    }
    ctx.strokeRect(data.coordinates.x, data.coordinates.y, data.coordinates.w, data.coordinates.h);
  }
  drawRelation(ctx, data) {
    let extra = this.parseText(data.panel_attributes).extra;
    // Get our type of line. Returned array should have three elements that map to the left arrow, the middle line, and the right arrow respectively.
    let lineType = extra.lt.match(/([^-.]*)([^>]*)(.*)/).slice(1);
    // Get our proper offsets
    let xOffset = data.coordinates.w - (data.coordinates.w - data.coordinates.x), yOffset = data.coordinates.h - (data.coordinates.h - data.coordinates.y);
    // Get coordinates as pairs
    let coords = [], ocoords = data.additional_attributes.split(';');
    for (let i = 0; i < ocoords.length; i+= 2) {
      coords.push(ocoords.slice(i, i+2));
    }
    for (let i = 0; i < coords.length; i++) {
      coords[i][0] = parseInt(coords[i][0]);
      coords[i][1] = parseInt(coords[i][1]);
    }
    // Begin our line drawing
    ctx.lineWidth = 1;
    // Set our line type
    if (lineType[1] == '-') {
      ctx.setLineDash([]);
    } else if (lineType[1] == '.') {
      ctx.setLineDash([6, 6]);
    } else if (lineType[1] == '..') {
      ctx.setLineDash([2, 2]);
    }
    // Make the line path
    ctx.beginPath();
    for (let i = 0; i < coords.length; i++) {
      // Get our coordinate pair
      let x = parseInt(coords[i][0]), y = parseInt(coords[i][1]);
      // Create the line
      ctx.lineTo(xOffset+x, yOffset+y);
    }
    ctx.stroke();
    // Draw arrow heads
    if (lineType[0]) {
      let x1 = coords[0][0], y1 = coords[0][1];
      let x2 = coords[1][0], y2 = coords[1][1];
      this.drawArrow(ctx, lineType[0], xOffset+x1, yOffset+y1, xOffset+x2, yOffset+y2);
    }
    if (lineType[2]) {
      let x1 = coords[coords.length-1][0], y1 = coords[coords.length-1][1];
      let x2 = coords[coords.length-2][0], y2 = coords[coords.length-2][1];
      this.drawArrow(ctx, lineType[2], xOffset+x1, yOffset+y1, xOffset+x2, yOffset+y2);
    }
  }
  drawArrow(ctx, type, fromX, fromY, toX, toY) {
    let radians = Math.atan2(toY - fromY, toX - fromX) - Math.PI/2;
    this.drawArrowHead(ctx, type, fromX, fromY, radians);
  }
  drawArrowHead(ctx, type, x, y, radians) {
    // FIXME: actually properly render inverted symbols
    // TODO: add '(+)', '()', 'x', '>[text]' '>|', '(', '[text]'
    let headLength    = 10;
    let headWidth     = 5;
    let lineColor     = 'black';
    let lineColorInv  = 'white';
    ctx.save();
    ctx.setLineDash([]); // Reset lines to solid
    ctx.translate(x, y);
    ctx.rotate(radians);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    if (type == '<' || type == '>') {
      ctx.lineTo(-headWidth, headLength);
      ctx.moveTo(0, 0);
      ctx.lineTo(headWidth, headLength);
      ctx.closePath();
      ctx.stroke();
    } else if (type == '<<' || type == '>>') {
      ctx.lineTo(-headWidth, headLength);
      ctx.lineTo(headWidth, headLength);
      ctx.closePath();
      ctx.fillStyle = lineColorInv;
      ctx.fill();
      ctx.stroke();
    } else if (type == '<<<' || type == '>>>') {
      ctx.lineTo(-headWidth, headLength);
      ctx.lineTo(headWidth, headLength);
      ctx.closePath();
      ctx.fillStyle = lineColor;
      ctx.fill();
      ctx.stroke();
    } else if (type == '<<<<' || type == '>>>>' || type == '<<<<<' || type == '>>>>>') {
      ctx.lineTo(-headWidth, headLength);
      ctx.lineTo(0, headLength*2);
      ctx.lineTo(headWidth, headLength);
      ctx.lineTo(0, 0);
      ctx.fillStyle = (type.length === 4 ? lineColorInv : lineColor);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  parseText(source) {
    let data = {text: [], extra: {}};
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
        let textObj = {value: '', style: {}};
        let regExpItalics = /([\/])([^\/]*)/g;
        let matchItalics = regExpItalics.exec(line);
        if (matchItalics) {
          textObj.style.italics = true;
          textObj.value = matchItalics[2];
        } else {
          textObj.value = line;
        }
        data.text.push(textObj);
      }
    }
    return data;
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
}
window.customElements.define('uxf-canvas', UXFCanvas);
