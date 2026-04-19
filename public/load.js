async function getWeathers(){
    const res = await fetch('./assets/weathers.json');
    const data = await res.json()
    return data;
}

async function getPosition(){
    const pos = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);

        navigator.geolocation.getCurrentPosition(
            resolve,
            () => resolve(null),
            {timeout: 10000}
        );
    })

    if(pos){
        return{
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
        }
    }
}

function createClass(tag, className, parent){
    let element = document.createElement(tag);
    element.className = className;
    parent.appendChild(element);
    return element;
}

function reset(chart){
    const dayElements = document.querySelectorAll('.day');

    dayElements.forEach((day) => {
        for(const child of [...day.children]){
            if(child.className === 'title'){
                for(const element of [...child.children]){
                    if(element.className === 'name') continue;

                    element.remove();
                }

                continue;
            }

            child.remove();
        }
    })

    chart.data.datasets.forEach((dataset, index) => {
        chart.setDatasetVisibility(index, false);
        chart.getDatasetMeta(index).hidden = true;
    });
    chart.update();
}

function drawArrow(ctx, fromX, fromY, toX, toY, headLength){
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
    const size = cx * 2;
    const r = size * 0.4;

    ctx.clearRect(0, 0, size, size);
    ctx.lineWidth = size * 0.006;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgb(26, 115, 167)';
    ctx.stroke();

    ctx.font = `32px JetBrains Mono`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgb(26, 115, 167)';

    const labelOffset = r * 1.1
    ctx.fillText('N', cx, cy - labelOffset);
    ctx.fillText('E', cx + labelOffset, cy);
    ctx.fillText('S', cx, cy + labelOffset);
    ctx.fillText('W', cx - labelOffset, cy);

    const rad = angle * (Math.PI / 180)
    const arrowLen = r * 0.9
    drawArrow(ctx, cx, cy, cx + arrowLen * Math.sin(rad), cy - arrowLen * Math.cos(rad), 10)
}

async function modeTemp(data, weathers, chart){
    const week = document.getElementById("week");

    for(let i = 0; i < 7; i++){
        const day = week.children[i];
        const temp = createClass('p', 'data', day);
        const tempMax = createClass('p', 'data', day);
        const tempMin = createClass('p', 'data', day);
        const title = day.querySelector('.title');
        const weather = createClass('img', 'weather', title);
        const text = createClass('h3', '', day);
        const apprTemp = createClass('p', 'data', day);
        const apprTempMax = createClass('p', 'data', day);
        const apprTempMin = createClass('p', 'data', day);
        text.textContent = 'Feels like:';
        text.style = 'font-size: medium; font-weight: bold; margin: 5px 0 2px;';
        temp.textContent = 'Avg: ' + data.temperature[i] + '°C';
        tempMax.textContent = `Max: ${data.temperature_max[i]}°C`;
        tempMin.textContent = `Min: ${data.temperature_min[i]}°C`;
        apprTemp.textContent = 'Avg: ' + data.appr_temp[i] + '°C';
        apprTempMax.textContent = `Max: ${data.appr_temp_max[i]}°C`;
        apprTempMin.textContent = `Min: ${data.appr_temp_min[i]}°C`;
        weather.src = await getIcon(weathers[data.code[i]].day.image);
    }

    for(let i = 0; i < 6; i++){
        chart.setDatasetVisibility(i, true);
    }
    chart.update();
}

