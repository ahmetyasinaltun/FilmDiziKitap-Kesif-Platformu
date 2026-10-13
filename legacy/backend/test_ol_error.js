const axios = require('axios');

async function test() {
    try {
        
        const badId = 'zyTCAlFPjgYC'; 
        console.log(`Testing Open Library with bad ID: ${badId}`);
        await axios.get(`https://openlibrary.org/works/${badId}.json`);
    } catch (error) {
        console.log('Error with bad ID:', error.response ? error.response.status : error.message);
    }

    try {
        
        const goodId = 'OL82548W';
        console.log(`Testing Open Library with good ID: ${goodId}`);
        const res = await axios.get(`https://openlibrary.org/works/${goodId}.json`);
        console.log('Success with good ID:', res.status);
    } catch (error) {
        console.log('Error with good ID:', error.response ? error.response.status : error.message);
    }
}

test();
