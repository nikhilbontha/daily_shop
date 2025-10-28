document.addEventListener('DOMContentLoaded', function() {
	var backBtn = document.getElementById('btn-back') || document.getElementById('btn-back-inline');
	if (backBtn) {
		var goBack = function() {
			if (window.history.length > 1) {
				window.history.back();
			} else {
				window.location.href = '/';
			}
		};
		backBtn.addEventListener('click', goBack);
		backBtn.addEventListener('mousedown', goBack);
	}
});
