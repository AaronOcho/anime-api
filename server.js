const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

const BASE_URL = 'https://api.jikan.moe/v4';
const GOGOANIME_API = 'https://api.consumet.org/anime/gogoanime';

const axiosInstance = axios.create({
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    validateStatus: function (status) {
        return status >= 200 && status < 500;
    },
    maxRedirects: 5,
    maxContentLength: 50 * 1000 * 1000
});

axiosInstance.interceptors.response.use(undefined, async (err) => {
    const { config } = err;
    if (!config || !config.retry) {
        return Promise.reject(err);
    }
    config.retry -= 1;
    const delayRetry = new Promise(resolve => setTimeout(resolve, config.retryDelay || 1000));
    await delayRetry;
    return axiosInstance(config);
});

axiosInstance.defaults.retry = 3;
axiosInstance.defaults.retryDelay = 1000;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const handleAxiosError = (error) => {
    if (error.response) {
        return {
            status: error.response.status,
            message: error.response.data?.message || 'API request failed',
            details: error.response.data
        };
    }
    return {
        status: 500,
        message: error.message,
        details: 'Internal server error'
    };
};

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

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
        res.json({ status: 'success', query: req.params.query, count: results.length, results });
    } catch (error) {
        const errorDetails = handleAxiosError(error);
        res.status(errorDetails.status).json({ status: 'error', ...errorDetails });
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
        res.json({ status: 'success', data: response });
    } catch (error) {
        const errorDetails = handleAxiosError(error);
        res.status(errorDetails.status).json({ status: 'error', ...errorDetails });
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
        res.json({ status: 'success', count: recent.length, data: recent });
    } catch (error) {
        const errorDetails = handleAxiosError(error);
        res.status(errorDetails.status).json({ status: 'error', ...errorDetails });
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
        res.json({ status: 'success', count: topAnime.length, data: topAnime });
    } catch (error) {
        const errorDetails = handleAxiosError(error);
        res.status(errorDetails.status).json({ status: 'error', ...errorDetails });
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
        res.json({ status: 'success', count: genres.length, data: genres });
    } catch (error) {
        const errorDetails = handleAxiosError(error);
        res.status(errorDetails.status).json({ status: 'error', ...errorDetails });
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
        res.json({ status: 'success', count: recommendations.length, data: recommendations });
    } catch (error) {
        const errorDetails = handleAxiosError(error);
        res.status(errorDetails.status).json({ status: 'error', ...errorDetails });
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
        res.json({ status: 'success', count: schedule.length, data: schedule });
    } catch (error) {
        const errorDetails = handleAxiosError(error);
        res.status(errorDetails.status).json({ status: 'error', ...errorDetails });
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
        const errorDetails = handleAxiosError(error);
        res.status(errorDetails.status).json({ status: 'error', ...errorDetails });
    }
});

app.get('/api/watch/:title', async (req, res) => {
    try {
        await delay(1000);
        const searchResponse = await axiosInstance.get(`${GOGOANIME_API}/search/${encodeURIComponent(req.params.title)}`);
        
        if (!searchResponse.data.results?.length) {
            return res.status(404).json({ status: 'error', message: 'Anime not found' });
        }

        const animeId = searchResponse.data.results[0].id;
        const infoResponse = await axiosInstance.get(`${GOGOANIME_API}/info/${animeId}`);
        
        const response = {
            title: infoResponse.data.title,
            episodes: infoResponse.data.episodes || [],
            totalEpisodes: infoResponse.data.totalEpisodes,
            image: infoResponse.data.image,
            description: infoResponse.data.description
        };

        res.json({ status: 'success', data: response });
    } catch (error) {
        console.error('Error details:', error);
        const errorDetails = handleAxiosError(error);
        res.status(errorDetails.status).json({ status: 'error', ...errorDetails });
    }
});

app.get('/api/watch/:title/:episode', async (req, res) => {
    try {
        await delay(1000);
        const searchResponse = await axiosInstance.get(`${GOGOANIME_API}/search/${encodeURIComponent(req.params.title)}`);
        
        if (!searchResponse.data.results?.length) {
            return res.status(404).json({ status: 'error', message: 'Anime not found' });
        }

        const animeInfo = searchResponse.data.results[0];
        const episodeId = `${animeInfo.id}-episode-${req.params.episode}`;
        
        const streamingResponse = await axiosInstance.get(`${GOGOANIME_API}/watch/${episodeId}`);
        
        if (!streamingResponse.data.sources?.length) {
            return res.status(404).json({ status: 'error', message: 'Episode sources not found' });
        }

        res.json({
            status: 'success',
            data: {
                title: animeInfo.title,
                episode: parseInt(req.params.episode),
                sources: streamingResponse.data.sources,
                subtitles: streamingResponse.data.subtitles || []
            }
        });
    } catch (error) {
        console.error('Error details:', error);
        const errorDetails = handleAxiosError(error);
        res.status(errorDetails.status).json({ status: 'error', ...errorDetails });
    }
});

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        console.log(`${req.method} ${req.url} - ${Date.now() - start}ms`);
    });
    next();
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
});

app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});

process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
    server.close(() => process.exit(0));
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

setInterval(() => {
    console.log('Memory usage:', process.memoryUsage());
}, 300000);