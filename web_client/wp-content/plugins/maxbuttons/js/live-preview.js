var $ = jQuery;

// Here be gathering everything related to live updating MB.
function maxLivePreview()
{

}

maxLivePreview.prototype = {
  fields: {},
  screens: {},
  currentScreen: '',
  currentFields: {},
  reloadInProgress: false,
  reloaded: {} // for partly reloads when doing a screen update.
}

maxLivePreview.prototype.init = function ()
{
  this.loadScreens();
  this.bindFields();

}

maxLivePreview.prototype.bindFields = function()
{
  // bind to all inputs, except for color-field or items with different handler.
  $('#maxbuttons input,#maxbuttons textarea').not('.mb-color-field').on('keyup change', $.proxy(this.update_preview_event,this));
  $('#maxbuttons select').on('change', $.proxy(this.update_preview_event, this));

  $('#maxbuttons .mb-color-field').wpColorPicker(
 {
     width: 300,
     alpha: true,
     palettes: this.colorPalettes,
     change: $.proxy( _.throttle(function(event, ui) {

         var color = ui.color.toString();
         this.update_color_event(event,ui, color);

     }, 200), this),

   });

   // Presets
 $('[data-action="set-preset"]').on('click', $.proxy(this.setPreset, this));

  $(document).on('changed_screen', $.proxy(this.changed_screen, this));
}

// on screen change, reload preview.
maxLivePreview.prototype.changed_screen = function(e, screen)
{
  // this needs a check to not run the default setup twice.
  this.setCurrentScreen('default');
  this.reloadFields();  // 'reload/reset' the preview to the main screen.
  if (screen != 'default') // no need to reload if not default
  {
    this.setCurrentScreen(screen);
    this.reloadFields(); // implement overrides of the screen.
  }

}

maxLivePreview.prototype.reloadFields = function()
{
  $(document).trigger('livepreview-reload-start');
  this.reloadInProgress = true;

  for(var mapfield in this.currentFields)
  {
     var data = this.fields[this.currentScreen][mapfield];
     this.update_preview( $('#' + mapfield), data);
  }
  this.reloadInProgress = false;
  this.reloaded = {};
  $(document).trigger('livepreview-reload-end');
}

maxLivePreview.prototype.loadScreens = function ()
{
  var self = this;

  $('.mbscreen-editor .fieldmap').each(function()
  {
      var $screen = $(this).parents('.mbscreen-editor');
      var screen_id = $screen.attr('id').replace('screen_', '');
      var map = $(this).text();
      if (typeof map != 'undefined')
        self.fields[screen_id] = $.parseJSON(map);

      if ($screen.hasClass('current-screen'))
      {
        self.setCurrentScreen(screen_id);
      }
  });
}

// function to help static function to get the proper ID's for the current field.
// byName is optional, signaling to search the field by form name instead of #id ( checkbox, radio )
// byName can result in multiple fields.
maxLivePreview.prototype.getFieldByID = function(name, byName)
{
  if (typeof byName == 'undefined')
  {
    byName = false;
  }

  if (this.currentScreen  == 'default')
    var id = name;
  else
    var id = this.currentScreen + '_' + name;


  if (byName)
  {
    var $field = $('input[name="' + id + '"]');
  }
  else
  {
    var $field = $('#' + id);
  }

  return $field;
}

maxLivePreview.prototype.setCurrentScreen = function(id)
{
  this.currentScreen = id;
  this.currentFields = this.fields[id];

  $(document).trigger('livepreview-screen-set', [id, this.currentFields] );
}

maxLivePreview.prototype.update_preview_event = function(e)
{
  e.preventDefault();
  var target = $(e.target);

  // migration to data field
  var field = $(target).data('field');
  var id = $(target).attr('id'); // this should change to be ready for the option to have two the same fields on multi locations.

  var data = this.currentFields[id];

  $(document).trigger('livePreviewUpdate', true);

  if (data !== null)
  {
    this.update_preview( $('#' + id), data);
  }

}

