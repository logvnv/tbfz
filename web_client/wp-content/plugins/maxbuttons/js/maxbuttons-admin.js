var $ = jQuery;

function maxAdmin()
{ }

maxAdmin.prototype = {
	//initialized: false,
 	colorUpdateTime: true,
  colorPalettes: true,
 	fields: null,
 	button_id: null,
 	form_updated: false,
 	tabs: null,
}; // MaxAdmin

maxAdmin.prototype.init = function () {
		this.button_id = $('input[name="button_id"]').val();
 		// Prevents the output button from being clickable (also in admin list view )
		$(document).on('click', ".maxbutton-preview", function(e) { e.preventDefault(); e.stopPropagation(); });

 		// overview input paging
 		$('#maxbuttons .input-paging').on('change', $.proxy(this.do_paging, this));

		$('.manual-toggle').on('click', $.proxy(this.toggleManual, this));
		$('.manual-entry').draggable({
			cancel: 'p, li',
		});

 		$(document).on('submit', 'form.mb_ajax_save', $.proxy(this.formAjaxSave, this));

		// copy / delete / trash action buttons via ajax
		$(document).on('click', '[data-buttonaction]', $.proxy(this.button_action, this ));

		// conditionals
		$(document).on('reInitConditionals', $.proxy(this.initConditionials, this));
		this.initConditionials(); // conditional options

  	// range inputs
		$('#maxbuttons').on('change, input', 'input[type="range"]', $.proxy(this.updateRange, this ));
		this.updateRange(null);

		/*
		****
		 ### After this only init for button main edit screen
		****

		*/
		if ($('#new-button-form').length == 0)
			return;


		if (this.button_id > 0) {
			$("#maxbuttons .mb-message").show();
		}

		//this.initResponsive(); // responsive edit interface

    // this events happens when live preview updates something.
    $(document).on('livePreviewUpdate', $.proxy(this.saveIndicator, this) );

    // screen changer.
    $('.screen-option').on('click', $.proxy(this.change_screen_event, this));
    $('.remove-screen').on('click', $.proxy(this.remove_screen, this));

		 $("#maxbuttons .output").draggable({
			cancel: '.nodrag',
		});

    // clicking on color picker circle scrolls to top and loads # on the page, which is bad.
    $('.iris-picker-inner .iris-square-value').removeAttr('href');
    $(document).on('click', '.iris-picker-inner .iris-square-value', function (e) {
        e.preventDefault(); e.stopPropagation(); return false; });

		/* Copy Color Interface */
		$('.input.mbcolor .arrows').on('click', $.proxy(this.copyColor, this) );

		$('[id$="radius_toggle"]').on('click', $.proxy(this.toggleRadiusLock,this));
    $('.output .preview-toggle').on('click', $.proxy(this.toggle_preview, this));

 		$('#maxbuttons input.mb-color-field').on('focus', $.proxy(this.select_field, this));

		$(window).on('beforeunload', $.proxy(function () { if (this.form_updated) return maxajax.leave_page; }, this));
		$(document).on('keyup', 'input', function (e) {

			if (e.keyCode && e.keyCode == 13)
			{
				$(":input")[$(":input").index(document.activeElement) + 1].focus();
				return false;
			}
		});

		$(".button-save").click($.proxy(function(e) {
			this.saveIndicator(null, false); // prevent alert when saving.

      if ($(e.target).attr('id') == 'new_add_screen')
      {
       $('#add_new_screen').val('yes');
     }
			$("#new-button-form").submit();
			return false;
		}, this) );

		// Expand shortcode tabs for more examples.
		$('.shortcode-expand').on('click', this.toggleShortcode);

    // URL Linker.
    $('#url_button').on('click', $.proxy(this.openURLDialog, this) );

    // Sidebar slider
    $('.block_sidebar .open_control').on('click', this.toggleSidebar);

    $(window).on('maxbuttons-js-init-done', $.proxy(this.loadLivePreview, this));

    if ( $('input[name="button_is_new"]').val() == 1)
      this.saveIndicator(null, true);

}; // INIT

maxAdmin.prototype.loadLivePreview = function()
{
  if (typeof window.maxFoundry.livePreview == 'function' )
  {
    this.livePreview = new window.maxFoundry.livePreview();
    this.livePreview.init();
    $(document).trigger('livepreview-loaded');

  }
  else {
    alert('Live Preview not loaded, button preview not functional');
  }

  if (typeof window.location.hash !== 'undefined' && window.location.hash.length > 0)
  {
    var screenid = window.location.hash.replace('#', '');
    this.change_screen(screenid);
  }
}

