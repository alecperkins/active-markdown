
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
