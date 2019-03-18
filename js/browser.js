$(document).ready(function() {
    document.getElementById('name-input').addEventListener('keyup', function (event) {
        event.preventDefault();
        if (event.keyCode == 13) {
            doSearch();
        } 
    });
    
    document.getElementsByClassName('navbar-brand')[0].addEventListener('click', browseTo(''));

    showObjects(false, true);

    if (supportsLocalStorage()) {
        var navbar = document.getElementById('navbar-content');
        var link = document.createElement('a');
        link.setAttribute('class', 'nav-link clickable');
        link.appendChild(document.createTextNode('Favorites'));
        link.addEventListener('click', browseTo('favorites'));
        var menuItem = document.createElement('li');
        menuItem.setAttribute('class', 'nav-item');
        menuItem.appendChild(link);
        navbar.appendChild(menuItem);

        var favString = window.localStorage.getItem('favorites');
        if (favString) {
            window.favorites = JSON.parse(favString);
        }
    }
});

function setCategoryMenu() {
    var categories = getUniqueCategories();
    var categoryNames = Object.keys(categories);
    categoryNames.sort();
    var dropdown = document.getElementById('category-dropdown');
    for (var i = 0; i < categoryNames.length; i++) {
        var category = categoryNames[i];
        var count = categories[category];
        var link = document.createElement('a');
        link.setAttribute('class', 'dropdown-item clickable');
        link.appendChild(document.createTextNode(`${category} (${count})`));
        link.addEventListener('click', browseTo('tag:' + category));
        dropdown.appendChild(link);
    }
}

function findWithoutCategory() {
    showObjects(function(obj) {
        return !window.categories[obj[1]];
    });
}

function browseTo(searchTag) {
    return function() {
        document.getElementById('name-input').value = searchTag;
        doSearch();
    };
}

setCategoryMenu();

function doSearch() {
    var search = document.getElementById('name-input').value.toLowerCase().trim();

    if (search.length === 0) {
        showObjects(false, true);
        return;
    }

    if (search.startsWith("tag:")) {
        showObjects(function (obj) {
            return hasCategory(obj, search.substring(4));
        });
    } else if(search === 'favorites') {
        showObjects(function (obj) {
            return isFavorite(obj[1]);
        });
    } else {
        showObjects(function(obj) {
            return obj[1].toLowerCase().includes(search);
        });
    }    
}

function getPreviewForObject(object, small) {
    return `https://cdn.rage.mp/public/odb/imgs${small ? '-small' : ''}/${object[1]}-${object[0]}.jpg`;
}

function hasCategory(obj, category) {
    return window.categories[obj[1]] && window.categories[obj[1]].filter(function (cat) {
        return cat.toLowerCase() === category.toLowerCase();
    }).length > 0;
}

function createCardForObject(object) {
    var card = document.createElement('div');
    card.setAttribute('class', 'card mb-4 shadow-sm');

    var thumbnailLink = document.createElement('a');
    thumbnailLink.setAttribute('href', getPreviewForObject(object));
    thumbnailLink.setAttribute('data-lightbox', object[1]);
    thumbnailLink.setAttribute('data-title', object[1]);

    var thumbnail = document.createElement('img');
    thumbnail.setAttribute('class', 'bd-placeholder-img card-img-top');
    thumbnail.setAttribute('src', getPreviewForObject(object, true));
    thumbnail.addEventListener('error', function() {
        thumbnail.src = '/img/fallback.jpg';
    });
    thumbnailLink.appendChild(thumbnail);

    var cardBody = document.createElement('div');
    cardBody.setAttribute('class', 'card-body');
    
    var cardText = document.createElement('p');
    cardText.setAttribute('class', 'card-text clickable');
    cardText.setAttribute('title', 'Copy to Clipboard');
    cardText.appendChild(document.createTextNode(object[1]));
    cardText.addEventListener('click', copyToClipboard(object[1]));

    var cardControl = document.createElement('div');
    cardControl.setAttribute('class', 'd-flex justify-content-between align-items-center');

    var btnGroup = document.createElement('div');
    btnGroup.setAttribute('class', 'btn-group');

    if (window.categories[object[1]]) {
        var categories = window.categories[object[1]];
        for (var i = 0; i < categories.length; i++) {
            var category = categories[i];
            var btn = document.createElement('a');
            btn.setAttribute('class', 'btn btn-sm btn-outline-secondary clickable');
            btn.innerHTML = category;
            btn.addEventListener('click', browseTo('tag:' + category));
            btnGroup.appendChild(btn);
        }
    }
    
    var infoText = document.createElement('small');
    infoText.setAttribute('class', 'text-muted');
    infoText.appendChild(document.createTextNode(object[0]));
    
    var favBtn = document.createElement('i');
    favBtn.setAttribute('class', 'fav-btn fa-star clickable ' + (isFavorite(object[1]) ? 'fas' : 'far'));
    favBtn.addEventListener('click', function(e) {
        toggleFavorite(object[1]);
        if (isFavorite(object[1])) {
            e.target.classList.remove('far');
            e.target.classList.add('fas');
        } else {
            e.target.classList.add('far');
            e.target.classList.remove('fas');
        }
    });
    infoText.appendChild(favBtn);

    cardControl.appendChild(btnGroup);
    cardControl.appendChild(infoText);

    cardBody.appendChild(cardText);
    cardBody.appendChild(cardControl);
    
    card.appendChild(thumbnailLink);
    card.appendChild(cardBody);
    
    var col = document.createElement('div');
    col.setAttribute('class', 'col-md-4');
    col.appendChild(card);

    return col;
}

