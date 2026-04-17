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
            `&daily=weather_code,temperature_2m_mean` +
            `&timezone=${ipData.timezone}`
        )
        const weatherData = await weatherRes.json()
        const data = {
            city: ipData.city,
            time: weatherData.daily.time,
            temperature: weatherData.daily.temperature_2m_mean
        }

        console.log(JSON.stringify(data, null, 2));
        res.json(data);
    } catch(err){
        console.error(err);
        res.status(500).json({error: 'Failed to get location'});
    }
})

app.listen(3000, () => {
    console.log('Server is running on port 3000')
})