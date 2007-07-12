/**
 * Component rendering peer: SplitPane
 * 
 * @class
 * @base EchoRender.ComponentSync
 */
EchoRender.ComponentSync.SplitPane = function() {

    /**
     * Array containing two PaneConfiguration instances, representing the state of each child pane.
     * @type Array
     */
    this._childPanes = new Array(2);
};

EchoRender.ComponentSync.SplitPane.prototype = new EchoRender.ComponentSync;

/**
 * Creates a new PaneConfiguration instance
 * 
 * @class Describes the configuration of a child pane of the SplitPane,
 *        including the child component and scroll bar positions.
 * @param {EchoRender.ComponentSync.SplitPane} splitPanePeer the relevant componentPeer
 * @param {EchoApp.Component} component the child component
 * @constructor
 */
EchoRender.ComponentSync.SplitPane.ChildPane = function(splitPanePeer, component) {
    this.component = component;
    this.layoutData = component.getRenderProperty("layoutData");
    if (this.layoutData) {
        var extent;
        extent = this.layoutData.getProperty("minimumSize");
        this.minimumSize = extent ? EchoWebCore.Render.extentToPixels(extent.value, extent.units, 
                !splitPanePeer._orientationVertical) : 0;
        extent = this.layoutData.getProperty("maximumSize");
        this.maximumSize = extent ? EchoWebCore.Render.extentToPixels(extent.value, extent.units, 
                !splitPanePeer._orientationVertical) : null;
    } else {
        this.minimumSize = 100;
    }
};

EchoRender.ComponentSync.SplitPane.ChildPane.prototype.loadScrollPositions = function(paneDivElement) {
    paneDivElement.scrollLeft = this.scrollLeft;
    paneDivElement.scrollTop = this.scrollTop;
};

EchoRender.ComponentSync.SplitPane.ChildPane.prototype.storeScrollPositions = function(paneDivElement) {
    this.scrollLeft = paneDivElement.scrollLeft;
    this.scrollTop = paneDivElement.scrollTop;
};

EchoRender.ComponentSync.SplitPane.prototype.renderDispose = function(update) {
    if (this._firstPaneDivElement) {
        if (this._childPanes[0]) {
            this._childPanes[0].storeScrollPositions(this._firstPaneDivElement);
        }
        this._firstPaneDivElement.id = "";
        this._firstPaneDivElement = null;
    }
    if (this._secondPaneDivElement) {
        if (this._childPanes[1]) {
            this._childPanes[1].storeScrollPositions(this._secondPaneDivElement);
        }
        this._secondPaneDivElement.id = "";
        this._secondPaneDivElement = null;
    }
    
    if (this._separatorDivElement) {
        EchoWebCore.EventProcessor.remove(this._separatorDivElement, "mousedown", new EchoCore.MethodRef(this,
                this._processSeparatorMouseDown), false);
        this._separatorDivElement.id = "";
        this._separatorDivElement = null;
    }

    this._splitPaneDivElement.id = "";
    this._splitPaneDivElement = null;
};

EchoRender.ComponentSync.SplitPane.prototype.loadRenderData = function() {
    var orientation = this.component.getRenderProperty("orientation", 
            EchoApp.SplitPane.ORIENTATION_HORIZONTAL_LEADING_TRAILING);
    // FIXME: RTL is hardcoded to false.
    var rtl = false;
 
    switch (orientation) {
    case EchoApp.SplitPane.ORIENTATION_HORIZONTAL_LEADING_TRAILING:
        this._orientationTopLeft = !rtl;
        this._orientationVertical = false;
        break;
    case EchoApp.SplitPane.ORIENTATION_HORIZONTAL_TRAILING_LEADING:
        this._orientationTopLeft = rtl;
        this._orientationVertical = false;
        break;
    case EchoApp.SplitPane.ORIENTATION_HORIZONTAL_LEFT_RIGHT:
        this._orientationTopLeft = true;
        this._orientationVertical = false;
        break;
    case EchoApp.SplitPane.ORIENTATION_HORIZONTAL_RIGHT_LEFT:
        this._orientationTopLeft = false;
        this._orientationVertical = false;
        break;
    case EchoApp.SplitPane.ORIENTATION_VERTICAL_TOP_BOTTOM:
        this._orientationTopLeft = true;
        this._orientationVertical = true;
        break;
    case EchoApp.SplitPane.ORIENTATION_VERTICAL_BOTTOM_TOP:
        this._orientationTopLeft = false;
        this._orientationVertical = true;
        break;
    default:
        throw new Error("Invalid orientation: " + orientation);
    }

    this._resizable = this.component.getRenderProperty("resizable");
    
    /**
     * The user's desired position of the separator.  This is the last
     * position to which the user dragged the separator or the last position
     * that the separator was explicitly set to.  This value may not be the
     * actual separator position, in cases where other constraints have
     * temporarily adjusted it.
     * @type Integer
     */
    this._userSeparatorPosition = this._separatorPosition = EchoRender.Property.Extent.toPixels(
            this.component.getRenderProperty("separatorPosition",
            EchoApp.SplitPane.DEFAULT_SEPARATOR_POSITION), this._orientationVertical);
    
    this._separatorSize = EchoRender.Property.Extent.toPixels(this.component.getRenderProperty(
            this._orientationVertical ? "separatorHeight" : "separatorWidth",
            this._resizable ? EchoApp.SplitPane.DEFAULT_SEPARATOR_SIZE_RESIZABLE 
            : EchoApp.SplitPane.DEFAULT_SEPARATOR_SIZE_FIXED), this._orientationVertical);
};