function getUniqueCategories() {
    var categoryArrays = Object.keys(window.categories).map(function (name) {
        return window.categories[name];
    });

    var categories = {};

    for (var i = 0; i < categoryArrays.length; i++) {
        for (var j = 0; j < categoryArrays[i].length; j++) {
            var old = categories[categoryArrays[i][j]] || 0
            categories[categoryArrays[i][j]] = old + 1;
        }
    }

    return categories;
}

window.currentObjects = [];
window.page = 0;
window.favorites = [];
var pageSize = 100;

function showObjects(filter, defaultView) {
    window.currentObjects = defaultView ? window.objects.slice(0, window.objects.length) : window.objects.filter(filter);
    console.log(window.currentObjects.length + ' objects');
    window.currentObjects.sort(function(obj1, obj2) {
        return obj1[1] - obj2[1];
    })

    setPage(0);
}

function browseToPage(page) {
    return function() {
        setPage(page);
    }
}

function getPageBrowseButton(page, text, activateable) {
    var btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.setAttribute('class', 'btn btn-outline-secondary');
    if (window.page == page && activateable) {
        btn.classList.add('btn-secondary');
        btn.classList.remove('btn-outline-secondary');
    }
    btn.appendChild(document.createTextNode(text));
    btn.addEventListener('click', browseToPage(page));
    return btn;
}

function setPage(newPage) {
    window.page = newPage;
    var availPages = Math.ceil(currentObjects.length / pageSize);

    var content = document.getElementById('content');
    while (content.firstChild) {
        content.removeChild(content.firstChild);
    }

    if (availPages > 1) {
        var paginationControl = document.createElement('div');
        paginationControl.setAttribute('class', 'btn-group mr-2 pagination-control');
        paginationControl.setAttribute('role', 'group');

        var pagesBefore = Math.min(Math.max(0, window.page), 5);
        var pagesAfter = Math.min(availPages - window.page - 1, 10 - pagesBefore);

        if (window.page > 0) {
            paginationControl.appendChild(getPageBrowseButton(0, '<<', false));
            paginationControl.appendChild(getPageBrowseButton(window.page - 1, '<', false));
        }
        
        for (var i = window.page - pagesBefore; i < (window.page + pagesAfter + 1); i++) {
            paginationControl.appendChild(getPageBrowseButton(i, i + 1, true));
        }

        if ((window.page + 1) < availPages) {
            paginationControl.appendChild(getPageBrowseButton(window.page + 1, '>', false));
            paginationControl.appendChild(getPageBrowseButton(availPages - 1, '>>', false));
        }

        

        content.appendChild(paginationControl);
    }

    var row = document.createElement('row');
    row.setAttribute('class', 'row');

    window.currentObjects.slice(window.page * pageSize, (window.page + 1) * pageSize).forEach(function(obj) {
        row.appendChild(createCardForObject(obj));
    });

    var content = document.getElementById('content');
    content.appendChild(row);

    var heading = document.createElement('small');
    heading.appendChild(document.createTextNode(`Page ${page + 1} of ${availPages}, ${currentObjects.length} total objects`));
    content.appendChild(heading);

    if (availPages > 0) {
        if ((window.page + 1) < availPages) {
            var btnNext = document.createElement('button');
            btnNext.setAttribute('type', 'button');
            btnNext.setAttribute('class', 'btn btn-sm btn-outline-secondary');
            btnNext.innerHTML = 'Next Page';
            btnNext.style.cssFloat = 'right';
            btnNext.addEventListener('click', function() {
                setPage(window.page + 1);
                window.scrollTo({top: 0, behavior: 'smooth'});
            })
            content.appendChild(btnNext);
        }

        if (window.page > 0) {
            var btnPrev = document.createElement('button');
            btnPrev.setAttribute('type', 'button');
            btnPrev.setAttribute('class', 'btn btn-sm btn-outline-secondary');
            btnPrev.innerHTML = 'Previous Page';
            btnPrev.style.cssFloat = 'right';
            btnPrev.style.marginRight = '10px';
            btnPrev.addEventListener('click', function() {
                setPage(window.page - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            })
            content.appendChild(btnPrev);
        }
    }
}

function copyToClipboard(text) {
    return function() {
        var area = document.createElement('textarea');;
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
    };
}

function supportsLocalStorage() {
    return typeof(Storage) !== "undefined";
}

function saveFavorites() {
    window.localStorage.setItem('favorites', JSON.stringify(window.favorites));
}

function isFavorite(objectName) {
    return window.favorites.indexOf(objectName) !== -1;
}

function toggleFavorite(objectName) {
    var index = window.favorites.indexOf(objectName)
    if (index !== -1) {
        window.favorites.splice(index, 1);
    } else {
        window.favorites.push(objectName);
    }

    saveFavorites();
}

function addToCategory(category, ...objects) {
    for (var i = 0; i < objects.length; i++) {
        if (!window.categories[objects[i]]) {
            window.categories[objects[i]] = [];
        }

        if (window.categories[objects[i]].indexOf(category) === -1) {
            window.categories[objects[i]].push(category);
        }
    }
}