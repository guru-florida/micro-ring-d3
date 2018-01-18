import './kpi/micro-ring';
import './css/app.css';


// Our data model, containing just an array of KPIs that have a value and limit
// each of our sample KPIs will reference one of these values
let data = [{
    value: 3
}, {
    value: 8,
    discreteLimit: 10
}, {
    value: 35,
    decimals: 0
}, {
    value: 143,
    decimals: 0
}];

// to animate our rings, we'll just increment a counter and a sine wave and base
// our animation on expressions of these two counters.
let motion = {
    running: true,
    count: 0,
    sine: 0
};

function panel_update() {
    this.s1.dat(data[0]);
    this.s2.dat(data[1]);
    this.s3.dat(data[2]);
    this.s4.dat(data[3]);

    this.m1.dat(data[0]);
    this.m2.dat(data[1]);
    this.m3.dat(data[2]);
    this.m4.dat(data[3]);

    this.l1.dat(data[0]);
    this.l2.dat(data[1]);
    this.l3.dat(data[2]);
    this.l4.dat(data[3]);
};

function panel(id, className, caption) {
    // Get the panel1 and clone it
    var p = document.getElementById("panel1");
    var clone = p.cloneNode(true);
    clone.id = id;                            // set new panel ID
    clone.className = "kpi-panel "+className; // set new classes
    p.parentNode.appendChild(clone);          // append to same parent as panel1

    // Capture the Ring containers and instantiate MicroRing controls
    window[id] = window.MicroRing.create("#"+id);
    window[id].update = panel_update;

    // Set the title of his panel
    let h1 = document.getElementById(id).firstChild;
    while(h1 && h1.nodeName!=="H1")
        h1 = h1.nextSibling;
    h1.innerText = caption;

    return clone;
}

/*
 *   On DOM Ready, clone panel1 with new styles and instantiate the Ring controls
 */
document.addEventListener("DOMContentLoaded", function(e) {
    // create new panels by cloning panel1
    panel("panel2", "kpi-light", "Light");
    panel("panel3", "kpi-dark kpi-thin", "Thin");

    // instantiate controls and attach handler for first panel
    // must do this after cloning or extra SVGs will appear in clones
    window.panel1 = window.MicroRing.create("#panel1");
    window.panel1.update = panel_update;
});

/*
 * Every X millis, update the value of the controls
 */
setInterval( () => { if(motion.running) {
    // update base counters and sine wave
    motion.count++;
    motion.sine =  Math.round(Math.sin(motion.count / 10) * 50 + 50);

    // update values in our data
    data[0].value = motion.count % 100;
    data[1].value = (motion.count*0.78) % 100;
    data[2].value = 52 + (motion.sine*0.7231);
    data[3].value = (motion.count < 25) ? motion.count : (25+(motion.count-25)*6.14);

    // update each of the panels
    window.panel1.update();
    window.panel2.update();
    window.panel3.update();
}}, 200);