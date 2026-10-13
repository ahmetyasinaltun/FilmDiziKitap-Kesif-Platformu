const axios = require('axios');

async function testSearch() {
    try {
        console.log('Testing empty query...');
        await axios.get(`https://openlibrary.org/search.json?q=&limit=10`);
    } catch (error) {
        console.log('Error with empty query:', error.response ? error.response.status : error.message);
    }

    try {
        console.log('Testing undefined query...');
        await axios.get(`https://openlibrary.org/search.json?q=undefined&limit=10`);
    } catch (error) {
        console.log('Error with undefined query:', error.response ? error.response.status : error.message);
    }
}

testSearch();
