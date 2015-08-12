$(document).ready(function(){
	$('.tabs-menu__link').click(function() {
		var content = $(this).attr('href');
		$(content).show().siblings().hide();
		return false;
	});
});