maxAdmin.prototype.change_screen_event = function(e)
{
  e.preventDefault();
  var $target = $(e.target);
  if (typeof ($target.data('screenid')) == 'undefined')
    $target = $target.parents('.screen-option');

  var change_screen = $target.data('screenid');
  if (typeof change_screen !== 'undefined')
    this.change_screen(change_screen);
}
maxAdmin.prototype.change_screen = function(change_screen)
{

  var active_screen = $('.screen-option.option-active').data('screenid');
  var $target = $('.screen-option[data-screenid="' + change_screen + '"]');
  if (change_screen != 'new')
  {
    $('#current_screen').val(change_screen);
  }
  // not the same.
  if (active_screen !== change_screen)
  {
      window.location.hash = change_screen;

      $('.screen-option').removeClass('option-active');
      $target.addClass('option-active');
      $(document).trigger('changed_screen', change_screen);

      $('.mbscreen-editor').removeClass('current-screen');
      $('#screen_' + change_screen).addClass('current-screen');

  }
  //change_screen
}

maxAdmin.prototype.remove_screen = function(e)
{
  if (confirm(maxadmin_settings.remove_confirm))
  {
    var $target = $(e.target);
    var screen_id = $target.parents('.mbscreen-editor').data('screenid');
    $target.parents('.mbscreen-editor').remove(); // remove editor screen

    $('.screen-option[data-screenid="' + screen_id + '"]').remove(); // remove the menu tab
    $('input[name="screens[]"][value="' + screen_id + '"]').remove(); // remove the input hidden registration

    // indicator for add new screen when limited.
    $('.removed-note').show();

    this.change_screen('default');

    this.saveIndicator(null, true);
  }
}

maxAdmin.prototype.toggle_preview = function (e)
{
	if ( $('.output .inner').is(':hidden') )
	{
		$('.output .inner').show();
		$('.output').css('height', 'auto');
		$('.preview .preview-toggle').removeClass('dashicons-arrow-down').addClass('dashicons-arrow-up');
	}
	else
	{
		$('.output .inner').hide();
		$('.output').css('height', 'auto');
		$('.preview .preview-toggle').removeClass('dashicons-arrow-up').addClass('dashicons-arrow-down');
	}
};

maxAdmin.prototype.select_field = function(e)
{
	$(e.target).select();
}

maxAdmin.prototype.button_action = function(e)
{
	e.preventDefault();
	var action = $(e.target).data('buttonaction');
  var confirm = $(e.target).data('confirm');


	this.form_updated = false;

  if (typeof confirm !== 'undefined')
  {
    var ret = window.confirm(confirm);
    if (! ret)
      return;
  }

	var button_id = $(e.target).data('buttonid');
	var nonce = $('input[name="' + action + '_nonce"]').val();
  var paged = $('input[name="paged"]').val();


	var url = maxajax.ajax_url;
	var data =
	{
		action: 'mb_button_action',
		button_action: action,
		button_id: button_id,
		nonce: nonce,

	};

  if (typeof paged !== 'undefined')
    data['paged'] = paged;

	$.post({
		url: url,
		data: data,
		success: function (data) {
			response = JSON.parse(data);

			if (typeof response.redirection != 'undefined')
			{
				window.location = response.redirection;
			}
		},
		error: function () {
			console.error('error in button action' + action);
		},
	});
}

/* Check the copy modal and display a warning if the button has been changes */
maxAdmin.prototype.checkCopyModal = function(modal)
{
	if (this.form_updated)
	{
		modal.currentModal.find('.mb-message').show();

	}
	else
		$(modal.currentModal).find('.mb-message').hide();
}


maxAdmin.prototype.copyColor = function (e)
{
	e.preventDefault();
	e.stopPropagation(); // stop the color picker from closing itself.

	var target = $(e.target);
	var bindto = $(e.target).parents('[data-bind]');
	var fieldId = '#' + bindto.data('id'); // Field which is used
	var bindId = '#' + bindto.data('bind'); // Field is bound to.

	// check which arrow was pressed
	if (target.hasClass('arrow-right'))
		var arrow_click = 'right';
	else
		var arrow_click = 'left';

	// check on which side the interface is. If arrows are on right side, it's the left side (...)
	if (bindto.hasClass('right') )
		var if_side = 'left';
	else
		var if_side = 'right';

	/* Decide which color to replace. If interface is left - then right click is copy to other element, but if interface is right, right is overwrite current element.
		Left : right click - copy, left replace.
		Right : right click - replace, left copy.
	*/
	if (if_side == 'left')
	{
		if (arrow_click == 'right')
			copy = true;
		else
			copy = false;
	}
	else if (if_side == 'right')
	{
		if (arrow_click == 'right')
			copy = false;
		else
			copy = true;
	}

	if ( copy )
	{
		$(bindId).val( $(fieldId).val() );
		$(bindId).trigger('change');
		$(bindId).wpColorPicker('color', $(fieldId).val());
	}
	else
	{
		$(fieldId).val( $(bindId).val() );
		$(fieldId).trigger('change');
		$(fieldId).wpColorPicker('color', $(bindId).val());
 	}

}

