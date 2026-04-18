const express = require('express')
const path = require('path')
const app = express()

app.use(express.static(path.join(__dirname, 'public')))

app.get('/api/weather', async (req, res) => {
    try {
        let ip = req.ip;
        console.log(ip);
        // localhost to public ip
        if(ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'){
            ip = '';
        }
        const ipRes = await fetch(`http://ip-api.com/json/${ip}`);
        const ipData = await ipRes.json();

        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?` +
            `latitude=${ipData.lat}&longitude=${ipData.lon}` +
            `&daily=weather_code,temperature_2m_mean,temperature_2m_max,temperature_2m_min` +
            `&current=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,` +
            `wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
            `&timezone=${ipData.timezone}`
        )
        const weatherData = await weatherRes.json()
            if(!weatherRes.ok){
            console.error(weatherData.reason);
        }
        const data = {
            city: ipData.city,
            code: weatherData.daily.weather_code,
            temperature: weatherData.daily.temperature_2m_mean,
            temperature_max: weatherData.daily.temperature_2m_max,
            temperature_min: weatherData.daily.temperature_2m_min,
            code_now: weatherData.current.weather_code,
            temperature_now: weatherData.current.temperature_2m,
            timezone: ipData.timezone,
            apparent_temp: weatherData.current.apparent_temperature,
            humidity: weatherData.current.relative_humidity_2m,
            wind_speed: weatherData.current.wind_speed_10m,
            wind_direction: weatherData.current.wind_direction_10m,
            wind_gusts: weatherData.current.wind_gusts_10m
        }

        console.log(JSON.stringify(data));
        res.json(data);
    } catch(err){
        console.error(err);
        res.status(500).json({error: 'Failed to get location'});
    }
})

app.listen(3000, () => {
    console.log('Server is running on port 3000')
})