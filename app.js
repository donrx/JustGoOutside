const express = require('express')
const path = require('path')
const { stringify } = require('querystring')
const app = express()

app.use(express.static(path.join(__dirname, 'public')))

async function getWeathers(params, lat, lon){
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto` + params);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json(); 
}

app.get('/api/weather', async (req, res) => {
    try {
        let city, lat, lon;

        if (req.query.lat && req.query.lon){
            lat = req.query.lat;
            lon = req.query.lon;

            const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
                { headers: { 'User-Agent': 'just-go-outside' } }
            );
            const geoData = await geoRes.json();
            console.log(JSON.stringify(geoData, null, 2));
            city = geoData.address.city || geoData.address.town || geoData.address.village || 'Unknown';
        } else{
            let ip = req.ip;
            // localhost to public ip
            if(ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'){
                ip = '';
            }
            const ipRes = await fetch(`http://ip-api.com/json/${ip}`);
            const ipData = await ipRes.json();
            city = ipData.city;
            lat = ipData.lat;
            lon = ipData.lon;
        }

        const weatherData = await getWeathers(
            `&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,` +
            `apparent_temperature_mean,apparent_temperature_max,apparent_temperature_min,` +
            `wind_speed_10m_mean,wind_speed_10m_max,wind_speed_10m_min,wind_direction_10m_dominant,` +
            `wind_gusts_10m_mean,wind_gusts_10m_max,wind_gusts_10m_min,weather_code,` +
            `relative_humidity_2m_mean,relative_humidity_2m_max,relative_humidity_2m_min` +
            `&current=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,` +
            `wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day`,
            lat, lon
        )

        const data = {
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

        res.json(data);
    } catch(err){
        console.error(err);
        res.status(500).json({error: 'Failed to get location'});
    }
})

app.listen(3000, () => {
    console.log('Server is running on port 3000')
})