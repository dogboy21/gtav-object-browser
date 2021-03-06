$(document).ready(function() {
    document.getElementById('name-input').addEventListener('keyup', function (event) {
        event.preventDefault();
        if (event.keyCode == 13) {
            doSearch();
        } 
    });
    
    document.getElementById('search-button').addEventListener('click', function() {
        doSearch();
    });

    showObjects(false, true);

    if (supportsLocalStorage()) {
        var entry = document.createElement('li');
        entry.setAttribute('class', 'list-group-item d-flex justify-content-between align-items-center clickable preserve');
        entry.appendChild(document.createTextNode('Favorites'));
        entry.addEventListener('click', browseTo('favorites'));
        document.getElementById('menu-list').appendChild(entry);

        var favString = window.localStorage.getItem('favorites');
        if (favString) {
            window.favorites = JSON.parse(favString);
        }
    }

    document.getElementById('show-uncategorized').addEventListener('click', browseTo('tag:none'));

    setCategoryMenu();

    document.getElementById('edit-category-modal').querySelector('button.btn-outline-success').addEventListener('click', modifyObjectCategories(false, true, false));

    document.getElementById('sidebar-toggle').addEventListener('click', function(e) {
        var sidebar = document.getElementById('page-sidebar');
        var icon = document.querySelector('#sidebar-toggle i');
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            icon.classList.add('fa-times');
            icon.classList.remove('fa-align-left');
        } else {
            sidebar.classList.add('active');
            icon.classList.add('fa-align-left');
            icon.classList.remove('fa-times');
        }
    });

    document.getElementById('darkmode-toggle').addEventListener('click', function(e) {
        var body = document.body;
        if (body.classList.contains('dark')) {
            body.classList.remove('dark');
        } else {
            body.classList.add('dark');
        }
    });

    window.addEventListener('resize', setContentHeight);
    setContentHeight();
});

function setContentHeight() {
    var height = window.innerHeight;
    var resulting = height - document.getElementById('menu-bar').clientHeight - document.getElementsByTagName('footer')[0].clientHeight;
    document.getElementsByTagName('main')[0].querySelector('.py-3').style.minHeight = resulting + 'px';
}

function setCategoryMenu() {
    var categories = getUniqueCategories();
    var categoryNames = Object.keys(categories);
    categoryNames.sort();
    var list = document.getElementById('category-list');
    for (var i = 0; i < list.children.length; i++) {
        var child = list.children[i];
        if (!child.classList.contains('preserve')) {
            list.removeChild(child);
            i--;
        }
    }

    for (var i = 0; i < categoryNames.length; i++) {
        var category = categoryNames[i];
        var count = categories[category];

        var badge = document.createElement('span');
        badge.setAttribute('class', 'badge badge-secondary badge-pill');
        badge.appendChild(document.createTextNode(count));

        var entry = document.createElement('li');
        entry.setAttribute('class', 'list-group-item d-flex justify-content-between align-items-center clickable');
        entry.addEventListener('click', browseTo('tag:' + category));

        entry.appendChild(document.createTextNode(category));
        entry.appendChild(badge);

        list.appendChild(entry);
    }
}

function findWithoutCategory() {
    showObjects(function(obj) {
        return !window.categories[obj[1]];
    });
}

function browseTo(searchTag) {
    return function() {
        window.scrollTo({top: 0, behavior: 'smooth'});
        document.getElementById('name-input').value = searchTag;
        doSearch();
    };
}

