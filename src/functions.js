const axios = require('axios')
const cheerio = require('cheerio')
const JustWatch = require('justwatch-api')

// Request webpage of icheckmovies list
const getMovieList = async (checklistURL) => {

    const proxy = 'https://aqueous-scrubland-78979.herokuapp.com/' // Personal Cors-Anywhere proxy server
    const html = await axios.get(proxy + checklistURL)
    return html
}

const populateMovieList = (html) => {
    const $ = cheerio.load(html.data)

    const titles = []
    const years = []
    const allMovies = []

    // Loops through all the film names and checks to see whether it contains the
    // <em> tag (which only occurs if the film name is not in English. In that case, it
    // contains the text of the English name of the film).  If it has the <em> tag, the
    // translated English name is appended to the titles array.  Otherwise the conditional
    // returns false and it simply appends the ordinary English title found in the <h2> tag.
    $('h2').each((i, elem) => {
        if ($(elem).next().find('em').text().trim()) {
            titles[i] = $(elem).next().find('em').text().trim()
        } else {
            titles[i] = $(elem).text().trim()
        }
    })
    // Loops through all the film years and appends them to the years array.
    $('.info').each((i, elem) => {
        years[i] = parseInt($(elem).text().trim().slice(0, 4), 10)
    })

    // Removes first entry in the titles array since it's garbage.
    const listTitle = titles.shift()

    // Creates an object for each film of title and release year and appends the object
    // to the allMovies array.
    titles.forEach((title, index) => {
        const movie = {
            title: title,
            year: years[index]
        }
        allMovies.push(movie)
    })
    checkStreamingDetails(allMovies, listTitle)
}

const checkStreamingDetails = async (allMovies, listTitle) => {
    let region = document.querySelector('#region').value
    let rank = 0
    const jw = new JustWatch({ locale: `${region}` })
    generateListTitle(listTitle)
    generateTable()

    for (const movie of allMovies) {
        const results = await jw.search(movie["title"])
        rank += 1

        for (const result of results["items"]) {
            checkIndividualMovie(movie, result, rank)
        }
    }
    removeLoadingBox()
    generateEndofListText()
}

const checkIndividualMovie = (movie, result, rank) => {
    if (result["title"] === movie["title"] && result["original_release_year"] === movie["year"]) {
        try {
            for (const offer of result["offers"]) {
                if (offer["provider_id"] === 8) {
                    generateResultDOM('Netflix', rank, result["title"], result["original_release_year"])
                    break
                } else if (offer["provider_id"] === 9) {
                    generateResultDOM('Amazon Prime', rank, result["title"], result["original_release_year"])
                    break
                }
            }
        } catch (e) {
            // Empty code block, to avoid error message on irrelevant items in the array
            // and thus provide better user experience.
            // TODO: Fix this so it doesn't occur in the first place! This isn't good if 
            // an unrelated error occurs!
        }
    }
}

const generateTable = () => {
    let tableEl = document.createElement('table')
    let tBody = document.createElement('tbody')
    tableEl.appendChild(tBody)

    tableEl.className = 'table is-striped'
    tBody.id = 'table-body'

    document.querySelector('#table-div').appendChild(tableEl)
}

const generateResultDOM = (service, rank, title, year) => {

    let tBody = document.querySelector('#table-body')

    let tRow = document.createElement('tr')
    tBody.appendChild(tRow)

    let cellRank = document.createElement('td')
    let cellTitle = document.createElement('td')
    let cellService = document.createElement('td')

    cellRank.textContent = `${rank}`
    cellTitle.textContent = `${title}  (${year})`

    if (service === 'Netflix') {
        cellService.className = 'search__results-netflix'
    } else if (service === 'Amazon Prime') {
        cellService.className = 'search__results-amazon'
    }

    cellService.textContent = `${service}`

    tRow.appendChild(cellRank)
    tRow.appendChild(cellTitle)
    tRow.appendChild(cellService)
}

const generateListTitle = (listTitle) => {
    const searchContainer = document.querySelector('#container-results')
    searchContainer.className = 'hero-body'

    const listTitleDiv = document.createElement("div")
    const headingEl = document.createElement("h1")
    headingEl.className = 'title'
    headingEl.textContent = `-- ${listTitle} --`
    listTitleDiv.id = 'list-title-div'
    listTitleDiv.appendChild(headingEl)
    document.querySelector("#table-div").appendChild(listTitleDiv)
}

const generateLoadingBox = () => {

    let divElBox = document.createElement("div")
    divElBox.className = "header__search-loading"
    divElBox.id = "loading-bar-div"

    let spanEl = document.createElement("p")
    // spanEl.textContent = 'Fetching results...'
    // spanEl.className = 'has-text-black'

    let progressEl = document.createElement('progress')
    progressEl.className = "progress is-dark is-large"

    // divElBox.appendChild(spanEl)
    divElBox.appendChild(progressEl)
    document.querySelector('#header__search').appendChild(divElBox)
}

const removeLoadingBox = async () => {
    let loading = document.querySelector('.header__search-loading')
    loading.parentNode.removeChild(loading)
}

const generateEndofListText = () => {
    let endMessageEl = document.createElement('h2')
    let endMessageDiv = document.createElement('div')
    endMessageEl.className = 'subtitle'
    endMessageDiv.className = 'has-text-centered'
    endMessageDiv.id = 'end-message-div'

    endMessageEl.textContent = '-- Enjoy! --'
    endMessageDiv.appendChild(endMessageEl)
    document.querySelector('#table-div').appendChild(endMessageDiv)
}

export { getMovieList, populateMovieList, checkStreamingDetails, generateResultDOM, generateLoadingBox, removeLoadingBox }