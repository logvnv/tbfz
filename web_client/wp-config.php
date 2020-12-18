<?php
/**
 * Основные параметры WordPress.
 *
 * Скрипт для создания wp-config.php использует этот файл в процессе
 * установки. Необязательно использовать веб-интерфейс, можно
 * скопировать файл в "wp-config.php" и заполнить значения вручную.
 *
 * Этот файл содержит следующие параметры:
 *
 * * Настройки MySQL
 * * Секретные ключи
 * * Префикс таблиц базы данных
 * * ABSPATH
 *
 * @link https://ru.wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Параметры MySQL: Эту информацию можно получить у вашего хостинг-провайдера ** //
/** Имя базы данных для WordPress */
define( 'DB_NAME', 'tbfz' );

/** Имя пользователя MySQL */
define( 'DB_USER', 'root' );

/** Пароль к базе данных MySQL */
define( 'DB_PASSWORD', '' );

/** Имя сервера MySQL */
define( 'DB_HOST', 'localhost' );

/** Кодировка базы данных для создания таблиц. */
define( 'DB_CHARSET', 'utf8mb4' );

/** Схема сопоставления. Не меняйте, если не уверены. */
define( 'DB_COLLATE', '' );

/**#@+
 * Уникальные ключи и соли для аутентификации.
 *
 * Смените значение каждой константы на уникальную фразу.
 * Можно сгенерировать их с помощью {@link https://api.wordpress.org/secret-key/1.1/salt/ сервиса ключей на WordPress.org}
 * Можно изменить их, чтобы сделать существующие файлы cookies недействительными. Пользователям потребуется авторизоваться снова.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         '16{mlnBym8BE(fj0Tmw$j(Q6kC-+zcF!8)&!R#7F>_7>]hjN]M6(9,>x Rmix32z' );
define( 'SECURE_AUTH_KEY',  '{5K0;?A`x.N>Wj_pgMn}&Yj26Ylm:r4|2X[0ASwFM]uNecXEOogYTdOp19q=q:-P' );
define( 'LOGGED_IN_KEY',    '$?Gx2z42)u7|Ev=es]?#U!e$ja9B=&*#C;/(cur1c-k7#^PquzcQ:gx:3ks%r<r;' );
define( 'NONCE_KEY',        '3kVN3;^a^mZ:vy<lUD>2;s&QTm/KjylWtz-BSx.{TuX/MOk5OQgBUqW7*$$w(5Fw' );
define( 'AUTH_SALT',        '|b~-im Zd),bjA1lRscrejSm5WAQ}8oycFa@4vL/m~]R,jqzF_N<)N!jfU>6xSFG' );
define( 'SECURE_AUTH_SALT', 'vRWl]Xk|eRc7koHXS7cAEJO4%xi+,r,IW28h@(Kh11O`xQM[GL,PA.*&CP*I2cf1' );
define( 'LOGGED_IN_SALT',   'Dp/4P45qfzB,b_xP(taZJM3`2)a&aOM^?9WjXzj0]eZv%T=TJn)g*WC!Cc4RAADd' );
define( 'NONCE_SALT',       '|c8E$k X1,h.g?.pGrj0J<5E+_ (O89tEsj(ODg}_y~=O47Qn-z+~]Xh^eHB!3p$' );

/**#@-*/

/**
 * Префикс таблиц в базе данных WordPress.
 *
 * Можно установить несколько сайтов в одну базу данных, если использовать
 * разные префиксы. Пожалуйста, указывайте только цифры, буквы и знак подчеркивания.
 */
$table_prefix = 'tbfz_';

/**
 * Для разработчиков: Режим отладки WordPress.
 *
 * Измените это значение на true, чтобы включить отображение уведомлений при разработке.
 * Разработчикам плагинов и тем настоятельно рекомендуется использовать WP_DEBUG
 * в своём рабочем окружении.
 *
 * Информацию о других отладочных константах можно найти в документации.
 *
 * @link https://ru.wordpress.org/support/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', false );

/* Это всё, дальше не редактируем. Успехов! */

/** Абсолютный путь к директории WordPress. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Инициализирует переменные WordPress и подключает файлы. */
require_once ABSPATH . 'wp-settings.php';