/** Updates the preview buttons with new CSS lines. Extracts several fields from the fieldmap.
*  state = csspseudo
* field_id is ID of form field, data is corresponding field data in fieldmap.
*/
maxLivePreview.prototype.update_preview = function($field, data)
{

  var state = null;
	if (typeof data == 'undefined')
		return; // field doesn't have updates

  // check all attributes. Fields can use any of those for different processes.
  if (typeof data.css != 'undefined')
	{
		value = $field.val();

		// a target that is checkbox but not checked should unset (empty) value.
		if ($field.is(':checkbox') && ! $field.is(':checked') )
			value = '';

    if ($field.is(':radio') && ! $field.is(':checked') )
      return; // not our radio update.

    if (typeof data.pseudo !== 'undefined')
    {
      state = data.pseudo;
    }
		this.putCSS(data, value, state);
  }
	if (typeof data.attr !== 'undefined')
	{
		$('.output .result').find('a').attr(data.attr, $field.val());
	}

  if (typeof data.func !== 'undefined')
  {
      var funcName = data.func;
      var self = this;
      if (funcName.indexOf('.') < 0)
      {
          funcName = 'self.' + funcName + '(target)';
      }
      else {
         funcName = funcName + '(target)';
      }

      try
      {
          var callFunc = new Function ('target', 'self', funcName);
          callFunc($field, this);
      }
      catch(err)
      {
        console.error(err);
      }

  }
};

maxLivePreview.prototype.putCSS = function(data,value,state)
{
	state = state || 'both';
  if (typeof data == 'undefined')
    return false;

	var element = '.maxbutton';
	if (state == 'hover')
		element = 'a.hover ';
	else if(state == 'normal')
		element = 'a.normal ';

  if (typeof data.unitfield != 'undefined')
  {

     var unitfielddata = this.getFieldByID(data.unitfield, true).filter(":checked"); // get by name, radio button
     var unitvalue = unitfielddata.val();

     if (value == 0)
       value = 'auto';
     else if (unitvalue == 'percent' || unitvalue == '%')
       value += '%';
     else if(unitvalue == 'pixel' || unitvalue == 'px')
       value += 'px';

  }
  else if (typeof data.css_unit != 'undefined' && value.indexOf(data.css_unit) == -1)
  {
    if (value.indexOf(data.css_unit) == -1)
		  value += data.css_unit;
  }
	if (typeof data.csspart != 'undefined')
	{
		var parts = data.csspart.split(",");
		for(i=0; i < parts.length; i++)
		{
			var cpart = parts[i];
			var fullpart = element + " ." + cpart;
  				$('.output .result').find(fullpart).css(data.css, value);
		  }
	}
	else
		$('.output .result').find(element).css(data.css, value);

}

maxLivePreview.prototype.update_color_event = function(event, ui, color)
{
    //event.preventDefault();
		var target = $(event.target);
    this.update_color(target, ui, color);
    $(document).trigger('livePreviewUpdate', true);

}

maxLivePreview.prototype.update_color = function(field, ui, color)
{
      var self = this;
      var id = field.attr('id');


			if (color.indexOf('#') === -1 && color.indexOf('rgba') < 0)
      {
				color = '#' + color; // add # to color
      }

      $('#' + id).val(color); // otherwise field value is running 1 click behind.

      // toggle transparency when needed.
      if ( $(field).val() == '')
      {
        $(field).parents('.mbcolor').find('.wp-color-result').children('.the_color').css('background-image', 'url(' + maxadmin_settings.icon_transparent + ')');
        if (typeof event.type !== 'undefined' && event.type == 'change')
          this.update_color(e, null, 'rgba(0,0,0,0)');
      }
      else {
        $(field).parents('.mbcolor').find('.wp-color-result').children('.the_color').css('background-image', 'none');
      }

			if(id.indexOf('box_shadow') !== -1)
			{
				this.updateBoxShadow(field);
			}
			else if(id.indexOf('text_shadow') !== -1)
			{
				this.updateTextShadow(field);
			}
			else if (id.indexOf('gradient') !== -1)
			{
				if (id.indexOf('hover') == -1)
					this.updateGradient();
				else
					this.updateGradient(true);
			}
			else if (id == 'button_preview')
			{
        if (color.indexOf('rgba') >= 0)
        {
        }
				$(".output .result").css('backgroundColor',  color);
			}
			else  // simple update
			{

				var data = this.currentFields[id];
        var state = 'normal';
        if (typeof data !== 'undefined' && typeof data.pseudo !== 'undefined')
        {
          state = data.pseudo;
        }

				this.putCSS(data, color, state);
			}
};

