const express = require('express')
const rateLimit = require('express-rate-limit');
const path = require('path')
const app = express()

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
})

app.use(limiter);

app.use(express.static(path.join(__dirname, 'public')))

async function fetchWeathers(query, lat, lon){
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto` + query);
    if (!res.ok) throw new Error(`API error: ${res.status}, ${JSON.stringify(await res.json(), null, 2)}`);
    return await res.json(); 
}

class TTLCache{
    constructor(ttl = 15 * 60 * 1000){ // 15 minutes
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value){
        if(this.cache.has(key)){
            clearTimeout(this.cache.get(key).timer);
        }

        const timer = setTimeout(() => {
            this.cache.delete(key);
            console.log(`Key ${key} expired`);
        }, this.ttl);

        this.cache.set(key, { value, timer });
    }

    get(key){
        const entry = this.cache.get(key);
        return entry ? entry.value : null;
    }
}

const cityCache = new TTLCache();

async function getCity(lat, lon){
    const key = `${lat},${lon}`;
    let geoData = cityCache.get(key);
    if(!geoData){
        const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'User-Agent': 'just-go-outside' } }
        );
        geoData = await geoRes.json();
        cityCache.set(key, geoData);
    }
    return geoData?.address?.city || geoData?.address?.town || geoData?.address?.village || 'Unknown';
}

const locationCache = new TTLCache();

async function getLocation(ip){
    if(ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'){
        ip = '';
    }
    let data = locationCache.get(ip);
    if(!data){
        const ipRes = await fetch(`http://ip-api.com/json/${ip}`);
        data = await ipRes.json();
        locationCache.set(ip, data);
    }
    return { city: ipData.city, lat: ipData.lat, lon: ipData.lon }
}

const weatherCache = new TTLCache();

async function getWeather(lat, lon){
    const key = `${lat},${lon}`;
    let data = weatherCache.get(key);
    if(!data){
        data = await fetchWeathers(
            `&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,` +
            `apparent_temperature_mean,apparent_temperature_max,apparent_temperature_min,` +
            `wind_speed_10m_mean,wind_speed_10m_max,wind_speed_10m_min,wind_direction_10m_dominant,` +
            `wind_gusts_10m_mean,wind_gusts_10m_max,wind_gusts_10m_min,weather_code,` +
            `relative_humidity_2m_mean,relative_humidity_2m_max,relative_humidity_2m_min` +
            `&current=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,` +
            `wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day`,
            lat, lon
        );

        weatherCache.set(key, data);
    }

    return data;
}

function getData(city, weatherData){
    return {
        city: city,
        timezone: weatherData.timezone,
        // Current
        code_now: weatherData.current.weather_code,
        temperature_now: weatherData.current.temperature_2m,
        apparent_temp_now: weatherData.current.apparent_temperature,
        humidity_now: weatherData.current.relative_humidity_2m,
        wind_speed_now: weatherData.current.wind_speed_10m,
        wind_direction_now: weatherData.current.wind_direction_10m,
        wind_gusts_now: weatherData.current.wind_gusts_10m,
        is_day: weatherData.current.is_day,
        // Daily Temperature
        code: weatherData.daily.weather_code,
        temperature: weatherData.daily.temperature_2m_mean,
        temperature_max: weatherData.daily.temperature_2m_max,
        temperature_min: weatherData.daily.temperature_2m_min,
        appr_temp: weatherData.daily.apparent_temperature_mean,
        appr_temp_max: weatherData.daily.apparent_temperature_max,
        appr_temp_min: weatherData.daily.apparent_temperature_min,
        // Daily Wind
        wind_speed: weatherData.daily.wind_speed_10m_mean,
        wind_speed_max: weatherData.daily.wind_speed_10m_max,
        wind_speed_min: weatherData.daily.wind_speed_10m_min,
        wind_direction: weatherData.daily.wind_direction_10m_dominant,
        wind_gusts: weatherData.daily.wind_gusts_10m_mean,
        wind_gusts_max: weatherData.daily.wind_gusts_10m_max,
        wind_gusts_min: weatherData.daily.wind_gusts_10m_min,
        // Daily Humidity
        humid: weatherData.daily.relative_humidity_2m_mean,
        humid_max: weatherData.daily.relative_humidity_2m_max,
        humid_min: weatherData.daily.relative_humidity_2m_min,
    }
}

app.get('/api/weather', async (req, res) => {
    try {
        let city, lat, lon;

        if (req.query.lat && req.query.lon){
            lat = parseFloat(req.query.lat);
            lon = parseFloat(req.query.lon);
            if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                return res.status(400).json({ error: 'Invalid coordinates' });
            }

            city = await getCity(lat, lon);
        } else{
            const ip = req.ip
            ({ city, lat, lon } = await getLocation(ip));
        }

        const weatherData = await getWeather(lat, lon);

        const data = getData(city, weatherData);

        res.json(data);
    } catch(err){
        console.error(err);
        res.status(500).json({error: err.message});
    }
})

app.listen(3000, () => {
    console.log('Server is running on port 3000')
})