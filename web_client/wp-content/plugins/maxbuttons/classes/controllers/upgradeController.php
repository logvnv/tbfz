<?php

namespace MaxButtons;

class upgradeController extends MaxController
{

  protected $view_template = 'maxbuttons-pro';

  public function view()
  {
    if ($this->page == 'social-share')
      $this->view_template = 'social-share';

    parent::view();
  }

  // no posts.
  public function handlePost()
  {
    return false;
  }
} // controller
