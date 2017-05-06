
function highlight(container, target, shouldScroll){
	$('.highlighted').removeClass('highlighted');
	target.parent().addClass('highlighted');
	if(shouldScroll){
		container.scrollTop(
			target.offset().top - container.offset().top + container.scrollTop() - 100
		);
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
	navbar.mouseenter(function(){
		shouldScroll = false;
	});
	navbar.mouseleave(function(){
		shouldScroll = true;
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
			lastDistance = Infinity;
		$('h4.name, h1.page-title').each(function () {
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

	var div, dl, dd, li,
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
	}
	if(methods.size()){
		div = $('<div class="members-list">');
		li.append('<strong><a href="#methods">Methods</a></strong> ');
		methods.after(div);
		$('article>.section-method').each(appendMembers(div));

	}


});