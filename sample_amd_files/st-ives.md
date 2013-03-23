# St Ives

An old riddle.

> As [I]{travelers: I or we} [was]{verb} going to **St Ives**  
> I met a man with [7 wives]{wives: 1..10}  
> Every wife had [7 sacks]{sacks: 1..10}  
> Every sack had [7 cats]{cats: 1..10}  
> Every cat had [7 kits]{kits: 1..10}  
> Kits, cats, sacks, wives  

    total_sacks     = @wives * @sacks
    total_cats      = total_sacks * @cats
    total_kits      = total_cats * @kits
    narrator        = 1
    man             = 1
    @first_guess = man + @wives + total_cats + total_kits + narrator

> How many were going to St Ives?

    if @travelers is 'I'
        @answer = 1
        @verb = 'was'
    else
        @answer = 2
        @verb = 'were'

The first guess is often [2753]{first_guess}, but the answer is [1]{answer}

- - -

(This file is an example of [Active Markdown](https://github.com/alecperkins/active-markdown). See the [plaintext source](st-ives.amd).)