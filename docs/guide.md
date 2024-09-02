


When you eat [3 cookies]{cookies: 2..100}, you consume <strong>[150. calories]{calories}</strong>. That’s [7.%]{dailypct} of your recommended daily calories.

    let kcal_per_cookie = 50;
    let daily_calories = 2100;
    calories = cookies * kcal_per_cookie;
    dailypct = calories / daily_calories;

Adapted from the [Tangle guide](https://worrydream.com/Tangle/guide.html).


- - -


Code blocks are concatenated together and run as a single function.

Variables defined in the document are provided to the code scope and can be referenced
Any changes to the variables are returned back to the document and the active elements updated.




Function definitions in code blocks to be used by charts must be assigned to the already-declared variable the chart is expecting.



### Forms

Regular HTML forms can be used for interactivity, such as `<select>` for a choice from a set:

My favorite pizza topping is [vegetarian]{pizza_type}

<select name="topping">
  <option value="cheese" default>cheese</option>
  <option value="pepperoni">pepperoni</option>
  <option value="green peppers">green peppers</option>
</select>

    switch (topping) {
      case "pepperoni":
        pizza_type = "meat";
        break;
      case "cheese":
        pizza_type = "vegetarian";
        break;
      case "green peppers":
        pizza_type = "vegan";
        break;
    }


Since the HTML is passed through, the document can take advantage of native enrichments like date pickers to pick a date in the [past]{relative}.

<input name="start" type="date" value="2024-08-30">

    if (Date.parse(start) <= Date.now()) {
      relative = 'past';
    } else {
      relative = 'future';
    }