function modeWind(data, chart){
    const week = document.getElementById("week");

    for(let i = 0; i < 7; i++){
        const day = week.children[i];
        const windText = createClass('h3', '', day);
        const windDir = createClass('p', 'data', day);
        const wind = createClass('p', 'data', day);
        const windMax = createClass('p', 'data', day);
        const windMin = createClass('p', 'data', day);
        const gustsText = createClass('h3', '', day);
        const gusts = createClass('p', 'data', day);
        const gustsMax = createClass('p', 'data', day);
        const gustsMin = createClass('p', 'data', day);
        windText.textContent = 'Wind speed:';
        gustsText.textContent = 'Wind gusts:';
        windText.style = 'font-size: medium; font-weight: bold; margin: 5px 0 2px;';
        gustsText.style = 'font-size: medium; font-weight: bold; margin: 5px 0 2px;';
        windDir.textContent = 'Dir: ' + data.wind_direction[i] + '°';
        wind.textContent = 'Avg: ' + data.wind_speed[i] + 'km/h';
        windMax.textContent = `Max: ${data.wind_speed_max[i]}km/h`;
        windMin.textContent = `Min: ${data.wind_speed_min[i]}km/h`;
        gusts.textContent = 'Avg: ' + data.wind_gusts[i] + 'km/h';
        gustsMax.textContent = `Max: ${data.wind_gusts_max[i]}km/h`;
        gustsMin.textContent = `Min: ${data.wind_gusts_min[i]}km/h`;

        const title = day.querySelector('.title');
        const arrow = createClass('canvas', 'weather', title);
        arrow.width = '100';
        arrow.height = '100';
        const size = arrow.width;
        const ctx = arrow.getContext('2d');
        const r = size * 0.3;
        const cx = size / 2;
        const cy = size / 2;

        ctx.lineWidth = 3;

        const rad = data.wind_direction[i] * (Math.PI / 180);
        const fromX = cx - r * Math.sin(rad);
        const fromY = cy + r * Math.cos(rad);
        const toX = cx + r * Math.sin(rad);
        const toY = cy - r * Math.cos(rad);
        drawArrow(ctx, fromX, fromY, toX, toY, 40);
    }

    for(let i = 6; i < 12; i++){
        chart.setDatasetVisibility(i, true);
    }
    chart.options.scales.y.title.text = 'km/h';
    chart.update();
}