EchoRender.ComponentSync.SplitPane.prototype._processSeparatorMouseDown = function(e) {
    EchoWebCore.DOM.preventEventDefault(e);
    
    EchoWebCore.dragInProgress = true;

    this._dragInitPosition = this._separatorPosition;
    if (this._orientationVertical) {
        this._dragInitMouseOffset = e.clientY;
    } else {
        this._dragInitMouseOffset = e.clientX;
    }
    
    var bodyElement = document.getElementsByTagName("body")[0];
    EchoWebCore.EventProcessor.add(bodyElement, "mousemove", 
            new EchoCore.MethodRef(this, this._processSeparatorMouseMove), true);
    EchoWebCore.EventProcessor.add(bodyElement, "mouseup", 
            new EchoCore.MethodRef(this, this._processSeparatorMouseUp), true);
};

EchoRender.ComponentSync.SplitPane.prototype._processSeparatorMouseMove = function(e) {
//FIXME. Refactor for size.
    var position;
    if (this._orientationVertical) {
        if (this._orientationTopLeft) {
            position = this._dragInitPosition + e.clientY - this._dragInitMouseOffset;
        } else {
            position = this._dragInitPosition - e.clientY + this._dragInitMouseOffset;
        }
    } else {
        if (this._orientationTopLeft) {
            position = this._dragInitPosition + e.clientX - this._dragInitMouseOffset;
        } else {
            position = this._dragInitPosition - e.clientX + this._dragInitMouseOffset;
        }
    }
    this._setSeparatorPosition(position);
};

EchoRender.ComponentSync.SplitPane.prototype._processSeparatorMouseUp = function(e) {
    EchoWebCore.DOM.preventEventDefault(e);
    
    EchoWebCore.dragInProgress = false;

    this._removeSeparatorListeners();
    this.component.setProperty("separatorPosition", new EchoApp.Property.Extent(this._separatorPosition));
    
    // inform renderer that separatorposition is currently drawn as this._separatorPosition
    
    this._userSeparatorPosition = this._separatorPosition;

    if (this._firstPaneDivElement) {
        EchoWebCore.VirtualPosition.redraw(this._firstPaneDivElement);
    }
    if (this._secondPaneDivElement) {
        EchoWebCore.VirtualPosition.redraw(this._secondPaneDivElement);
    }

    EchoRender.notifyResize(this.component);
};

EchoRender.ComponentSync.SplitPane.prototype._getInsetsSizeAdjustment = function(layoutData) {
    if (!layoutData || !layoutData.getProperty("insets")) {
        return 0;
    }
    var layoutDataInsets = EchoRender.Property.Insets.toPixels(layoutData.getProperty("insets"));
    var adjustment;
    if (this._orientationVertical) {
        adjustment = layoutDataInsets.top + layoutDataInsets.bottom;
    } else {
        adjustment = layoutDataInsets.left + layoutDataInsets.right;
    }
    if (adjustment > this._separatorPosition) {
        adjustment = this._separatorPosition;
    }
    return adjustment;
};

EchoRender.ComponentSync.SplitPane.prototype._getRenderedChildIndex = function(child) {
    if (this._childPanes[0] && this._childPanes[0].component == child) {
        return 0;
    } else if (this._childPanes[1] && this._childPanes[1].component == child) {
        return 1;
    } else {
        throw new Error("Specified component is not a child of the SplitPane.");
    }
};

