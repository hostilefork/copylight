/*
 * copylight.js
 * Visual reinforcement of licensing for large HTML selections
 * Copyright (c) 2011-2012 HostileFork.com
 *
 * MIT license:
 *	 http://www.opensource.org/licenses/mit-license.php
 *	 http://www.gnu.org/licenses/gpl.html
 *
 * For more information, see http://hostilefork.com/copylight
 */

/*jslint vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */
/*globals $, jQuery, window, document */
(function ($) {
	// http://stackoverflow.com/questions/1335851/
	// http://stackoverflow.com/questions/4462478/
	"use strict";

	var globals = {
		warningIconSpan: null,
		debugMode: false, // enable with $.copylight('debug')(true);
		numCopyLightElements: 0,
		markedElements : null,
		inMouseHandler: false,
		modalDialog: null,
		licenseInformation: {
			'cc-zero': {
				url: "http://creativecommons.org/publicdomain/zero/1.0/",
				color: "green"
			},
			'cc-by': {
				url: "http://creativecommons.org/licenses/by/3.0/",
				color: "green"
			},
			'cc-by-sa': {
				url: "http://creativecommons.org/licenses/by-sa/3.0/",
				color: "green"
			},
			'cc-by-nd': {
				url: "http://creativecommons.org/licenses/by-nd/3.0/",
				color: "yellow"
			},
			'cc-by-nc': {
				url: "http://creativecommons.org/licenses/by-nc/3.0/",
				color: "yellow"
			},
			'cc-by-nc-sa': {
				url: "http://creativecommons.org/licenses/by-nc-sa/3.0/",
				color: "yellow"
			},
			'cc-by-nc-nd': {
				url: "http://creativecommons.org/licenses/by-nc-nd/3.0/",
				color: "yellow"
			},
			'all-rights-reserved': {
				url: "http://en.wikipedia.org/wiki/All_rights_reserved",
				color: "red"
			}
		}
	};

	// Philosophically, I believe that invading the user's ability to copy
	// and paste text in any way is bad.  But what's even worse is if that
	// interfering code causes a page to crash.  All callbacks in CopyLight
	// are guarded with this exception handler so if they fail they will
	// do so quietly.
	function crashGuard(f) {
		// http://stackoverflow.com/questions/1959040/
		return function (/*...*/) {
			if (globals.debugMode) {
				// We want to know about crashes if we are debugging
				return f.apply(this, arguments);
			} else {
				try {
					return f.apply(this, arguments);
				} catch (e) {
					// Just sweep it under the rug.
					return $.noop();
				}
			}
		};
	}
			
	function getComputedStyles(el) {
	    var $el = $(el);
		var attributes = [
			'font-family','font-size','font-weight','font-style','color',
			'text-transform','text-decoration','letter-spacing','word-spacing',
			'line-height','text-align','vertical-align','direction','background-color',
			'background-image','background-repeat','background-position',
			'background-attachment','opacity','width','height','top','right','bottom',
			'left','margin-top','margin-right','margin-bottom','margin-left',
			'padding-top','padding-right','padding-bottom','padding-left',
			'border-top-width','border-right-width','border-bottom-width',
			'border-left-width','border-top-color','border-right-color',
			'border-bottom-color','border-left-color','border-top-style',
			'border-right-style','border-bottom-style','border-left-style','position',
			'display','visibility','z-index','overflow-x','overflow-y','white-space',
			'clip','float','clear','cursor','list-style-image','list-style-position',
			'list-style-type','marker-offset'
		];
		var computedStyles = {};
		$.each(attributes, function(i, attr){
			// used to use .css(attr) but that stopped working in later jQuery/Chrome
			// http://stackoverflow.com/questions/7623535/
			computedStyles[attr] = $el.prop(attr);
		});
		return computedStyles;
	}
	
	// This routine will climb up and return enough CSS style information for el that
	// you can apply it to "undo" the influence of a style change applied at a higher
	// node.
	function getCssToUndoBackgroundChange(el) {
		var $el = $(el);
		// REVIEW: computed style format probably different in different browsers.  How to test
		// for transparent in a cross browser way?  Make a sample transparent node, and then 
		// compute its style, and hope the browser is consistent?
		var parentComputedStyles = {'background-image': 'none', 'background-color': 'rgba(0, 0, 0, 0)'};
		var childComputedStyles = getComputedStyles($el);
		while ($el.length !== 0) {
			// look for any deltas.  if there's a delta, then this parent is the
			// node that influences us.
			if (parentComputedStyles['background-image'] != childComputedStyles['background-image']) {
				// to compensate, we steal the image for ourselves
				// we actually need to compute the shift amount, and sync this if the window resizes
				return {'background-image': parentComputedStyles['background-image']};
			}
			if (parentComputedStyles['background-color'] != childComputedStyles['background-color']) {
				return {'background-color': parentComputedStyles['background-color']};
			}
			
			childComputedStyles = parentComputedStyles;
			$el = $el.parent();
			if ($el.length !== 0) {
				parentComputedStyles = getComputedStyles(el);
			}
		}
		return {'background-color': 'white'};  // REVIEW
	}

	// http://stackoverflow.com/questions/205853/why-would-a-javascript-variable-start-with-a-dollar-sign
	function getNearestAncestorLicenseData($el) {
		var $current = $el;
		do {
			var data = $current.data('copylight');
			if (data) {
				return data;
			}
			$current = $current.parent();
		} while ($current.length);
		return null; // default, or error?	cc-zero?
	}
	
	function saveSelection(selectionObject) {
		// https://developer.mozilla.org/en/DOM/Selection/rangeCount
		// "A user can normally only select one range at a time, so the 
		//	rangeCount will usually be 1. Scripting can be use to make the selection
		//	contain more than 1 range."
		//
		// So if they have only one range selected, we make sure we preserve whether
		// the cursor is at the start or the end.  Otherwise we just focus on
		// getting the ranges right.  
		var ret = null;
		switch (selectionObject.rangeCount) {
			case 0:
				ret = {rangeCount: 0};
				break;

			case 1:
				// The range-level API seems to throw out the selection direction
				// information (e.g. if the user started from the left and dragged
				// to the right, or from the right and dragged to the left).  So
				// we manually generate single a single range which preserves
				// the direction info available in the selection interface
				ret = {
					rangeCount: 1,
					rangeDescriptors: [{
						startContainer: selectionObject.anchorNode,
						startOffset: selectionObject.anchorOffset,
						endContainer: selectionObject.focusNode,
						endOffset: selectionObject.focusOffset					
					}] 
				};
				break;

			default:
				ret = {
					rangeCount: selectionObject.rangeCount,
					rangeDescriptors: []
				};
				var index;
				for (index = 0; index < selectionObject.rangeCount; index++) {
					var range = selectionObject.getRangeAt(index); 
					ret.rangeDescriptors.push({
						startContainer: range.startContainer,
						startOffset: range.startOffset,
						endContainer: range.endContainer,
						endOffset: range.endOffset
					});
				}
		}
		
		ret.adjustForSplit = function(splitNode, splitOffset, newNode) {
			var affectsSelection = false;
			var index;
			for (index = 0; index < this.rangeCount; index++) {
				var rangeDescriptor = this.rangeDescriptors[index];
				
				if (rangeDescriptor.startContainer === splitNode) {
					affectsSelection = true;
					if (rangeDescriptor.startOffset > splitOffset) {
						rangeDescriptor.startContainer = newNode;
						rangeDescriptor.startOffset -= splitOffset;
					}
				}
				
				if (rangeDescriptor.endContainer === splitNode) {
					affectsSelection = true;
					if (rangeDescriptor.endOffset > splitOffset) {
						rangeDescriptor.endContainer = newNode;
						rangeDescriptor.endOffset -= splitOffset;
					}
				} 
			}
			return affectsSelection;
		};
		
		// Assumes that at end of join, leftNode will have rightNode's contents
		// and all rightNode's offsets will need to be increased by splitOffset
		// (e.g. the old length of leftNode's contents)
		ret.adjustForJoin = function(leftNode, joinOffset, rightNode) {
			var affectsSelection = false;
			var index;
			for (index = 0; index < this.rangeCount; index++) {
				var rangeDescriptor = this.rangeDescriptors[index];
				
				if (rangeDescriptor.startContainer === leftNode) {
					affectsSelection = true;
				} else if (rangeDescriptor.startContainer === rightNode) {
					affectsSelection = true;
					rangeDescriptor.startContainer = leftNode;
					rangeDescriptor.startOffset += joinOffset; 
				}
				
				if (rangeDescriptor.endContainer === leftNode) {
					affectsSelection = true;
				} else if (rangeDescriptor.endContainer === rightNode) {
					affectsSelection = true;
					rangeDescriptor.endContainer = leftNode;
					rangeDescriptor.endOffset += joinOffset;
				}
			}
			return affectsSelection;
		};
		
		ret.restore = function() {
			var selection = window.getSelection();
			selection.removeAllRanges();
		
			switch (this.rangeCount) {
				case 0:
					break;
				case 1:
					var rangeDescriptor = this.rangeDescriptors[0];
					
					var singleRange = document.createRange();
					singleRange.setStart(
						rangeDescriptor.startContainer,
						rangeDescriptor.startOffset);
					selection.addRange(singleRange);
					
					if ((rangeDescriptor.startContainer !== rangeDescriptor.endContainer) ||
							(rangeDescriptor.startOffset !== rangeDescriptor.endOffset)) {
						// avoids [Exception... "Component returned failure code: 0x80004005
						// (NS_ERROR_FAILURE) [nsISelection.extend]" nsresult: "0x80004005
						// (NS_ERROR_FAILURE)"
						selection.extend(rangeDescriptor.endContainer, rangeDescriptor.endOffset);
					}
					break;
				default:
					var index;
					for (index = 0; index < this.rangeCount; index++) {
						var range = document.createRange();
						range.setStart(
							this.rangeDescriptors[index].startContainer,
							this.rangeDescriptors[index].startOffset);
						range.setEnd(this.rangeDescriptors[index].endContainer,
							this.rangeDescriptors[index].endOffset);
						selection.addRange(range);
					}
			}
		};
		
		return ret;
	}

	function openCopyrightPolicyWindow(event) {
		// Callback function when user clicks on the warning button
		// Target page should make it easy to get this page's URL to the clipboard
		// Can make whatever appeal to respecting copyright you want
	
		// For some reason, just hiding and showing the warningIconSpan was causing it to move
		// around.	The seemingly-more-disruptive act of throwing in a placeholder does not.
		var emptyPlaceholderSpan = $('<span />');
		var saveData = saveSelection(window.getSelection());
		
		// If we use replaceWith() instead of insert/detach then there is an unbind() so that
		// any events on the warningIconSpan are removed...
		emptyPlaceholderSpan.insertAfter(globals.warningIconSpan);
		globals.warningIconSpan.detach();
		
		if (globals.modalDialog !== null) {
			throw "copylight: Modal dialog already being displayed.";
		}
		
		globals.modalDialog = $('<div class="jqmAlert" id="ext3">' +
			'<div class="jqmAlertWindow" id="ext3b">' +
    			'<div class="jqmAlertTitle clearfix">' +
    				'<h1>Did you know?</h1><a href="#" class="jqmClose"><em>Close</em></a>' +
  				'</div>' +
  				'<div class="jqmAlertContent">' +
  					'<p>Please wait...</p>' +
  				'</div>' +
			'</div>' +
		'</div>');
		
		$(document.body).append(globals.modalDialog);
		
		// http://dev.iceburg.net/jquery/jqModal/
		globals.modalDialog.jqm({
			onHide: function(hash) {
				hash.w.hide();
				hash.o.remove(); // remove overlay
				saveData.restore(); // put selection back
				emptyPlaceholderSpan.replaceWith(globals.warningIconSpan);
				globals.modalDialog.remove();
				globals.modalDialog = null;
			},
			target: 'div.jqmAlertContent',
			overlay: 20 // percentage of opacity
		});
		globals.modalDialog.jqmShow();
		
	/*	var newWindow = window.open('CopyrightPolicy.html?' + document.location.href, 'CopyrightPolicy');
		if (newWindow) {
			newWindow.focus();
		} */
		event.preventDefault();
	}

	function showWarningIconIfInvisible() {
		if (globals.warningIconSpan) {
			globals.warningIconSpan.show();
		}
	}

	function hideWarningIconIfVisible() {
		if (globals.warningIconSpan) {
			globals.warningIconSpan.hide();
		}
	}

	function hideAnyWatermarks() {	
		globals.markedElements.copylight('watermark', false);
		globals.markedElements = null;
	}

	// Unfortunately, if the user is in mid-making a selection, disrupting the
	// DOM near the selection is bad.  The effects are wonky and you will see
	// them only if you are making certain kinds of selections near the disruption.
	//
	// So make sure this is only called in a handler that runs after all mousedown
	// -or- mouseup handling.
	function removeAnyWarnings() {
		if (globals.inMouseHandler) {
			throw "copylight: Cannot call removeAnyWarnings from a mouse handler";
		}
		
		hideAnyWatermarks();
		
		// Remove floating warning icon if it's there
		if (globals.warningIconSpan) {
			var spanParent = globals.warningIconSpan.parentNode;
			var spanPrevSibling = globals.warningIconSpan.previousSibling;
			var spanNextSibling = globals.warningIconSpan.nextSibling;
			globals.warningIconSpan.mouseup(null);
			globals.warningIconSpan.remove();
			globals.warningIconSpan = null;

			// spanParent.normalize() would be nice, but if the user has a
			// selection (or is working on making a selection) then disrupting
			// nodes near that location--even if it's something "harmless"
			// like a normalize--leads to unwanted effects.
			if (spanPrevSibling && spanNextSibling && 
					(spanPrevSibling.nodeType === 3 /* Node.TEXT_NODE */) && 
					(spanNextSibling.nodeType === 3 /* Node.TEXT_NODE */)) {
						
				var selection = window.getSelection();
				var saveData = saveSelection(selection);
				// Manual normalization, sigh.
				var joinOffset = spanPrevSibling.data.length;
				spanPrevSibling.data = spanPrevSibling.data + spanNextSibling.data;
				spanParent.removeChild(spanNextSibling); // no remove() on TextNode elements :(
				if (saveData.adjustForJoin(spanPrevSibling, joinOffset, spanNextSibling)) {
					saveData.restore();
				}
			}
		}
	}

	function notifyUserIfSelectionIsSubstantial(mouseX, mouseY) {
		if (globals.inMouseHandler) {
			throw "copylight: Cannot call notifyUserIfSelectionIsSubstantial from a mouse handler";
		}

		// No selection means no notification is necessary
		// WARNING: do not call this variable currentSel if in global scope!
		var selection = window.getSelection();
		if (!selection) {
			return;
		}
		// http://stackoverflow.com/questions/3212112/getrangeat-error-if-no-text-is-selected
		if (selection.rangeCount === 0) {
			return;
		}
			
		// http://stackoverflow.com/questions/4220478/get-all-dom-block-elements-for-selected-texts 
		var range = selection.getRangeAt(0);
		var allWithinRangeParent = $(range.commonAncestorContainer).find("*").andSelf();
		
		var showStoplight = false;
		
		if (globals.markedElements !== null) {
			throw "copylight: Cannot call notifyUserIfSelectionIsSubstantial with marked elements";
		}
		globals.markedElements = $([]);

		// First loop: Before we start applying any watermarking styles, we need to look for any
		// "holes" that we will need to cut out of the watermarked areas to undo their influence
		// See: http://stackoverflow.com/questions/8083701/workaround-for-lack-of-css-feature-to-suppress-inherited-styles-and-backgroun
		$.each(allWithinRangeParent, function (i, el) {
			var $el = $(el);
			var data = $el.data('copylight');
			if (data) {
				data.cachedStyleString = $el.attr('style');
				data.cssToUndoBackgroundChange = getCssToUndoBackgroundChange($el);
			}
		});
		
		// Second loop: now we start applying watermarks
		$.each(allWithinRangeParent, function (i, el) {
			var $el = $(el);
						
			// The second parameter says to include the element
			// even if it's not fully selected
			if (selection.containsNode(el, true) ) {
				var license = getNearestAncestorLicenseData($el);
				if (license) {
				
					// just a test...make it so that cc-zero
					if (license['license'] === 'cc-zero') {
						$el.css(license.cssToUndoBackgroundChange);	
					} else {
						var textSelected = selection.toString();
						if (textSelected.length < license.charLimitForNotice) {
							return;
						}
						$.merge(globals.markedElements, license.target.copylight('watermark', true));
					}
				}

				showStoplight = true;
			}
		});
		
		if (!showStoplight) {
			return;
		}
			
		// We add an icon roughly where the user ended making the selection
		// by putting it into the DOM at the point where the selection ended.
		// NOTE: What will semantics be when user selects large areas using
		// something other than start end points?  double clicks?  Programmatic?
		globals.warningIconSpan = $('<span class="copylight-alert yellow" id="traffic" title="IMPORTANT: Click to Read License BEFORE Copying!" />');
		/* display="none"?	display="inline"? */
		globals.warningIconSpan.mousedown(crashGuard(openCopyrightPolicyWindow));
		
		// https://developer.mozilla.org/En/DOM:selection
		// anchorNode - Returns the node in which the selection begins. 
		// anchorOffset - Returns the number of characters that the selection's anchor
		//					 is offset within the anchorNode. 
		// focusNode - Returns the node in which the selection ends. 
		// focusOffset - Returns the number of characters that the selection's focus 
		//					 is offset within the focusNode.
	
		// REVIEW: Opera does not seem to differentiate between the cases where
		// the user drags a selection forward vs. backward, hence we end
		// up getting anchor/focus swapped on backward selections
		var saveData = saveSelection(selection);
		if (selection.focusNode.nodeType === 3 /* Node.TEXT_NODE */) {
			// This split operation could disrupt the pointers a selection has
			// into the ranges.
			var newNode = (selection.focusNode).splitText(selection.focusOffset);
			if (saveData.adjustForSplit(selection.focusNode, selection.focusOffset, newNode)) {
				// always restore the selection
				$.noop();
			}
		}
		// http://www.ruby-forum.com/topic/147322
		if (selection.focusOffset == 0) {
			globals.warningIconSpan.insertBefore(selection.focusNode)
		} else {
			globals.warningIconSpan.insertAfter(selection.focusNode);
		}
		saveData.restore();	
	}

	function mousedownHandler(event) {
		crashGuard(function(event) {
			globals.inMouseHandler = true;
			if ((event.which === 1 /* left click */) && globals.warningIconSpan) {
				if (event.element === globals.warningIconSpan) {
					// do not want clicking on the warning icon to disrupt selection
					// https://developer.mozilla.org/en/DOM/event.preventDefault
					event.preventDefault();
				} else {
					if (globals.modalDialog === null) {
						hideAnyWatermarks();
						hideWarningIconIfVisible();
					}
				}
			}
			globals.inMouseHandler = false;
		})(event);
	}

	function mouseupHandler(event) {
		crashGuard(function(event) {
			globals.inMouseHandler = true;
			if (event.which === 1 /* left click */) {
				// Let the selection finalize mouseUp before disrupting the DOM
				// failure to do this leads to weird behaviors, sometimes, which
				// includes Firefox not being receptive to the selection being changed
				// by further mousedown messages (!)
			
				// only do this if we are not showing a dialog...
				if (globals.modalDialog === null) {
					window.setTimeout(crashGuard(
						function(x,y) {
							notifyUserIfSelectionIsSubstantial(event.pageX, event.pageY);
						}
					), 0);
				}
			}
			globals.inMouseHandler = false;
		})(event);
	}

	// These methods are only called through .copylight which has a crashGuard()
	// so all of these are implicitly protected against crashing in non-debug mode
	var methods = {
		init : function(options) {
			
			return this.each(function(){
				
				var $this = $(this);
				var data = $this.data('copylight');
				
				// If the plugin hasn't been initialized yet for this element
				if (!data) {
											
					var settings = {
						'license' : 'cc-zero',
						'watermark' : true,
						'watermarked' : false,
						'charLimitForNotice': 256
					};

					// If options exist, lets merge them
					// with our default settings for this element
					if (options) { 
						$.extend(settings, options);
					}
					
					$this.data('copylight', $.extend(settings, {
						target : $this
					}));
					
					$this.addClass(settings.license);
				}
				
				if (globals.numCopyLightElements++ === 0) {
					// http://stackoverflow.com/questions/2655597/when-should-i-observe-javascript-events-on-window-vs-document-vs-document-body
					// http://docs.jquery.com/Namespaced_Events
					
					$(document).bind('mouseup.copylight', mouseupHandler);
					$(document).bind('mousedown.copylight', mousedownHandler);
				}
			});
		},

		debug : function(arg) {
			globals.debugMode = arg;
			alert('copylight debug mode is ON');
		},

		watermark : function(arg) {
			// returns the collection of elements that had their watermark status changed
			
			// http://stackoverflow.com/questions/2832008/adding-newly-created-dom-elements-to-an-empty-jquery-object
			var changedList = $([]);
			
			var defaultWatermarkHandler = function(enable, license) {
				var $this = $(this);
				if ($this.hasClass('copylighted') === enable) {
					throw "Expected copylighted status to be " + !enable;
				}
				if (enable) {
					$this.addClass('copylighted');
				} else {
					$this.removeClass('copylighted');
				}
			};
			
			this.each(function(i, el){
				
				var $el = $(el);
				var data = $el.data('copylight');
				if (!data) {
					throw "copylight.watermark called on node that wasn't configured for a license";
				}
				var enable = arg ? true : false;
				if (data.watermarked === enable) {
					return;
				}
				if (typeof data.watermark == 'function') {
					data.watermark.apply(el, [enable, data.license]);
				} else {
					if (data.watermark) {
						defaultWatermarkHandler.apply(el, [enable, data.license]);
					}
				}
				data.watermarked = enable;
				changedList.push($el);
			});
			
			return changedList;
		},
		
/*
		// could add more functions here
		// See article http://docs.jquery.com/Plugins/Authoring
		reposition : function() { },
		show : function() {  },
		hide : function() {  },
		update : function(content) { }
*/

		destroy : function() {
			
			return this.each(function(){
			
				var $this = $(this);
				var data = $this.data('copylight');
								
				// if any DOM elements were created and stored in .data, be sure to .remove() here
				
				$this.removeData('copylight');
				
				if (--globals.numCopyLightElements === 0) {
					// http://docs.jquery.com/Namespaced_Events
					$(document).unbind('.copylight');
				}
			});
		}
	};

	$.fn.copylight = crashGuard(function(method) {

		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			return $.error('Method ' + method + ' does not exist on jQuery.copylight');
		}
	});
	
	// http://stackoverflow.com/questions/7985923/minimal-modifications-to-jquery-plugin-sample-to-call-plugin-with-no-elements
    $.extend({
        copylight: $.fn.copylight
    });

    // Global initialization - runs one time
    $(function() {
		// we scan document and try to do as much "automatic" smarts as possible
		$.each(globals.licenseInformation, function(k, v) {
			$("." + k).copylight({license: k});
		});
    });
	
}(jQuery)); // end CopyLight plugin