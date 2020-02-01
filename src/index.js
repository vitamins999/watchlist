import { getMovieList, populateMovieList, generateLoadingBox, removeLoadingBox } from './functions'

document.querySelector('#search__form').addEventListener('submit', function (e) {
    document.querySelector('#table-div').innerHTML = ''
    generateLoadingBox()
    const checklistURL = e.target.elements.searchChecklist.value.trim()
    e.preventDefault()
    getMovieList(checklistURL)
        .then((html) => populateMovieList(html))
        .catch(() => {
            removeLoadingBox()
            alert(`A problem occured and I wasn't able to fetch the data! Please check the url is correct.  If it is, try again later and hopefully the servers will be back up!`)
        })
})