maxLivePreview.prototype.updateBoxShadow = function (target)
	{
	//	target = target || null;
  if (this.reloadInProgress && typeof this.reloaded.boxshadow !== 'undefined')
      return;

    var id = $(target).attr('id');

  	var left = this.getFieldByID('box_shadow_offset_left').val();
		var top = this.getFieldByID("box_shadow_offset_top").val();
		var width = this.getFieldByID("box_shadow_width").val();
		var spread = this.getFieldByID('box_shadow_spread').val();

		var color = this.getFieldByID("box_shadow_color").val();
		var hovcolor = this.getFieldByID("box_shadow_color_hover").val();

    if (color == '') color = 'rgba(0,0,0,0)';
    if (hovcolor == '') hovcolor = 'rgba(0,0,0,0)';

    var id = $(target).attr('id');
		var data = this.currentFields[id];
    if (typeof data == 'undefined') // field not defined.
      return;
		data.css = 'boxShadow';

    value = left + 'px ' + top + 'px ' + width + 'px ' + spread + 'px ' + color;
    value_hover = left + 'px ' + top + 'px ' + width + 'px ' + spread + 'px ' + hovcolor;

    this.putCSS(data, value, 'normal');
    this.putCSS(data, value_hover, 'hover');

    this.reloaded.boxshadow = true;
		//$('.output .result').find('a.normal').css("boxShadow",left + 'px ' + top + 'px ' + width + 'px ' + spread + 'px ' + color);
		//$('.output .result').find('a.hover').css("boxShadow",left + 'px ' + top + 'px ' + width + 'px ' + spread + 'px ' + hovcolor);
	}

maxLivePreview.prototype.updateTextShadow = function(target)
	{
	//	hover = hover || false;
  if (this.reloadInProgress && typeof this.reloaded.textshadow !== 'undefined')
      return;

		var left = this.getFieldByID("text_shadow_offset_left").val();
		var top = this.getFieldByID("text_shadow_offset_top").val();
		var width = this.getFieldByID("text_shadow_width").val();

		var color = this.getFieldByID("text_shadow_color").val();
		var hovcolor = this.getFieldByID("text_shadow_color_hover").val();

		var id = $(target).attr('id');

		var data = this.currentFields[id];
    if (typeof data == 'undefined') // field not defined.
      return;
		data.css = 'textShadow';

    if (color == '') color = 'rgba(0,0,0,0)';
    if (hovcolor == '') hovcolor = 'rgba(0,0,0,0)';

		var value = left + 'px ' + top + 'px ' + width + 'px ' + color;
		this.putCSS(data, value, 'normal');

		value = left + 'px ' + top + 'px ' + width + 'px ' + hovcolor;
		this.putCSS(data, value, 'hover');

    this.reloaded.textshadow = true;
	}

maxLivePreview.prototype.updateAnchorText = function (target)
	{
		var preview_text = $('.output .result').find('a .mb-text');

		// This can happen when the text is removed, button is saved, so the preview doesn't load the text element.
		if (preview_text.length === 0)
		{
			$('.output .result').find('a').append('<span class="mb-text"></span>');
		$('.output .result').find('a .mb-text').css({'display':'block','line-height':'1em','box-sizing':'border-box'});

			this.reloadFields();
		}
		$('.output .result').find('a .mb-text').text(target.val());
	}

maxLivePreview.prototype.updateGradientOpacity = function(target)
	{
		this.updateGradient(true);
		this.updateGradient(false);
	}

maxLivePreview.prototype.updateDimension = function ($field)
{
  if (this.reloadInProgress && typeof this.reloaded.dimension !== 'undefined')
      return;

    var id = $field.data('field');
    if (typeof id == 'undefined')
      var id = $field.attr('id');
    if (typeof id == 'undefined') // still don't want, then no.
      return;
    var data = {};

    // get the units.
    if (id.indexOf('width') >= 0)
    {
        var $field = this.getFieldByID('button_width');
        var $unitfield = this.getFieldByID('button_size_unit_width', true);
        data.css = 'width';
        var updatePreview = '.preview_border_width span';
        var unitUpdate = '.input.' + $field.attr('name') + ' .unit';
    }
    else if(id.indexOf('height') >= 0)
    {
      var $field = this.getFieldByID('button_height');
      var $unitfield = this.getFieldByID('button_size_unit_height', true);
      data.css = 'height';
      var updatePreview = '.preview_border_height span';
      var unitUpdate = '.input.' + $field.attr('name') + ' .unit';
    }

    var dimension = $field.val();
    var unit = $unitfield.filter(':checked').val();

    if (dimension == 0)
    {
       unit = '';
       dimension = 'auto';
       this.putCSS(data, 'auto');
    }

    if (unit == 'percent')
      unit = '%';
    if (unit == 'pixel')
      unit = 'px';

    data.css_unit = unit;

    $(updatePreview).text(dimension + unit);
    $(updatePreview).css('width', dimension + unit);
    this.putCSS(data, dimension);
    $(unitUpdate).text(unit);

    this.reloaded.dimension = true;
}

