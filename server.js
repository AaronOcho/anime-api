const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

const BASE_URL = 'https://api.jikan.moe/v4';

const axiosInstance = axios.create({
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/search/:query', async (req, res) => {
    try {
        await delay(1000);
        const response = await axiosInstance.get(`${BASE_URL}/anime?q=${encodeURIComponent(req.params.query)}&sfw=true`);
        
        const results = response.data.data.map(anime => ({
            title: anime.title,
            title_english: anime.title_english,
            image: anime.images.jpg.image_url,
            synopsis: anime.synopsis,
            episodes: anime.episodes,
            score: anime.score,
            status: anime.status,
            aired: anime.aired.string,
            mal_id: anime.mal_id
        }));

        res.json({
            status: 'success',
            query: req.params.query,
            count: results.length,
            results
        });
    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.get('/api/anime/:id', async (req, res) => {
    try {
        await delay(1000);
        const [animeRes, episodesRes] = await Promise.all([
            axiosInstance.get(`${BASE_URL}/anime/${req.params.id}`),
            axiosInstance.get(`${BASE_URL}/anime/${req.params.id}/episodes`)
        ]);

        const anime = animeRes.data.data;
        const episodes = episodesRes.data.data;

        const response = {
            title: anime.title,
            title_english: anime.title_english,
            image: anime.images.jpg.image_url,
            trailer_url: anime.trailer?.url,
            synopsis: anime.synopsis,
            episodes: episodes.map(ep => ({
                number: ep.mal_id,
                title: ep.title,
                aired: ep.aired,
                filler: ep.filler,
                recap: ep.recap
            })),
            status: anime.status,
            aired: anime.aired,
            duration: anime.duration,
            rating: anime.rating,
            score: anime.score,
            genres: anime.genres.map(g => g.name),
            studios: anime.studios.map(s => s.name)
        };

        res.json({
            status: 'success',
            data: response
        });
    } catch (error) {
        console.error('Anime details error:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.get('/api/recent', async (req, res) => {
    try {
        await delay(1000);
        const response = await axiosInstance.get(`${BASE_URL}/seasons/now`);
        
        const recent = response.data.data.map(anime => ({
            title: anime.title,
            image: anime.images.jpg.image_url,
            episodes: anime.episodes,
            status: anime.status,
            mal_id: anime.mal_id
        }));

        res.json({
            status: 'success',
            count: recent.length,
            data: recent
        });
    } catch (error) {
        console.error('Recent anime error:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.get('/api/top', async (req, res) => {
    try {
        await delay(1000);
        const response = await axiosInstance.get(`${BASE_URL}/top/anime`);
        
        const topAnime = response.data.data.map(anime => ({
            title: anime.title,
            image: anime.images.jpg.image_url,
            score: anime.score,
            rank: anime.rank,
            mal_id: anime.mal_id
        }));

        res.json({
            status: 'success',
            count: topAnime.length,
            data: topAnime
        });
    } catch (error) {
        console.error('Top anime error:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.get('/api/genre/:id', async (req, res) => {
    try {
        await delay(1000);
        const response = await axiosInstance.get(`${BASE_URL}/anime?genres=${req.params.id}`);
        
        const animeList = response.data.data.map(anime => ({
            title: anime.title,
            image: anime.images.jpg.image_url,
            synopsis: anime.synopsis,
            mal_id: anime.mal_id
        }));

        res.json({
            status: 'success',
            count: animeList.length,
            data: animeList
        });
    } catch (error) {
        console.error('Genre anime error:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.get('/api/genres', async (req, res) => {
    try {
        await delay(1000);
        const response = await axiosInstance.get(`${BASE_URL}/genres/anime`);
        
        const genres = response.data.data.map(genre => ({
            id: genre.mal_id,
            name: genre.name,
            count: genre.count
        }));

        res.json({
            status: 'success',
            count: genres.length,
            data: genres
        });
    } catch (error) {
        console.error('Genres error:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.get('/api/recommendations/:id', async (req, res) => {
    try {
        await delay(1000);
        const response = await axiosInstance.get(`${BASE_URL}/anime/${req.params.id}/recommendations`);
        
        const recommendations = response.data.data.map(rec => ({
            title: rec.entry.title,
            image: rec.entry.images.jpg.image_url,
            mal_id: rec.entry.mal_id
        }));

        res.json({
            status: 'success',
            count: recommendations.length,
            data: recommendations
        });
    } catch (error) {
        console.error('Recommendations error:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.get('/api/schedule', async (req, res) => {
    try {
        await delay(1000);
        const response = await axiosInstance.get(`${BASE_URL}/schedules`);
        
        const schedule = response.data.data.map(anime => ({
            title: anime.title,
            image: anime.images.jpg.image_url,
            broadcast: anime.broadcast,
            mal_id: anime.mal_id
        }));

        res.json({
            status: 'success',
            count: schedule.length,
            data: schedule
        });
    } catch (error) {
        console.error('Schedule error:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.get('/api/random', async (req, res) => {
    try {
        await delay(1000);
        const response = await axiosInstance.get(`${BASE_URL}/random/anime`);
        
        const anime = response.data.data;
        res.json({
            status: 'success',
            data: {
                title: anime.title,
                image: anime.images.jpg.image_url,
                synopsis: anime.synopsis,
                mal_id: anime.mal_id
            }
        });
    } catch (error) {
        console.error('Random anime error:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});

app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Endpoint not found'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}`);
});