<?php
namespace MaxButtons;
defined('ABSPATH') or die('No direct access permitted');

$button_id = $this->view->button_id;
$button = $this->view->button;

$admin = MB()->getClass('admin');
$page_title = __("Button editor","maxbuttons");
$action = $this->getButton('add-new', array('add_class' => 'page-title-action add-new-h2')); //"<a class='page-title-action add-new-h2' href='" . $this->getButtonLink() . "'>" . __('Add New', 'maxbuttons') . "</a>";
$admin->get_header(array("title" => $page_title, "title_action" => $action) );
 ?>
		<form id="new-button-form" action="<?php echo $this->getButtonLink($button_id, array('noheader' => true));  ?>" method="post">
			<input type="hidden" name="button_id" value="<?php echo $button_id ?>">
      <input type="hidden" name="button_is_new" value="<?php echo $this->view->button_is_new ?>" />
			<?php wp_nonce_field("button-edit","maxbuttons_button") ?>
			<?php wp_nonce_field("button-copy","copy_nonce"); ?>
			<?php wp_nonce_field("button-delete","delete_nonce"); ?>
			<?php wp_nonce_field('button-trash', 'trash_nonce'); ?>

			<div class="form-actions">
        <?php
          echo $this->getButton('save');
          if ($button_id > 0)
          {
            echo $this->getButton('copy');
            echo $this->getButton('trash');
            echo $this->getButton('delete');
          }
        ?>
			</div>



			<?php
			/** Display admin notices [deprecated]
			* @ignore
			*/
			/** Display admin notices
			*
			*   Hook to display admin notices on error and other occurences in the editor. Follows WP guidelines on format.
			*   @since 4.20
			*/
			do_action("mb/editor/display_notices");
			?>

			<?php if ($button_id > 0): ?>
			<div class="mb-message shortcode">
				<?php $button_name = $button->getName();

				 ?>
				<?php _e('To use this button, place the following shortcode anywhere you want it to appear in your site content:', 'maxbuttons') ?>
				<strong>[maxbutton id="<?php echo $button_id ?>"]</strong>

				<p><?php _e("Shortcode options can make using MaxButtons much easier! Check all possible options", 'maxbuttons'); ?> </p>

        <?php $opened = (isset($_GET['copied'])) ? 'open' : 'closed'; ?>
				<span class='shortcode-expand <?php echo $opened ?>'><h4><?php _e("How to make your life easier","maxbuttons"); ?>
							<span class="dashicons-before <?php echo (isset($_GET['copied'])) ? 'dashicons-arrow-up' : 'dashicons-arrow-down' ?>"></span>
				</h4>

				</span>

				<div class="expanded" <?php echo ($opened == 'open') ? 'style="display:inline-block;"' : '' ?>>
					<p class="example">
						<strong><?php _e("Add a button by using the button name","maxbuttons"); ?></strong>
						&nbsp; [maxbutton name="<?php echo $button_name; ?>"]
					</p>
					<p class="example">
					<strong><?php _e("Same button with different link","maxbuttons");  ?></strong>
						&nbsp; [maxbutton id="<?php echo $button_id ?>" url="http://yoururl"]
					</p>

					<p class="example"><strong><?php _e("Same button with diffent text","maxbuttons"); ?> </strong>
						&nbsp; [maxbutton id="<?php echo $button_id ?>" text="yourtext"]
					</p>
					<p class="example"><strong><?php _e("All possible shortcode options","maxbuttons"); ?></strong>
						&nbsp; [maxbutton id="<?php echo $button_id ?>" text="yourtext" url="http://yoururl" linktitle="tooltip" window="new" nofollow="true"]
					</p>

					<h4><?php _e("More tips","maxbuttons"); ?></h4>
					<p><?php _e("If you use this button on a static page, on multiple pages, or upload your theme to another WordPress installation choose an unique name and use ",
						"maxbuttons"); ?>  <strong>[maxbutton name='my-buy-button' url='http://yoururl']</strong>.
					</p>

					<p> <?php _e("By using this syntax when you edit and save your button it will be changed everywhere it is used on your site. If you delete the button and create a new one with the same name the new button will be used on your site. Easy!","maxbuttons"); ?>
				 	</p>

				</div>
			</div>
			<?php endif; ?>

    <!-- preview -->
		<div class="output">
			<div class="header"><?php _e('Preview', 'maxbuttons') ?>
				<span class='preview-toggle dashicons dashicons-arrow-up'> </span>
			</div>


			<div class="inner">
          <?php

            $width = $this->getCurrentScreen()->getValue('button_width');
            $w_unit = $this->getCurrentScreen()->getValue('button_size_unit_width');

            $height = $this->getCurrentScreen()->getValue('button_height');
            $h_unit = $this->getCurrentScreen()->getValue('button_size_unit_height');

            $w_unit = ($w_unit == 'pixel') ? __('px', 'maxbuttons') : '%';
            $h_unit = ($h_unit == 'pixel') ? __('px', 'maxbuttons') : '%';

            if ($height == 0)
            {
               $height = __('auto', 'maxbuttons');
               $h_unit = '';
            }
            if ($width == 0)
            {
                $width = __('auto', 'maxbuttons');
                $w_unit = '';
            }
          ?>
				<p><?php _e('The top is the normal button, the bottom one is the hover.', 'maxbuttons') ?></p>


				<div class="result ">
          <div class='border_wrapper'>
            <div class='preview_border_height'><span style="width: <?php echo $height . $h_unit ?>"><?php echo $height  . $h_unit ?></span> </div>
					       <?php $button->display(array("mode" => 'editor', "load_css" => "inline", "preview_part" => "normal"));  ?>
            <div class='preview_border_width'><span><?php echo $width  . $w_unit ?></span></div>
          </div>

					<p>&nbsp;</p>

          <div class='border_wrapper'>
            <div class='preview_border_height'><span style="width: <?php echo $height . $h_unit ?>"><?php echo $height . $h_unit ?></span> </div>
					       <?php $button->display(array("mode" => 'editor', "preview_part" => ":hover", "load_css" => "inline")); ?>
             <div class='preview_border_width'><span><?php echo $width . $w_unit ?></span></div>
          </div>
				</div>

				<input type='hidden' id='colorpicker_current' value=''>

				<div class="input mbcolor preview nodrag">
					<input type="text" name="button_preview" id="button_preview" class="mb-color-field" value="#ffffff">
				</div>

				<div class="note"><?php _e('Change this color to see your button on a different background.', 'maxbuttons') ?></div>
				<input  type="hidden" id="button_preview" value='' />
				<input style="display: none;" type="text" id="button_output" name="button_output" value="" />

				<div class="clear"></div>
			</div> <!-- inner -->
		</div> <!-- output -->

     <div class='editor'>
        <input type='hidden' id='current_screen' name='current_screen' value='<?php echo $this->view->currentScreen ?>' />
        <div class="screen-option-wrapper">
      <?php
      $screens = $this->view->screens;
      ?>
      <?php foreach($screens as $screen): // show screen menu icons
        $screen_type = ($screen->is_responsive()) ? 'responsive' : 'default';
        $screen_type = ($screen->is_new()) ? 'new' : $screen_type;

        // @todo add sensible sizes from screen here. If possible
        $min_width = $max_width = 0;
        if ($screen->is_responsive())
        {
          $min_width = $this->getCurrentScreen()->getValue($screen->getFieldID('min_width'));
          $max_width = $this->getCurrentScreen()->getValue($screen->getFieldID('max_width'));
        }

        // default.
        //$title = ($screen->is_new()) ?  : $title;

         $current = ($screen->id == $this->view->currentScreen) ? 'option-active' : '';

         switch ($screen_type)
         {
           case 'new':
            $icon = 'dashicons-plus';
           break;
           case 'responsive':
            if ($min_width >= 1024)
              $icon = 'dashicons-laptop';
            else
              $icon =  'dashicons-smartphone';
           break;
           case 'default':
           default:
            $icon = 'dashicons-desktop';
           break;
         }

         $display = '';

         if ($screen->is_default())
         {
           $title =  __('Your main button for all screens. ', 'maxbuttons');
         }
         elseif ($screen->is_new())
         {
            $title = __('Add a new responsive screen', 'maxbuttons');
         }
         elseif ($min_width && $max_width)
         {
            $display = $min_width . __('px', 'maxbuttons') . ' - ' . $max_width . __('px', 'maxbuttons');
            $title = sprintf(__('Shows at screen size from %s to %s', 'maxbuttons'), $min_width . __('px', 'maxbuttons'), $max_width . __('px', 'maxbuttons'));
         }
         elseif (! $min_width && $max_width)
         {
            $display = '< ' . $max_width . __('px', 'maxbuttons');
            $title = sprintf(__('Shows at screen size smaller than %s', 'maxbuttons'), $max_width . __('px', 'maxbuttons'));

         }
         elseif (! $max_width && $min_width)
         {
            $display = '> ' . $min_width . __('px', 'maxbuttons');
            $title = sprintf(__('Shows at screen size bigger than %s', 'maxbuttons'), $min_width . __('px', 'maxbuttons'));
         }
         elseif (! $min_width && ! $max_width) // if somebody does something like this :/
         {
            $display = '';
            $title = sprintf(__('Set width and height to use this responsive screen', 'maxbuttons'));
         }

        ?>
        <input type="hidden" name="screens[]" value="<?php echo $screen->id ?>" />
      <div class='screen-option <?php echo $current ?>' data-screenid="<?php echo $screen->id ?>" data-screentype="<?php echo $screen_type ?>" title="<?php echo $title ?>">
        <div class='wrapper'>
          <span class='dashicons <?php echo $icon ?>'></span>
          <span class='screen_name'><?php echo $screen->name ?></span>
          <?php if ($screen->is_responsive()) {
              echo "<span class='screen_size'>" . $display  . "</span>";
          } ?>
        </div>
      </div>
    <?php endforeach; ?>



<?php echo $this->getButton('save', array('add_class' => 'screen-option ')); ?>

  </div> <!-- screen option wrapper -->
      <?php foreach($screens as $screen): // load screen editors
        $current = ($screen->id == $this->view->currentScreen) ? 'current-screen' : '';
        ?>
        <div id='screen_<?php echo $screen->id ?>' class='mbscreen-editor <?php echo $current ?>' data-screenid="<?php echo $screen->id ?>">
            <?php $this->showScreenEditor($screen);
            ?>
        </div>
    <?php endforeach; ?>


    </div>
			<div class="form-actions">

        <?php echo $this->getButton('save'); ?>
			</div>

		</form>


		<?php // output the link dialog thing

		if ( ! class_exists( '_WP_Editors', false ) )
        require( ABSPATH . WPINC . '/class-wp-editor.php' );

		//add the interface of the link picker.
		\_WP_Editors::wp_link_dialog() ?>

	</div>
<?php $admin->get_footer(); ?>
