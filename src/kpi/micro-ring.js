import * as d3 from 'd3';
import './kpi.css';
import './micro-ring.css';


function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArc(radius, x, y, startAngle, endAngle) {
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var largeArcFlag = (endAngle - startAngle) <= 180 ? '0' : '1';

    return [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
}

function MicroRing(ctrl, options) {
    var _this = this;
    this.container = ctrl;

    // load defaults from HTML container attributes, supplied options, or defaults (in that priority order)
    this.defaults = this.getDefaults(ctrl, options, {
        title: null,
        color: "#1e66b7",
        limit: 100,
        decimals: 0,
        unit: null
    });

    // these accessor functions simply extract a value from a data object
    this.accessors = {
        color: function (d) { return d.color ? d.color : _this.defaults.color },
        title: function (d) { return d.title ? d.title : _this.defaults.title },
        value: function (d) { return d.value },
        arcValue: function (d) { return (d.value>=d.limit) ? 0.9999 : (d.value / d.limit) },
        toString: function(d) { return isNaN(d.value) ? d.value : d.value.toFixed(d.decimals ? d.decimals : _this.defaults.decimals) },
        x: function(d, i) { return /*120*d.id +*/ 60 },
        y: function(d, i) { return 60 }
    };

    // compute classes
    this.classes = ["micro-ring"];
    if (options) {
        if (options.size)
            this.classes.push("kpi-" + options.size);
    }

    this.svg = this.extend(
        d3.select(this.container).append("svg")
            .attr("class", this.classes.join(' '))
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 120 120")
    );

    this.redraw();
}

MicroRing.prototype.redraw = function(data) {
    var _this = this;
    if(!data) return;
    this.rings = this.extend( this.svg
        .selectAll("g.ring")
        .data( data , function(d) { return d.id; }) );

    // deletion of controls that no longer exist
    this.rings
        .exit()
        .remove();

    // creation of new controls
    this.extend(this.rings.enter()
        .append("g")
        .attr("class", "ring")
        .attr("id", function(d) { return d.id }))
        .circle("radial-track", 45, null, 0.1)
        .label("value", -3, "black", this.accessors.toString)
        .label("title", 15, null,  this.accessors.title)
        .arc("radial-value", 45, 0, function(d) { return _this.accessors.arcValue(d) * 360; });

    // update existing controls
    this.rings.select("text.value")
        .text(this.accessors.toString);
    this.extend(this.rings.select("path.radial-value"))
        .describeArc("radial-value", 45, 0, function(d) { return _this.accessors.arcValue(d) * 360; });
};

MicroRing.prototype.getDefaults = function() {
    var def = {};
    var data_attribs = "title,color,limit,decimals,unit".split(',');
    var v;
    for(var n in arguments) {
        var arg = arguments[n];
        if(arg===null || arg===undefined) continue;
        if(arg.getAttribute!==undefined) {
            // argument is a HTML element, use getAttribute to check for defaults
            for (var a in data_attribs) {
                var attr = data_attribs[a];
                if (def[attr]===undefined && (v = arg.getAttribute(attr)) !== null || (v = arg.getAttribute("data-" + attr)) !== null) {
                    // found the option in the attributes of the container HTML element
                    def[attr] = isNaN(Number(v)) ? v : Number(v);
                }
            }
        } else {
            // assume a plain javascript object with options
            for (var a in data_attribs) {
                var attr = data_attribs[a];
                if (def[attr]===undefined && arg[attr] !== undefined) {
                    // found the option in the supplied javascript object (constructor 'options' argument)
                    def[attr] = arg[attr];
                }
            }
        }
    }
    return def;
}

MicroRing.prototype.value = function(v) {
    this.data[0].value = v;
    this.redraw();
};

MicroRing.prototype.dat = function(v) {
    if(!Array.isArray(v))
        v = [ v ];
    this.redraw(v);
};

const micro_ring_helpers = {
    g: function(className) {
        this.append("g")
        attr("class", className);
        return this;
    },
    circle: function(className, radius, color, opacity) {
        var _this = this;
        this.append("circle")
            .attr("class", className)
            .attr("cx", function(d) { return _this.accessors.x(d) })
            .attr("cy", function(d) { return _this.accessors.y(d) })
            .attr("r", radius)
            .attr("fill", "none")
            .attr("stroke", color ? color : this.accessors.color)
            .attr("opacity", opacity);
        return this;
    },
    label: function (className, y, color, textValue) {
        var _this = this;
        this.append("text")
            .attr("class", className)
            .attr("x", function(d) { return _this.accessors.x(d) })
            .attr("y", function(d) { return _this.accessors.y(d) + y })
            .attr("text-anchor", "middle")
            .attr("fill", color ? color : this.accessors.color)
            .text(textValue);
        return this;
    },
    describeArc: function(className, radius, startAngle, endAngle, color) {
        var _this = this;
        this.attr("d", function(d) { return describeArc(
            radius, _this.accessors.x(d), _this.accessors.y(d),
            isNaN(startAngle) ? startAngle.apply(this, arguments) : startAngle,
            isNaN(endAngle) ? endAngle.apply(this, arguments) : endAngle)
        });
        return this;
    },
    arc: function(className, radius, startAngle, endAngle, color) {
        var _this = this;
        this.append("path")
            .attr("class",className)
            .attr("fill","none")
            .attr("stroke", color ? color : this.accessors.color)
            .attr("d", function(d) { return describeArc(
                radius, _this.accessors.x(d), _this.accessors.y(d),
                isNaN(startAngle) ? startAngle.apply(this, arguments) : startAngle,
                isNaN(endAngle) ? endAngle.apply(this, arguments) : endAngle)
            });
        return this;
    }
};

MicroRing.prototype.extend = function(ctrl) {
    for(var h in micro_ring_helpers)
        ctrl[h] = micro_ring_helpers[h].bind(ctrl);
    ctrl.accessors = this.accessors;
    return ctrl;
};

document.addEventListener("DOMContentLoaded", function(e) {
    d3.selectAll("div.micro-ring")
        .each( function() { if(this.id) return window[this.id] = new MicroRing(this); });
});
