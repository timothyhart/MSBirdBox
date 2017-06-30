// Set to the URL of your backend
var BACKEND_URL = "";

// Set to the URL of your central server
var ipAddressStr = window.location.href
var ipAddress = ipAddressStr.split(":")[1]; 
var address = "http:" + ipAddress +":80";
var CENTRAL_URL = address+"/MSBirdBox";
var PI_ID = "01";
// TODO: Improve these URLs..
var LOGIN_URL = CENTRAL_URL + "/learning-module/js/login.php";
var CENTRAL_DATABASE_JSON_URL = CENTRAL_URL + "/prototype/Admin-panel/exportdata.php";
var CENTRAL_DATABASE_COMMONBIRDS_URL = CENTRAL_URL + "/prototype/Admin-panel/exportCommonBirdsData.php";
var CENTRAL_DATABASE_BASE_URL = CENTRAL_URL + "/prototype/public/database";

// Date/time format passed to moment.js for formatting
var DATETIME_DISPLAY_FORMAT = "ll, LTS";

// Date format passed to moment.js for formatting
var DATE_DISPLAY_FORMAT = "ll";

// Time format passed to moment.js for formatting
var TIME_DISPLAY_FORMAT = "LTS";

// Duration format string passed to moment.js
var DURATION_DISPLAY_FORMAT = "h [hours,] m [minutes,] s [seconds]";