maxLivePreview.prototype.updateRadius = function(target)
{
  if (this.reloadInProgress && typeof this.reloaded.radius !== 'undefined')
      return;

  var value = target.val();
  var fields = ['radius_bottom_left', 'radius_bottom_right', 'radius_top_left', 'radius_top_right'];

  var toggle = this.getFieldByID('radius_toggle');

  if ( $(toggle).data('lock') == 'lock')
  {
  	for(i=0; i < fields.length; i++)
  	{
  		var $field = this.getFieldByID(fields[i]); // find the real field.
      $field.val(value); // set value via locking
      var id = $field.attr('id'); // get the real id, from element.
  		var data = this.currentFields[id];
  		this.putCSS(data,value + 'px'); // update

  	}
  }
  else {  // update as regular single field
    var value = $(target).val();
    var id = $(target).attr('id');
    var data = this.currentFields[id];
    this.putCSS(data, value);
  }

  this.reloaded.radius = true;

}

maxLivePreview.prototype.getGradient = function(hover)
{
		hover = hover || false;


		var hovtarget = '';
		if (hover)
			hovtarget = "_hover";

		var stop = parseInt(this.getFieldByID('gradient_stop').val());

		if (isNaN(stop) )
			stop = 45;

		var gradients_on = this.getFieldByID('use_gradient').prop('checked');

    var color = this.getFieldByID('gradient_start_color' + hovtarget).val();
    var endcolor = this.getFieldByID('gradient_end_color' + hovtarget).val();

    if (color == '') color = 'rgba(0,0,0,0)';
    if (endcolor == '') endcolor = 'rgba(0,0,0,0)';

		var start = this.hexToRgb(color);
		var end = this.hexToRgb(endcolor);
		var startop = parseInt(this.getFieldByID('gradient_start_opacity' + hovtarget).val());
		var endop = parseInt(this.getFieldByID('gradient_end_opacity' + hovtarget).val());

			if (! gradients_on)
			{
				end = start;
				endop = startop;
			}

			if(isNaN(startop)) startop = 100;
			if(isNaN(endop)) endop = 100;



    if (start.indexOf('rgba') < 0)
      var startrgba = "rgba(" + start + "," + (startop/100) + ") ";
    else
      var startrgba = start;

    if (end.indexOf('rgba')  < 0)
      var endrgba = "rgba(" + end + "," + (endop/100) + ") ";
    else
      var endrgba = end;

    var gradient = 'linear-gradient(' + startrgba + stop + "%," +  endrgba + ')';

    return gradient;

}

maxLivePreview.prototype.updateGradient = function(hover)
{
  if (this.reloadInProgress && typeof this.reloaded.gradient !== 'undefined')
      return;

  var gradient = this.getGradient(hover);

  if (!hover)
		var button = $('.output .result').find('a.normal');
	else
		var button = $('.output .result').find('a.hover');

  button.css("background", gradient);

  $(document).trigger('livepreview/gradient/updated', [gradient, hover]);
    this.reloaded.gradient =  true;
}

maxLivePreview.prototype.updateContainerUnit = function($field)
{
  var $field = this.getFieldByID('container_width_unit', true);
  var val = $field.filter(':checked').val();

  if (val == 'pixel')
    val = 'px';
  else
    val = '%';

  var cwidth = this.getFieldByID('container_width').attr('name');

  $('.option.' + cwidth + ' .unit').text(val);
}

maxLivePreview.prototype.setPreset = function(e)
{
  var options = $('#' + this.currentScreen + '_preset-hidden').val();
  var setPreset = $('#' + this.currentScreen + '_preset option:selected').val();
  options = $.parseJSON(options);


  var $minfield = $('#' + this.currentScreen + '_min_width');
  var $maxfield = $('#' + this.currentScreen + '_max_width');

  if (options[setPreset] && setPreset !== 'none')
  {
     var option = options[setPreset];
     var minwidth = option.minwidth;
     var maxwidth = option.maxwidth;

     if (minwidth <= 0) minwidth = 0;
     if (maxwidth <= 0) maxwidth = 0;

     $minfield.val(minwidth);
     $maxfield.val(maxwidth);
  }

}

maxLivePreview.prototype.hexToRgb = function(hex) {
      if (hex.indexOf('rgba') >= 0)
        return hex;

			hex = hex.replace('#','');
			var bigint = parseInt(hex, 16);
			var r = (bigint >> 16) & 255;
			var g = (bigint >> 8) & 255;
			var b = bigint & 255;

			return r + "," + g + "," + b;
}
