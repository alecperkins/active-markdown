# A Live Markdown Document

## Ornare Dolor

Lorem ipsum dolor sit amet, [consectetur](http://example.com) adipiscing elit. Donec id elit non mi
porta gravida at eget metus. Nulla vitae elit libero, a pharetra augue. Aenean
lacinia bibendum nulla sed *consectetur*. Curabitur blandit tempus porttitor.
Nullam quis risus eget urna mollis ornare vel eu leo.

    if @users_choice is 'on'
        result = @some_number * 5
    else
        result = @some_number * 50
    @other_number = result
    console.log result, @other_number, this


Curabitur blandit <span class="live-text"  data-name="users_choice" data-config='["on", "or", "off"]'>on</span> porttitor. Integer posuere erat a ante venenatis
dapibus posuere velit aliquet. Nullam <span class="live-text"  data-name="some_number" data-config='["[0..10]"]'>5</span> risus eget urna
mollis ornare vel eu <span class="live-text"  data-name="some_number" data-config='[]'>5</span>.

Morbi leo risus, porta ac <span class="live-text"  data-name="other_number" data-config='[]'>5</span> ac, vestibulum
at eros.
