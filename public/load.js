async function getWeathers(){
    const res = await fetch('./assets/weathers.json');
    const data = await res.json()
    return data;
}

function isDay(timezone){
    const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false
    });

    const hour = parseInt(hourStr);

    return hour >= 6 && hour < 18;
}

function drawArrow(ctx, fromX, fromY, toX, toY){
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);

    ctx.lineTo(
        toX - headLength * Math.cos(angle - Math.PI / 5),
        toY - headLength * Math.sin(angle - Math.PI / 5)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
        toX - headLength * Math.cos(angle + Math.PI / 5),
        toY - headLength * Math.sin(angle + Math.PI / 5)
    );

    ctx.strokeStyle = 'rgb(26, 115, 167)';
    ctx.stroke();
}

function drawCompass(ctx, cx, cy, angle){
    ctx.clearRect(0, 0, compass.width, compass.height);

    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(cx, cy, 200, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgb(26, 115, 167)';
    ctx.stroke();

    ctx.font = '36px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgb(26, 115, 167)';
    ctx.fillText('N', cx, cy - 220);
    ctx.fillText('E', cx + 220, cy);
    ctx.fillText('S', cx, cy + 223);
    ctx.fillText('W', cx - 220, cy);

    const rad = angle * (Math.PI / 180)
    drawArrow(ctx, cx, cy, cx + 190 * Math.sin(rad), cy - 190 * Math.cos(rad))
}

async function getIcon(url){
    const res = await fetch(url);
    if(!res.ok){
        throw new Error(`Failed to fetch image: HTTP ${res.status}`);
    }

    const blob = await res.blob();

    const imgUrl = URL.createObjectURL(blob);
    return imgUrl
}

try{
    const res = await fetch('api/weather')
    const data = await res.json()

    document.getElementById('city').textContent = data.city;
        
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const first = today.getDay();

    const week = document.getElementById('week');
    const day = document.querySelector('.day');

    const weathers = await getWeathers();

    for(let i = 1; i < 7; i++){
        let clone = day.cloneNode(true);
        week.appendChild(clone);
    }

    for(let i = 0; i < week.children.length; i++){
        const name = week.children[i].querySelector('.name');
        const temp = week.children[i].querySelector('.temp');
        const tempMax = week.children[i].querySelector('.temp-max');
        const tempMin = week.children[i].querySelector('.temp-min');
        const weather = week.children[i].querySelector('.weather');
        name.textContent = days[(first + i) % 7]; 
        temp.textContent = 'Avg: ' + data.temperature[i] + '°C';
        tempMax.textContent = `Max: ${data.temperature_max[i]}°C`;
        tempMin.textContent = `Min: ${data.temperature_min[i]}°C`;
        weather.src = await getIcon(weathers[data.code[i]].day.image);
    }

    const icon = document.getElementById('icon');

    const imgUrl = isDay(data.timezone) ? weathers[data.code_now].day.image : weathers[data.code_now].night.image
    icon.src = await getIcon(imgUrl);

    const tempNow = document.getElementById('temp-now');
    const apprTempNow = document.getElementById('appr-temp-now');
    tempNow.textContent = data.temperature_now + '°C'
    apprTempNow.textContent = 'Feels like ' + data.apparent_temp + '°C';

    const humidNow = document.getElementById('humid-now');
    const windSpeed = document.getElementById('wind-speed');
    const windDir = document.getElementById('wind-dir');
    const windGusts = document.getElementById('wind-gusts');

    humidNow.textContent = `${data.humidity}%`;
    windSpeed.textContent = `Wind speed: ${data.wind_speed}km/h`
    windDir.textContent = `Wind direction: ${data.wind_direction}°`
    windGusts.textContent = `Wind gusts: ${data.wind_gusts}km/h`

    const compass = document.getElementById('compass');
    const ctx = compass.getContext('2d');
    const cx = compass.width / 2;
    const cy = compass.height / 2;

    drawCompass(ctx, cx, cy, data.wind_direction);

    const xValues = [];
    for(let i = 0; i < 7; i++){
        xValues.push(days[(first + i) % 7]);
    }

    Chart.defaults.font.family = "'JetBrains Mono', monospace"

    new Chart("chart", {
        type: "line",
        data: {
            labels: xValues,
            datasets: [
                {
                    label: 'avg',
                    backgroundColor: "rgba(15, 76, 218, 0.2)",
                    borderColor: "rgb(26, 115, 167)",
                    data: data.temperature
                },
                {
                    label: 'max',
                    backgroundColor: "rgba(15, 76, 218, 0.2)",
                    borderColor: "rgb(26, 160, 167)",
                    data: data.temperature_max,
                    fill: -1
                },
                {
                    label: 'min',
                    backgroundColor: "rgba(15, 76, 218, 0.2)",
                    borderColor: "rgb(26, 92, 167)",
                    data: data.temperature_min,
                    fill: +1
                }
            ]
        },
        options: {
            responsive: true,
            interaction:{
                intersect: false,
            },
            scales:{
                x: {
                    display: true,
                    title:{
                        display: true,
                    }
                },
                y:{
                    display: true,
                    title: {
                        display: true,
                        text: '°C',
                    },
                }
            },
            elements:{
                line:{
                    cubicInterpolationMode: 'monotone',
                    tension: 0.8,
                }
            }
        }
    })
} catch(error){
    console.error(error);
}