EchoRender.ComponentSync.SplitPane.prototype._hasRelocatedChildren = function(update) {
    var oldChild0 = this._childPanes[0] ? this._childPanes[0].component : null; 
    var oldChild1 = this._childPanes[1] ? this._childPanes[1].component : null; 
    var childCount = this.component.getComponentCount();
    var newChild0 = childCount > 0 ? this.component.getComponent(0) : null;
    var newChild1 = childCount > 1 ? this.component.getComponent(1) : null;
    return (oldChild0 != null && oldChild0 == newChild1) 
            || (oldChild1 != null && oldChild1 == newChild0);
};

EchoRender.ComponentSync.SplitPane.prototype._redraw = function() {
    var insetsAdjustment = 0;
    if (this.component.getComponentCount() > 0) {
        var layoutData = this.component.getComponent(0).getRenderProperty("layoutData");
        insetsAdjustment = this._getInsetsSizeAdjustment(layoutData);
    }

    if (this._orientationVertical) {
        if (this._orientationTopLeft) {
            this._redrawItem(this._firstPaneDivElement, "height", (this._separatorPosition - insetsAdjustment) + "px");
            this._redrawItem(this._secondPaneDivElement, "top", (this._separatorPosition + this._separatorSize) + "px");
            this._redrawItem(this._separatorDivElement, "top", this._separatorPosition + "px");
        } else {
            this._redrawItem(this._firstPaneDivElement, "height", (this._separatorPosition - insetsAdjustment) + "px");
            this._redrawItem(this._secondPaneDivElement, "bottom", (this._separatorPosition + this._separatorSize) + "px"); 
            this._redrawItem(this._separatorDivElement, "bottom", this._separatorPosition + "px");
        }
    } else {
        if (this._orientationTopLeft) {
            this._redrawItem(this._firstPaneDivElement, "width", (this._separatorPosition - insetsAdjustment) + "px");
            this._redrawItem(this._secondPaneDivElement, "left", (this._separatorPosition + this._separatorSize) + "px");
            this._redrawItem(this._separatorDivElement, "left", this._separatorPosition + "px");
        } else {
            this._redrawItem(this._firstPaneDivElement, "width", (this._separatorPosition - insetsAdjustment) + "px");
            this._redrawItem(this._secondPaneDivElement, "right", (this._separatorPosition + this._separatorSize) + "px"); 
            this._redrawItem(this._separatorDivElement, "right", this._separatorPosition + "px");
        }
    }
};

EchoRender.ComponentSync.SplitPane.prototype._redrawItem = function(element, styleProperty, newValue) {
    if (element) {
        element.style[styleProperty] = newValue;
    }
};

EchoRender.ComponentSync.SplitPane.prototype._removeSeparatorListeners = function() {
    var bodyElement = document.getElementsByTagName("body")[0];
    EchoWebCore.EventProcessor.remove(bodyElement, "mousemove", 
            new EchoCore.MethodRef(this, this._processSeparatorMouseMove), true);
    EchoWebCore.EventProcessor.remove(bodyElement, "mouseup", 
            new EchoCore.MethodRef(this, this._processSeparatorMouseUp), true);
};