maxAdmin.prototype.toggleRadiusLock = function (event)
{
	var target = $(event.target);
	var lock = $(target).data('lock');
	if (lock == 'lock')
	{
		$(target).removeClass('dashicons-lock').addClass('dashicons-unlock');
		$(target).data('lock', 'unlock');
	}
	else if (lock == 'unlock')
	{
		$(target).removeClass('dashicons-unlock').addClass('dashicons-lock');
		$(target).data('lock', 'lock');
	}

}

maxAdmin.prototype.initResponsive = function()
{

	//window.maxFoundry.maxadmin.responsive = new mbResponsive();
	//window.maxFoundry.maxadmin.responsive.init(this);

}


maxAdmin.prototype.do_paging = function(e)
{
	var page = parseInt($(e.target).val());

	if (page <= parseInt($(e.target).attr('max')) )
	{
		var url = $(e.target).data("url");
		window.location = url + "&paged=" + page;

	}
}


maxAdmin.prototype.toggleShortcode = function (e)
{
	if ($('.shortcode-expand').hasClass('closed'))
	{
		$(' .mb-message.shortcode .expanded').css('display','inline-block');
		$('.shortcode-expand span').removeClass('dashicons-arrow-down').addClass('dashicons-arrow-up');
		$('.shortcode-expand').removeClass('closed').addClass('open');
	}
	else
	{
		$(' .mb-message.shortcode .expanded').css('display','none');
		$('.shortcode-expand span').addClass('dashicons-arrow-down').removeClass('dashicons-arrow-up');
		$('.shortcode-expand').addClass('closed').removeClass('open');
	}

}

maxAdmin.prototype.toggleManual = function (e)
{
  e.preventDefault();
	var $target = $(e.target);

	var subject = $target.data("target");
	var $newWindow = $('.manual-entry[data-manual="' + subject + '"]');

	if ($newWindow.is(':visible'))
	{
		$newWindow.hide();
		return true;
	}
  var $destination = $target.parents('.option-container');

	$newWindow.css('top', '0px');
	$newWindow.css('right','-25%');
	$newWindow.prependTo($destination);
  $newWindow.show();
}

maxAdmin.prototype.resetConditionals = function()
{
    $('[data-show], [data-has]').each(function () {
        var condition  = $(this).data('show');
        if (typeof condition === 'undefined')
        {
          condition = $(this).data('has');
        }
        if (typeof condition === 'undefined')
        {
          console.error($(this) + 'has a improperly set conditional');
          return;
        }
        var target = condition.target;
        $(document).off('change','[name="' + target + '"]'); // turn off event
    });


}

maxAdmin.prototype.initConditionials = function ()
{
	var mAP = this;
  this.resetConditionals();

	$('[data-show]').each(function () {
		var condition  = $(this).data('show');
		var target = condition.target;
		var values = condition.values;
		var self = this;

		$(document).on('change','[name="' + target + '"]', {child: this, values: values}, $.proxy(mAP.updateConditional, mAP) );

    if ( $('[name="' + target + '"]').length > 1)  // trigger change to test condition
    {
        $('[name="' + target + '"]:checked').trigger('change', ['conditional']); // radio / checkbox button
    }
    else {
  	   $('[name="' + target + '"]').trigger('change', ['conditional']);
    }
	});

// problem here is fields having same target, will add the same event over and over //
//  the target, input array, have a lot of input fields, which all receive the events. this is the issue.

  var updatelist = [];

  $('[data-has]').each(function () {
		var condition = $(this).data('has');
		var target = condition.target;
		var values = condition.values;


  $('[name="' + target + '"]').on('change', {target: target, child: this, values: values}, $.proxy(mAP.updateHasConditional, mAP) );

   var targetdecl = '[name="' + target + '"]';
   if (! $.inArray(targetdecl, updatelist));
    updatelist.push(targetdecl);
	});

  if (updatelist.length > 0)
  {
    // the issue will a lot of event checking still exist..
    $(updatelist.toString()).first().trigger('change', ['conditional']);
  }

}

maxAdmin.prototype.updateConditional = function (event)
{
	var data = event.data;
	var cond_values = data.values;
	var cond_child = data.child;

	var target = $(event.currentTarget);
	var value = $(target).val();

	// if type = checkbox: cond_value checked means it has to be 'checked' to show. Otherwise 'unchecked' go hide.
	if (target.attr('type') === 'checkbox')
	{

		var checked = $(target).prop('checked');

		if (cond_values == 'checked' && checked)
			value = 'checked';
		else if (cond_values == 'unchecked' && !checked)
			value = 'unchecked';
		else
			value = 0;
	}

	if (cond_values.indexOf(value) >= 0)
	{

		$(cond_child).fadeIn('fast');
		$(cond_child).find('input, select').trigger('change');
	}
	else
	{
		$(cond_child).fadeOut('fast');
		$(cond_child).find('input, select').trigger('change');
	}
}

