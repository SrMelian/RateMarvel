/*
    global $, Chart
*/

let charactersLocal;

let comicsLocal;

let usersLocal;

let votes = [];

let $progressModal = $('#progressModal');

$(document).ready(function() {
    $progressModal.modal('show');
    if (localStorage.characters == undefined
        || localStorage.comics == undefined) {
        getFromApi();
    } else {
        charactersLocal = downFromLocalStorage('characters');
        printCharacters();
        comicsLocal = downFromLocalStorage('comics');
        printComics();
        paginateTabs();
        $progressModal.modal('hide');
        updateResults();
    }
});

/**
 * API calls, also print the divs, and paginate
 */
function getFromApi() {
    $.ajax({
        url: 'https://gateway.marvel.com:443/v1/public/characters?limit=100&apikey=2929d01b380e0e821e7c814ac42e7f7d',
        type: 'GET',
        dataType: 'json',
        success: function(json) {
            charactersLocal = json.data.results;
            loadStorage(charactersLocal, 'characters');
            printCharacters(false);
        },
        error: function(request, status, error) {
            console.log(error);
            printCharacters(true);
        },
    });
    $.ajax({
        url: 'https://gateway.marvel.com:443/v1/public/comics?limit=100&apikey=2929d01b380e0e821e7c814ac42e7f7d',
        type: 'GET',
        dataType: 'json',
        success: function(json) {
            comicsLocal = json.data.results;
            loadStorage(comicsLocal, 'comics');
            printComics(false);
            paginateTabs();
            updateResults();
        },
        error: function(request, status, error) {
            console.log(error);
            printComics(true);
        },
        complete: function() {
            $progressModal.modal('hide');
        },
    });
}

/**
 * Print the cards with the characters and control the error from API
 * @param {boolean} error True when the ajax call failed
 */
function printCharacters(error) {
    let $mainDiv = $('#characters');
    let htmlOutput = '';

    if (error) {
        htmlOutput =
            `<div class="alert alert-info" role="alert">
                No results found
            </div>`;
    }

    for (const key in charactersLocal) {
        if (charactersLocal.hasOwnProperty(key)) {
            const element = charactersLocal[key];
            htmlOutput +=
                `<div class="card character">
                    <img class="card-img-top" src="${element.thumbnail.path}/portrait_incredible.${element.thumbnail.extension}" alt="Cartel principal del personaje de Marvel ${element.name}" data-item="char-${element.id}" data-toggle="modal" data-target="#voteModal" tabIndex="0" />
                    <div class="card-body">
                        <h5 class="card-title" tabIndex="0">${element.name}</h5>
                        <button class="btn btn-primary text-white" data-item="char-${element.id}" data-toggle="modal" data-target="#voteModal" tabIndex="0" aria-label="Votar al personaje ${element.name}">Vote</button>
                    </div>
                </div>`;
        }
    }
    $mainDiv.append($(htmlOutput));
}

/**
 * Print the cards with the comics and control the error from API
 * @param {boolean} error True when the ajax call failed
 */
function printComics(error) {
    let $mainDiv = $('#comics');
    let htmlOutput = '';

    if (error) {
        htmlOutput =
            `<div class="alert alert-info" role="alert">
                No results found
            </div>`;
    }

    for (const key in comicsLocal) {
        if (comicsLocal.hasOwnProperty(key)) {
            const element = comicsLocal[key];
            htmlOutput +=
                `<div class="card comic">
                    <img class="card-img-top" src="${element.thumbnail.path}/portrait_incredible.${element.thumbnail.extension}" alt="Cartel principal del cómic ${element.title}" data-item="comic-${element.id}" data-toggle="modal" data-target="#voteModal" tabIndex="0" />
                    <div class="card-body">
                        <h5 class="card-title" tabIndex="0">${element.title}</h5>
                        <p class="card-text" tabIndex="0">${element.description == null ? 'No description.' : element.description}</p>
                        <button class="btn btn-primary text-white" data-item="comic-${element.id}" data-toggle="modal" data-target="#voteModal" tabIndex="0" aria-label="Votar al cómic ${element.title}">Vote</button>
                    </div>
                </div>`;
        }
    }
    $mainDiv.append($(htmlOutput));
}

