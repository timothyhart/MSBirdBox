<?php
// if(!isset($_SESSION))
// {
//     session_start();
// }

// set global variables
$GLOBALS['config'] = array(
    'mysql' => array(
        'host' => '127.0.0.1:20000',
        'username' => 'birdbox',
        'password' => 'birdbox',
        'db' => 'birdbox'
    ),
    'remember' => array(
        'cookie_name' => 'hash',
        'cookie_expiry' => 604800 
    ),
    'session' => array(
        'session_name' => 'user',
        'token_name' => 'token'
    )
);

spl_autoload_register(function($class){
    require_once 'classes/' . $class . '.php';
});

date_default_timezone_set("Australia/Brisbane");

require_once 'functions/sanitise.php';