maxAdmin.prototype.updateHasConditional = function(event)
{
	var mAP = this;
	var data = event.data;

	var cond_values = data.values;
	var cond_child = data.child;

	var target = data.target;

	var hascond = false;

/** The issue here is to change this calls, to searches directly for value form cond_values ( mostly 1-3 options ) and not run the entire DOM each time.
*/
  var filter = [];
  $(cond_values).each(function (el)
  {

    filter.push( '[value=' + this + ']');
  } );

  if ($('[name="' + target + '"]').filter( filter.toString() ).length > 0)
  {
      hascond = true;
  }
  else {
    hascond = false
  }

	if (hascond)
	{
		$(cond_child).fadeIn('fast');
	}
	else
	{
		$(cond_child).fadeOut('fast');
	}

}

maxAdmin.prototype.updateRange = function (event)
{
	if (typeof event == 'undefined' || event === null )
	{
		var targets = $('input[type="range"]');
	}
	else
	{
		var targets = [event.target];
	}

	$(targets).each(function () {
		var value = $(this).val();
		$(this).parents('.input').find('.range_value output').val(value + '%');

	});

}

maxAdmin.prototype.saveIndicator = function(e, toggle)
{
	if (toggle)
	{
    	this.form_updated = true;
      $('.button-save').removeClass('disabled').addClass('button-primary');
  }
	else
  {
		this.form_updated = false;
    $('.button-save').addClass('disabled').removeClass('button-primary');
  }
}

// General AJAX form save
maxAdmin.prototype.formAjaxSave = function (e)
{
	e.preventDefault();
	var url = mb_ajax.ajaxurl;
	var form = $(e.target);

	var data = form.serialize();


	$.ajax({
	  type: "POST",
	  url: url,
	  data: data,

	}).done($.proxy(this.saveDone, this));
}

maxAdmin.prototype.saveDone = function (res)
{
	$('[data-form]').prop('disabled', false);

	var json = $.parseJSON(res);

	var result = json.result;
	var title = json.title;


	var collection_id = json.data.id;

	if (typeof json.data.new_nonce !== 'undefined')
	{
		var nonce = json.data.new_nonce;
	 	$('input[name="nonce"]').val(json.data.new_nonce);
	}

	if (result)
	{
		// if collection is new - add collection_id to the field
		$('input[name="collection_id"]').val(collection_id);

		// replace the location to the correct collection
		var href = window.location.href;
		if (href.indexOf('collection_id') === -1)
			window.history.replaceState({}, '', href + '&collection_id=' + collection_id);

		// trigger other updates if needed
		$(document).trigger('mbFormSaved');

		// update previous selection to current state;
		var order = $('input[name="sorted"]').val();
		$('input[name="previous_selection"]').val(order);

		// in case the interface needs to be reloaded.
		if (json.data.reload)
		{
			document.location.reload(true);
		}

	}
	if (! result)
	{
		$modal = window.maxFoundry.maxModal;
		$modal.newModal('collection_error');
		$modal.setTitle(title);
		$modal.setContent(json.body);

		$modal.setControls('<button class="modal_close button-primary">' + json.close_text + '</button>');
		$modal.show();

	}
}

maxAdmin.prototype.openURLDialog = function(e)
{
  window.wpActiveEditor = 'url'; // $('input[name="url"]'); //true; //we need to override this var as the link dialogue is expecting an actual wp_editor instance

  wpLink.open(); //open the link popup
  $('#link-options').hide();
  $('.query-results').css('top', '70px');
  $('#wp-link-submit').off('click keyup change');
  $('#wp-link-submit').on('click', $.proxy(this.updateLink, this) );
  return false;
}

maxAdmin.prototype.updateLink = function (e)
{
   e.preventDefault();
   var old_url = $('#url').val();
   var url = $('#wp-link-url').val();
   var host = maxadmin_settings.homeurl;

   url = url.replace(host, '');

   $('#url').val(url);

   if (old_url != url)
   { // trigger update when changing URL
     $(document).trigger('livePreviewUpdate', true);
   }

   wpLink.close();
   return false;
}

maxAdmin.prototype.toggleSidebar = function(e)
{
  var target = e.target;
  var $sidebar = $(target).parents('.block_sidebar');

  if ($sidebar.hasClass('active'))
  {
    $sidebar.removeClass('active');
  }
  else {
    $sidebar.addClass('active');
  }

}
