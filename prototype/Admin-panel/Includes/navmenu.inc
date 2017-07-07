<script type="text/javascript">
var checkBeforeLeaving = function(){
  if(sessionStorage.getItem("isAdmin")!== null ){
    if( sessionStorage.getItem("isAdmin") !== 0 ){
    $("#admin_link").attr("href", "../prototype/Admin-panel/brisbanebirds.php");
    return true;
    }
  } else {
    $("#admin_link").attr("href", "../");
    return true;
  }
}
</script><!-- Navigation menu for use across site -->

<nav class="home-menu pure-menu pure-menu-open pure-menu-horizontal pure-menu-fixed">
  <a href="index.php" class="pure-menu-heading">AB<sup>3</sup></a>
  <ul class="pure-menu-list">
        <li class="pure-menu-item"><a id="admin_link" href="#" class="pure-menu-link" onclick="checkBeforeLeaving()">Administrate</a></li>
        <li class="pure-menu-item pure-menu-item-alternate"><a href="../../../" onclick="javascript:event.target.port=3000" class="pure-menu-link">Record</a></li>
        <li class="pure-menu-item"><a href="../../learning-module/" class="pure-menu-link">Learn</a></li>
        <li class="pure-menu-item pure-menu-item-alternate"><a href="#" class="pure-menu-link">LoginRegister</a></li>
    </ul>
</nav>

<!-- <img src="../../learning-module-assets/favicon.png">  -->
