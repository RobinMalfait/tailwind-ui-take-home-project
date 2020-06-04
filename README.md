## Hello!

Hey Adam and Steve. Thank you very much for this opportunity!

Before we start, just a small note. I could have implemented things similar to the way you implemented the ListBox
component on your stream the other day. While this is a nice and clean solution, I wanted to take it
a step further and did some experimenting. I believe that a good pair programming partner /
colleague is someone that can challenge you and whom you can experiment with and that likes to play
devil's advocate from time to time. I genuinely believe that this is a good and healthy way to reach
the best and cleanest solution there is. So therefore I challenged your implementation and took
things a little further in a more experimental way.

## Some explanations:

1. **I wrote a lot of comments in my code.** It's something I have been doing at my current job as
   well and seemed to have helped a bunch of colleagues. I can drop the comments or move it to
   actual documentation if you prefer that, but for now, it's in there! If you don't like them in
   the future just let me know.
2. **I've also been pretty verbose**, I tried to be explicit instead of implicit as much as
   possible.
3. I implemented a **little extra user experience wise feature** that shows you _negative_ prices if
   you selected an option that could be removed again. Implemented it similar to how the Apple
   website did it.
4. I must admit that I am not an accessibility expert, I only knew the basics.
   - I used the [WAI ARIA specification](https://www.w3.org/TR/wai-aria-1.1/#radiogroup) to implement certain a11y features, I hope that is ok.
   - I also used the [axe Google Chrome](https://chrome.google.com/webstore/detail/axe-web-accessibility-tes/lhdoppojpmngadmnindnejefpokejbdd) extension to verify all the accessibility violations.
5. There was this interesting problem with the focus states for all the options. They have a double
   border, but we can't just use that in code to go from `border` -> `border-2` because that would
   jump the content. We also want to "stack" the shadows in case of the focus state. Some solutions
   that might seem obvious but are not usable:

   1. If you want to mimic the effect of a `0px` border to a `1px` border, you could always have a
      `1px` border and make the border transparent. When you "select" the option you could change
      the color of the border. But this is not possible because we want to go from a `1px` border to
      a `2px` border, without jumping the content.
   2. Stacking 2 elements, where the outer element has a border and the inner element has a
      transparent border by default. When the option gets selected we could change the border color
      of the inner element to get the double border effect without jumping the content. However this
      is not possible because of the border radius. The border radius will leave tiny gaps. These
      gaps look horrible.
   3. Using a `shadow-solid` is a good fix, but this leaves less room for the `shadow-outline-gray`
      when we are in the "focused" state.
   4. Another solution would be to use a single `border` by default, and when the option gets
      selected we could use a `border-2 -m-px`, while this works, this makes the outer shadow
      smaller when the item is focused & selected.
   5. My final solution, and the solution I used was to go from `border p-px` to `border-2 p-0`.
      This way the content itself never jumps because there is this little tiny padding that is
      accounting for that!

      > I am really interested in how you solved this!

## Some observations:

1. Oh you sneaky! The border on the "options" are **gray-300** by default and on the "images" they
   are **gray-200**. You almost got me there!
2. Another (probably very intentional) sneaky thing I saw was that the 1280+ design was set to a
   width of 1440 instead of 1280. This got me confused for a second when looking at certain widths
   of elements.
3. According to the figma file there is an additional `drop shadow` on the outer
   `shadow-outline-gray` "element", while I saw this, I think this is just a continuation of the
   `shadow-md` on the "main" element.
4. I saw that the total price was set to a value that could never be reached. I assumed that this
   was just to display some data, and not an actual "correct" implementation. Therefore I didn't ask about this on Twitter.
5. I saw that on smaller screens there was an additional price attached to a `None` value. I also
   assumed that this was just some copy / paste issue and not a thing to keep in mind.
6. I saw a very tiny "issue" but I was almost too scared to ask. However in the `lg` and `xl`
   screens the learn more link has `Need a financing?` and on smaller screens the `a` is dropped,
   just `Need financing?`. I used `Need financing?` everywhere to be consistent but I did see the
   little difference 👀.
7. I saw that the options for "Form Factor" in the designs were next to each other but in the
   provided screenshot they were below each other. I verified this with you (Adam) on Twitter, but
   wanted to put it in here again as well.

---

I liked this assignment! I hope you like my solution as well!

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```
