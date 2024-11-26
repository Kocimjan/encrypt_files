
let startX, startY, startTime;
let video = document.querySelector('.video .current_video')
let play_btn = document.querySelector('.play_btn')
let video_block = document.querySelector('.video')

let video_played = video.playing;

let history = localStorage.getItem('history');
if (history != null) {
    localStorage.setItem('history_index', history.split(';').length - 1);
} else {
    localStorage.setItem('history', '');
}

document.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = new Date().getTime();
});

document.addEventListener('touchend', function(e) {
    let endX = e.changedTouches[0].clientX;
    let endY = e.changedTouches[0].clientY;
    let endTime = new Date().getTime();

    let diffX = endX - startX;
    let diffY = endY - startY;
    let timeDiff = endTime - startTime;

    if (timeDiff < 200 && Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
        // click
        video_played = !video_played;
        if (video_played) {
            video.play()
            play_btn.style.opacity = 0;
        }
        else {
            video.pause()
            play_btn.style.opacity = 1;
        }
    }
    else if (timeDiff > 500 && Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
        // long click
        let result = confirm('Сбросить историю просмотра?');
        if (result) {
            localStorage.clear()
        }        
    }

    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) {
                console.log('right swipe');
                let result = confirm('Сбросить историю просмотра?');
                if (result) {
                    localStorage.clear()
                }   
            } else {
                console.log('left swipe');   
            }
        } else {
            if (diffY > 0) {
                // down swipe
                
                let history = localStorage.getItem('history');
                let i = Number(localStorage.getItem('history_index'));

                if (i - 1 < 0) return;

                let video_id = history.split(';')[i - 1];

                (async function() {
                    try {
                        const response = await fetch('/get_' + video_id, {
                            method: 'GET'
                        });
                        if (response.ok) {
                            let result = await response.json();

                            let prev_video = document.createElement('video');
                            prev_video.classList.add('prev_video');
                            prev_video.id = result.id;
                            prev_video.innerHTML = '<source src="/static/videos/' + result.id.toString() + '.mp4" type="video/mp4">';
                            prev_video.setAttribute('loop', true);
                            video_block.prepend(prev_video);

                            setTimeout(() => {
                                prev_video = document.querySelector('.prev_video');
                                prev_video.classList.replace('prev_video', 'current_video');
                                
                                document.querySelector('.next_video').remove();
                                video.classList.replace('current_video', 'next_video');
                                video.pause()
                                video.setAttribute('autoplay', false);
                
                                video = prev_video;
                                video.currentTime = 0;
                                video.play()
                                video_played = true;
                                video.setAttribute('autoplay', true);
                
                                play_btn.style.opacity = 0;

                                localStorage.setItem('history_index', i - 1)
                            }, 10);                
                        } else console.error('Ошибка при отправке запроса.');
                    } catch (error) {
                        console.error('Произошла ошибка:', error);
                    }
                })();

                video_id = video.id;
                (async function() {
                    try {
                        const response = await fetch('/get_' + video_id, {
                            method: 'GET'
                        });
                        if (response.ok) {
                            let result = await response.json();

                            let name = document.querySelector('.controls .name');
                            let desc = document.querySelector('.controls .desc');

                            name.innerText = '@' + result.author_name.toString();
                            desc.innerText = result.desc.toString();
                        } else {
                            console.error('Ошибка при отправке запроса.');
                        }
                    } catch (error) {
                        console.error('Произошла ошибка:', error);
                    }
                })();

            } else {
                // up swipe

                next_video = document.querySelector('.next_video');
                if (!next_video) {
                    alert('Возникла ошибка. Пожалуйста, перезагрузить страницу')
                }
                next_video.classList.replace('next_video', 'current_video');
                
                video.classList.replace('current_video', 'prev_video');
                video.pause()
                video.setAttribute('autoplay', false);
                setTimeout(() => {
                    document.querySelector('.prev_video').remove();
                }, 500);

                video = next_video;
                video.currentTime = 0;
                video.setAttribute('autoplay', true);

                play_btn.style.opacity = 0;
                video.play();
                video_played = true;

                let video_id = video.id;
                (async function() {
                    try {
                        const response = await fetch('/get_' + video_id, {
                            method: 'GET'
                        });
                        if (response.ok) {
                            let result = await response.json();

                            let history = localStorage.getItem('history');
                            let i = localStorage.getItem('history_index');

                            if (history == null && !history_used) {
                                history = result.id.toString() + ';';
                            } else if (!history_used) {
                                history += result.id.toString() + ';';
                            }
            
                            if (i == null) {
                                i = history.split(';').length - 2;
                            } else {
                                i = Number(i) + 1;
                            }

                            localStorage.setItem('history', history);
                            localStorage.setItem('history_index', i);

                            let name = document.querySelector('.controls .name');
                            let desc = document.querySelector('.controls .desc');

                            name.innerText = '@' + result.author_name.toString();
                            desc.innerText = result.desc.toString();
                        } else {
                            console.error('Ошибка при отправке запроса.');
                        }
                    } catch (error) {
                        console.error('Произошла ошибка:', error);
                    }
                })();

                let history = localStorage.getItem('history');
                if (history.charAt(history.length - 1) == ';') {
                    history = history.replace(';', '', -1);
                }

                let i = Number(localStorage.getItem('history_index'));
                let history_used = false;

                if (history == null || i + 1 >= history.split(';').length) {
                    
                    (async function() {
                        try {

                            let hist_query_part = 'null';
                            if (history) {
                                hist_query_part = history.replaceAll(';', ',');
                            }
                            console.log(hist_query_part);
                            

                            const response = await fetch('/next?hist=' + hist_query_part, {
                                method: 'GET'
                            });
                            if (response.ok) {
                                let result = await response.json();

                                if (result == null) {
                                    alert('Видео закончились. Можно сбросить историю просмотра (долго нажатие или свайп вправо), чтобы увидеть просмотренные видео');
                                    return;
                                }

                                let new_video = document.createElement('video');
                                new_video.classList.add('next_video');
                                new_video.id = result.id;
                                new_video.innerHTML = '<source src="/static/videos/' + result.id.toString() + '.mp4" type="video/mp4">';
                                new_video.setAttribute('loop', true);
                                new_video.classList.add('next_video');
                                video_block.appendChild(new_video);
                            } else {
                                console.error('Ошибка при отправке запроса.');
                            }
                        } catch (error) {
                            console.error('Произошла ошибка:', error);
                        }
                    })();

                } else {
                    history_used = true;

                    if (i + 1 >= history.split(';').length) {}
                    let video_id = Number(history.split(';')[i + 1]);
                    (async function() {
                        try {
                            const response = await fetch('/get_' + video_id, {
                                method: 'GET'
                            });
                            if (response.ok) {
                                let result = await response.json();
    
                                let new_video = document.createElement('video');
                                new_video.classList.add('next_video');
                                new_video.id = result.id;
                                new_video.innerHTML = '<source src="/static/videos/' + result.id.toString() + '.mp4" type="video/mp4">';
                                new_video.setAttribute('loop', true);
                                new_video.classList.add('next_video');
                                video_block.appendChild(new_video);
                            } else console.error('Ошибка при отправке запроса.');
                        } catch (error) {
                            console.error('Произошла ошибка:', error);
                        }
                    })();
                }
            }
        }
    }
});
