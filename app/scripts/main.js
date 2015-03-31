'use strict';

var bungie = new bungie();

bungie.user(function(u) {
	if(u.error) {
			printError('Error loading user. Make sure your account is <a href="http://www.bungie.net">linked with bungie.net and you are logged in</a>.');
			return;
	}
  
  

  /*
	var toggle = document.getElementById('system');
	chrome.storage.sync.get('system', function(res) {
		if(res.system !== undefined) {
			bungie.setsystem(res.system);
			toggle.value = res.system;
		}
		loadUser();
	});

	if(bungie.system().xbl.id !== undefined && bungie.system().psn.id !== undefined) {
		toggle.style.display = 'block';
		toggle.addEventListener('change', function() {
			bungie.setsystem(this.value);
			chrome.storage.sync.set({'system': this.value});
			loadUser();
		});
	} 
  */
});