EchoRender.ComponentSync.SplitPane.prototype.renderAdd = function(update, parentElement) {
    this.loadRenderData();
    var separatorColor = new EchoApp.Property.Color("red"); 
    var separatorImage = null;
    
    var childCount = this.component.getComponentCount();
    if (childCount > 2) {
        throw new Error("Cannot render SplitPane with more than two child components.");
    }
    var child0 = childCount < 1 ? null : this.component.getComponent(0);
    var child1 = childCount < 2 ? null : this.component.getComponent(1);

    this._splitPaneDivElement = document.createElement("div");
    this._splitPaneDivElement.id = this.component.renderId;
    this._splitPaneDivElement.style.position = "absolute";
    this._splitPaneDivElement.style.overflow = "hidden";
    this._splitPaneDivElement.style.top = "0px"
    this._splitPaneDivElement.style.bottom = "0px"
    this._splitPaneDivElement.style.left = "0px"
    this._splitPaneDivElement.style.right = "0px"
    
    EchoRender.Property.Color.renderFB(this.component, this._splitPaneDivElement);
    EchoRender.Property.Font.renderDefault(this.component, this._splitPaneDivElement);
    
    if (this._separatorSize > 0) {
        this._separatorDivElement = document.createElement("div");
        this._separatorDivElement.id = this.component.renderId + "_separator";
        this._separatorDivElement.style.position = "absolute";
        EchoRender.Property.Color.renderComponentProperty(this.component, "separatorColor",
                EchoApp.SplitPane.DEFAULT_SEPARATOR_COLOR, this._separatorDivElement, "backgroundColor");
        this._separatorDivElement.style.fontSize = "1px";
        this._separatorDivElement.style.lineHeight = "0";
        this._separatorDivElement.style.zIndex = "2";

        var resizeCursor = null;
        if (this._orientationVertical) {
            if (this._orientationTopLeft) {
                this._separatorDivElement.style.top = this._separatorPosition + "px";
                resizeCursor = "s-resize";
            } else {
                this._separatorDivElement.style.bottom = this._separatorPosition + "px";
                resizeCursor = "n-resize";
            }
            this._separatorDivElement.style.width = "100%";
            this._separatorDivElement.style.height = this._separatorSize + "px";
            EchoRender.Property.FillImage.renderComponentProperty(this.component, "separatorVerticalImage", null, 
                    this._separatorDivElement, 0);
        } else {
            if (this._orientationTopLeft) {
                this._separatorDivElement.style.left = this._separatorPosition + "px";
                resizeCursor = "e-resize";
            } else {
                this._separatorDivElement.style.right = this._separatorPosition + "px";
                resizeCursor = "w-resize";
            }
            this._separatorDivElement.style.height = "100%";
            this._separatorDivElement.style.width = this._separatorSize + "px";
            EchoRender.Property.FillImage.renderComponentProperty(this.component, "separatorHorizontalImage", null, 
                    this._separatorDivElement, 0);
        }
        if (this._resizable && resizeCursor) {
            this._separatorDivElement.style.cursor = resizeCursor;
        }
        this._splitPaneDivElement.appendChild(this._separatorDivElement);
    } else {
        this._separatorDivElement = null;
    }
    
    for (var i = 0; i < childCount && i < 2; ++i) {
        var child = this.component.getComponent(i);
        this._renderAddChild(update, child, i);
    }
    
    parentElement.appendChild(this._splitPaneDivElement);
    
    if (this._resizable) {
        EchoWebCore.EventProcessor.add(this._separatorDivElement, "mousedown", new EchoCore.MethodRef(this,
                this._processSeparatorMouseDown), false);
    }
};

EchoRender.ComponentSync.SplitPane.prototype._renderAddChild = function(update, child, index) {
    var childIndex = this.component.indexOf(child);
    var paneDivElement = document.createElement("div");
    
    if (index == 0) {
       this._firstPaneDivElement = paneDivElement;
    } else {
       this._secondPaneDivElement = paneDivElement;
    }
    
    paneDivElement.id = this.component.renderId + "_pane" + childIndex;
    paneDivElement.style.position = "absolute";
    paneDivElement.style.overflow = "auto";
    
    var layoutData = child.getRenderProperty("layoutData");
    if (layoutData) {
        EchoRender.Property.Alignment.renderComponentProperty(layoutData, "alignment", null, paneDivElement, false,
                this.component);
        EchoRender.Property.Color.renderComponentProperty(layoutData, "background", null, paneDivElement, "backgroundColor");
        EchoRender.Property.FillImage.renderComponentProperty(layoutData, "backgroundImage", null, paneDivElement);
        EchoRender.Property.Insets.renderComponentProperty(layoutData, "insets", null, paneDivElement, "padding");
        switch (layoutData.getProperty("overflow")) {
        case EchoApp.SplitPane.OVERFLOW_HIDDEN:
            paneDivElement.style.overflow = "hidden";
            break;
        case EchoApp.SplitPane.OVERFLOW_SCROLL:
            paneDivElement.style.overflow = "scroll";
            break;
        }
    }
    var insetsAdjustment = this._getInsetsSizeAdjustment(layoutData);
    
    var renderingTopLeft = (index == 0 && this._orientationTopLeft)
            || (index != 0 && !this._orientationTopLeft);
            
    if (this._orientationVertical) {
        paneDivElement.style.left = "0px";
        paneDivElement.style.right = "0px";
        if (this._orientationTopLeft) {
            if (index == 0) {
                paneDivElement.style.top = "0px";
                paneDivElement.style.height = (this._separatorPosition - insetsAdjustment) + "px";
            } else {
                paneDivElement.style.top = (this._separatorPosition + this._separatorSize) + "px";
                paneDivElement.style.bottom = "0px";
            }
        } else {
            if (index == 0) {
                paneDivElement.style.bottom = "0px";
                paneDivElement.style.height = (this._separatorPosition - insetsAdjustment) + "px";
            } else {
                paneDivElement.style.top = "0px";
                paneDivElement.style.bottom = (this._separatorPosition + this._separatorSize) + "px";
            }
        }
    } else {
        paneDivElement.style.top = "0px";
        paneDivElement.style.bottom = "0px";
        if (this._orientationTopLeft) {
            if (index == 0) {
                paneDivElement.style.left = "0px";
                paneDivElement.style.width = (this._separatorPosition - insetsAdjustment) + "px";
            } else {
                paneDivElement.style.left = (this._separatorPosition + this._separatorSize) + "px";
                paneDivElement.style.right = "0px";
            }
        } else {
            if (index == 0) {
                paneDivElement.style.width = (this._separatorPosition - insetsAdjustment) + "px";
                paneDivElement.style.right = "0px";
            } else {
                paneDivElement.style.left = "0px";
                paneDivElement.style.right = this._separatorPosition + "px";
            }
        }
    }
    
    EchoRender.renderComponentAdd(update, child, paneDivElement);
    this._splitPaneDivElement.appendChild(paneDivElement);

    if (this._childPanes[index] && this._childPanes[index].component == child) {
        this._childPanes[index].loadScrollPositions(paneDivElement);
    } else {
        this._childPanes[index] = new EchoRender.ComponentSync.SplitPane.ChildPane(this, child);
    }
};

