![Copylight logo](https://raw.github.com/hostilefork/copylight/master/copylight-logo.png)

CopyLight is an **experimental** jQuery plugin that allows websites to emphasize the licensing terms of their content, if a user has selected a substantial amount of it on a page.  *(What constitutes a "substantial" selection is customizable, but defaults to 256 characters.)*  The license terms are emphasized without making text selections brittle or unreliable...nor is attribution injected to the clipboard without the user's consent *(as is done by systems like "Tynt")*.

When a large enough selection happens to trigger the plugin, a color-coded "stoplight button" appears.  This button is placed as near as possible to the point of selection to make it easy to click and to see what it is attached to.  Pushing the button brings up a dialog which provides a reminder of the site's license terms, and also gives a convenient URL to share with an easy one-click copy.  Yet the final decision is left to the user; and browser functionality for copying is not interfered with.

Although CopyLight can be used to draw a page visitor's attention to a "red light" licensing *restriction*, it can also emphasize "green light" or "yellow light" *freedoms* governing content that uses [Creative Commons](http://http://creativecommons.org/) licenses.

See [copylight.hostilefork.com](http://copylight.hostilefork.com) for additional information about this project and the motivations for creating it.


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


# License

Copylight is released under the MIT License.

