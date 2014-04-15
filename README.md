![Copylight logo](https://raw.github.com/hostilefork/copylight/master/copylight-logo.png)

CopyLight is a jQuery plugin that allows websites to emphasize the licensing terms of their content, if a user has selected a substantial amount of it on a page.  *(What constitutes a "substantial" selection is customizable, but defaults to 256 characters.)*  The license terms are emphasized without making text selections brittle or unreliable...nor is attribution injected to the clipboard without the user's consent *(like <a href="http://www.tynt.com/">"Tynt"</a>)*.

When a large enough selection happens to trigger the plugin, a color-coded "stoplight button" appears.  This button is placed as near as possible to the point of selection to make it easy to click.  Pushing the button brings up a dialog which provides a reminder of the site's license terms, and also gives a convenient URL to share with an easy one-click copy.  Yet the final decision is left to the user; and browser functionality for copying is not interfered with.</p>

Although CopyLight can be used to draw a page visitor's attention to a "red light" licensing *restriction*, it can also emphasize "green light" or "yellow light" *freedoms* governing content that uses [Creative Commons](http://http://creativecommons.org/) licenses.

See [copylight.hostilefork.com](http://copylight.hostilefork.com) for additional information about this project.


# Motivation

The plugin was created to address a problem on the web, which are sites that disable the text selection feature of your browser.  This means if you want to quote even just a word or sentence you are reading, you must either retype it or send a link to the entire page.  Sites do this because if they let you copy a relevant portion to send to a friend or quote on a blog, that audience won't be forced to visit the site you copied from.

At one point this was limited to sites known for pop-ups, malware, and other bad practices *(such as those offering song lyrics, which they did not author or type in)*.  But the phenomenon has spread to otherwise reputable sites that actually create their own content, such as Snopes.  They feel justified as copyright owners that the only way to enforce their license is to break your browser as collateral damage.  In an e-mail confrontation with me, Snopes in particular argued that allowing people to take the information out of context interfered with their mission of stopping rumors.

Yet as one of the technologists who builds infrastructure like what organizations like Snopes used to find an audience in the first place, I take this kind of abuse of software personally.  The extension mechanisms that allow for hooks into the browser *were not put there so they could hinder the user experience*.  And this line of thinking is what the Electronic Frontier Foundation very rightfully calls ["Defective By Design"](https://defectivebydesign.org/).

For those not tech-savvy enough to find a workaround, this is a matter of **deliberately crippling the web browser**.  It also tramples on the [doctrine of Fair Use](http://en.wikipedia.org/wiki/Fair_use).  CopyLight was a reaction to show that there are reasonable alternatives, and to demonstrate one such idea.


# Using CopyLight on Your Page

CopyLight is a jQuery plugin, and follows the conventions for such plugins.  This means you can use selectors and call the `.copylight()` method with options to activate the behavior on the selected elements:

    $(selector).copylight({...options...});

Yet there's an easier way to use CopyLight on a page.  Just include its JavaScript and CSS files in your page's header, and mark document elements with a `class` attribute for the license that applies to the elements underneath them.  For instance:

	<div class="cc-by-sa">Text licensed Creative Commons Attribution-ShareAlike</div>

The supported class names are:

### Green Light (no restrictions)

* `cc-zero` - [Creative Commons Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/)

### Yellow Light (some restrictions)

* `cc-by` - [Creative Commons Attribution](http://creativecommons.org/licenses/by/4.0/)

* `cc-by-nc` - [Creative Commons Attribution-NonCommercial](http://creativecommons.org/licenses/by-nc/4.0/)

* `cc-by-nd` - [Creative Commons Attribution-NoDerivatives](http://creativecommons.org/licenses/by-nd/4.0/)

* `cc-by-sa` - [Creative Commons Attribution-ShareAlike](http://creativecommons.org/licenses/by-sa/4.0/)

* `cc-by-nc-nd` - [Creative Commons Attribution-NonCommercial-NoDerivatives](http://creativecommons.org/licenses/by-nc-nd/4.0/)

* `cc-by-nc-sa` - [Creative Commons Attribution-NonCommercial-ShareAlike](http://creativecommons.org/licenses/by-nc-sa/4.0/)

### Red Light (all rights reserved)

* `all-rights-reserved` - [All Rights Reserved](http://en.wikipedia.org/wiki/All_rights_reserved)

