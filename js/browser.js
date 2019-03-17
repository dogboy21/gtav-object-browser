document.getElementById('name-input').addEventListener('keyup', function (event) {
    event.preventDefault();
    if (event.keyCode == 13) {
        doSearch();
    } 
});

showObjects(false, true);

function setCategoryMenu() {
    var categories = getUniqueCategories();
    var dropdown = document.getElementById('category-dropdown');
    for (var i = 0; i < categories.length; i++) {
        var category = categories[i];
        var link = document.createElement('a');
        link.setAttribute('class', 'dropdown-item clickable');
        link.innerHTML = category;
        link.addEventListener('click', browseToCategory(category));
        dropdown.appendChild(link);
    }
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

function showObjects(filter, defaultView) {
    var content = document.getElementById('content');
    while (content.firstChild) {
        content.removeChild(content.firstChild);
    }

    var row = document.createElement('row');
    row.setAttribute('class', 'row');

    (defaultView ? window.objects.slice(0, 100) : window.objects.filter(filter)).forEach(function(obj) {
        row.appendChild(createCardForObject(obj));
    });

    var content = document.getElementById('content');
    content.appendChild(row);
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
            categories[categoryArrays[i][j]] = "";
        }
    }

    return Object.keys(categories);
}