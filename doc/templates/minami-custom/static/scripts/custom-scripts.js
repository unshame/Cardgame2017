var firstScroll = true;	//Скролл при загрузке страницы обрабатывается без анимации

$(function () {
	$('body>footer').css('margin-top', window.innerHeight - $('body>footer').outerHeight() - 70);

	var currentHash;
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

	//Когда курсор находится над боковой панели, отключаем скролл к элементам
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

	//Заменяем слеши в классе
	if(className){
		className = className.replace('/','_');
	}
	if(className == 'Global'){
		className = 'global';
	}
	var container = $('body>nav');	

	//Заменяем слеши в классах элементов боковой панели
	$('.nav-item').each(function(i){
		var c = $(this).attr('class')
		$(this).attr('class', c.replace('/', '_'));
	})

	//Показываем элементы боковой панели, относящиеся к текущему классу или global
	if(className){
	  $('.nav-item.' + className).show();
	}

	function tryLink(className, hash, prefix){
		if(!prefix){
			prefix = '';
		}
		var link = className + '.html#' + hash;
		var query1 = 'body>nav a[href="' + prefix + link + '"]';
		var query2 = 'body>nav a[href="' + prefix + className + '.html"]';
		var target = $(query1);
		if(!target.size()){
			target = $(query2);
		}
		return target;
	}

	//Находит и подсвечивает элемент в боковой панели в соответствии с текущим хэшем 
	function highlightCurrent(hash, forced){
		if(!forced && parseInt(navbar.css('left')) < 0){
			return;
		}
		var link = className + '.html#' + hash;
		var target = tryLink(className, hash);
		if(!target.size()){
			target = tryLink(className, hash, 'external-');
		}
		if(!target.size()){
			target = tryLink(className, hash, 'module-');
		}
		if(!target.size()){
			target = tryLink(hash, '', 'global.html#');
		}
		if(target.size())
			highlight(container, target, shouldScroll);
	}

	$(document).scroll(function () {
		var lastHash, 
			lastDistance = Infinity,
			selector = 'h4.name, h1.page-title';

		if(className)
			selector += ', h3.subsection-title';

		//Находим текущий раздел
		$(selector).each(function () {
			var top = window.pageYOffset;
			var distance = top - $(this).offset().top;
			var hash = $(this).attr('id');
			if (distance >= -50 && distance < lastDistance) {
				lastHash = hash;
				lastDistance = distance;
			}
		});

		//Изменяем url и подсвечиваем элемент, если хэш изменился 
		if(lastHash && currentHash != lastHash){
			history.replaceState(null, null, '#' + lastHash);
			currentHash = lastHash;
			highlightCurrent(lastHash);
		}
	});

	var dl, dd, li,
		methods = $('#methods'),
		members = $('#members'),
		typedefs = $('#typedefs');

	//Создаем контейнер для ссылок к разделам вверху страницы
	if(methods.size() || members.size() || typedefs.size()){
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

	//Members
	if(members.size()){
		addLinks(methods, navbar, li, className, 'members', 'type-member', 'Members');
	}

	//Methods
	if(methods.size()){
		addLinks(methods, navbar, li, className, 'methods', 'type-function', 'Methods');
	}

	//Typedefs
	if(typedefs.size()){
		addLinks(typedefs, navbar, li, className, 'typedefs', 'type-typedef', 'Type definitions');
	}

	//Фикс кнопки переключения панели
	var trigger = $('#nav-trigger');
	trigger.click(function(){
		setTimeout(function(){
			highlightCurrent(currentHash, true);
		}, 100);
	});

	//Подсветка элемента при загрузке страницы
	currentHash = document.location.hash.substr(1);
	highlightCurrent(currentHash);

});

//Подсвечивает элемент в боковой панели
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

//Добавляет ссылки на разделы в боковую панель
function addLinks(header, navbar, li, className, id, type, text){
	var div = $('<div class="members-list">');
	li.append('<strong><a href="#' + id + '">' + text + '</a></strong> ');
	header.after(div);
	if(className){
		var nav = $('<li>').addClass('nav-item').css('display', 'list-item');
		nav.html('<span class="nav-item-name subsection"><a href="' + className + '.html#' + id + '">' + text + '</a></span>');
		navbar.find('.' + className + ' .' + type).eq(0).parent().before(nav);
	}
}
