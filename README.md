# Micro-Ring

*Implements a small ring guage for indicating a single KPI metric.*

See also the Micro-Ring Guage for [React](https://github.com/guru-florida/micro-ring-react).

Beyond just a simple ring guage, have you ever needed to show the significance of a small number
and yet need to also support large ones? Using a standard ring or pie chart small numbers,
such as 1 out of 100, get lost in the pixels. This ring gauge solves this problem by
switching between three modes to indicate small, medium and large values.

Lets consider an alarm indicator that you typically want to show values between 0 and 100, but
it is possible that a flood of 1000 events could occur:
* Small values - Values between 1 and 10 show as discrete blocks. User immediately knows we are
in the 1-10 range because the arc line appears segmented. First block starts at about 7 oclock
and goes clockwise.
* Medium values - Values in the 11-100 range show as a continuous arc between 10% and 100% of 
the 360 radius. Arc starts at 12 oclock and goes clockwise.
* Large values - Segmented arcs appear around the normal arc to indicate laps of the 0-100 range.
If 500 events occured, then the outer indicator ring would contain 5 arc segments.

You can configure each of the small and medium limits, or disable modes. The control is implemented
using an SVG element.

## Styles

All styles such as size, line width, color, font, etc. can be applied using stylesheets. The included
micro-ring.css and kpi.css already have a number of class names for predefined styles.

* kpi-small, kpi-medium, kpi-large - sets the overal guage size to 64, 90, 140 pixels square respectively.
* kpi-dark, kpi-light - indicate what background the guage will be overlayed over for better legibility.
* kpi-thin - sets the arc line style to be thinner.

There are some other perhaps useful classes for laying out multiple rings on a page though not required.

* kpi-row - layout a row of ring guages using css flow layout. Also supports <label> tag to caption the row.
* kpi-panel - decorate an element to contain one or more rows of Ring KPIs. (combine with kpi-light or kpi-dark)
Supports H1 tag to caption the panel. 

## Including in Your Project

1. Copy the _src/kpi/micro-ring.js_ and optionally the _micro-ring.css_ and _kpi.css_ files into your project.
(NPM package on its way.)

2. Import the file(s):
```
import MicroKPI from './kpi/micro-ring';
import './kpi/micro-ring.css';
import './kpi/kpi.css';
```

3. Create one or more div tags to contain the Ring guage. Only requirement is that it has
an `id` and `class` attribute. You can also set options using attributes in the form `data-<option-name>`.

```
<div id="ring1"
    class="micro-ring">
</div>

<div id="ring2" 
    class="micro-ring" 
    title="outside" 
    data-color="CornflowerBlue" 
    data-limit="100" 
    data-decimals="1">
</div>
```

4. You can access the control in javascript using:
```
    window.ring1.value( v )
    
    // or update all options, using:
    window.ring1.data({ value: 33.2, color: 'blue' })
```


## License
The Ring guage is licensed under MIT, so fill your boots.
