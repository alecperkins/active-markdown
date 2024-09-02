---
title: Active Markdown examples
---

# Active Markdown examples

This is a series of examples authored using Active Markdown. They demonstrate: the various elements available; how they can be connected with logic using code blocks; how the elements, logic, and datasets can drive charts.


- - -


## Cookies

When you eat [3 cookies]{cookies: 2..100}, you consume <strong>[150. calories]{calories}</strong>. That’s [7.%]{dailypct} of your recommended daily calories.

    let kcal_per_cookie = 50;
    let daily_calories = 2_100;
    calories = cookies * kcal_per_cookie;
    dailypct = calories / daily_calories;

(This example is adapted from the [Tangle guide](https://worrydream.com/Tangle/guide.html), providing a comparison between the two. It shows simple interactivity with a range element, assumptions and logic in the code block, and formatting in the string element. The `<strong>` is currently necessary because the parser has a bug where it fails to wrap active markdown elements in markdown formatting.)


- - -


## St Ives

An [old riddle](https://en.wikipedia.org/wiki/As_I_was_going_to_St_Ives).

> As [I]{solo: I or we} [was]{verb} going to **St Ives**,
> I met a man with [7 wives]{wives: 1..10},
> Every wife had [7 sacks]{sacks: 1..10},
> Every sack had [7 cats]{cats: 1..10},
> Every cat had [7 kits]{kits: 1..10}:
> Kits, cats, sacks, wives,
> How many were going to St Ives?

A _reasonable_ guess is [2752]{first_guess}, a sum of the beings the narrator met:

    const man   = 1;
    total_sacks = wives * sacks;
    total_cats  = total_sacks * cats;
    total_kits  = total_cats * kits;

    first_guess = man + wives + total_cats + total_kits;

And another guess might follow the second to last line more literally and sum [2401 kits]{total_kits}, [343 cats]{total_cats}, [49 sacks]{total_sacks}, and [7 wives]{wives} for an answer of [2800]{second_guess}:

    second_guess = total_kits + total_cats + total_sacks + wives;

…but the correct answer is [1]{answer}.

    if (solo) {
      travelers = 1;
      verb = 'was';
    } else {
      travelers = 2;
      verb = 'were';
    }

    answer = travelers;

(This example shows switch, range, and string elements combined with logic in code blocks, plus regular markdown formatting.)


- - -



## Opposite over hypotenuse

The classic [sine]{sine: sine or cosine} wave is derived from right triangles. The [sine]{trig} of an angle is the ratio of the side of the triangle [opposite]{side} the angle to the hypotenuse of the triangle.

<!-- [![Graphic showing a triangle in a unit circle and the relationship between sine and cosine](https://upload.wikimedia.org/wikipedia/commons/7/72/Sinus_und_Kosinus_am_Einheitskreis_1.svg)](https://commons.wikimedia.org/wiki/File:Sinus_und_Kosinus_am_Einheitskreis_1.svg) -->

<svg viewBox="0 0 10 10" style="max-width: 300px; margin: 0 auto; display: block">
    <path stroke="orange" d="M 3 7 A 4 4, 0, 0, 1, 4 9" fill="none" stroke-linecap="round" stroke-width="0.5" />
    <line id="hypotenuse" x1="1" y1="9" x2="9" y2="1" stroke="black" stroke-linecap="round" stroke-width="0.5" />
    <line id="opposite" x1="9" y1="1" x2="9" y2="9" stroke="black" stroke-linecap="round" stroke-width="0.5" />
    <line id="adjacent" x1="1" y1="9" x2="9" y2="9" stroke="black" stroke-linecap="round" stroke-width="0.5" />
</svg>

Plotting that ratio for a range of angles produces an undulating [sine]{trig} wave graph:

![trig of x]{line=trigResult: 0..2pi by 0.025pi}

By including parameters around the [sine]{trig} function in different ways, we can manipulate the resulting wave:

    const trigFunction = sine ? Math.sin : Math.cos;
    trigResult = function (rad) {
      return amplitude * trigFunction(frequency * rad + x_offset) + y_offset;
    }

| operation | to           | affects                                           |
|-----------|--------------|---------------------------------------------------|
| multiply  | trig result  | [amplitude: 1.00]{amplitude: 0.1..10 by 0.1}      |
| multiply  | the angle    | [frequency: 1.00]{frequency: 0..10 by 0.25}       |
| add       | the angle    | [x offset: 0.00]{x_offset: -4pi..4pi by 0.0625pi} |
| add       | trig result  | [y offset: 0.00]{y_offset: -10..10 by 1}          |


The [sine]{trig} function’s companion is the [cosine]{other} function.

    const opposite_el = document.getElementById('opposite');
    const adjacent_el = document.getElementById('adjacent');
    if (sine) {
      trig = 'sine';
      side = 'opposite';
      other = 'cosine';
      opposite_el.style.stroke = 'green';
      adjacent_el.style.stroke = 'black';
    } else {
      trig = 'cosine';
      side = 'adjacent';
      other = 'sine';
      opposite_el.style.stroke = 'black';
      adjacent_el.style.stroke = 'red';
    }

(This example shows: a chart embed; a table; how string elements can repeat the same variable; and manipulation of inline markup from a code block.)


- - -


## Crop yields


<select name="country">
    <option value="Canada">Canada</option>
    <option value="Mexico" selected>Mexico</option>
    <option value="United States">United States</option>
</select>

<select name="crops" multiple>
    <option value="apples" selected>apples</option>
    <option value="bananas" selected>bananas</option>
    <option value="coffee">coffee</option>
    <option value="oats">oats</option>
    <option value="potatoes">potatoes</option>
    <option value="sugarcane">sugarcane</option>
    <option value="tomatoes">tomatoes</option>
    <option value="wheat">wheat</option>
</select>

![apples,bananas,coffee,oats,potatoes,sugarcane,tomatoes,wheat by year]{bar=selectCrop: 2000..2022}

    const country_records_by_year = {}
    yields.forEach(row => {
        if (row.country === country) {
            country_records_by_year[row.year] = row;
        }
    });
    selectCrop = (year) => {
        const point = { year: year.toString() };
        const record = country_records_by_year[year.toString()];
        crops.forEach(crop => {
            point[crop] = record[crop];
        })
        return point;
    }


```csv=yields
country,year,apples,bananas,coffee,oats,potatoes,sugarcane,tomatoes,wheat
Canada,2000,21.8419,,,2.6076999,11.6314,,51.890697,2.4445999
Canada,2001,21.6806,,,2.1727,10.2703,,52.6036,1.9452
Canada,2002,17.492699,,,2.1109,11.165199,,65.0225,1.8324
Canada,2003,19.431,,,2.3867,11.8424,,66.9062,2.2565
Canada,2004,19.3487,,,2.809,12.363,,74.688896,2.6409
Canada,2005,21.1301,,,2.5822,11.5053,,75.945,2.7380998
Canada,2006,20.2796,,,2.5066,13.0482,,73.8611,2.6095998
Canada,2007,24.3757,,,2.5897,12.649799,,75.0129,2.3316998
Canada,2008,23.97,,,2.9499,12.6065,,75.1541,2.8574998
Canada,2009,25.3975,,,2.9696999,12.745299,,76.4611,2.7897
Canada,2010,22.8393,,,2.7491,39.0809,,74.3847,2.8084998
Canada,2011,25.4084,,,2.9136999,36.6462,,68.0415,2.9568
Canada,2012,17.7194,,,2.8161,38.6092,,84.6532,2.8743
Canada,2013,26.636799,,,3.4803998,41.0606,,83.2355,3.5979998
Canada,2014,25.8183,,,3.1715,41.3836,,66.9768,3.0818
Canada,2015,22.1458,,,3.2684,42.7087,,66.698296,2.8925
Canada,2016,26.3333,,,3.4947,38.7791,,72.8319,3.5805
Canada,2017,25.7547,,,3.5488,39.378,,78.2447,3.3815
Canada,2018,25.6022,,,3.4192,38.9128,,80.361595,3.2742
Canada,2019,24.9704,,,3.6223998,38.775497,,82.511894,3.3834
Canada,2020,25.5739,,,3.4815,36.747997,,82.896194,3.5374
Canada,2021,22.6919,,,2.3883998,41.3325,,82.5077,2.4375
Canada,2022,24.751,,,3.7278998,41.9235,,85.936295,3.4055998
Mexico,2000,6.1765,25.8968,0.4822,1.4108,23.942,71.3267,21.403,4.9354997
Mexico,2001,7.2573,28.542398,0.40539998,1.2791,23.7799,75.7528,22.560099,4.7661
Mexico,2002,7.8771,29.354399,0.43199998,1.5033,23.7558,72.1832,22.4196,5.0999
Mexico,2003,9.0746,28.256498,0.41849998,2.0251,25.4312,73.6874,23.8099,4.4912
Mexico,2004,9.694699,29.9889,0.41079998,1.5374999,24.239899,74.6455,24.3158,4.4871
Mexico,2005,9.807899,29.2316,0.38619998,1.6610999,25.9662,77.1081,23.5938,4.7517
Mexico,2006,10.4179,29.542799,0.3663,2.0007,24.861,74.5303,22.9079,5.2274
Mexico,2007,9.0077,25.9685,0.3479,1.7243999,27.0565,75.443596,26.9893,5.0824
Mexico,2008,9.2607,27.6791,0.3396,1.4688,27.7258,73.8902,28.300798,5.0134
Mexico,2009,9.852099,29.446798,0.3454,1.8120999,27.7374,69.6506,27.1617,4.9688
Mexico,2010,10.125299,27.342299,0.3308,1.6646999,27.7578,71.627396,30.529299,5.4185
Mexico,2011,11.0921,28.790699,0.3445,0.97919995,26.2734,69.6744,28.5325,5.4778
Mexico,2012,6.4164,30.3491,0.354,1.7935,26.8098,69.303,35.5254,5.6568
Mexico,2013,14.503799,28.960299,0.3308,1.8448,26.7752,78.1579,37.6594,5.2934
Mexico,2014,12.9289,28.8331,0.30699998,1.7687,27.3384,74.39,37.143497,5.1935
Mexico,2015,13.6124,29.168999,0.28419998,1.7943,27.1435,73.0233,41.116898,4.5256
Mexico,2016,13.215699,30.448399,0.235,1.8535999,27.925999,72.27,43.3429,5.3388
Mexico,2017,13.3189,28.865599,0.2408,1.6645,28.950499,73.7756,45.6275,5.2967
Mexico,2018,12.592299,29.980799,0.2514,1.9897,29.892,72.326195,50.4785,5.4372997
Mexico,2019,14.3726,30.147,0.2633,2.0719,30.5241,74.5418,48.590298,5.5308
Mexico,2020,12.5948,30.9,0.276,2.2489,31.943499,69.4771,48.7171,5.3212
Mexico,2021,11.307,30.2006,0.2716,2.0527,31.7781,68.2644,45.946598,5.9944
Mexico,2022,14.8803,30.6342,0.2809,2.1376,31.2232,68.3484,46.3956,6.0933
United States,2000,27.348299,22.2572,1.4353,2.3011,42.7161,86.4468,74.9056,2.8237998
United States,2001,25.804499,21.063,1.4235,2.2072,40.180298,83.1538,66.7475,2.7017999
United States,2002,24.1996,16.8587,1.4225999,2.0217,40.5669,85.8602,75.418495,2.3567
United States,2003,25.321499,18.7747,1.5732,2.3327,41.0985,84.313194,68.2474,2.9712
United States,2004,30.5621,18.5926,1.0821999,2.3221,43.815197,76.4143,80.564995,2.9025998
United States,2005,29.3587,23.879099,1.5063,2.2598,43.730297,71.3137,72.5485,2.8230999
United States,2006,30.5857,19.036999,1.2983999,2.1447,44.0949,81.378494,72.182495,2.5986
United States,2007,29.034399,22.076,1.3126999,2.1566,44.433598,77.9588,83.1205,2.7045999
United States,2008,30.9247,17.730299,1.5489999,2.2842,44.437298,71.286896,84.6034,3.0175
United States,2009,31.483,18.853899,1.5489999,2.4369,46.4446,78.0623,87.7269,2.9896998
United States,2010,30.908699,18.143799,1.5647,2.3172,44.943798,69.895096,88.5396,3.1167
United States,2011,31.9842,19.4889,1.3518,2.0547,44.6923,75.076195,92.4535,2.9422
United States,2012,30.9933,18.1845,1.2859,2.1943998,45.7762,80.056496,94.8245,3.1153998
United States,2013,36.2135,18.192299,0.9569,2.2977998,46.3577,75.7099,90.732796,3.1673
United States,2014,41.6171,18.7701,0.9068,2.4338,47.1507,78.5279,97.1661,2.9378
United States,2015,34.7767,16.1994,0.8566,2.5168,46.899998,81.153496,89.461494,2.9299
United States,2016,39.1856,11.5204,0.6926,2.3676999,48.6408,79.7242,91.1398,3.5407999
United States,2017,39.456898,7.9473996,0.756,2.212,48.3887,82.4123,88.647995,3.1174998
United States,2018,39.4965,11.732699,0.86759996,2.3274,49.727398,86.0642,96.8227,3.2005
United States,2019,42.1498,10.2477,0.83089995,2.307,50.752197,78.397995,98.0384,3.4745998
United States,2020,38.971798,9.8925,0.7122,2.3351998,51.636497,85.4005,99.05019,3.3416998
United States,2021,38.5484,10.6138,0.779,2.1980999,49.7352,78.712,95.8863,2.9805
United States,2022,37.9376,10.248,0.8472,2.3235,49.0891,83.705795,95.541794,3.1273
```

Data sampled from the dataset by: Hannah Ritchie, Pablo Rosado and Max Roser (2022) - “Crop Yields”, https://ourworldindata.org/crop-yields.


(This example shows use of a native select element, a chart, and a dataset, all connected together through a code block.)


- - -


## Air quality readings

Air quality is a big concern as of late. A major contribution to poor air quality is particulate matter. Different particle sizes have different health impacts. Sensors can detect particles of different sizes.

![p1_0_um,p2_5_um,p10_0_um by date]{scatter=particulates: ..}

The readings are provided in particle counts per deciliter of air for a given particle size category, measured in micrometers, or μm.

The 2.5μm reading is important because particles at this size threshold are especially difficult to filter, artificially and by human respiratory systems. These particles can get deep into lungs or cross the blood–brain barrier, and are typically the most harmful. Air filters are rated by how well they filter this category.

Note that these sensors are measuring particles at a given size _or smaller_. This means the 10μm reading includes the 2.5μm and 1.0μm counts as well.

<!-- TODO: Show readings from <input type="date" name="startdate"> to <input type="date" name="enddate"> -->

```json=particulates
[{"date":"2024-08-01","p1_0_um":43.8,"p2_5_um":0.79,"p10_0_um":0.18},
{"date":"2024-08-02","p1_0_um":128.93,"p2_5_um":12.07,"p10_0_um":4.76},
{"date":"2024-08-03","p1_0_um":42.7,"p2_5_um":13.68,"p10_0_um":5.47},
{"date":"2024-08-04","p1_0_um":13.9,"p2_5_um":2.24,"p10_0_um":0.37},
{"date":"2024-08-05","p1_0_um":17.93,"p2_5_um":6.18,"p10_0_um":1.02},
{"date":"2024-08-06","p1_0_um":91.2,"p2_5_um":14.23,"p10_0_um":7.3},
{"date":"2024-08-07","p1_0_um":49.05,"p2_5_um":9.75,"p10_0_um":1.64},
{"date":"2024-08-08","p1_0_um":19.32,"p2_5_um":1.63,"p10_0_um":0.44},
{"date":"2024-08-09","p1_0_um":36.96,"p2_5_um":2.64,"p10_0_um":0.89},
{"date":"2024-08-10","p1_0_um":41.49,"p2_5_um":7.29,"p10_0_um":1.59},
{"date":"2024-08-11","p1_0_um":47.33,"p2_5_um":6.95,"p10_0_um":1.26},
{"date":"2024-08-12","p1_0_um":30.93,"p2_5_um":1.69,"p10_0_um":0.76},
{"date":"2024-08-13","p1_0_um":15.86,"p2_5_um":1.97,"p10_0_um":0.37},
{"date":"2024-08-14","p1_0_um":32.86,"p2_5_um":0.21,"p10_0_um":0},
{"date":"2024-08-15","p1_0_um":143.12,"p2_5_um":15.02,"p10_0_um":5.12},
{"date":"2024-08-16","p1_0_um":113.05,"p2_5_um":10.82,"p10_0_um":5.18},
{"date":"2024-08-17","p1_0_um":237.41,"p2_5_um":28.72,"p10_0_um":13.66},
{"date":"2024-08-18","p1_0_um":171.52,"p2_5_um":13.25,"p10_0_um":5.43},
{"date":"2024-08-19","p1_0_um":21.02,"p2_5_um":4.2,"p10_0_um":0.98},
{"date":"2024-08-20","p1_0_um":7.83,"p2_5_um":0.81,"p10_0_um":0},
{"date":"2024-08-21","p1_0_um":7.04,"p2_5_um":2.11,"p10_0_um":0.86},
{"date":"2024-08-22","p1_0_um":19.29,"p2_5_um":4,"p10_0_um":0.46},
{"date":"2024-08-23","p1_0_um":47.35,"p2_5_um":3.87,"p10_0_um":0.47},
{"date":"2024-08-24","p1_0_um":57.76,"p2_5_um":10.83,"p10_0_um":2.34},
{"date":"2024-08-25","p1_0_um":98.42,"p2_5_um":13.37,"p10_0_um":8.28},
{"date":"2024-08-26","p1_0_um":99.53,"p2_5_um":11.52,"p10_0_um":5.17},
{"date":"2024-08-27","p1_0_um":93.81,"p2_5_um":9.4,"p10_0_um":3.12},
{"date":"2024-08-28","p1_0_um":76.58,"p2_5_um":7.59,"p10_0_um":1.86},
{"date":"2024-08-29","p1_0_um":53.47,"p2_5_um":4.41,"p10_0_um":1.07},
{"date":"2024-08-30","p1_0_um":23.48,"p2_5_um":3.41,"p10_0_um":1.28},
{"date":"2024-08-31","p1_0_um":12.4,"p2_5_um":3.5,"p10_0_um":0.67}]
```

(This example shows a scatter-type chart with multiple series, being driven directly from a JSON dataset, using the text content of the chart element definition to specify the axes. Note the x-axis labels are messy. The ChartEmbed currently does not automatically adjust the labeling well, so it’s best to stick to short labels.)

