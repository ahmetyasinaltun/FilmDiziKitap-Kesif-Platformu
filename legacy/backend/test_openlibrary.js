const axios = require('axios');

async function testOpenLibrary() {
    try {
        const query = 'harry potter';
        console.log(`Searching for: ${query}`);
        const booksRes = await axios.get(`https://openlibrary.org/search.json?q=${query}&limit=5`);
        
        if (booksRes.data.docs) {
            console.log(`Found ${booksRes.data.docs.length} books.`);
            const firstBook = booksRes.data.docs[0];
            console.log('First book raw data:', JSON.stringify(firstBook, null, 2));
            
            const mappedBook = {
                apiId: firstBook.key.replace('/works/', ''),
                title: firstBook.title,
                type: 'book',
                poster: firstBook.cover_i ? `https://covers.openlibrary.org/b/id/${firstBook.cover_i}-L.jpg` : null,
                description: 'Açıklama Open Library üzerinden alınamıyor.',
                author: firstBook.author_name?.join(', '),
                releaseDate: firstBook.first_publish_year?.toString()
            };
            console.log('Mapped book:', mappedBook);
        } else {
            console.log('No docs found.');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testOpenLibrary();
