/**
 * Component rendering peer: Label
 */
Echo.Sync.Label = Core.extend(Echo.Render.ComponentSync, { 

    $static: {
    
       _defaultIconTextMargin: 5
    },
    
    $load: function() {
        Echo.Render.registerPeer("Label", this);
    },
    
    /**
     * The text node or element representing the label.
     */
    _node: null,
    
    /**
     * Formats the whitespace in the given text for use in HTML.
     * 
     * @param text {String} the text to format
     * @param parentElement the element to append the text to
     */
    _formatWhitespace: function(text, parentElement) {
        // switch between spaces and non-breaking spaces to preserve line wrapping
        text = text.replace(/\t/g, " \u00a0 \u00a0");
        text = text.replace(/ {2}/g, " \u00a0");
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (i > 0) {
                parentElement.appendChild(document.createElement("br"));
            }
            if (line.length > 0) {
                parentElement.appendChild(document.createTextNode(line));
            }
        }
    },
    
    renderAdd: function(update, parentElement) {
        this._containerElement = parentElement;
        var icon = this.component.render("icon");
        var text = this.component.render("text");
        var foreground = this.component.render("foreground");
        var background = this.component.render("background");
        var toolTip = this.component.render("toolTipText");
    
        if (text != null) {
            var lineWrap = this.component.render("lineWrap", true);
            var formatWhitespace = this.component.render("formatWhitespace", false)
                    && (text.indexOf(' ') != -1 || text.indexOf('\n') != -1 || text.indexOf('\t') != -1);
            
            if (icon) {
                // Text and icon.
                var iconTextMargin = this.component.render("iconTextMargin", 
                        Echo.Sync.Label._defaultIconTextMargin);
                var orientation = Echo.Sync.TriCellTable.getOrientation(this.component, "textPosition");
                var tct = new Echo.Sync.TriCellTable(orientation, Echo.Sync.Extent.toPixels(iconTextMargin));
                var img = document.createElement("img");
                Echo.Sync.ImageReference.renderImg(icon, img);
                if (formatWhitespace) {
                    this._formatWhitespace(text, tct.tdElements[0]);
                } else {
                    tct.tdElements[0].appendChild(document.createTextNode(text));
                }
                if (!lineWrap) {
                    tct.tdElements[0].style.whiteSpace = "nowrap";
                }
                tct.tdElements[1].appendChild(img);
                this._node = tct.tableElement;
                this._node.id = this.component.renderId;
                Echo.Sync.Font.render(this.component.render("font"), this._node);
                Echo.Sync.Color.renderFB(this.component, this._node);
            } else {
                // Text without icon.
                var font = this.component.render("font");
                if (!this.client.designMode && !toolTip && !font && lineWrap && !foreground && !background 
                        && !formatWhitespace) {
                    this._node = document.createTextNode(text);
                } else {
                    this._node = document.createElement("span");
                    this._node.id = this.component.renderId;
                    if (formatWhitespace) {
                        this._formatWhitespace(text, this._node);
                    } else {
                        this._node.appendChild(document.createTextNode(text));
                    }
                    if (!lineWrap) {
                        this._node.style.whiteSpace = "nowrap";
                    }
                    Echo.Sync.Font.render(font, this._node);
                    Echo.Sync.Color.renderFB(this.component, this._node);
                }
            }
        } else if (icon) {
            var img = document.createElement("img");
            Echo.Sync.ImageReference.renderImg(icon, img);
            this._node = document.createElement("span");
            this._node.id = this.component.renderId;
            this._node.appendChild(img);
            Echo.Sync.Color.renderFB(this.component, this._node); // should be BG only.
        } else {
            // Neither icon nor text, render blank.
            if (this.client.designMode) {
                this._node = document.createElement("span");
                this._node.id = this.component.renderId;
            } else {
                this._node = null;
            }
        }
        
        if (toolTip) {
            this._node.title = toolTip;
        }
    
        if (this._node) {
            parentElement.appendChild(this._node);
        }
    },
    
    renderDispose: function(update) {
        this._containerElement = null;
        this._node = null;
    },
    
    renderUpdate: function(update) {
        if (this._node) {
            this._node.parentNode.removeChild(this._node);
        }
        // Note: this.renderDispose() is not invoked (it does nothing).
        this.renderAdd(update, this._containerElement);
        return false; // Child elements not supported: safe to return false.
    }
});