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
        discreteLimit: 10,
        lapsLimit: 100,
        padding: 0.15,
        decimals: 0,
        unit: null
    });

    // these accessor functions simply extract a field from the data object or default value
    this.accessors = {
        color: function (d) { return d.color ? d.color : _this.defaults.color },
        title: function (d) { return d.title ? d.title : _this.defaults.title },
        value: function (d) { return d.value; },
        laps:  function (d) { return Math.floor(d.value / this.limit(d)); },
        limit: function (d) { return d.limit ? d.limit : _this.defaults.limit },
        discreteLimit: function(d) { return d.discreteLimit ? d.discreteLimit : _this.defaults.discreteLimit },
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

    // create the root SVG element
    this.svg = this.extend(
        d3.select(this.container).append("svg")
            .attr("class", this.classes.join(' '))
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 120 120")
    );
}

MicroRing.prototype.redraw = function(data) {
    var _this = this;
    if(!data) return;

    /* D3 is very different than your typical functional style of programming. In D3, given data tuple {value, limit,
       title, etc}, we describe how to construct a new one, update an existing one, or delete one. Each of these
       operations is described using a chain of operations. With these chains, D3 can then manage any number of data
       tuples by computing the intersection of previous state to new. For now MicroRing only creates 1 object, but we
       could easily enhance it to create any number of Rings within a single SVG with automatic or plotted positions.

       The following code is typical of D3 code but very radical if you are new to D3. Read about D3 data joins for
       more info on how D3 works.
     */

    // First select any existing Rings and map to items in the data array (Only 1 for now)
    this.rings = this.extend( this.svg
        .selectAll("g.ring")
        .data( data , function(d) { return d.id; }) );

    // for deletion of Rings that no longer exist, just remove...no transitions for now
    this.rings
        .exit()
        .remove();

    // for creation of new Rings,
    // fully describe all arcs, groups, circles and text
    var enter = this.extend(this.rings.enter()
        .append("g")
        .attr("class", "ring")
        .attr("id", function(d) { return d.id }))
        .circle("radial-track", 45, null, 0.1)
        .label("value", -3, "black", this.accessors.toString)
        .label("title", 15, null,  this.accessors.title);

    // for update existing Ring
    //    * update value text
    this.rings
        .select("text.value")
        .text(this.accessors.toString);

    // for update existing Ring value segments  in either continuous or segmented mode
    // we have to use a for-each to apply an inner D3 Join on the segments. For continuous there would be only 1 segment
    // but for discrete mode there could be any number of segments up to discreteLimit. Also, we update the laps
    // indicator too.
    this.rings
        .merge(enter)                                   // we want this chain to run on both enter and updates
        .each( function(d, i) {
            //
            // For each Ring we compute the value arc
            //
            let val = _this.accessors.value(d) % _this.accessors.limit(d);
            let laps = Math.min(_this.accessors.laps(d), _this.defaults.lapsLimit);
            let discrete = (laps===0) && (val <= _this.accessors.discreteLimit(d));

            // compute the radial range of the value arc
            let range = discrete
                ? [ -150, -150 + (Math.floor(val) / _this.accessors.discreteLimit(d)) * 300 ]
                : [ 0, (val / _this.accessors.limit(d)) * 359.9999 ]; // not 360 or arc will wrap to 0

            _this.d3Segments(this, "radial-segment", 45, discrete ? _this.defaults.padding : 0, range, discrete ? Math.floor(val) : 1);

            //
            // Also compute the arc segments for laps indicator
            //
            let ofs = -60 / laps;
            _this.d3Segments(this, "lap-segment", 57, (laps>1) ? _this.defaults.padding : 0, [ofs, ofs + 359.9999], laps );

        });
        //.describeArc("radial-segment radial-value", 45, 0, function(d) { return _this.accessors.arcValue(d) * 360; });
};

MicroRing.prototype.d3Segments = function(d3o, className, radius, padding, range, count) {

    // build an ordinal array of segments
    var segs = d3.range(0, count);

    var segments = d3.select(d3o)
        .selectAll("path."+className)
        .data( segs );

    // compute the bands for each segment
    var bands = d3.scaleBand()
        .domain(segs)                           // create N bands where N=d.value
        .range(range)                           // range in degrees
        .paddingInner(padding)                  // distance between segments
        .paddingOuter(padding/2);

    // now build the D3 chain to draw the segments
    var bw = bands.bandwidth();

    segments.exit().remove();

    this.extend( segments.enter() )
        .arc(className, radius,
            function(e,i) { return bands(e); },
            function(e,i) { return bands(e) + bw; }
        );
    this.extend( segments )
        .describeArc(className, radius,
            function(e,i) { return bands(e); },
            function(e,i) { return bands(e) + bw; }
        );
};


MicroRing.prototype.getDefaults = function() {
    var def = {};
    var data_attribs = "title,color,limit,discreteLimit,lapsLimit,padding,decimals,unit".split(',');
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

var micro_ring_helpers = {
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

MicroRing.create = function(selector) {
    let group = {};
    d3.select(selector).selectAll("div.micro-ring")
        .each( function() { if(this.id) return group[this.id] = new MicroRing(this); });
    return group;
}

window.MicroRing = MicroRing;

/*document.addEventListener("DOMContentLoaded", function(e) {
    d3.selectAll("div.micro-ring")
        .each( function() { if(this.id) return window[this.id] = new MicroRing(this); });
});*/