/**
 * Upload to localStorage a item
 * @param {Object} element to upload, will be stringify
 * @param {String} name which will be identified the Object in the localStorage
 */
function loadStorage(element, name) {
    localStorage.setItem(name, JSON.stringify(element));
}

/**
* Download the localStorage a item, no check if exist
* @param {String} item to download
* @return {Object}
*/
function downFromLocalStorage(item) {
    return JSON.parse(localStorage.getItem(item));
}

/**
 * Load the information in the vote modal when shows
 */
$('#voteModal').on('show.bs.modal', function(event) {
    let modal = $(this);
    let button = $(event.relatedTarget); // Button that triggered the modal
    let recipient = button.data('item').split('-'); // Extract info from data- attribute
    let data = returnDataById(recipient[0], recipient[1]);

    // Modal title
    modal.find('.modal-title').text((data.hasOwnProperty('name') ? data.name : data.title));

    let $container = modal.find('#imgModal');

    let $html =
        `<div class="row">
            <div class="col-12">
                <img src="${data.thumbnail.path}/portrait_incredible.${data.thumbnail.extension}" style="margin-bottom: 20px;" />
            </div>
        </div>`
    ;

    if (data.hasOwnProperty('description') && data.description != null) {
        $html += `<p>${data.description}</p>`;
    } else if (data.description == null) {
        $html += `<p>No description.</p>`;
    }

    $container.empty();
    $container.prepend($html);

    // Atributo data-item del botón Votar
    modal.find('.btn-primary').attr('data-item', `${recipient[0]}-${recipient[1]}`);
});

/**
 * Return the object which coincide with the id
 * @param {String} str Contains the type object, character or comic
 * @param {Int} id to search
 * @return {Object} Object which the data to display
 */
function returnDataById(str, id) {
    let data;
    if (isCharacter(str)) {
        for (const key in charactersLocal) {
            if (charactersLocal.hasOwnProperty(key)) {
                const element = charactersLocal[key];
                if (element.id == id) {
                    data = element;
                    break;
                }
            }
        }
    } else {
        for (const key in comicsLocal) {
            if (comicsLocal.hasOwnProperty(key)) {
                const element = comicsLocal[key];
                if (element.id == id) {
                    data = element;
                    break;
                }
            }
        }
    }
    return data;
}

/**
 * Check if the requested data is a character or a comic, to place the info
 * in the modal
 * @param {String} str Var to check
 * @return {boolean} True if is a char
 */
function isCharacter(str) {
    return str == 'char' ? true : false;
}

// <validateFormModal>

let $form = $('.needs-validation');

$('#voteModal').find('.btn-primary').on('click', function() {
    $form.submit();
});

$('#voteModal').find('input').on('keydown', function(event) {
    if (event.which == 13) {
        $form.submit();
    }
});

$form.on('submit', function(event) {
    event.preventDefault();
    event.stopPropagation();

    let name = $('#name').val();
    let email = $('#email').val();
    let number = $('#number').val();
    let data = $('#voteModal').find('.btn-primary')[0].dataset.item.split('-');
    let votedCharacter = isCharacter(data[0]) ? true : false;

    if ($form[0].checkValidity()) {
        if (!userCanVote(email, votedCharacter)) {
            $('#userExist').fadeIn();
        } else {
            if (userExist(email)) {
                updateUser(email);
            } else {
                registerUser(name, email, number, votedCharacter);
            }
            applyVote(data[1]);
            // Reset modal
            $('#userExist').hide();
            $form[0].reset();
            $form.removeClass('was-validated');
            // Refesh results
            updateResults();
            $('#voteModal').modal('hide');
            $('#voteSuccess').fadeIn();
            setTimeout(() => {
                $('#voteSuccess').fadeOut();
            }, 3000);
        }
    } else {
        $form.addClass('was-validated');
    }
});

