var firstScroll = true;

function highlight(container, target, shouldScroll){
	$('.highlighted').removeClass('highlighted');
	target.parent().addClass('highlighted');
	if(shouldScroll){
		var toWindowTop = target.offset().top - container.offset().top,
			offset = 100,
			desired,
			current = container.scrollTop(),
			duration;

		if(firstScroll){
			desired = target.offset().top + current - container.offset().top - window.innerHeight/2 + offset;	
		}
		else if(toWindowTop < offset){
			desired = target.offset().top + current - container.offset().top - offset;
		}
		else if(toWindowTop > window.innerHeight - offset){
			desired = target.offset().top + current - container.offset().top - window.innerHeight + offset;			
		}

		if(desired !== undefined){
			container.stop();
			duration = Math.abs(desired - current)/2;
			if(duration > 25 && !firstScroll){
				container.animate(
					{scrollTop:	desired + "px"},
					duration,
					'linear'
				);
			}
			else{
				container.scrollTop(desired);
			}
		}
		firstScroll = false;
	}
}

function appendMembers(div){
	return function(){
		var name = $(this).find('h4').attr('id');
		div.append('<code><a href="#' + name + '">' + name + '</a></code> ');
	};
}

$(function () {
	$('body>footer').css('margin-top', window.innerHeight - $('body>footer').outerHeight() - 70);

	var shouldScroll = true;
	var navbar = $('body>nav');
	var timeout = null;

	function setScroll(val){
		if(timeout){
			clearTimeout(timeout);
			timeout = null;
		}
		shouldScroll = val;
	}

	navbar.mouseenter(function(){
		setScroll(false);
	});
	navbar.mouseleave(function(){
		setScroll(true);
	});
	navbar.mousedown(function(){
		setScroll(true);
	});
	navbar.mouseup(function(){
		timeout = setTimeout(function(){
			setScroll(false);
		}, 0);
	});

	var title = $('.page-title');
	var className = title.attr('id');
	if(className == 'Global')
		className = 'global';
	var container = $('body>nav');

	if(className)
	  $('.nav-item.' + className + ', .nav-item.global').show();
	else
	  $('.nav-item.global').show();


	function highlightCurrent(hash){
		var link = className + '.html#' + hash;
		var target = $('body>nav a[href="' + link + '"]');
		if(!target.size()){
			target = $('body>nav a[href="' + className + '.html"]');
		}
		if(!target.size()){
			target = $('body>nav a[href="external-' + className + '.html"]');
		}
		if(!target.size()){
			target = $('body>nav a[href="global.html#' + hash + '"]');
		}
		if(target.size())
			highlight(container, target, shouldScroll);
	}

	var currentHash = document.location.hash.substr(1);
	highlightCurrent(currentHash);
	$(document).scroll(function () {
		var lastHash, 
			lastDistance = Infinity,
			selector = 'h4.name, h1.page-title';
		if(className && className != 'global')
			selector += ', h3.subsection-title';
		$(selector).each(function () {
			var top = window.pageYOffset;
			var distance = top - $(this).offset().top;
			var hash = $(this).attr('id');
			if (distance >= -18 && distance < lastDistance) {
				lastHash = hash;
				lastDistance = distance;
			}
		});
		if(lastHash && currentHash != lastHash){
			history.pushState(null, null, '#' + lastHash);
			currentHash = lastHash;
			highlightCurrent(lastHash);
		}
	});

	var div, dl, dd, li, nav,
		methods = $('#methods'),
		members = $('#members');
	if(methods.size() || members.size()){
		dl = $('.container-overview .details');
		if(!dl.size()){
			dl = $('<dl class="details">');
			
			title.after(dl);
		}
		dl.append('<dt class="tag-source">Jump to:</dt>');
		dd = $('<dd>');
		dd.html('<ul class="dummy"><li></li></ul>');
		dl.append(dd);
		li = dd.find('li');
	}

	if(members.size()){
		div = $('<div class="members-list">');
		li.append('<strong><a href="#members">Members</a></strong> ');
		members.after(div);
		$('article>.section-members').each(appendMembers(div));

		if(className && className != 'global'){
			nav = $('<li>').addClass('nav-item').css('display', 'list-item');
			nav.html('\
				<span class="nav-item-name subsection"><a href="' + className + '.html#members">Members</a></span>\
			');
			navbar.find('.' + className).eq(0).before(nav);
		}

	}
	if(methods.size()){
		div = $('<div class="members-list">');
		li.append('<strong><a href="#methods">Methods</a></strong> ');
		methods.after(div);
		$('article>.section-method').each(appendMembers(div));

		if(className && className != 'global'){
			nav = $('<li>').addClass('nav-item').css('display', 'list-item');
			nav.html('\
				<span class="nav-item-name subsection"><a href="' + className + '.html#methods">Methods</a></span>\
			');
			navbar.find('.' + className + ' .type-function').eq(0).parent().before(nav);
		}
	}


});