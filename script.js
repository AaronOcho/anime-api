document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.endpoints-nav button');
    const sections = document.querySelectorAll('.endpoint-section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.dataset.section;
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(sectionId).classList.add('active');
        });
    });
});

async function testEndpoint(endpoint) {
    const baseUrl = window.location.origin;
    let url = '';
    let urlElement = document.getElementById(`${endpoint}Url`);
    let resultElement = document.getElementById(`${endpoint}Result`);

    try {
        switch(endpoint) {
            case 'search':
                const query = document.getElementById('searchQuery').value;
                if (!query) {
                    throw new Error('Please enter a search query');
                }
                url = `${baseUrl}/api/search/${encodeURIComponent(query)}`;
                break;

            case 'anime':
                const animeId = document.getElementById('animeId').value;
                if (!animeId) {
                    throw new Error('Please enter an anime ID');
                }
                url = `${baseUrl}/api/anime/${animeId}`;
                break;

            case 'recommendations':
                const recId = document.getElementById('recommendationsId').value;
                if (!recId) {
                    throw new Error('Please enter an anime ID');
                }
                url = `${baseUrl}/api/recommendations/${recId}`;
                break;

            case 'recent':
                url = `${baseUrl}/api/recent`;
                break;

            case 'top':
                url = `${baseUrl}/api/top`;
                break;

            case 'genres':
                url = `${baseUrl}/api/genres`;
                break;

            case 'schedule':
                url = `${baseUrl}/api/schedule`;
                break;

            case 'random':
                url = `${baseUrl}/api/random`;
                break;
        }

        urlElement.textContent = url;
        resultElement.textContent = 'Loading...';

        const response = await fetch(url);
        const data = await response.json();

        resultElement.textContent = JSON.stringify(data, null, 2);

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

    } catch (error) {
        resultElement.textContent = JSON.stringify({
            status: 'error',
            message: error.message
        }, null, 2);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

document.querySelectorAll('.url').forEach(element => {
    element.addEventListener('click', () => {
        copyToClipboard(element.textContent);
    });
});