// </validateFormModal>

/**
 * Check if a user vote the only characters, only comics, or both
 * @param {String} email
 * @param {boolean} votingCharacter
 * @return {boolean}
 */
function userCanVote(email, votingCharacter) {
    let returned = true;
    if (localStorage.users != undefined) {
        usersLocal = downFromLocalStorage('users');
    }
    for (const key in usersLocal) {
        if (usersLocal.hasOwnProperty(key)) {
            const element = usersLocal[key];
            if (element.email == email && element.votedCharacter == votingCharacter) {
                returned = false;
                break;
            } else if (element.votedComic) {
                returned = false;
            }
        }
    }
    return returned;
}

/**
 * Check if a user exists, to decide if sign up or update
 * @param {String} email
 * @return {boolean}
 */
function userExist(email) {
    let returned = false;
    if (localStorage.users != undefined) {
        usersLocal = downFromLocalStorage('users');
    }
    for (const key in usersLocal) {
        if (usersLocal.hasOwnProperty(key)) {
            const element = usersLocal[key];
            if (element.email == email) {
                returned = true;
                break;
            }
        }
    }
    return returned;
}

/**
 * Sign Up the user
 * @param {String} name
 * @param {String} email
 * @param {int} number
 * @param {boolean} votedCharacter if true character, if false comic
 */
function registerUser(name, email, number, votedCharacter) {
    usersLocal = [];
    let votedComic = votedCharacter ? false : true;

    if (localStorage.users != undefined) {
        usersLocal = downFromLocalStorage('users');
    }

    usersLocal[usersLocal.length] = {
        name: name,
        email: email,
        phone: number,
        votedCharacter: votedCharacter,
        votedComic: votedComic,
    };
    loadStorage(usersLocal, 'users');
}

/**
 * Update user with the new vote state
 * @param {String} email using like primary key
 */
function updateUser(email) {
    if (localStorage.users != undefined) {
        usersLocal = downFromLocalStorage('users');
    }
    for (const key in usersLocal) {
        if (usersLocal.hasOwnProperty(key)) {
            const element = usersLocal[key];
            if (element.email == email) {
                if (element.votedCharacter) {
                    element.votedComic = true;
                } else if (element.votedComic) {
                    element.votedCharacter = true;
                }
            }
        }
    }

    loadStorage(usersLocal, 'users');
}

/**
 * Check if the element voted exist and increment votes
 * @param {*} vote id from the element was voted
 */
function applyVote(vote) {
    let foundIt = false;
    if (localStorage.votes != undefined) {
        votes = downFromLocalStorage('votes');
    }
    for (const key in votes) {
        if (votes.hasOwnProperty(key)) {
            const element = votes[key];
            if (element.id == vote) {
                element.votes++;
                foundIt = true;
            }
        }
    }
    if (!foundIt) {
        votes.push({id: vote, votes: 1});
    }
    loadStorage(votes, 'votes');
}

/**
 * Refresh the votes results
 */
function updateResults() {
    let arrayData = [];
    let arrayLabel = [];
    if (localStorage.votes != undefined) {
        votes = downFromLocalStorage('votes');
    }

    for (const key in votes) {
        if (votes.hasOwnProperty(key)) {
            const element = votes[key];
            let object = returnDataById('char', element.id);
            if (object != undefined) {
                arrayLabel.push(object.name);
                arrayData.push(parseInt(element.votes));
            }
        }
    }
    $('canvas').remove();
    drawChart1(arrayLabel, arrayData);
    drawChart2(arrayLabel, arrayData);
    drawChart3(arrayLabel, arrayData);

    arrayData = [];
    arrayLabel = [];

    for (const key in votes) {
        if (votes.hasOwnProperty(key)) {
            const element = votes[key];
            let object = returnDataById('comic', element.id);
            if (object != undefined) {
                arrayLabel.push(object.title);
                arrayData.push(parseInt(element.votes));
            }
        }
    }
    drawChart4(arrayLabel, arrayData);
    drawChart5(arrayLabel, arrayData);
    drawChart6(arrayLabel, arrayData);
};

