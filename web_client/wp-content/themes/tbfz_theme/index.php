<!DOCTYPE html>
<html><head>
	<meta charset="utf-8" />
	<link rel="stylesheet" href="<?php echo get_stylesheet_uri() ?>" />
	<?php wp_head() ?>
</head>
<body>
	<?php get_header(); // вставка header.php ?>
	Привет мир!
	<?php get_footer(); // footer.php ?>
</body>
</html>