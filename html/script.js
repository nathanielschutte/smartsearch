console.log('script working')

const BASE_URL = 'localhost'
const DISPLAY_LIMIT = 100

let queryTime // start time for search query
let headText // header text

const maxCacheLines = 20 // max number of stories queries
let cacheIncrement = 0 // cache access time increment
let cache = {} // cached query data

let lastItem = 0 // last item index loaded for display
let currentItems = [] // the current item list
let loadingNext = false // should the list load more?

// Print cache update or whole cache
function printCache(line = null) {
    if (line === null) {
        let num = 1
        for (l in cache) {
            console.log(`[cache] [${num}] accessed: ${cache[l].accessed}  query: ${l}  size: ${Object.keys(cache).length}/${maxCacheLines}`)
            num++
        }
    }
    else {
        console.log(`[cache] accessed: ${cache[line].accessed}  query: ${line}  size: ${Object.keys(cache).length}/${maxCacheLines}`)
    }
}

// Get list items from [start : start+limit]
function buildList(list, start=0, limit=null) {
    let endList = -1
    if (limit === null) {
        endList = list.length
    }
    else {
        endList = start + limit
        if (endList > list.length) {
            endList = list.length
        }
    }
    str = ''
    for (let i = start; i < endList; i++) {
        str += `<li>${list[i]}</li>`
    }
    return str
}

// Display search results
function resultsList(results, limit) {
    $('.searchResults').show().scrollTop(0)
    $('.resultsList').empty().append(buildList(results, start = 0, limit = limit))
    currentItems = results  // global copy of current items list
    lastItem = DISPLAY_LIMIT            // track last item
    loadingNext = results.length > DISPLAY_LIMIT
}

// Handle incoming results data from server
function handleSearchResults(data) {
    const results = data.results
    const resultsCount = data.results.length

    console.log('[query] requested', data.query)

    // Display from response
    resultsList(results, DISPLAY_LIMIT)

    const endTime = new Date()
    const resultsTime = endTime - queryTime
    let headText = `${resultsCount} results in ${resultsTime}ms`
    $('.searchResultsHead').text(headText)

    // Cache replace
    if (Object.keys(cache).length >= maxCacheLines) {
        let oldestAccess = -1
        let replaceId = ''
        for (line in cache) {
            if (oldestAccess === -1 || cache[line].accessed < oldestAccess) {
                oldestAccess = cache[line].accessed
                replaceId = line
            }
        }
        delete cache[replaceId]
    }

    if (data.results.length && data.results.length > 0) {
        // Cache add
        cache[data.query] = {
            data: [...data.results],
            accessed: cacheIncrement++
        }
        printCache(data.query);
    }
}

// Do a search results request or pull data from cache
function searchRequest(query) {
    // console.log(`searching ${query} length ${query.length}`)

    // Query is good
    if (query && query.length > 0) {

        // Result is in cache
        if (cache[query] != null && cache[query].data.length > 0) {
            queryTime = new Date()
            cache[query].accessed = cacheIncrement++

            // Display from cache
            resultsList(cache[query].data, DISPLAY_LIMIT)

            const endTime = new Date()
            const resultsTime = endTime - queryTime
            let headText = `${cache[query].data.length} results from cache (${resultsTime}ms)`
            $('.searchResultsHead').text(headText)

            printCache(query)
        }

        // Result not in cache, get from server
        else {
            queryTime = new Date()
            $.ajax({
                url: '/search',
                data: {query: query},
                dataType: 'json',
                success: data => {
                    if (data.status && data.status === 'OK' && data && data.results) {
                        handleSearchResults(data)
                    }
                    else if (data.status && data.status === 'error') {
                        if (data.message) {
                            console.log('error:', data.message)
                        }
                    }
                }
            })
        }
    }
    else {
        $('.searchResultsHead').text('')
        $('.searchResults').hide()
    }
}

// HTML
$(function() {

    loadingNext = false

    $('#searchQuery[type="text"]')
    .on('input', function() {
        query = $(this).val()
        searchRequest(query)
    })
    
    $('#searchBtn')
    .on('click', function() {
        query = $('#searchQuery').val()
        searchRequest(query)
    })

    $('.searchResults')
    .hide()
    .on('scroll', function() {
        if (loadingNext && $(this).scrollTop() > ($(this).prop('scrollHeight') - $(this).height()) - 10) {
            $('.resultsList').append(buildList(currentItems, start = lastItem, limit = DISPLAY_LIMIT))
            lastItem += DISPLAY_LIMIT
            loadingNext = currentItems.length > lastItem
            console.log('loading next -- last item:', lastItem, 'load next:', loadingNext)
        }
    })
})