/**
 *
 * @param {*} arrayLabel
 * @param {*} arrayData
 */
function drawChart1(arrayLabel, arrayData) {
    let $content = $('#chart1Char');
    $content.append(`<canvas tabindex="0"></canvas>`);
    let canvas = $content.find('canvas')[0];
    let ctxPA = canvas.getContext('2d');
    new Chart(ctxPA, {
        type: 'doughnut',
        data: {
            labels: arrayLabel,
            datasets: [{
                'label': 'Votos',
                'data': arrayData,
                'fill': true,
                'borderColor': 'rgb(75, 192, 192)',
                'lineTension': 0.1,
                'backgroundColor': [
                    '#DCECC9',
                    '#B3DDCC',
                    '#8ACDCE',
                    '#62BED2',
                    '#46AACE',
                    '#3D91BE',
                    '#3577AE',
                    '#2D5E9E',
                    '#24448E',
                    '#1C2B7F',
                    '#162065',
                    '#11174B',
                ],
            }],
        },
        options: {
            responsive: true,
        },
    });
}

/**
 *
 * @param {*} arrayLabel
 * @param {*} arrayData
 */
function drawChart2(arrayLabel, arrayData) {
    let $content = $('#chart2Char');
    $content.append(`<canvas tabindex="0"></canvas>`);
    let canvas = $content.find('canvas')[0];
    let ctxPA = canvas.getContext('2d');
    new Chart(ctxPA, {
        type: 'bar',
        data: {
            labels: arrayLabel,
            datasets: [{
                'label': 'Votos',
                'data': arrayData,
                'fill': true,
                'borderColor': 'rgb(75, 192, 192)',
                'lineTension': 0.1,
                'backgroundColor': [
                    '#DCECC9',
                    '#B3DDCC',
                    '#8ACDCE',
                    '#62BED2',
                    '#46AACE',
                    '#3D91BE',
                    '#3577AE',
                    '#2D5E9E',
                    '#24448E',
                    '#1C2B7F',
                    '#162065',
                    '#11174B',
                ],
            }],
        },
        options: {
            responsive: true,
        },
    });
}

/**
 *
 * @param {*} arrayLabel
 * @param {*} arrayData
 */
function drawChart3(arrayLabel, arrayData) {
    let $content = $('#chart3Char');
    $content.append(`<canvas tabindex="0"></canvas>`);
    let canvas = $content.find('canvas')[0];
    let ctxPA = canvas.getContext('2d');
    new Chart(ctxPA, {
        type: 'line',
        data: {
            labels: arrayLabel,
            datasets: [{
                'label': 'Votos',
                'data': arrayData,
                'fill': false,
                'borderColor': 'rgb(75, 192, 192)',
                'lineTension': 0.1,
                'backgroundColor': [
                    '#DCECC9',
                    '#B3DDCC',
                    '#8ACDCE',
                    '#62BED2',
                    '#46AACE',
                    '#3D91BE',
                    '#3577AE',
                    '#2D5E9E',
                    '#24448E',
                    '#1C2B7F',
                    '#162065',
                    '#11174B',
                ],
            }],
        },
        options: {
            responsive: true,
        },
    });
}

/**
 *
 * @param {*} arrayLabel
 * @param {*} arrayData
 */
function drawChart4(arrayLabel, arrayData) {
    let $content = $('#chart1Comic');
    $content.append(`<canvas tabindex="0"></canvas>`);
    let canvas = $content.find('canvas')[0];
    let ctxPA = canvas.getContext('2d');
    new Chart(ctxPA, {
        type: 'doughnut',
        data: {
            labels: arrayLabel,
            datasets: [{
                'label': 'Votos',
                'data': arrayData,
                'fill': true,
                'borderColor': 'rgb(75, 192, 192)',
                'lineTension': 0.1,
                'backgroundColor': [
                    '#DCECC9',
                    '#B3DDCC',
                    '#8ACDCE',
                    '#62BED2',
                    '#46AACE',
                    '#3D91BE',
                    '#3577AE',
                    '#2D5E9E',
                    '#24448E',
                    '#1C2B7F',
                    '#162065',
                    '#11174B',
                ],
            }],
        },
        options: {
            responsive: true,
        },
    });
}

