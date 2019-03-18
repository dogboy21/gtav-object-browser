$(document).ready(function() {
    document.getElementById('name-input').addEventListener('keyup', function (event) {
        event.preventDefault();
        if (event.keyCode == 13) {
            doSearch();
        } 
    });
    
    showObjects(false, true);
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
        link.addEventListener('click', browseToCategory(category));
        dropdown.appendChild(link);
    }
}

function findWithoutCategory() {
    showObjects(function(obj) {
        return !window.categories[obj[1]];
    });
}

function browseToCategory(category) {
    return function() {
        document.getElementById('name-input').value = 'tag:' + category;
        doSearch();
    };
}

setCategoryMenu();

function doSearch() {
    var search = document.getElementById('name-input').value.toLowerCase();

    if (search.trim().length === 0) {
        showObjects(false, true);
        return;
    }

    if (search.startsWith("tag:")) {
        showObjects(function (obj) {
            return hasCategory(obj, search.substring(4));
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
    thumbnailLink.appendChild(thumbnail);

    var cardBody = document.createElement('div');
    cardBody.setAttribute('class', 'card-body');
    
    var cardText = document.createElement('p');
    cardText.setAttribute('class', 'card-text');
    cardText.innerHTML = object[1];

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
            btn.addEventListener('click', browseToCategory(category));
            btnGroup.appendChild(btn);
        }
    }
    
    var infoText = document.createElement('small');
    infoText.setAttribute('class', 'text-muted');
    infoText.innerHTML = object[0];
    
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
var pageSize = 100;

function showObjects(filter, defaultView) {
    window.currentObjects = defaultView ? window.objects.slice(0, window.objects.length) : window.objects.filter(filter);
    console.log(window.currentObjects.length + ' objects');
    window.currentObjects.sort(function(obj1, obj2) {
        return obj1[1] - obj2[1];
    })

    setPage(0);
}

function setPage(newPage) {
    window.page = newPage;
    var availPages = Math.ceil(currentObjects.length / pageSize);

    var content = document.getElementById('content');
    while (content.firstChild) {
        content.removeChild(content.firstChild);
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
                window.scrollTo({ top: 0, behavior: 'smooth' });
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