EchoRender.ComponentSync.SplitPane.prototype._renderRemoveChild = function(update, child) {
    var index = this._getRenderedChildIndex(child);
    this._childPanes[index] = null;
    switch (index) {
    case 0:
        EchoWebCore.DOM.removeNode(this._firstPaneDivElement);
        this._firstPaneDivElement = null;
        break;
    case 1:
        EchoWebCore.DOM.removeNode(this._secondPaneDivElement);
        this._secondPaneDivElement = null;
        break;
    }
};

EchoRender.ComponentSync.SplitPane.prototype.renderSizeUpdate = function() {
    EchoWebCore.VirtualPosition.redraw(this._splitPaneDivElement);
    if (this.component.getRenderProperty("resizable")) {
        this._setSeparatorPosition(this._userSeparatorPosition);
    }
    if (this._firstPaneDivElement) {
        EchoWebCore.VirtualPosition.redraw(this._firstPaneDivElement);
    }
    if (this._secondPaneDivElement) {
        EchoWebCore.VirtualPosition.redraw(this._secondPaneDivElement);
    }
};

EchoRender.ComponentSync.SplitPane.prototype.renderUpdate = function(update) {
    var fullRender = false;
    if (update.hasUpdatedProperties() || update.hasUpdatedLayoutDataChildren()
            || this._hasRelocatedChildren()) {
        // Full render
        fullRender = true;
    } else {
        var removedChildren = update.getRemovedChildren();
        if (removedChildren) {
            // Remove children.
            for (var i = 0; i < removedChildren.length; ++i) {
                this._renderRemoveChild(update, removedChildren[i]);
            }
        }
        var addedChildren = update.getAddedChildren();
        if (addedChildren) {
            // Add children.
            for (var i = 0; i < addedChildren.length; ++i) {
                this._renderAddChild(update, addedChildren[i], this.component.indexOf(addedChildren[i])); 
            }
        }
    }
    if (fullRender) {
        var element = this._splitPaneDivElement;
        var containerElement = element.parentNode;
        EchoRender.renderComponentDispose(update, update.parent);
        containerElement.removeChild(element);
        this.renderAdd(update, containerElement);
    }
    
    return fullRender;
};

EchoRender.ComponentSync.SplitPane.prototype._setSeparatorPosition = function(newValue) {
    var oldValue = this._separatorPosition;

    if (this._childPanes[1]) {
        var totalSize = this._orientationVertical ? 
                this._splitPaneDivElement.offsetHeight : this._splitPaneDivElement.offsetWidth;
        if (newValue > totalSize - this._childPanes[1].minimumSize - this._separatorSize) {
            newValue = totalSize - this._childPanes[1].minimumSize - this._separatorSize;
        } else if (this._childPanes[1].maximumSize != null
                && newValue < totalSize - this._childPanes[1].maximumSize - this._separatorSize) {
            newValue = totalSize - this._childPanes[1].maximumSize - this._separatorSize;
        }
    }
    if (this._childPanes[0]) {
        if (newValue < this._childPanes[0].minimumSize) {
            newValue = this._childPanes[0].minimumSize;
        } else if (this._childPanes[0].maximumSize  != null && newValue > this._childPanes[0].maximumSize) {
            newValue = this._childPanes[0].maximumSize;
        }
    }
    
    this._separatorPosition = newValue;
    
    if (oldValue != newValue) {
        this._redraw();
    }
    
    //FIXME.
    return oldValue != newValue;
};

EchoRender.registerPeer("SplitPane", EchoRender.ComponentSync.SplitPane);