function modeHumid(data, chart){
    const week = document.getElementById('week');

    for(let i = 0; i < 7; i++){
        const day = week.children[i];
        const humid = createClass('p', 'data', day);
        const humidMax = createClass('p', 'data', day);
        const humidMin = createClass('p', 'data', day);
        humid.textContent = `Avg: ${data.humid[i]}%`;
        humidMax.textContent = `Max: ${data.humid_max[i]}%`;
        humidMin.textContent = `Min: ${data.humid_min[i]}%`;
    }

    for(let i = 12; i < 15; i++){
        chart.setDatasetVisibility(i, true);
    }
    chart.options.scales.y.title.text = '%';
    chart.update();
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
    const pos = await getPosition();
    let res;
    if(pos){
        res = await fetch(`api/weather?lat=${pos.lat}&lon=${pos.lon}`);
    } else{
        res = await fetch(`api/weather`); 
    }
    
    const data = await res.json()

    document.getElementById('city').textContent = data.city;

    const weathers = await getWeathers();

    const week = document.getElementById('week');

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const first = today.getDay();

    for(let i = 0; i < 7; i++){
        let day = document.createElement('div');
        day.className = 'day';

        let title = document.createElement('div');
        title.className = 'title';

        let text = document.createElement('h2');
        text.className = 'name';
        text.textContent = days[(first + i) % 7]; 

        title.appendChild(text);
        day.appendChild(title);

        week.appendChild(day);
    }

    const tempButton = document.getElementById('temp-button');
    const windButton = document.getElementById('wind-button');
    const humidButton = document.getElementById('humid-button');

    const icon = document.getElementById('icon');

    const imgUrl = data.is_day ? weathers[data.code_now].day.image : weathers[data.code_now].night.image
    icon.src = await getIcon(imgUrl);
    URL.revokeObjectURL(imgUrl);

    const tempNow = document.getElementById('temp-now');
    const apprTempNow = document.getElementById('appr-temp-now');
    tempNow.textContent = data.temperature_now + '°C'
    apprTempNow.textContent = 'Feels like ' + data.apparent_temp_now + '°C';

    const humidNow = document.getElementById('humid-now');
    const windSpeed = document.getElementById('wind-speed');
    const windDir = document.getElementById('wind-dir');
    const windGusts = document.getElementById('wind-gusts');

    humidNow.textContent = `${data.humidity_now}%`;
    windSpeed.textContent = `Wind speed: ${data.wind_speed_now}km/h`
    windDir.textContent = `Wind direction: ${data.wind_direction_now}°`
    windGusts.textContent = `Wind gusts: ${data.wind_gusts_now}km/h`

    const wrapper = document.getElementById('compass-wrapper');
    const compass = document.getElementById('compass');

    const ro = new ResizeObserver(() => {
        const size = wrapper.offsetWidth;
        compass.width = size * 2;
        compass.height = size * 2;
        compass.style.width = size + 'px';
        compass.style.height = size + 'px';
        drawCompass(compass.getContext('2d'), size, size, data.wind_direction_now);
    });

    ro.observe(wrapper);

    const xValues = [];
    for(let i = 0; i < 7; i++){
        xValues.push(days[(first + i) % 7]);
    }

    Chart.defaults.font.family = "'JetBrains Mono', monospace"
    Chart.defaults.font.size = 12;
    Chart.defaults.color = `rgb(26, 115, 167)`;

    const chart = new Chart("chart", {
        type: "line",
        data: {
            labels: xValues,
            datasets: [
                {
                    label: 'temp avg',
                    backgroundColor: "rgba(15, 76, 218, 0.2)",
                    borderColor: "rgb(26, 115, 167)",
                    data: data.temperature
                },
                {
                    label: 'temp max',
                    backgroundColor: "rgba(15, 76, 218, 0.2)",
                    borderColor: "rgb(26, 160, 167)",
                    data: data.temperature_max,
                    fill: 0
                },
                {
                    label: 'temp min',
                    backgroundColor: "rgba(15, 76, 218, 0.2)",
                    borderColor: "rgb(26, 92, 167)",
                    data: data.temperature_min,
                    fill: 0
                },
                {
                    label: 'feel avg',
                    backgroundColor: "rgba(218, 18, 15, 0.2)",
                    borderColor: "rgb(167, 33, 26)",
                    data: data.appr_temp
                },
                {
                    label: 'feel max',
                    backgroundColor: "rgba(218, 18, 15, 0.2)",
                    borderColor: "rgb(176, 55, 28)",
                    data: data.appr_temp_max,
                    fill: 3
                },
                {
                    label: 'feel min',
                    backgroundColor: "rgba(218, 18, 15, 0.2)",
                    borderColor: "rgb(148, 28, 28)",
                    data: data.appr_temp_min,
                    fill: 3
                },
                {
                    label: 'wind avg',
                    backgroundColor: "rgba(15, 76, 218, 0.2)",
                    borderColor: "rgb(26, 115, 167)",
                    data: data.wind_speed,
                },
                {
                    label: 'wind max',
                    backgroundColor: "rgba(15, 76, 218, 0.2)",
                    borderColor: "rgb(26, 160, 167)",
                    data: data.wind_speed_max,
                    fill: 6,
                },
                {
                    label: 'wind min',
                    backgroundColor: "rgba(15, 76, 218, 0.2)",
                    borderColor: "rgb(26, 92, 167)",
                    data: data.wind_speed_min,
                    fill: 6,
                },
                {
                    label: 'gusts avg',
                    backgroundColor: "rgba(218, 18, 15, 0.2)",
                    borderColor: "rgb(167, 33, 26)",
                    data: data.wind_gusts
                },
                {
                    label: 'gusts max',
                    backgroundColor: "rgba(218, 18, 15, 0.2)",
                    borderColor: "rgb(176, 55, 28)",
                    data: data.wind_gusts_max,
                    fill: 9
                },
                {
                    label: 'gusts min',
                    backgroundColor: "rgba(218, 18, 15, 0.2)",
                    borderColor: "rgb(148, 28, 28)",
                    data: data.wind_gusts_min,
                    fill: 9
                },
                {
                    label: 'humid avg',
                    backgroundColor: "rgba(15, 76, 218, 0.2)",
                    borderColor: "rgb(26, 115, 167)",
                    data: data.humid,
                },
                {
                    label: 'humid max',
                    backgroundColor: "rgba(15, 76, 218, 0.2)",
                    borderColor: "rgb(26, 160, 167)",
                    data: data.humid_max,
                    fill: 12,
                },
                {
                    label: 'humid min',
                    backgroundColor: "rgba(15, 76, 218, 0.2)",
                    borderColor: "rgb(26, 92, 167)",
                    data: data.humid_min,
                    fill: 12,
                },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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

    chart.options.plugins.legend.labels.filter = (legendItem) => {
        return !chart.getDatasetMeta(legendItem.datasetIndex).hidden;
    };

    reset(chart);
    modeTemp(data, weathers, chart);

    tempButton.addEventListener('click', () => {
        reset(chart);
        modeTemp(data, weathers, chart);
    })

    windButton.addEventListener('click', () => {
        reset(chart);
        modeWind(data, chart);
    })

    humidButton.addEventListener('click', () => {
        reset(chart);
        modeHumid(data, chart);
    })

} catch(error){
    console.error(error);
} finally{
    const loader = document.getElementById('loading-screen');
    loader.classList.add('fade-out');

    loader.addEventListener('transitionend', ()=>{
        loader.style.display = 'none';
    }, {once: true});
}