/**
 *
 * @param {*} arrayLabel
 * @param {*} arrayData
 */
function drawChart5(arrayLabel, arrayData) {
    let $content = $('#chart2Comic');
    $content.append(`<canvas tabindex="0"></canvas>`);
    let canvas = $content.find('canvas')[0];
    let ctxPA = canvas.getContext('2d');
    new Chart(ctxPA, {
        type: 'bar',
        data: {
            labels: arrayLabel,
            datasets: [{
                'label': 'Votos',
                'data': arrayData,
                'fill': true,
                'borderColor': 'rgb(75, 192, 192)',
                'lineTension': 0.1,
                'backgroundColor': [
                    '#DCECC9',
                    '#B3DDCC',
                    '#8ACDCE',
                    '#62BED2',
                    '#46AACE',
                    '#3D91BE',
                    '#3577AE',
                    '#2D5E9E',
                    '#24448E',
                    '#1C2B7F',
                    '#162065',
                    '#11174B',
                ],
            }],
        },
        options: {
            responsive: true,
        },
    });
}

/**
 *
 * @param {*} arrayLabel
 * @param {*} arrayData
 */
function drawChart6(arrayLabel, arrayData) {
    let $content = $('#chart3Comic');
    $content.append(`<canvas tabindex="0"></canvas>`);
    let canvas = $content.find('canvas')[0];
    let ctxPA = canvas.getContext('2d');
    new Chart(ctxPA, {
        type: 'line',
        data: {
            labels: arrayLabel,
            datasets: [{
                'label': 'Votos',
                'data': arrayData,
                'fill': false,
                'borderColor': 'rgb(75, 192, 192)',
                'lineTension': 0.1,
                'backgroundColor': [
                    '#DCECC9',
                    '#B3DDCC',
                    '#8ACDCE',
                    '#62BED2',
                    '#46AACE',
                    '#3D91BE',
                    '#3577AE',
                    '#2D5E9E',
                    '#24448E',
                    '#1C2B7F',
                    '#162065',
                    '#11174B',
                ],
            }],
        },
        options: {
            responsive: true,
        },
    });
}

// <scrollSpy>

$('#toTop').click(function() {
    $('html, body').animate({
        scrollTop: $('#mainWrapper').offset().top - 65,
    }, 1000);
    return false;
});

$('#spyTop').waypoint(function(event, direction) {
    if (direction == 'up') {
        $('.to-top').removeClass('visible');
    }
    if (direction == 'down') {
        $('.to-top').addClass('visible');
    }
}, {
    offset: 30,
});

// </scrollSpy>

/**
 * Paginate function from plugin
 * @param {Object} options
 */
function paginate(options) {
    let items = $(options.itemSelector);
    let numItems = items.length;
    let perPage = options.itemsPerPage;
    items.slice(perPage).hide();
    $(options.paginationSelector).pagination({
        items: numItems,
        itemsOnPage: perPage,
        cssStyle: 'light-theme',
        onPageClick: function(pageNumber) {
            let showFrom = perPage * (pageNumber - 1);
            let showTo = showFrom + perPage;
            items.hide()
                .slice(showFrom, showTo).show();
            return false;
        },
    });
}

/**
 * Paginate characters and comics
 */
function paginateTabs() {
    paginate({
        itemSelector: '.card.character',
        paginationSelector: '#characters-pagination',
        itemsPerPage: 10,
    });
    paginate({
        itemSelector: '.card.comic',
        paginationSelector: '#comics-pagination',
        itemsPerPage: 10,
    });
}