function doSearch() {
    var search = document.getElementById('name-input').value.toLowerCase().trim();

    if (search.length === 0) {
        showObjects(false, true);
        return;
    }

    if (search.startsWith('tag:')) {
        if (search.substring(4) === 'none') {
            findWithoutCategory();
            return;
        }

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
    favBtn.setAttribute('title', 'Toggle Favorite');
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

    var tagsBtn = document.createElement('i');
    tagsBtn.setAttribute('class', 'fas fa-tags clickable');
    tagsBtn.setAttribute('title', 'Modify Categories');
    tagsBtn.addEventListener('click', function() {
        showEditModal(object[1]);
    });
    infoText.appendChild(tagsBtn);

    cardControl.appendChild(btnGroup);
    cardControl.appendChild(infoText);

    cardBody.appendChild(cardText);
    cardBody.appendChild(cardControl);
    
    card.appendChild(thumbnailLink);
    card.appendChild(cardBody);
    
    var col = document.createElement('div');
    col.setAttribute('class', 'col-md-3');
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
    heading.setAttribute('class', 'page-summary');
    heading.appendChild(document.createTextNode(`Page ${page + 1} of ${availPages}, ${currentObjects.length} total objects`));
    content.appendChild(heading);

    if (availPages > 0) {
        if ((window.page + 1) < availPages) {
            var btnNext = document.createElement('button');
            btnNext.setAttribute('type', 'button');
            btnNext.setAttribute('class', 'btn btn-sm btn-outline-secondary float-right');
            btnNext.innerHTML = 'Next Page';
            btnNext.addEventListener('click', function() {
                setPage(window.page + 1);
                window.scrollTo({top: 0, behavior: 'smooth'});
            })
            content.appendChild(btnNext);
        }

        if (window.page > 0) {
            var btnPrev = document.createElement('button');
            btnPrev.setAttribute('type', 'button');
            btnPrev.setAttribute('class', 'btn btn-sm btn-outline-secondary float-right');
            btnPrev.innerHTML = 'Previous Page';
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
    return typeof(Storage) !== 'undefined';
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

function showEditModal(objectName) {
    window.editing = objectName;
    var modal = document.getElementById('edit-category-modal');
    var title = modal.querySelector('.modal-title > span');
    while (title.firstChild) {
        title.removeChild(title.firstChild);
    }
    title.appendChild(document.createTextNode(objectName));

    var categoryInput = modal.querySelector('datalist#categories');
    while (categoryInput.firstChild) {
        categoryInput.removeChild(categoryInput.firstChild);
    }

    var categories = getUniqueCategories();
    var categoryNames = Object.keys(categories);
    categoryNames.sort();
    for (var i = 0; i < categoryNames.length; i++) {
        var category = categoryNames[i];
        var option = document.createElement('option');
        option.appendChild(document.createTextNode(category));
        categoryInput.appendChild(option);
    }

    var categoryList = modal.querySelector('.list-group');
    while (categoryList.firstChild) {
        categoryList.removeChild(categoryList.firstChild);
    }

    if (window.categories[objectName]) {
        var objCategories = window.categories[objectName];
        for (var i = 0; i < objCategories.length; i++) {
            addModalEntry(objCategories[i]);
        }
    }

    $('#edit-category-modal').modal()
}

function addModalEntry(category) {
    var entry = document.createElement('li');
    entry.setAttribute('class', 'list-group-item d-flex justify-content-between align-items-center');
    entry.appendChild(document.createTextNode(category));

    var removeBadge = document.createElement('span');
    removeBadge.setAttribute('class', 'badge badge-danger badge-pill clickable');
    removeBadge.innerHTML = 'x';
    removeBadge.addEventListener('click', modifyObjectCategories(category, false, entry));
    entry.appendChild(removeBadge);

    document.querySelector('#edit-category-modal .list-group').appendChild(entry);
}

function modifyObjectCategories(_category, add, element) {
    return function() {
        var objectName = window.editing;
        var category = _category;
        if (!_category) {
            var input = document.getElementById('edit-category-modal').querySelector('input[type=text]');
            category = input.value;
            input.value = '';
        }

        if (!add && element) {
            element.parentNode.removeChild(element);
        }

        if (!window.categories[objectName]) {
            window.categories[objectName] = [];
        }

        if (add) {
            if (window.categories[objectName].indexOf(category) === -1) {
                window.categories[objectName].push(category);
                addModalEntry(category);
            }
        } else {
            var index = window.categories[objectName].indexOf(category);
            if (index !== -1) {
                window.categories[objectName].splice(index, 1);
            }
        }

        window.changedCategories[objectName] = window.categories[objectName];
        setCategoryMenu();
        document.querySelector('#export-modal textarea').value = JSON.stringify(window.changedCategories, null, 4);
    }
}