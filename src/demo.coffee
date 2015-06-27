module.exports = """
# kukac.
> As []{travelers: we or I} []{verb} going to []{random}
> Every wife had [7 sacks]{sacks: 1..10 by 1}

> [-]{init}

    if @init isnt ''
        @random = Math.random()
        @init = ''

    if @travelers
        narrator = 2
        @verb = 'were'
    else
        narrator = 1
        @verb = 'was'

"""